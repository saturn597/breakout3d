function main() {
    const canvas = document.getElementById('canvas');
    const gl = new GL(canvas);

    const box = new GLBox(100, 100, 100);
    box.colors.front = [100, 0, 0];
    box.colors.back = [122, 0, 0];
    box.colors.left = [255, 255, 0];
    box.colors.right = [0, 255, 0];
    box.colors.t = [0, 0, 100];
    box.colors.bottom = [0, 0, 100];

    const newBox = new GLBox(50, 50, 50);
    newBox.colors.front = [122, 0, 0];
    newBox.colors.back = [122, 0, 0];
    newBox.colors.left = [255, 255, 0];
    newBox.colors.right = [0, 255, 0];
    newBox.colors.t = [0, 0, 100];
    newBox.colors.bottom = [0, 0, 100];

    newBox.transformation.translate(200, 200, 200);

    const objects = [box, newBox];

    const aspect = canvas.clientWidth / canvas.clientHeight; 
    let matrix = new PositionMatrix(4, 4, [1, 0, 0, 0,
                  0, -1, 0, 0,
                  0, 0, -1, 0,
                  0, 0, 0, 1]);
    matrix.setPerspective(Math.PI / 4, aspect, 1, 2000);
    matrix.translate(0, 0, -560);
    gl.setPerspective(matrix.getProjection());

    let last = null;

    requestAnimationFrame(function d(t) {
        if (!last) {
            last = t;
        }
        let progress = t - last;
        last = t;

        angle = 2 * Math.PI * progress / 2000;
        box.transformation.rotateX(angle);
        box.transformation.rotateY(angle);
        newBox.transformation.translate(-200, -200, -200);
        newBox.transformation.rotateX(angle);
        newBox.transformation.rotateY(angle);
        newBox.transformation.translate(200, 200, 200);

        gl.draw(objects);

        requestAnimationFrame(d);
    });
}

window.onload = main;
