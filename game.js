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
    const zMax = 5000;

    const zMin = 1000;

    const fov = Math.PI / 4;

    const aspect = canvas.clientWidth / canvas.clientHeight;

    gl.setPerspective(fov, aspect, zMin - 1, zMax + 1, xMax, yMax);

    let xMin = -xMax;
    let yMin = -yMax;
    const walls = [
        makeFace(xMin, yMin, yMax, zMin, zMax, [0, 255, 0], 0),
        makeFace(xMax, yMin, yMax, zMin, zMax, [0, 255, 0], 0),
        makeFace(yMax, xMin, xMax, zMin, zMax, [0, 0, 255], 1),
        makeFace(yMin, xMin, xMax, zMin, zMax, [0, 0, 255], 1),
        makeFace(zMax, xMin, xMax, yMin, yMax, [255, 0, 0], 2),
        makeFace(zMin, xMin, xMax, yMin, yMax, [100, 0, 0], 2),
    ];

    // This is the wall closest to the viewer - it shouldn't be visible, we
    // just want it there so the ball bounces when it gets close enough
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
    newBox.colors.up = [0, 0, 100];
    newBox.colors.down = [0, 0, 100];

    const objects = [...walls, newBox];
    const collidables = [...walls];

    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
            const b = new Ball(-150 + 180 * x, -150 + 180 * y, 3000, 150, 150, 150);
            b.colors.front = [122, 255, 255];
            b.onCollision = () => {
                collidables.splice(collidables.indexOf(b), 1);
                objects.splice(objects.indexOf(b), 1);
            };
            objects.push(b);
            collidables.push(b);
        }
    }

    let lastT;
    requestAnimationFrame(function d(t) {
        if (!newBox.hasTrajectory) {
            newBox.setTrajectory([-0.5, 1, 5], t, collidables);
            lastT = t;
        }

        gl.draw(objects);

        if (t - lastT > 100) {
            // Don't advance the frame if too much time passed since the last
            // one.
            newBox.setTrajectory(newBox.v, t, collidables);
            console.log('skipped');
        } else {
            newBox.update(t);
        }
        lastT = t;

        requestAnimationFrame(d);
    });
}

window.onload = main;
