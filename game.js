function main() {
    const canvas = document.getElementById('canvas');
    const gl = new GL(canvas);

    const box = new Box(0, 0, 300, 100, 100, 100);
    box.colors.front = [122, 0, 0];
    box.colors.back = [122, 0, 0];
    box.colors.left = [0, 255, 0];
    box.colors.right = [0, 255, 0];
    box.colors.t = [0, 0, 100];
    box.colors.bottom = [0, 0, 100];

    gl.setVertices(new Float32Array(box.getVertices()));
    gl.setColors(new Int8Array(box.getColors()));

    const aspect = canvas.clientWidth / canvas.clientHeight; 

    let matrix = new PositionMatrix([1, 0, 0, 0,
                  0, -1, 0, 0,
                  0, 0, -1, 0,
                  0, 0, 0, 1]);
    matrix.setPerspective(Math.PI / 4, aspect, 1, 2000);

    let last = null;

    requestAnimationFrame(function d(t) {
        if (!last) {
            last = t;
        }
        let progress = t - last;
        last = t;
        angle = 2 * Math.PI * progress / 2000;
        matrix.rotateX(angle);
        gl.setPerspective(matrix.getProjection());
        gl.draw();
        requestAnimationFrame(d);
    });
}

window.onload = main;
