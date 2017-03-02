function main() {
    // Helper for setting some initial values
    function randomInt(min, max) {
        // Return random int greater than or equal to min and less than max.
        // That is, it's in range [min, max - 1].
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    const canvas = document.getElementById('canvas');
    const gl = new GL(canvas);

    const messages = document.getElementById('messages');
    function setMessage(msg) {
        messages.innerHTML = msg;
    }

    // Ball initial values
    const ballInnerColor = [210, 210, 255];
    const ballOuterColor = [50, 50, 90];
    const ballRadius = 40;
    const ballVelocity = [-0.25, 0.5, 3];
    const maxMotion = 1.25;

    // Paddle initial values.
    const paddleColor = [0, 0, 0];
    const paddleThickness = 5;
    const paddleHeight = 120;
    const paddleWidth = 175;

    // Helpful variables
    let alive;
    let ball;
    let currentLevel = 0;
    let paddle;
    let paused;

    // nearWall is an invisible wall in front of the player - when the ball
    // hits this, either it bounces back (if the paddle is in the right spot),
    // or the player is penalized for missing the ball.
    let nearWall;

    function initialize(level) {
        const collidables = [];
        const drawables = [];

        // Get the parameters of the level we were passed.
        //
        // Bricks is a listing of all the bricks in the level.
        //
        // Set xMax, yMax, zMax to adjust the dimensions of the game area.
        //
        // zMin is the "near" z-value. This should be a ways out for
        // playability.
        const {bricks, xMin, xMax, yMin, yMax, zMin, zMax} = level;

        // Adjust the canvas size to match xMax and yMax
        canvas.width = xMax - xMin;
        canvas.height = yMax - yMin;
        gl.viewport(0, 0, canvas.width, canvas.height);

        // Set up our perspective
        const fov = Math.PI / 4;
        const aspect = canvas.clientWidth / canvas.clientHeight;
        gl.setPerspective(fov, aspect, zMin, zMax + 1, xMin, xMax, yMin, yMax);

        const rect = canvas.getBoundingClientRect();
        const xAdj = (xMax - xMin) / canvas.width;
        const yAdj = (yMax - yMin) / canvas.height;

        canvas.onmousemove = function(evt) {
            paddle.x = xAdj * (evt.clientX - rect.left) + xMin;
            paddle.y = yAdj * (rect.top - evt.clientY) + yMax;
        };

        const initialPosition = [
            randomInt(xMin + ballRadius + 1, xMax - ballRadius),
            randomInt(yMin + ballRadius + 1, yMax - ballRadius),
            zMin + ballRadius
        ];

        ball = new Ball(...initialPosition, ballRadius * 2, maxMotion, ballInnerColor, ballOuterColor);

        let brickCount = bricks.length;
        bricks.forEach(function(b) {
            b.onCollision = () => {
                collidables.splice(collidables.indexOf(b), 1);
                drawables.splice(drawables.indexOf(b), 1);
                brickCount--;

                if (brickCount <= 0) {
                    setMessage('Click to go to the next level.');
                    currentLevel++;
                    if (currentLevel > levels.length - 1) {
                        setMessage('You win! Click to restart.');
                        currentLevel = 0;
                    }
                    alive = false;
                }
            };
        });

        paddle = new Paddle(0, 0, zMin, paddleWidth, paddleHeight, paddleThickness, paddleColor);

        const walls = [
            makeFace(xMin, yMin, yMax, zMin, zMax, [50, 255, 0], 0),
            makeFace(xMax, yMin, yMax, zMin, zMax, [50, 255, 0], 0),
            makeFace(yMax, xMin, xMax, zMin, zMax, [0, 50, 255], 1),
            makeFace(yMin, xMin, xMax, zMin, zMax, [0, 50, 255], 1),
            makeFace(zMax, xMin, xMax, yMin, yMax, [255, 0, 50], 2),
        ];

        nearWall = makeFace(zMin, xMin, xMax, yMin, yMax, [100, 0, 0], 2);

        nearWall.onCollision = function() {
            if (!ball.getVertices().some(paddle.contains, paddle)) {
                alive = false;
                currentLevel = 0;
                setMessage('Oops, you missed! Click to try again.');
            }
        };

        drawables.push(...bricks, ...walls);
        collidables.push(...drawables.slice());

        collidables.push(nearWall);
        drawables.push(paddle, ball);

        return {collidables, drawables};
    }

    function gameLoop(collidables, drawables) {
        setMessage('Good luck!');

        alive = true;
        canvas.style.cursor = 'none';

        let lastT = null;
        let oldPaddlePosition = [paddle.x, paddle.y];

        requestAnimationFrame(function d(t) {
            if (lastT === null) {
                ball.setTrajectory(ball.v || ballVelocity, t, collidables);
                lastT = t;
            }

            const dt = t - lastT;

            if (dt > 100) {
                // Don't advance the frame if too much time passed since the last
                // one.
                ball.setTrajectory(ball.v, t, collidables);
            } else {
                // When the ball bounces off the near wall (i.e., "hits the
                // paddle", from the player's perspective), we want the
                // paddle's movement to impact the ball's.
                // (Multiplying by 3 exaggerates the effect.)
                nearWall.velocityAdjustment = [
                    3 * (paddle.x - oldPaddlePosition[0]) / dt,
                    3 * (paddle.y - oldPaddlePosition[1]) / dt,
                    0
                ];
                oldPaddlePosition = [paddle.x, paddle.y];

                // Now we're ready to update the ball's position.
                ball.update(t);
            }
            lastT = t;

            gl.draw(drawables);

            if (paused) {
                lastT = null;
                return;
            }

            if (alive) {
                requestAnimationFrame(d);
            } else {
                canvas.style.cursor = 'auto';
            }
        });
    }

    alive = true;
    paused = true;

    let {collidables, drawables} = initialize(levels[0]);
    gl.draw(drawables);
    canvas.onclick = function() {
        if (alive) {
            paused = !paused;
            if (!paused) {
                gameLoop(collidables, drawables);
            }
        } else {
            alive = true;
            const level = initialize(levels[currentLevel]);
            collidables = level.collidables;
            drawables = level.drawables;
            gameLoop(collidables, drawables);
        }
    };
}

window.onload = main;
