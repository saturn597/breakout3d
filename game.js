//http://webglfundamentals.org

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

    get(x, y) {
        return this.m[x + this.w * y];
    }

    set(x, y, val) {
        this.m[x + this.w * y] = val;
    }

    multiply(m2) {
        if (this.w != m2.h) {
            throw `Cannot multiply a matrix with width ${this.w} by a matrix with height ${m2.h}`;
        }
        const newM = [];
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < m2.w; x++) {
                let e = 0;
                for (let i = 0; i < this.h; i++) {
                    e += this.get(i, y) * m2.get(x, i);
                    console.log(this.get(i, y), m2.get(x, i));
                }
                console.log('e is ' + e);
                newM.push(e);
            }
        }

        return new Matrix(m2.w, this.h, newM);
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
    }

    translate(x, y, z) {
        return this.multiply(
            [1, 0, 0, 0,
            0, 1, 0, 0, 
            0, 0, 1, 0,
            tx, ty, tz, 1]);
    }
 
    scale(sx, sy, sz) {
        return this.multiply([
            sx, 0, 0, 0,
            0, sy, 0, 0,
            0, 0, sz, 0,
            0, 0, 0, 1,
        ]);
    }

    rotateX(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        return this.multiply([
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1
        ]);
    }

    rotateY(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        return this.multiply([
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1
        ]);
    }

    rotateZ(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        return this.multiply([
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
    }

    perspective(m, fov, aspect, near, far) {
        // https://unspecified.wordpress.com/2012/06/21/calculating-the-gluperspective-matrix-and-other-opengl-matrix-maths/
        const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
        const rangeInv = 1.0 / (near - far);
        return this.multiply([ 
                f / aspect, 0, 0, 0,
                0, f, 0, 0,
                0, 0, (near + far) * rangeInv, -1,
                0, 0, near * far * rangeInv * 2, 0,
        ]);
    }
}

{
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

    const colors = new Uint8Array([
            // left column front
            200,  70, 120,
            200,  70, 120,
            200,  70, 120,
            200,  70, 120,
            200,  70, 120,
            200,  70, 120,

            // top rung front
            200,  70, 120,
            200,  70, 120,
            200,  70, 120,
            200,  70, 120,
            200,  70, 120,
            200,  70, 120,

            // middle rung front
            200,  70, 120,
            200,  70, 120,
            200,  70, 120,
            200,  70, 120,
            200,  70, 120,
            200,  70, 120,

            // left column back
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,

            // top rung back
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,

            // middle rung back
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,

            // top
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,

            // top rung right
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,

            // under top rung
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,

            // between top rung and middle
            210, 160, 70,
            210, 160, 70,
            210, 160, 70,
            210, 160, 70,
            210, 160, 70,
            210, 160, 70,

            // top of middle rung
            70, 180, 210,
            70, 180, 210,
            70, 180, 210,
            70, 180, 210,
            70, 180, 210,
            70, 180, 210,

            // right of middle rung
            100, 70, 210,
            100, 70, 210,
            100, 70, 210,
            100, 70, 210,
            100, 70, 210,
            100, 70, 210,

            // bottom of middle rung.
            76, 210, 100,
            76, 210, 100,
            76, 210, 100,
            76, 210, 100,
            76, 210, 100,
            76, 210, 100,

            // right of bottom
            140, 210, 80,
            140, 210, 80,
            140, 210, 80,
            140, 210, 80,
            140, 210, 80,
            140, 210, 80,

            // bottom
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,

            // left side
            160, 160, 220,
            160, 160, 220,
            160, 160, 220,
            160, 160, 220,
            160, 160, 220,
            160, 160, 220
    ]);

    const vertices = new Float32Array([
            // left column front
            0,   0,  0,
            0, 150,  0,
            30,   0,  0,
            0, 150,  0,
            30, 150,  0,
            30,   0,  0,

            // top rung front
            30,   0,  0,
            30,  30,  0,
            100,   0,  0,
            30,  30,  0,
            100,  30,  0,
            100,   0,  0,

            // middle rung front
            30,  60,  0,
            30,  90,  0,
            67,  60,  0,
            30,  90,  0,
            67,  90,  0,
            67,  60,  0,

            // left column back
            0,   0,  30,
            30,   0,  30,
            0, 150,  30,
            0, 150,  30,
            30,   0,  30,
            30, 150,  30,

            // top rung back
            30,   0,  30,
            100,   0,  30,
            30,  30,  30,
            30,  30,  30,
            100,   0,  30,
            100,  30,  30,

            // middle rung back
            30,  60,  30,
            67,  60,  30,
            30,  90,  30,
            30,  90,  30,
            67,  60,  30,
            67,  90,  30,

            // top
            0,   0,   0,
            100,   0,   0,
            100,   0,  30,
            0,   0,   0,
            100,   0,  30,
            0,   0,  30,

            // top rung right
            100,   0,   0,
            100,  30,   0,
            100,  30,  30,
            100,   0,   0,
            100,  30,  30,
            100,   0,  30,

            // under top rung
            30,   30,   0,
            30,   30,  30,
            100,  30,  30,
            30,   30,   0,
            100,  30,  30,
            100,  30,   0,

            // between top rung and middle
            30,   30,   0,
            30,   60,  30,
            30,   30,  30,
            30,   30,   0,
            30,   60,   0,
            30,   60,  30,

            // top of middle rung
            30,   60,   0,
            67,   60,  30,
            30,   60,  30,
            30,   60,   0,
            67,   60,   0,
            67,   60,  30,

            // right of middle rung
            67,   60,   0,
            67,   90,  30,
            67,   60,  30,
            67,   60,   0,
            67,   90,   0,
            67,   90,  30,

            // bottom of middle rung.
            30,   90,   0,
            30,   90,  30,
            67,   90,  30,
            30,   90,   0,
            67,   90,  30,
            67,   90,   0,

            // right of bottom
            30,   90,   0,
            30,  150,  30,
            30,   90,  30,
            30,   90,   0,
            30,  150,   0,
            30,  150,  30,

            // bottom
            0,   150,   0,
            0,   150,  30,
            30,  150,  30,
            0,   150,   0,
            30,  150,  30,
            30,  150,   0,

            // left side
            0,   0,   0,
            0,   0,  30,
            0, 150,  30,
            0,   0,   0,
            0, 150,  30,
            0, 150,   0
    ]);


    const vertices_2 = new Float32Array([
                // left column
                0, 0, 50,
                30, 0, 50,
                0, 150, 50,
                0, 150, 50,
                30, 0, 50,
                30, 150, 50,

                // top rung
                30, 0, 50,
                100, 0, 50,
                30, 30, 50,
                30, 30, 50,
                100, 0, 50,
                100, 30, 50,

                // middle rung
                30, 60, 50,
                67, 60, 50,
                30, 90, 50,
                30, 90, 50,
                67, 60, 50,
                67, 90, 50,

                // left column
                0, 0, 0,
                30, 0, 0,
                0, 150, 0,
                0, 150, 0,
                30, 0, 0,
                30, 150, 0,

                // top rung
                30, 0, 0,
                100, 0, 0,
                30, 30, 0,
                30, 30, 0,
                100, 0, 0,
                100, 30, 0,

                // middle rung
                30, 60, 0,
                67, 60, 0,
                30, 90, 0,
                30, 90, 0,
                67, 60, 0,
                67, 90, 0
            ]);

    const id = [
        1, 0, 0, 0,
        0, 1, 0, 0, 
        0, 0, 1, 0, 
        0, 0, 0, 1,
        ];

    function makeTranslation(tx, ty, tz) {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0, 
            0, 0, 1, 0,
            tx, ty, tz, 1,
            ];
    }

    function makeScale(sx, sy, sz) {
        return [
            sx, 0, 0, 0,
            0, sy, 0, 0,
            0, 0, sz, 0,
            0, 0, 0, 1,
        ];
    }

    function makeXRotation(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        return [
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1
        ];
    }

    function makeYRotation(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        return [
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1
        ];
    }

    function makeZRotation(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        return [
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ];
    }

    function applyPerspective(m, fov, aspect, near, far) {
        // https://unspecified.wordpress.com/2012/06/21/calculating-the-gluperspective-matrix-and-other-opengl-matrix-maths/
        const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
        const rangeInv = 1.0 / (near - far);
        return matrixMultiply(m, [
                f / aspect, 0, 0, 0,
                0, f, 0, 0,
                0, 0, (near + far) * rangeInv, -1,
                0, 0, near * far * rangeInv * 2, 0,
        ]);
    }

    function project(m, width, height, depth) {
        return matrixMultiply(m, 
            [
                2 / width, 0, 0, 0,
                0, -2 / height, 0, 0,
                0, 0, 2 / depth, 0,
                -1, 1, 0, 1,
            ]);
    }


    function matrixMultiply(a, b, dim = 4) {
        function get(x, y) {
            return x + dim * y;
        }

        const newM = [];
        for (let y = 0; y < dim; y++) {
            for (let x = 0; x < dim; x++) {
                let e = 0;
                for (let i = 0; i < dim; i++) {
                    e += a[get(i, y)] * b[get(x, i)];
                }
                newM.push(e);
            }
        }

        return newM;
    }

    function translate(m, tx, ty, tz) {
        return matrixMultiply(m, makeTranslation(tx, ty, tz));
    }

    function scale(m, sx, sy, sz) {
        return matrixMultiply(m, makeScale(sx, sy, dz));
    }

    function rotateX(m, angle) {
        return matrixMultiply(m, makeXRotation(angle));
    }

    function rotateY(m, angle) {
        return matrixMultiply(m, makeYRotation(angle));
    }

    function rotateZ(m, angle) {
        return matrixMultiply(m, makeZRotation(angle));
    }

    function main() {

        // Set up canvas context
        const canvas = document.getElementById('canvas');
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

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        // Get vertex data to the attribute
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        // Connect the buffered data to the attribute a_position in our vShader
        const posLoc = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(posLoc);
        // args to vertexAttribPointer: attribute location, number of components per iteration, 
        // data type, whether data should be normalized, stride, offset
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

        // Get color data to the attribute
        const color_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
        const colorLoc = gl.getAttribLocation(program, 'a_color');
        gl.enableVertexAttribArray(colorLoc);
        gl.vertexAttribPointer(colorLoc, 3, gl.UNSIGNED_BYTE, true, 0, 0);

        // Set up uniforms
        gl.useProgram(program);  // Setting uniforms depends on the current program

        const resLoc = gl.getUniformLocation(program, 'u_resolution');
        const matrixLoc = gl.getUniformLocation(program, 'u_matrix');
        const fudgeLoc = gl.getUniformLocation(program, 'u_fudgeFactor');

        gl.uniform2f(resLoc, gl.canvas.width, gl.canvas.height);
        gl.uniform1f(fudgeLoc, 1);

        let matrix = [1, 0, 0, 0,
                      0, 1, 0, 0,
                      0, 0, 1, 0,
                      0, 0, 0, 1];

        const aspect = canvas.clientWidth / canvas.clientHeight; 

        let last = null;
        let colorTime = 0;
        requestAnimationFrame(function d(t) {
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            if (!last) {
                last = t;
            }
            let progress = t - last;
            colorTime += progress;
            last = t;
            angle = 2 * Math.PI * progress / 2000;
            matrix = rotateX(matrix, angle);
            matrix = rotateY(matrix, angle);
            matrix = translate(matrix, -150, 0, -360);
            gl.uniformMatrix4fv(matrixLoc, false, applyPerspective(matrix, Math.PI / 4, aspect, 1, 2000));
            matrix = translate(matrix, 150, 0, 360);
            if (colorTime >= 200) {
                colorTime = 0;
            }
            gl.drawArrays(gl.TRIANGLES, 0, 16*6);
            requestAnimationFrame(d);
        });
    }
    
    window.onload = main;
}
