const DEFAULTS = {
    targetCanvasWidth: 600,
    targetCanvasHeight: 600,

    ballInnerColor: [210, 210, 255],
    ballOuterColor: [50, 50, 90],
    ballRadius: 40,

    paddleColor: [0, 0, 0],
    paddleThickness: 5,
    paddleHeight: 120,
    paddleWidth: 175,
};

// Helper for setting some initial values
function randomInt(min, max) {
    // Return random int greater than or equal to min and less than max.
    // That is, it's in range [min, max - 1].
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function main() {
    const canvas = document.getElementById('canvas');
    const glManager = new GLManager(canvas);

    const messages = document.getElementById('messages');
    function setMessage(msg) {
        messages.innerHTML = msg;
    }

    // Helpful variables
    let advance = false;
    let currentLevel = 0;
    let play;

    function initialize(level) {
        // Do basic initialization work required for each level.  This will
        // involve setting up the display canvas based on the level dimensions,
        // adding some default objects (such as walls on the edges of the level
        // dimensions), and setting up a mouse motion callback on the canvas
        // for moving the paddle.

        const {xMin, xMax, yMin, yMax, zMin, zMax} = level;

        prepDisplay(glManager, DEFAULTS.targetCanvasWidth, DEFAULTS.targetCanvasHeight,
                {xMin, xMax, yMin, yMax, zMin, zMax});

        const levelObjects = refineLevel(level);

        const rect = canvas.getBoundingClientRect();
        const xAdj = (xMax - xMin) / canvas.width;
        const yAdj = (yMax - yMin) / canvas.height;

        canvas.onmousemove = function(evt) {
            levelObjects.paddle.x = xAdj * (evt.clientX - rect.left) + xMin;
            levelObjects.paddle.y = yAdj * (rect.top - evt.clientY) + yMax;
        };

        return levelObjects;
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
            play = new Play(glManager, initialize(levels[currentLevel]), onComplete = playComplete);
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

    play = new Play(glManager, initialize(levels[0]), playComplete);
    play.setPaused(true);
    play.start();
}

function refineLevel(level) {
    // Return a set of objects that should be in the level, based on level data
    // we were passed.

    let ball, paddle, walls;

    const {bricks, initialVelocity, xMin, xMax, yMin, yMax, zMin, zMax} =
        level;

    const ballRadius = DEFAULTS.ballRadius;
    if (level.hasOwnProperty('ball')) {
        ball = level.ball;
    } else {
        const initialPosition = [
            randomInt(xMin + ballRadius + 1, xMax - ballRadius),
            randomInt(yMin + ballRadius + 1, yMax - ballRadius),
            zMin + ballRadius
        ];

        ball = new Ball(...initialPosition, ballRadius * 2,
                level.maxMotion, DEFAULTS.ballInnerColor,
                DEFAULTS.ballOuterColor);
    }

    if (level.hasOwnProperty('paddle')) {
        paddle = level.paddle;
    } else {
        paddle = new Paddle(0, 0, zMin, DEFAULTS.paddleWidth,
                DEFAULTS.paddleHeight, DEFAULTS.paddleThickness,
                DEFAULTS.paddleColor);
    }

    if (level.hasOwnProperty('walls')) {
        walls = level.walls;
    } else {
        walls = [
            makeFace(xMin, yMin, yMax, zMin, zMax, [50, 255, 0], 0),
            makeFace(xMax, yMin, yMax, zMin, zMax, [50, 255, 0], 0),
            makeFace(yMax, xMin, xMax, zMin, zMax, [0, 50, 255], 1),
            makeFace(yMin, xMin, xMax, zMin, zMax, [0, 50, 255], 1),
            makeFace(zMax, xMin, xMax, yMin, yMax, [255, 0, 50], 2),
        ];
    }

    // nearWall is an invisible wall in front of the player - when the ball
    // hits this, either it bounces back (if the paddle is in the right spot),
    // or the player is penalized for missing the ball.
    const nearWall = makeFace(zMin, xMin, xMax, yMin, yMax, [100, 0, 0], 2);

    return {ball, bricks, initialVelocity, nearWall, paddle, walls};
}

function prepDisplay(glManager, targetWidth, targetHeight, data) {
    // Given the dimensions of a level given by data, set the glManager's
    // canvas size and adjust the perspective so that the whole level will be
    // visible.
    //
    // glManager is our glManager.
    //
    // targetWidth and targetHeight tell us the width and height we'd like
    // the canvas to be (we'll try to get close).
    //
    // fov is our field of view, an angle representing how wide an area the
    // player should be able to see.
    //
    // Data contains these attributes defining the limits of the level:
    //
    // xMin, xMax, yMin, yMax, zMin, zMax

    const {xMin, xMax, yMin, yMax, zMin, zMax} = data;

    const canvas = glManager.gl.canvas;

    // Adjust the canvas size. It should be in the same aspect ratio as the
    // level itself. So, the canvas width should be in proportion to the canvas
    // height as the level width is to the level height. Try to get the canvas
    // as close as possible to targetWidth and targetHeight, without exceeding
    // those dimensions.
    const levelWidth = xMax - xMin;
    const levelHeight = yMax - yMin;
    const scale = Math.min(targetWidth / levelWidth,
            targetHeight / levelHeight);
    canvas.width = levelWidth * scale;
    canvas.height = levelHeight * scale;

    glManager.viewport(0, 0, canvas.width, canvas.height);

    // Set up our perspective
    const aspect = canvas.clientWidth / canvas.clientHeight;

    // The fov doesn't actually make much difference for us since, by passing
    // zMin, zMax, xMin, xMax, yMin, yMax to setPerspective, we force the player's
    // view to contain exactly those ranges.
    const fov = 0;
    glManager.setPerspective(fov, aspect, zMin, zMax + 1, xMin, xMax, yMin, yMax);
}

window.onload = main;
