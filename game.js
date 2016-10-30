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

    const newBox = new Ball(-400, 0, -100, 50, 50, 50);
    newBox.colors.front = [122, 0, 0];
    newBox.colors.back = [122, 0, 0];
    newBox.colors.left = [255, 255, 0];
    newBox.colors.right = [0, 255, 0];
    newBox.colors.t = [0, 0, 100];
    newBox.colors.bottom = [0, 0, 100];

    let color = [0, 0, 100];
    const f2Test = new Face2(50, -200, 200, -300, 300, color,0);
    const objects = [f2Test, newBox];
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
        if (!last) {
            last = t;
        }
        let progress = t - last;
        last = t;

        let angle = 2 * Math.PI * progress / 2000;
        let distance = progress / 4;
        newBox.x += dir * distance;
        if (newBox.x > 300) {
            dir = -1;
        } else if (newBox.x < -300) {
            dir = 1;
        }

        /*for (obj of objects) {
            obj.transform.call(obj.transformation, angle);
        }*/
        let collisionTime = objects[0].intersection([newBox.right(), newBox.down(), newBox.front()], [250*dir, 0, 0]);
        console.log(collisionTime);
        gl.draw(objects);

        if (collisionTime !== null) requestAnimationFrame(d);
    });
}

window.onload = main;
