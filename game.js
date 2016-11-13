function main() {
    const canvas = document.getElementById('canvas');
    const gl = new GL(canvas);

    const messages = document.getElementById('messages');
    function setMessage(msg) {
        messages.innerHTML = msg;
    }

    const ballDims = {
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

    let drawables = [];
    let collidables = [];

    let alive;
    let ball;
    let bricks;
    let nearWall; // an invisible wall in front of the player to detect when the ball is "out of bounds"
    let paddle;
    let walls;

    function initialize() {
        ball = new Ball(
            0, 0,
            zMin + ballDims.depth / 2,
            ballDims.width,
            ballDims.height,
            ballDims.depth
        );

        ball.colors = {
            'front': [122, 0, 0],
            'back': [122, 0, 0],
            'left': [255, 255, 0],
            'right': [0, 255, 0],
            'up': [0, 0, 100],
            'down': [0, 0, 100]
        };

        bricks = [];
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                const b = new Ball(-150 + 180 * x, -150 + 180 * y, 3000, 150, 150, 150);
                b.colors.front = [122, 255, 255];
                bricks.push(b);
            }
        }

        let brickCount = bricks.length;
        bricks.forEach(function(b) {
            b.onCollision = () => {
                collidables.splice(collidables.indexOf(b), 1);
                drawables.splice(drawables.indexOf(b), 1);
                brickCount--;

                if (brickCount <= 0) {
                    setMessage('You win! Click to start again.');
                    alive = false;
                }
            };
        });

        paddle = new Paddle(0, 0, zMin - 1, 150, 100, 5, [0, 0, 0]);  // Should zMin - 1 work?

        walls = [
            makeFace(xMin, yMin, yMax, zMin, zMax, [0, 255, 0], 0),
            makeFace(xMax, yMin, yMax, zMin, zMax, [0, 255, 0], 0),
            makeFace(yMax, xMin, xMax, zMin, zMax, [0, 0, 255], 1),
            makeFace(yMin, xMin, xMax, zMin, zMax, [0, 0, 255], 1),
            makeFace(zMax, xMin, xMax, yMin, yMax, [255, 0, 0], 2),
        ];

        nearWall = makeFace(zMin, xMin, xMax, yMin, yMax, [100, 0, 0], 2);

        nearWall.onCollision = function() {
            if (!ball.getVertices().some(paddle.contains, paddle)) {
                alive = false;
                setMessage('Oops, you missed! Click to try again.');
            }
        };

        drawables = [...bricks, ...walls];
        collidables = drawables.slice();

        collidables.push(nearWall);
        drawables.push(paddle, ball);
    }

    initialize();

    const rect = canvas.getBoundingClientRect();
    const xAdj = (xMax - xMin) / canvas.width;
    const yAdj = -(yMax - yMin) / canvas.height;

    canvas.onmousemove = function(evt) {
        paddle.x = xAdj * (evt.clientX - rect.left) + xMin;
        paddle.y = yAdj * (evt.clientY - rect.top) - yMin;
    };

    alive = false;
    gl.draw(drawables);
    canvas.onclick = function(evt) {
        if (alive === true) {
            return;
        }

        setMessage('Good luck!');

        initialize();

        paddle.x = xAdj * (evt.clientX - rect.left) + xMin;
        paddle.y = yAdj * (evt.clientY - rect.top) - yMin;

        alive = true;
        canvas.style.cursor = 'none';

        let lastT;

        requestAnimationFrame(function d(t) {
            if (!ball.hasTrajectory) {
                ball.setTrajectory([-0.5, 1, 5], t, collidables);
                lastT = t;
            }

            if (t - lastT > 100) {
                // Don't advance the frame if too much time passed since the last
                // one.
                ball.setTrajectory(ball.v, t, collidables);
            } else {
                ball.update(t);
            }
            lastT = t;

            gl.draw(drawables);

            if (alive) {
                requestAnimationFrame(d);
            } else {
                canvas.style.cursor = 'auto';
            }
        });
    };
}

window.onload = main;
