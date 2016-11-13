function makeFace(constant, minA, maxA, minB, maxB, color, orientation) {
    const dimA = maxA - minA;
    const dimB = maxB - minB;
    const position = [
        constant,
        minA + dimA / 2,
        minB + dimB / 2
    ];

    let adjPos;
    if (orientation === 0) {
        adjPos = position;
    } else if (orientation === 1) {
        adjPos = [position[1], position[0], position[2]];
    } else if (orientation === 2) {
        adjPos = [position[1], position[2], position[0]];
    }

    return new Face(adjPos, dimA, dimB, color, orientation);
}

class Face {
    // Represents a piece of a plane that has a constant x, y, or z, depending
    // on value of this.orientation
    constructor(position, dimA, dimB, color, orientation) {
        [this.x, this.y, this.z] = position;
        this.dimA = dimA;
        this.dimB = dimB;

        this.color = color;
        this.orientation = orientation;
    }

    get a() {
        return this.orientation === 0 ? this.y : this.x;
    }

    get b() {
        return this.orientation === 2 ? this.y: this.z;
    }

    get constant() {
        return [this.x, this.y, this.z][this.orientation];
    }

    get minA() {
        return this.a - this.dimA / 2;
    }

    get maxA() {
        return this.a + this.dimA / 2;
    }

    get minB() {
        return this.b - this.dimB / 2;
    }

    get maxB() {
        return this.b + this.dimB / 2;
    }

    get vertices() {
        return [
            [this.constant, this.minA, this.minB],
            [this.constant, this.maxA, this.minB],
            [this.constant, this.maxA, this.maxB],
            [this.constant, this.minA, this.maxB],
        ];
    }

    orient(v) {
        if (this.orientation === 0) {
            return v;
        }

        if (this.orientation === 1) {
            return [v[1], v[0], v[2]];
        }

        if (this.orientation === 2) {
            return [v[1], v[2], v[0]];
        }
    }

    rorient(v) {
        if (this.orientation === 0) {
            return v;
        }

        if (this.orientation === 1) {
            return [v[1], v[0], v[2]];
        }

        if (this.orientation === 2) {
            return [v[2], v[0], v[1]];
        }
    }

    getColors() {
        return [].concat(...Array(6).fill(this.color));
    }

    getPolys() {
        let v = this.vertices.map(this.orient, this);
        return [
            v[0][0], v[0][1], v[0][2],
            v[1][0], v[1][1], v[1][2],
            v[2][0], v[2][1], v[2][2],

            v[0][0], v[0][1], v[0][2],
            v[2][0], v[2][1], v[2][2],
            v[3][0], v[3][1], v[3][2]
        ];

        // Originally used this simpler looking approach:
        /*return [
            ...v[0], ...v[1], ...v[2],
            ...v[0], ...v[2], ...v[3],
        ];*/
        // But per Chrome's profiler that was a lot slower, and this method is
        // called a lot.
        // ~12% of "self" CPU time over a quick game came to ~1% with the spread
        // operators "expanded."
    }

    intersection(p, v) {
        p = this.rorient(p);
        v = this.rorient(v);
        if (v[0] === 0) {
            return null;
        }

        let t = (this.constant - p[0]) / v[0];
        let aIntersect = p[1] + v[1] * t;
        let bIntersect = p[2] + v[2] * t;
        if (t > 0 &&
            this.minA <= aIntersect && aIntersect <= this.maxA &&
            this.minB <= bIntersect && bIntersect <= this.maxB
        ) {
            return [t, this.orientation];
        }

        return null;
    }

    onCollision() {
    }
}

class GLBox {
    constructor(x, y, z, width, height, depth) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.w = width;
        this.h = height;
        this.d = depth;

        const [u, d, l, r, f, b] = [
            this.up(),
            this.down(),
            this.left(),
            this.right(),
            this.front(),
            this.back()
        ];

        this.faces = [
            new Face([x, y, f], width, height, [0, 0, 0], 2),
            new Face([x, y, b], width, height, [0, 0, 0], 2),
            new Face([l, y, z], height, depth, [0, 0, 0], 0),
            new Face([r, y, z], height, depth, [0, 0, 0], 0),
            new Face([x, u, z], width, depth, [0, 0, 0], 1),
            new Face([x, d, z], width, depth, [0, 0, 0], 1),
        ];

