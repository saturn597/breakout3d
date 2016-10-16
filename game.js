function main() {
    const canvas = document.getElementById('canvas');
    const gl = new GL(canvas);

    gl.setVertices(Data.vertices);
    gl.setColors(Data.colors);
    
    const aspect = canvas.clientWidth / canvas.clientHeight; 

    let matrix = new PositionMatrix([1, 0, 0, 0,
                  0, -1, 0, 0,
                  0, 0, 1, 0,
                  0, 0, 0, 1]);
    matrix.setPerspective(Math.PI / 4, aspect, 1, 2000);

    let last = null;

    requestAnimationFrame(function d(t) {
        if (!last) {
            last = t;
        }
        let progress = t - last;
        last = t;
        angle = 2 * Math.PI * progress / 1000;
        matrix.rotateY(angle);
        matrix.translate(0, 0, -360);
        gl.setPerspective(matrix.getProjection());
        matrix.translate(0, 0, 360);
        gl.draw();
        requestAnimationFrame(d);
    });
}

window.onload = main;
