class Play {
    constructor(gl, levelData, onComplete) {
        this.gl = gl;
        this.onComplete = onComplete;

        const {ball, bricks, initialVelocity, nearWall, paddle, walls} =
            levelData;

        this.ball = ball;
        ball.v = initialVelocity;
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

        // TODO: move this into level set up
        this.mover = new Patroller(200, 0, 3000, 83, 450, 450);
        this.mover.setPath(0, -0.1, -150, 2);
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

        let oldPaddlePosition = [paddle.x, paddle.y];

        let lastTime = null;

        let lastCourseChange = null;
        let nextCourseChange = null;
        let nextCourseChangers = [];

        let frame = (currentTime) => {
            const dt = currentTime - lastTime;

            if (this.paused || dt > 200) {
                // If we're pausing or if there was a long delay between
                // frames, let's reset our trajectory information. This way,
                // when the player resumes, the ball doesn't suddenly jump
                // ahead by however long we were waiting.
                nextCourseChange = null;
                lastCourseChange = null;
            }

            if (this.paused) {
                return;
            }

            while (nextCourseChange === null || currentTime > nextCourseChange) {
                // This while loop gets entered when we need to set a new
                // trajectory.  For example, this occurs at the start of the
                // game (when nextCourseChange is null), and when there's
                // been a collision (in which case currentTime is past
                // nextCourseChange, the time we anticipate needing to "bounce"
                // and change course).

                if (nextCourseChange !== null) {
                    // Start by updating to just BEFORE the course change.
                    // Updating to exactly a collision time can put something
                    // just past where it should be (and hence it overlaps what
                    // it shouldn't) due to floating point imprecision.
                    //
                    // Downside: when there are a lot of very rapid course
                    // changes, going back a a short time for each one can slow
                    // or even stop the pace of the game. Currently the
                    // solution is to avoid allowing situations with lots of
                    // course changes. So, no collidable objects in such close
                    // proximity that the ball bounces back and forth between
                    // them.
                    //
                    // Also, we're assuming that motion is relatively
                    // continuous - so that the position immediately BEFORE the
                    // change is effectively what the position should be AT
                    // change time.

                    for (let mover of this.movers) {
                        mover.update(nextCourseChange - lastCourseChange - 0.1);
                    }

                    for (let changer of nextCourseChangers) {
                        changer.nextCourse();
                    }
                }

                lastCourseChange =
                    nextCourseChange === null ? currentTime : nextCourseChange;

                // Start with an assumption that something'll change course in
                // 1 second.
                nextCourseChange = 1000 + lastCourseChange;
                nextCourseChangers = [];

                // Start new courses for all moving objects, based on
                // everyone's new speed. If anything's changing course in under
                // 1 second, we'll want to check in sooner.  Find the mover(s)
                // with the soonest expected course change.
                for (let mover of this.movers) {
                    const delta = mover.startCourse(collidables);
                    const current = delta + lastCourseChange;
                    if (delta !== null && current <= nextCourseChange) {
                        if (current === nextCourseChange) {
                            nextCourseChangers.push(mover);
                        } else {
                            nextCourseChangers = [mover];
                        }
                        nextCourseChange = current;
                    }
                }
            }

            // When the ball bounces off the near wall (i.e., "hits the
            // paddle", from the player's perspective), we want the
            // paddle's movement to impact the ball's.
            // (Multiplying by 2 exaggerates the effect.)
            if (lastTime !== null) {
                nearWall.velocityAdjustment = [
                    2 * (paddle.x - oldPaddlePosition[0]) / dt,
                    2 * (paddle.y - oldPaddlePosition[1]) / dt,
                    0
                ];
                oldPaddlePosition = [paddle.x, paddle.y];
            }

            for (let m of this.movers) {
                m.update(currentTime - lastCourseChange);
            }

            this.gl.draw(drawables);

            lastTime = currentTime;

            if (this.alive) {
                requestAnimationFrame(frame);
            } else {
                onComplete(bricks.length === 0);
            }
        }

        requestAnimationFrame(frame);
    }
}