        this.colors = {
            front: [0, 0, 0],
            back: [0, 0, 0],
            up: [0, 0, 0],
            down: [0, 0, 0],
            left: [0, 0, 0],
            right: [0, 0, 0],
        };
    }

    up() {
        return this.y - this.h / 2;
    }

    down() {
        return this.y + this.h / 2;
    }

    left() {
        return this.x - this.w / 2;
    }

    right() {
        return this.x + this.w / 2;
    }

    front() {
        return this.z - this.d / 2;
    }

    back() {
        return this.z + this.d / 2;
    }

    getColors() {
        let colors = this.colors;

        function add(arr) {
            return arr.concat(arr, arr, arr, arr, arr);
        }

        return [].concat(
            add(colors.front),
            add(colors.back),
            add(colors.left),
            add(colors.right),
            add(colors.up),
            add(colors.down)
        );
    }

    getPolys() {
        let res = [].concat(...this.faces.map(f => f.getPolys()));
        return res;
        /*let v = this.getVertices();

        let arr = [
            v[0], v[2], v[1],  // front
            v[2], v[1], v[3],

            v[4], v[6], v[5],  // back
            v[6], v[5], v[7],

            v[4], v[1], v[0],  // left
            v[4], v[5], v[1],

            v[6], v[3], v[2],  // right
            v[6], v[7], v[3],

            v[4], v[2], v[0],  // top
            v[4], v[6], v[2],

            v[5], v[3], v[1],  // bottom
            v[5], v[7], v[3],
        ];
        return [].concat(...arr);*/
    }

    getVertices() {
        const up = this.up();
        const down = this.down();
        const left = this.left();
        const right = this.right();
        const front = this.front();
        const back = this.back();

        const v1 = [left, up, front];
        const v2 = [left, down, front];
        const v3 = [right, up, front];
        const v4 = [right, down, front];
        const v5 = [left, up, back];
        const v6 = [left, down, back];
        const v7 = [right, up, back];
        const v8 = [right, down, back];

        return [v1, v2, v3, v4, v5, v6, v7, v8];
    }

    intersection(p, v) {
        const res = this.faces.map(f => f.intersection(p, v)).
            filter(c => c !== null).
            sort((a, b) => a[0] > b[0] ? 1 : -1);
        if (res.length > 0) {
            return res[0];
        }
        return null;
    }

    move(x, y, z) {
        const dx = x - this.x;
        const dy = y - this.y;
        const dz = z - this.z;

        this.x = x;
        this.y = y;
        this.z = z;

        for (let f of this.faces) {
            [f.x, f.y, f.z] = [f.x + dx, f.y + dy, f.z + dz];
        }
    }

    onCollision() {}

    setColors(colors) {
        let cols = colors.slice();
        this.colors = {
            right: cols.splice(-3),
            left: cols.splice(-3),
            bottom: cols.splice(-3),
            t: cols.splice(-3),
            back: cols.splice(-3),
            front: cols.splice(-3),
        }
    }
}

class Paddle {
    constructor(x, y, z, width, height, thickness, color) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.width = width;
        this.height = height;
        this.thickness = thickness;
        this.color = color;
    }

    contains(arr) {
        const x = arr[0];
        const y = arr[1];
        return x >= this.x - this.width / 2 &&
            y >= this.y - this.height / 2 &&
            x <= this.x + this.width &&
            y <= this.y + this.height;
    }

    getPolys() {
        function getRect(x, y, z, width, height) {
            return [
                x, y, z,
                x + width, y, z,
                x + width, y + height, z,

                x, y, z,
                x + width, y + height, z,
                x, y + height, z,
            ];
        }

        let polys = [
            ...getRect(this.x - this.width / 2, this.y - this.height / 2, this.z, this.width, this.thickness),
            ...getRect(this.x - this.width / 2, this.y + this.height / 2 - this.thickness, this.z, this.width, this.thickness),
            ...getRect(this.x - this.width / 2, this.y - this.height / 2 + this.thickness, this.z, this.thickness, this.height - 2 * this.thickness),
            ...getRect(this.x + this.width / 2 - this.thickness, this.y - this.height / 2 + this.thickness, this.z, this.thickness, this.height - 2 * this.thickness),
        ];
        return polys;
    }

    getColors() {
        return [].concat(...Array(24).fill(this.color));
    }
}

class Ball extends GLBox {
    constructor(...args) {
        super(...args);
        this.v = 0;
        this.collidables = [];
    }

    setTrajectory(v, t, collidables) {
        this.v = v;
        this.initialTime = t;
        this.initialPosition = [this.x, this.y, this.z];
        this.collidables = collidables;

        // Figure out the next object(s) we're going to collide with.  Our
        // trajectory will have to change when we collide - set collisionTime
        // to the time the collision will occur, so that we can deal with it
        // then. We might collide with multiple objects at once, so store all
        // of the objects if so.
        // Once we're done, each item in this.collisions is a 2 element array,
        // containing 1) the orientation of the face we're colliding with and
        // 2) the object we're colliding with.
        let soonestTime = null;
        let collisions = [];
        for (let obj of collidables) {
            let colls = this.getVertices().
                map(p => obj.intersection(p, this.v)).
                filter(i => i != null).
                sort((a, b) => a[0] > b[0] ? 1 : -1);

            if (colls.length > 0) {
                let coll = [colls[0][1], obj];
                let collTime = colls[0][0];
                if (soonestTime === null || collTime <= soonestTime) {
                    if (soonestTime === collTime) {
                        collisions.push(coll);
                    } else {
                        collisions = [coll];
                    }
                    soonestTime = collTime;
                }
            }
        }
        this.collisionTime = t + soonestTime;
        this.collisions = collisions;

        this.hasTrajectory = true;
    }

    update(t) {
        if (t > this.collisionTime) {
            // We collided, so change our trajectory so that we "bounce" in the
            // other direction

            // Start by updating to just BEFORE the collision.  Updating to
            // exactly the collision time sometimes puts the ball just past
            // where it should be (and hence it overlaps what it shouldn't) due
            // to floating point imprecision
            this.update(this.collisionTime - 1);
            const newV = this.v.slice();
            const reversed = Array(3).fill(false);
            for (let c of this.collisions) {
                let o = c[0];
                if (!reversed[o]) {
                    newV[o] = -newV[o];
                    reversed[o] = true;
                }
                c[1].onCollision();
            }
            this.setTrajectory(newV, this.collisionTime, this.collidables);
            this.update(t);
            return;
        };

        const elapsed = t - this.initialTime;

        this.move(
            this.initialPosition[0] + this.v[0] * elapsed,
            this.initialPosition[1] + this.v[1] * elapsed,
            this.initialPosition[2] + this.v[2] * elapsed
        );
    }
}
