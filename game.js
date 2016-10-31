function main() {
    const canvas = document.getElementById('canvas');
    const gl = new GL(canvas);

    const box = new GLBox(0, 0, 0, 100, 100, 100);
    box.colors.front = [100, 0, 0];
    box.colors.back = [122, 0, 0];
    box.colors.left = [255, 255, 0];
    box.colors.right = [0, 255, 0];
    box.colors.t = [0, 0, 100];
    box.colors.bottom = [0, 0, 100];

    const newBox = new Ball(0, 0, 150, 20, 20, 20);
    newBox.colors.front = [122, 0, 0];
    newBox.colors.back = [122, 0, 0];
    newBox.colors.left = [255, 255, 0];
    newBox.colors.right = [0, 255, 0];
    newBox.colors.t = [0, 0, 100];
    newBox.colors.bottom = [0, 0, 100];

    let color = [0, 0, 255];
    /*const walls = [
        new Face2(400, -400, 400, -700, 700, color, 0),
        new Face2(-400, -400, 400, -700, 700, color, 0),
        new Face2(700, -700, 700, -400, 400, [255, 0, 0], 2),
        new Face2(-200, -700, 700, -400, 400, [255, 0, 0], 2),
        ];*/
    const walls = [
        new Face2(200, -150, 150, -200, 200, [255, 0, 0], 2),
        new Face2(0, -150, 150, -200, 200, [100, 0, 0], 2),
        new Face2(-150, -200, 200, 0, 200, [0, 255, 0], 0),
        new Face2(150, -200, 200, 0, 200, [0, 255, 0], 0),
        new Face2(200, -150, 150, 0, 200, [0, 0, 255], 1),
        new Face2(-200, -150, 150, 0, 200, [0, 0, 255], 1),
    ];
    //walls[3].visible = false;
    walls[1].visible = false;
    const rightWall = new Face2(150, -200, 200, -300, 300, color, 0);
    const objects = [...walls, newBox];
    /*
    let colorIter = {};
    let rc = () => [randInt(0, 255), randInt(0, 255), randInt(0, 255)];
    for (let i = 0; i < 10; i++) {
        const b = new Ball(randInt(-300, 300), randInt(-300, 300), randInt(-300, 300), 52, 52, 52);
        colorIter[Symbol.iterator] = randInts(0, 255, 18);
        let colors = Array.from(colorIter);
        b.setColors(colors);
        //b.colors.front = rc();
        //b.colors.back = rc();
        //b.colors.left = rc();
        //b.colors.right = rc();
        //b.colors.t = rc();
        //b.colors.bottom = rc();
        objects.push(b);
    }*/

    const aspect = canvas.clientWidth / canvas.clientHeight; 
    let matrix = new PositionMatrix(4, 4, [1, 0, 0, 0,
                  0, -1, 0, 0,
                  0, 0, -1, 0,
                  0, 0, 0, 1]);
    matrix.setPerspective(Math.PI / 4, aspect, 1, 2000);
    matrix.translate(0, 0, -560);
    gl.setPerspective(matrix.getProjection());

    let last = null;
    let dir = 1;

    /*let transforms = [PositionMatrix.prototype.rotateX, PositionMatrix.prototype.rotateY, PositionMatrix.prototype.rotateZ];
    for (obj of objects) {
        obj.transform = transforms[randInt(0, 2)];
    }*/

    requestAnimationFrame(function d(t) {
        if (!newBox.hasTrajectory) {
            newBox.setTrajectory([0.5, 1, 0.5], t, walls);
        }

        newBox.update(t);

        /*if (newBox.x > 300) {
            newBox.setTrajectory([-0.500, 0, 0], t, [objects[0]]);
        } else if (newBox.x < -300) {
            newBox.setTrajectory([0.500, 0, 0], t, [objects[0]]);
        }*/

        /*for (obj of objects) {
            obj.transform.call(obj.transformation, angle);
        }*/
        gl.draw(objects);

        requestAnimationFrame(d);
    });
}

window.onload = main;
