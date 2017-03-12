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

    // Canvas size parameters
    const targetCanvasWidth = 600;
    const targetCanvasHeight = 600;

    // Ball initial values
    const ballInnerColor = [210, 210, 255];
    const ballOuterColor = [50, 50, 90];
    const ballRadius = 40;

    // Paddle initial values.
    const paddleColor = [0, 0, 0];
    const paddleThickness = 5;
    const paddleHeight = 120;
    const paddleWidth = 175;

    // Helpful variables
    let advance = false;
    let currentLevel = 0;
    let play;

    function initialize(level) {
        // Get the parameters of the level we were passed.
        //
        // Bricks is a listing of all the bricks in the level.
        //
        // Set xMax, yMax, zMax to adjust the dimensions of the game area.
        //
        // zMin is the "near" z-value. This should be a ways out for
        // playability.
        const {bricks, initialVelocity, maxMotion, xMin, xMax, yMin, yMax,
            zMin, zMax} = level;

        // Adjust the canvas size - try to get as close as possible to
        // targetCanvasWidth and targetCanvasHeight, without going over (but
        // keep the right aspect ratio).
        const totalWidth = xMax - xMin;
        const totalHeight = yMax - yMin;
        const scale = Math.min(targetCanvasWidth / totalWidth,
                targetCanvasHeight / totalHeight);
        canvas.width = totalWidth * scale;
        canvas.height = totalHeight * scale;
        gl.viewport(0, 0, canvas.width, canvas.height);

        // Set up our perspective
        const fov = Math.PI / 4;
        const aspect = canvas.clientWidth / canvas.clientHeight;
        gl.setPerspective(fov, aspect, zMin, zMax + 1, xMin, xMax, yMin, yMax);

        const rect = canvas.getBoundingClientRect();
        const xAdj = (xMax - xMin) / canvas.width;
        const yAdj = (yMax - yMin) / canvas.height;

        const initialPosition = [
            randomInt(xMin + ballRadius + 1, xMax - ballRadius),
            randomInt(yMin + ballRadius + 1, yMax - ballRadius),
            zMin + ballRadius
        ];

        ball = new Ball(...initialPosition, ballRadius * 2, maxMotion, ballInnerColor, ballOuterColor);

        paddle = new Paddle(0, 0, zMin, paddleWidth, paddleHeight, paddleThickness, paddleColor);

        canvas.onmousemove = function(evt) {
            paddle.x = xAdj * (evt.clientX - rect.left) + xMin;
            paddle.y = yAdj * (rect.top - evt.clientY) + yMax;
        };

        const walls = [
            makeFace(xMin, yMin, yMax, zMin, zMax, [50, 255, 0], 0),
            makeFace(xMax, yMin, yMax, zMin, zMax, [50, 255, 0], 0),
            makeFace(yMax, xMin, xMax, zMin, zMax, [0, 50, 255], 1),
            makeFace(yMin, xMin, xMax, zMin, zMax, [0, 50, 255], 1),
            makeFace(zMax, xMin, xMax, yMin, yMax, [255, 0, 50], 2),
        ];

        // nearWall is an invisible wall in front of the player - when the ball
        // hits this, either it bounces back (if the paddle is in the right spot),
        // or the player is penalized for missing the ball.
        let nearWall = makeFace(zMin, xMin, xMax, yMin, yMax, [100, 0, 0], 2);

        return {ball, bricks, initialVelocity, maxMotion, nearWall, paddle,
            walls};
    }

    function playComplete(victory) {
        if (victory) {
            setMessage('Click to start the next level.');
            currentLevel++;
            if (currentLevel > levels.length - 1) {
                setMessage('You win! Click to restart.');
                currentLevel = 0;
            }
        } else {
            currentLevel = 0;
            setMessage('Oops, you missed! Click to try again.');
        }
        advance = true;
        canvas.style.cursor = 'auto';
    }

    canvas.onclick = function() {
        if (advance) {
            // Advance to the next level.
            play = new Play(gl, initialize(levels[currentLevel]), onComplete = playComplete);
            advance = false;
        }
        if (play.paused) {
            play.setPaused(false);
            canvas.style.cursor = 'none';
            setMessage('Good luck!');
            play.start();
        } else {
            play.setPaused(true);
            canvas.style.cursor = 'auto';
            setMessage('Paused. Click to continue.');
        }
    };

    play = new Play(gl, initialize(levels[0]), playComplete);
    play.setPaused(true);
    play.start();
}

window.onload = main;
