// used tutorials on http://webglfundamentals.org to make these

const vShaderSrc = `
        attribute vec4 a_position;

        uniform mat4 u_projection;

        attribute vec4 a_color;
        varying vec4 v_color;

        void main() {
            gl_Position = u_projection * a_position;
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

class GLManager {
    constructor(canvas) {
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
        this.viewport = (...args) => gl.viewport(...args);

        this.objects = [];
    }

    addObj(obj) {
        this.objects.push(obj);
    }

    draw(objs) {
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        let colors = objs.map(obj => obj.getColors()).reduce((a, b) => a.concat(b));
        let polys = objs.map(obj => obj.getPolys()).reduce((a, b) => a.concat(b));
        this.setVertices(new Float32Array(polys));
        this.setColors(new Int8Array(colors));
        gl.drawArrays(gl.TRIANGLES, 0, polys.length / 3);
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

    setPerspective(fov, aspect, near, far, xMin, xMax, yMin, yMax) {
        // Sets the perspective matrix used by this GL context, based on the
        // provided parameters.
        //
        // fov: the angle in radians of the field of view
        // aspect: the aspect ratio of the display area (like canvas width /
        // height)
        // near: the "near" z value - vertices nearer than this z value are
        // clipped
        // far: the max z value - vertices farther than this z value are clipped
        //
        // If xMin, xMax, yMin and yMax are set, the perspective matrix will be
        // scaled and translated so that, for objects at the "near" z value,
        //
        // 1) everything between xMin and xMax is visible and
        // 2) everything between yMin and yMax is visible.
        //
        // The goal is to make sure the canvas shows all objects at z=near
        // between -xMax and xMax, and between -yMax and yMax, without
        // displaying more coordinates than necessary outside of those ranges,
        // and without looking distorted. The entire range at z=near from -xMax
        // to xMax, and -yMax to yMax, will just fit within the display area.

        const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
        const rangeInv = 1.0 / (near - far);

        // A lot of the math for this is derived on:
        // https://unspecified.wordpress.com/2012/06/21/calculating-the-gluperspective-matrix-and-other-opengl-matrix-maths/
        const matrix = new PositionMatrix(4, 4, [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, -(near + far) * rangeInv, 1,
            0, 0, near * far * rangeInv * 2, 0,
        ]);

        if (xMin !== undefined && xMax !== undefined && yMin !== undefined && yMax !== undefined) {
            const oldXMax = (near * aspect) / f;
            const oldYMax = near / f;

            // First we need to scale so that the visible range at z=near covers
            // the full distance between -oldXMax and oldXMax.
            //
            // The visible range at z = near goes from -oldXMax to oldXMax. So
            // the full visible distance is oldXMax * 2. We need to scale
            // everything so that the region between xMin and xMax covers that
            // full distance.

            const scale = Math.min(oldXMax * 2 / (xMax - xMin), oldYMax * 2 / (yMax - yMin));
            matrix.scale(
                scale,
                scale,
                1
            );

            // If we only scaled, the new "xMax" would be (xMax - xMin) / 2,
            // rather than at the specified xMax. So translate to put the xMax
            // in the right spot. The distance from (xMax - xMin) / 2 to xMax
            // is (xMax - xMin) / 2 - xMax, or -(xMax + xMin) / 2. Our
            // translation is happening in OpenGL land, where the viewport only
            // covers -1 to 1, or a distance of 2. But our world is scaled up
            // to cover xMin to xMax, or a distance of xMax - xMin. So we need
            // to scale down our translation - so divide the -(xMax + xMin) / 2
            // by (xMax - xMin) / 2, to get -(xMax + xMin) / (xMax - xMin)

           matrix.translate(
                -(xMax + xMin) / (xMax - xMin),
                -(yMax + yMin) / (yMax - yMin),
                0
            );

        }

        this.gl.uniformMatrix4fv(this.projectionLoc, false, matrix.m);
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
