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
        this.movers = [ball];

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

        this.mover = new Mover(0, 0, 3000, 450, 450, 50);
        this.mover.colors.front = [255, 100, 100];
        this.drawables.push(this.mover);
        this.movers.push(this.mover);
        this.collidables.push(this.mover);
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
                this.mover.setTrajectory([0, 0, -1], t);
                ball.setTrajectory(ball.v || this.initialVelocity, t, collidables);
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
                for (let m of this.movers) {
                    m.update(t);
                }
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

