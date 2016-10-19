function main() {
    const canvas = document.getElementById('canvas');
    const gl = new GL(canvas);

    const box = new Box(0, 0, 0, 100, 100, 100);
    box.colors.front = [122, 0, 0];
    box.colors.back = [122, 0, 0];
    box.colors.left = [255, 255, 0];
    box.colors.right = [0, 255, 0];
    box.colors.t = [0, 0, 100];
    box.colors.bottom = [0, 0, 100];

    console.log(box.getPolys().length);
    box.transform(Math.PI / 4);
    console.log(box.getPolys().length);

    gl.setVertices(new Float32Array(Data.vertices));
    gl.setColors(new Int8Array(Data.colors));

    gl.setVertices(new Float32Array(box.getPolys()));
    gl.setColors(new Int8Array(box.getColors()));

    const aspect = canvas.clientWidth / canvas.clientHeight; 

    let matrix = new PositionMatrix(4, 4, [1, 0, 0, 0,
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
        box.transform(angle);
        gl.setVertices(new Float32Array(box.getPolys()));
        matrix.translate(0, 0, -560);
        gl.setPerspective(matrix.getProjection());
        gl.draw();
        matrix.translate(0, 0, 560);
        requestAnimationFrame(d);
    });
}

window.onload = main;
