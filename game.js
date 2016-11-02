function main() {
    const canvas = document.getElementById('canvas');
    const gl = new GL(canvas);

    const boxDims = {
        width: 75,
        height: 75,
        depth: 75
    };

    const zMin = 700;
    const zMax = 3000;
    const aspect = canvas.clientWidth / canvas.clientHeight; 
    const fov = Math.PI / 4;

    const { x: xMax, y: yMax } = 
        gl.setPerspective(fov, aspect, zMin, zMax + 1);

    let xMin = -xMax;
    let yMin = -yMax;
    const walls = [
        new Face2(xMin, yMin, yMax, zMin, zMax, [0, 255, 0], 0),
        new Face2(xMax, yMin, yMax, zMin, zMax, [0, 255, 0], 0),
        new Face2(yMax, xMin, xMax, zMin, zMax, [0, 0, 255], 1),
        new Face2(yMin, xMin, xMax, zMin, zMax, [0, 0, 255], 1),
        new Face2(zMax, xMin, xMax, yMin, yMax, [255, 0, 0], 2),
        new Face2(zMin, xMin, xMax, yMin, yMax, [100, 0, 0], 2),
    ];

    walls[5].visible = false;

    const newBox = new Ball(
        0, 0, 
        zMin + boxDims.depth / 2,
        boxDims.width,
        boxDims.height, 
        boxDims.depth
    );

    newBox.colors.front = [122, 0, 0];
    newBox.colors.back = [122, 0, 0];
    newBox.colors.left = [255, 255, 0];
    newBox.colors.right = [0, 255, 0];
    newBox.colors.t = [0, 0, 100];
    newBox.colors.bottom = [0, 0, 100];

    const objects = [...walls, newBox];

    requestAnimationFrame(function d(t) {
        if (!newBox.hasTrajectory) {
            newBox.setTrajectory([-0.5, 1, 5], t, walls);
        }

        newBox.update(t);

        gl.draw(objects);

        requestAnimationFrame(d);
    });
}

window.onload = main;
