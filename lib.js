// used tutorials on http://webglfundamentals.org to make these

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        return shader;
    }
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return program;
    }
    
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

const vShaderSrc = `
        attribute vec4 a_position;

        uniform mat4 u_matrix;

        attribute vec4 a_color;
        varying vec4 v_color;
        
        void main() {
            gl_Position = u_matrix * a_position;
            v_color = a_color;
        }
    `;

const fShaderSrc = `
    precision mediump float;

    varying vec4 v_color;

    void main() {
        gl_FragColor = v_color;
    }
    `;

class GL {
    constructor(canvasElement) {
        const gl = canvas.getContext('webgl');

        if (!gl) {
            alert('WebGL not working!');
            return;
        }

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Create program
        const vShader = createShader(gl, gl.VERTEX_SHADER, vShaderSrc);
        const fShader = createShader(gl, gl.FRAGMENT_SHADER, fShaderSrc);
        const program = createProgram(gl, vShader, fShader);
        gl.useProgram(program);

        gl.enable(gl.DEPTH_TEST);

        this.posLoc = gl.getAttribLocation(program, "a_position");
        this.colorLoc = gl.getAttribLocation(program, 'a_color');
        this.matrixLoc = gl.getUniformLocation(program, 'u_matrix');

        this.vertexCount = 0;

        this.gl = gl;
    }

    draw() {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
    }

    setColors(colors) {
        const gl = this.gl;

        const color_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.colorLoc);
        gl.vertexAttribPointer(this.colorLoc, 3, gl.UNSIGNED_BYTE, true, 0, 0);
    }

    setVertices(vertices) {
        const gl = this.gl;

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // Connect the buffered data to the attribute a_position in our vShader
        gl.enableVertexAttribArray(this.posLoc);

        // args to vertexAttribPointer: attribute location, number of components per iteration, 
        // data type, whether data should be normalized, stride, offset
        gl.vertexAttribPointer(this.posLoc, 3, gl.FLOAT, false, 0, 0);

        this.vertexCount = vertices.length / 3;
    }

    setPerspective(matrix) {
        this.gl.uniformMatrix4fv(this.matrixLoc, false, matrix);
    }
}

class Matrix {
    constructor(w, h, initial) {
        if (initial === undefined) {
            initial = Array(w * h).fill(0);
        }
        if (initial.length != w * h) {
            throw 'Initial value isn\'t the right length'; 
        }
        this.w = w;
        this.h = h;
        this.m = initial;
    }

    static multiply(m1, m2) {
        if (m1.w != m2.h) {
            throw `Cannot multiply a matrix with width ${m1.w} by a matrix with height ${m2.h}`;
        }
        const newM = [];
        for (let y = 0; y < m1.h; y++) {
            for (let x = 0; x < m2.w; x++) {
                let e = 0;
                for (let i = 0; i < m1.h; i++) {
                    e += m1.get(i, y) * m2.get(x, i);
                }
                newM.push(e);
            }
        }
        return new Matrix(m2.w, m1.h, newM); 
    }

    get(x, y) {
        return this.m[x + this.w * y];
    }

    set(x, y, val) {
        this.m[x + this.w * y] = val;
    }

    multiply_update(m2) {
        this.m = Matrix.multiply(this, m2).m;
    }

    show() {
        for (let y = 0; y < this.h; y++) {
            let s = '';
            for (let x = 0; x < this.w; x++) {
                s += this.get(x, y) + ' ';
            }
            console.log(s);
        }
    }
}

class PositionMatrix extends Matrix {
    constructor(initial) {
        super(4, 4, initial);
        this.projectionMatrix = PositionMatrix.getIdentity();
    }

    static getIdentity() {
        return new Matrix(4, 4, [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
        ]);
    }

    setPerspective(fov, aspect, near, far) {
        // https://unspecified.wordpress.com/2012/06/21/calculating-the-gluperspective-matrix-and-other-opengl-matrix-maths/
        const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
        const rangeInv = 1.0 / (near - far);
        this.projectionMatrix = new Matrix(4, 4, [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0,
        ]);
    }

    translate(tx, ty, tz) {
        this.multiply_update(new PositionMatrix([
            1, 0, 0, 0,
            0, 1, 0, 0, 
            0, 0, 1, 0,
            tx, ty, tz, 1
        ]));
    }
 
    scale(sx, sy, sz) {
        this.multiply_update(new PositionMatrix([
            sx, 0, 0, 0,
            0, sy, 0, 0,
            0, 0, sz, 0,
            0, 0, 0, 1,
        ]));
    }

    rotateX(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        this.multiply_update(new PositionMatrix([
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1
        ]));
    }

    rotateY(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        this.multiply_update(new PositionMatrix([
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1
        ]));
    }

    rotateZ(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        this.multiply_update(new PositionMatrix([
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]));
    }

    getProjection() {
        return Matrix.multiply(this, this.projectionMatrix).m;
    }
}

class Box {
    constructor(x, y, z, w, h, d) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.d = d;
        this.w = w;
        this.h = h;

        this.colors = {
            front: [0, 0, 0],
            back: [0, 0, 0],
            t: [0, 0, 0],
            bottom: [0, 0, 0],
            left: [0, 0, 0],
            right: [0, 0, 0],
        };
    }

    getColors() {
        let colors = this.colors;

        function add(arr) {
            return arr.concat(arr, arr, arr, arr, arr);
        }

        return [].concat(
            add(colors.front),
            add(colors.back),
            add(colors.left),
            add(colors.right),
            add(colors.t),
            add(colors.bottom)
        );
    }

    getVertices() {
        const t = this.y - this.h / 2;
        const bottom = this.y + this.h / 2;
        const left = this.x - this.w / 2;
        const right = this.x + this.w / 2;
        const front = this.z - this.d / 2;
        const back = this.z + this.d / 2;

        const c1 = [left, t, front];
        const c2 = [left, bottom, front];
        const c3 = [right, t, front];
        const c4 = [right, bottom, front];
        const c5 = [left, t, back];
        const c6 = [left, bottom, back];
        const c7 = [right, t, back];
        const c8 = [right, bottom, back];

        let arr = [
            c1, c3, c2,  // front
            c3, c2, c4,

            c5, c7, c6,  // back
            c7, c6, c8,

            c5, c2, c1,  // left
            c5, c6, c2,

            c7, c4, c3,  // right
            c7, c8, c4,

            c5, c3, c1,  // top
            c5, c7, c3,

            c6, c4, c2,  // bottom
            c6, c8, c4,
        ];

        return [].concat(...arr);
    }
}
