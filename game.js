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

    const id = [
        1, 0, 0, 0,
        0, 1, 0, 0, 
        0, 0, 1, 0, 
        0, 0, 0, 1,
        ];

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

        gl.uniform2f(resLoc, gl.canvas.width, gl.canvas.height);

        const aspect = canvas.clientWidth / canvas.clientHeight; 

        let matrix = new PositionMatrix([1, 0, 0, 0,
                      0, 1, 0, 0,
                      0, 0, 1, 0,
                      0, 0, 0, 1]);
        matrix.setPerspective(Math.PI / 4, aspect, 1, 2000);
        matrix.scale(1, -1, 1);

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
            matrix.rotateY(angle);
            matrix.translate(0, 0, -360);
            gl.uniformMatrix4fv(matrixLoc, false, matrix.getProjection());
            matrix.translate(0, 0, 360);
            if (colorTime >= 200) {
                colorTime = 0;
            }
            gl.drawArrays(gl.TRIANGLES, 0, 16*6);
            requestAnimationFrame(d);
        });
    }
    
    window.onload = main;
}
