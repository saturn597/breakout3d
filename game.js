function main() {
    const canvas = document.getElementById('canvas');
    const gl = new GL(canvas);

    const boxDims = {
        width: 80,
        height: 80,
        depth: 80
    };

    // Set these three values to adjust the dimensions of the game area
    const xMax = 300;
    const yMax = 300;
    const zMax = 4000;

    const zMin = 700;

    const fov = Math.PI / 4;

    const aspect = canvas.clientWidth / canvas.clientHeight; 

    gl.setPerspective(fov, aspect, zMin - 1, zMax + 1, xMax, yMax);

    let xMin = -xMax;
    let yMin = -yMax;
    const walls = [
        new Face(xMin, yMin, yMax, zMin, zMax, [0, 255, 0], 0),
        new Face(xMax, yMin, yMax, zMin, zMax, [0, 255, 0], 0),
        new Face(yMax, xMin, xMax, zMin, zMax, [0, 0, 255], 1),
        new Face(yMin, xMin, xMax, zMin, zMax, [0, 0, 255], 1),
        new Face(zMax, xMin, xMax, yMin, yMax, [255, 0, 0], 2),
        new Face(zMin, xMin, xMax, yMin, yMax, [100, 0, 0], 2),
    ];

    // This is the wall closest to the viewer - it shouldn't be visible, we
    // just want it there so the ball boucnes when it gets close enough
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

    newBox.setTrajectory([-0.5, 1, 5], performance.now(), walls);

    requestAnimationFrame(function d(t) {
        newBox.update(t);

        gl.draw(objects);

        requestAnimationFrame(d);
    });
}

window.onload = main;
