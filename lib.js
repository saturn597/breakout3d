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

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randInts(min, max, num) {
    return function* () {
        while(num > 0) {
            yield randInt(min, max);
            num--;
        }
    }
}

const vShaderSrc = `
        attribute vec4 a_position;

        uniform mat4 u_objectTransform;
        uniform mat4 u_projection;

        attribute vec4 a_color;
        varying vec4 v_color;
        
        void main() {
            gl_Position = u_projection * u_objectTransform * a_position;
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
        this.projectionLoc = gl.getUniformLocation(program, 'u_projection');
        this.objectTransformLoc= gl.getUniformLocation(program, 'u_objectTransform');

        this.gl = gl;

        this.objects = [];
    }

    addObj(obj) {
        this.objects.push(obj);
    }

    draw(objs) {
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        for (let obj of objs) {
            gl.uniformMatrix4fv(this.objectTransformLoc, false, obj.transformation.m);
            let polys = obj.getPolys();
            let colors = obj.getColors();
            this.setVertices(new Float32Array(polys));
            this.setColors(new Int8Array(colors));
            gl.drawArrays(gl.TRIANGLES, 0, polys.length / 3);
        }
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
    }

    setPerspective(matrix) {
        this.gl.uniformMatrix4fv(this.projectionLoc, false, matrix);
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
                for (let i = 0; i < m1.w; i++) {
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
    constructor(w, h, initial) {
        super(w, h, initial);
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
        this.multiply_update(new PositionMatrix(4, 4, [
            1, 0, 0, 0,
            0, 1, 0, 0, 
            0, 0, 1, 0,
            tx, ty, tz, 1
        ]));
    }
 
    scale(sx, sy, sz) {
        this.multiply_update(new PositionMatrix(4, 4, [
            sx, 0, 0, 0,
            0, sy, 0, 0,
            0, 0, sz, 0,
            0, 0, 0, 1,
        ]));
    }

    rotateX(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        this.multiply_update(new PositionMatrix(4, 4, [
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1
        ]));
    }

    rotateY(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        this.multiply_update(new PositionMatrix(4, 4, [
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1
        ]));
    }

    rotateZ(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        this.multiply_update(new PositionMatrix(4, 4, [
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

class Trajectory {
    constructor(t_start, p_start, velocity) {
        this.t_start = t_start;
        this.p_start = p_start;
        this.velocity = velocity;
    }

    get_position(t) {
        return (t - t_start) * velocity + p_start;
    }
}

function overlap(interval1, interval2) {
    
}

class Face {
    constructor(vertices, color) {
        this.vertices = vertices;
        this.color = color;
        this.transformation = new PositionMatrix(4, 4, [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
    }

    getPolys() {
        let v = this.vertices;
        return [
            ...v[0], ...v[1], ...v[2],
            ...v[0], ...v[2], ...v[3]
        ];
    }

    getColors() {
        return [].concat(...Array(6).fill(this.color));
    }
}

class FaceX extends Face {
    constructor(x, minY, maxY, minZ, maxZ, color) {
        const vertices = [
            [x, minY, minZ],
            [x, maxY, minZ],
            [x, maxY, maxZ],
            [x, minY, maxZ],
        ];
        super(vertices, color);
    }

    intersection(x, y, z, dx, dy, dz) {

    }
}

class FaceY extends Face {
    constructor(y, minX, maxX, minZ, maxZ, color) {
        const vertices = [
            [minX, y, minZ],
            [maxX, y, minZ],
            [maxX, y, maxZ],
            [minX, y, maxZ],
        ];

        super(vertices, color);

        this.y = y;
        this.minX = minX;
        this.maxX = maxX;
        this.minZ = minZ;
        this.maxZ = maxZ;
    }

    intersection(x, y, z, dx, dy, dz) {
        if (dy === 0) {
            // This case could be handled in more detail - what if y is equal to this.y? 
            // Not handling for now, for simplicity's sake.
            return null;
        }
        let t = (this.y - y) / dy;
        let xIntersect = x + dx * t;
        let zIntersect = z + dz * t;
        if (this.minX <= xIntersect && xIntersect <= this.maxX &&
            this.minZ <= zIntersect && zIntersect <= this.maxZ) {
            return t;
        } else {
            return null;
        }
    }
}

class FaceZ extends Face {
    constructor(z, minX, maxX, minY, maxY, color) {
        const vertices = [
            [minX, minY, z],
            [maxX, minY, z],
            [maxX, maxY, z],
            [minX, maxY, z],
        ];
        super(vertices, color);
    }
}

class GLBox {
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

        this.transformation = new PositionMatrix(4, 4, [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    up() {
        return this.y - this.h / 2;
    }

    down() {
        return this.y + this.h / 2;
    }

    left() {
        return this.x - this.w / 2;
    }

    right() {
        return this.x + this.w / 2;
    }

    front() {
        return this.z - this.d / 2;
    }

    back() {
        return this.z + this.d / 2;
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

    getPolys() {
        let v = this.getVertices();

        let arr = [
            v[0], v[2], v[1],  // front
            v[2], v[1], v[3],

            v[4], v[6], v[5],  // back
            v[6], v[5], v[7],

            v[4], v[1], v[0],  // left
            v[4], v[5], v[1],

            v[6], v[3], v[2],  // right
            v[6], v[7], v[3],

            v[4], v[2], v[0],  // top
            v[4], v[6], v[2],

            v[5], v[3], v[1],  // bottom
            v[5], v[7], v[3],
        ];
        return [].concat(...arr);
    }

    getVertices() {
        const up = this.up();
        const down = this.down();
        const left = this.left();
        const right = this.right();
        const front = this.front();
        const back = this.back();

        const v1 = [left, up, front];
        const v2 = [left, down, front];
        const v3 = [right, up, front];
        const v4 = [right, down, front];
        const v5 = [left, up, back];
        const v6 = [left, down, back];
        const v7 = [right, up, back];
        const v8 = [right, down, back];

        return [v1, v2, v3, v4, v5, v6, v7, v8];
    }

    setColors(colors) {
        let cols = colors.slice();
        this.colors = {
            right: cols.splice(-3), 
            left: cols.splice(-3), 
            bottom: cols.splice(-3), 
            t: cols.splice(-3), 
            back: cols.splice(-3), 
            front: cols.splice(-3),
        }
    }
}


class Ball extends GLBox {
    constructor(...args) {
        super(...args);
    }
}

