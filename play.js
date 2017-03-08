const ballVelocity = [-0.25, 0.5, 3];  // TODO: make this configurable in the level

class Play {
    constructor(gl, levelData, onComplete) {
        this.gl = gl;
        this.onComplete = onComplete;

        const {ball, bricks, initialVelocity, nearWall, paddle, walls} =
            levelData;

        this.ball = ball;
        this.bricks = bricks.slice();
        this.initialVelocity = initialVelocity;
        this.nearWall = nearWall;
        this.paddle = paddle;
        this.walls = walls;

        this.collidables = [...bricks, nearWall, ...walls];
        this.drawables = [ball, ...bricks, paddle, ...walls];

        this.alive = true;
        this.paused = true;

        let brickCount = bricks.length;
        bricks.forEach((b) => {
            b.onCollision = () => {
                this.bricks.splice(this.bricks.indexOf(b), 1);
                this.collidables.splice(this.collidables.indexOf(b), 1);
                this.drawables.splice(this.drawables.indexOf(b), 1);
                brickCount--;

                if (brickCount === 0) {
                    this.alive = false;
                }
            };
        });

        nearWall.onCollision = () => {
            if (!ball.getVertices().some(paddle.contains, paddle)) {
                this.alive = false;
            }
        };
    }

    setPaused(state) {
        this.paused = state;
    }

    start() {
        const ball = this.ball;
        const bricks = this.bricks;
        const nearWall = this.nearWall;
        const paddle = this.paddle;

        const collidables = this.collidables;
        const drawables = this.drawables;

        const onComplete = this.onComplete;

        this.gl.draw(drawables);

        let lastT = null;
        let oldPaddlePosition = [paddle.x, paddle.y];

        let frame = (t) => {
            if (this.paused) {
                lastT = null;
                return;
            }

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

            this.gl.draw(drawables);

            if (this.alive) {
                requestAnimationFrame(frame);
            } else {
                onComplete(bricks.length === 0);
            }
        };

        requestAnimationFrame(frame);
    }
}

