function randomColor() {
    return [Math.random() * 255, Math.random() * 255, Math.random() * 255];
}

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
    // Represents a piece of a plane that has a constant x, y, or z.
    // Whether the face will have constant x, y, or z depends on the value
    // of orientation. If orientation is:
    //
    // 0: then this face lies in a plane with constant x
    // 1: then this face lies in a plane with constant y
    // 2: then this face lies in a plane with constant z
    //
    // Internally, instead of referring to our x, y, and z coordinates, we
    // refer to "a", "b', and "constant" coordinates. We map "a", "b" and "c"
    // in a consistent way onto "x", "y" and "z", depending on our
    // orientation.
    //
    // The idea is that, by referring to "a", "b", and "constant", we can have
    // just one set of functions/calculations that applies under all
    // orientations.

    constructor(position, dimA, dimB, color, orientation) {
        // Position gives the center point of the face. dimA and dimB give the
        // width and height of the face.
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
        // Convert a [constant, a, b] vector in our internal coordinate system
        // to an [x, y, z] vector in the external coordinate system.
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
        // Convert an [x, y, z] vector to [constant, a, b].
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
        // Given a point at position "p" and moving at velocity v, return the
        // time it's expected to collide with this face as well as the face
        // itself, or return null if there will be no collision.
        //
        // (Returning the face itself, i.e., this, is for consistency with the
        // intersection method on objects, which also returns the face hit).
        //
        // p and v are arrays representing 3 dimensional vectors.

        // This face may be oriented in one of 3 different ways. Adjust the
        // position and velocity vectors so we can calculate the collision time
        // with one set of equations.
        p = this.rorient(p);
        v = this.rorient(v);

        // If the point isn't moving towards us, assume it won't
        // hit us.  We're ignoring the case where the object already
        // overlaps us. (Note - after this.rorient, v[0] refers to
        // this face's constant value).
        if (v[0] === 0) {
            return null;
        }

        // Calculate when the point will reach this face's constant value.
        // Then figure out what "a" and "b" values it has at that time. If
        // it'll be within this face's "a" and "b" ranges then it will collide
        // and we should return the time of the collision. Otherwise, return
        // null.
        let t = (this.constant - p[0]) / v[0];
        let aIntersect = p[1] + v[1] * t;
        let bIntersect = p[2] + v[2] * t;
        if (t > 0 &&
            this.minA <= aIntersect && aIntersect <= this.maxA &&
            this.minB <= bIntersect && bIntersect <= this.maxB
        ) {
            return {'time': t, 'face': this};
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

        this.v = [0, 0, 0];
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
        // Find given a point with location vector p moving at velocity v, when
        // will that point hit this GLBox? Return the time and the face that's
        // going to be hit first, or return null if there will be no
        // intersections.
        //
        // To do this, check each face and find the time the point will hit
        // that face, filter out the null results (which means it won't hit the
        // face), then sort so we can find the lowest time (since we really
        // only want the first collision). This is inefficient but we don't do
        // it a lot.
        const intersections =
            this.faces.map(f => f.intersection(p, v)).
            filter(c => c !== null).
            sort((a, b) => a.time > b.time ? 1 : -1);

        if (intersections.length > 0) {
            return intersections[0];
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

class Mover extends GLBox {
    // TODO: Consider moving these methods into GLBox - is there a reason a Mover
    // couldn't just be a GLBox with a non-zero velocity?

    constructor(...args) {
        super(...args);
        this.initialPosition = [this.x, this.y, this.z];
        this.v = [0, 0, 0];
    }

    intersection(p, v) {
        const adjustedV = [v[0] - this.v[0], v[1] - this.v[1], v[2] - this.v[2]];
        return super.intersection(p, adjustedV);
    }

    nextCourse() {
    }

    startCourse(collidables) {
        // Start a new course from our current position. This means we set our
        // initialPosition to our current position, so that the update method
        // correctly puts us here at time 0.
        //
        // We should also report back on the time until our course needs to
        // change, based on the positions of other objects we get passed, or
        // return null if we don't anticipate a change. Subclasses will
        // implement this more fully.
        this.initialPosition = [this.x, this.y, this.z];
        return null;
    }

    update(t) {
        // Based on our initial position and current velocity, update our
        // position to what it should be at time t.

        this.move(
            this.initialPosition[0] + this.v[0] * t,
            this.initialPosition[1] + this.v[1] * t,
            this.initialPosition[2] + this.v[2] * t
        );
    }
}

class Patroller extends Mover {
    // A box object that moves back and forth between two positions.

    nextCourse() {
        this.v[this.direction] = -this.v[this.direction];
    }

    setPath(d, s, min, max) {
        // d: sets the axis along which we move. 0 for x axis, 1 for y, 2 for
        // z.
        // s: sets our speed along the axis set by d.
        // min: sets our minimum value along the axis set by d. When we reach
        // min, turn to a positive v.
        // max: sets our maximum value along the axis set by d. When we reach
        // max, turn to a negative v.
        this.direction = d;
        this.v = [0, 0, 0];
        this.v[d] = s;
        this.min = min;
        this.max = max;
    }

    startCourse(collidables) {
        super.startCourse(collidables);

        if (!this.hasOwnProperty('direction')) {
            return null;
        }

        let v = this.v[this.direction];
        let initial = this.initialPosition[this.direction];

        if (v < 0 && initial > this.min) {
            return Math.abs((initial - this.min) / v);
        }

        if (v > 0 && initial < this.max) {
            return Math.abs((this.max - initial) / v);
        }

        return null;
    }
}

class Ball extends Mover {
    constructor(x, y, z, diameter, maxMotion, innerColor, outerColor) {
        // x, y, z, diameter give the physical location/dimensions of our ball
        // innerColor and outerColor are 3-element arrays giving the rgb color
        // of the ball's center and outer edge, respectively (the ball will
        // have a gradient from the inner to the outer color so that it looks
        // shaded).

        // The "ball" is represented graphically by a flat polygon.  But for
        // collision prediction, we assume we're in a box with sides of length
        // diameter (we inherit our "boxy" properties from superclass GLBox).
        super(x, y, z, diameter, diameter, diameter);

        this.diameter = diameter;
        this.v = 0;
        this.collidables = [];

        this.maxMotion = maxMotion;
        this.capVComponentsSeparately = false;

        // Draw the ball as a polygon with numSides
        const numSides = 25;
        const inc = 2 * Math.PI / numSides;

        // Start with a vector representing one vertex of the polygon
        // Then rotate it around by "inc" radians and repeat until we've
        // come full circle
        const init = new PositionMatrix(4, 1, [0, this.diameter / 2, 0, 1]);
        this.polys = [];

        for (let i = 0; i < numSides; i++) {
            let a = init.m.slice(0, 3);
            init.rotateZ(inc);
            let b = init.m.slice(0, 3);
            this.polys.push(a, b, [0, 0, 0, 1]);
        }

        // Store our colors in the form webGL will expect
        const colors = [...outerColor, ...outerColor, ...innerColor];
        this.colors = [].concat(...Array(this.polys.length / 3).fill(colors));
    }

    getPolys() {
        // Translate to be in the correct position on screen
        return [].concat(...this.polys.map(arr => [arr[0] + this.x, arr[1] + this.y, arr[2] + this.z]));
    }

    getColors() {
        return this.colors;
    }

    nextCourse() {
        // Update our velocity to reflect the next trajectory we're expecting
        // to take.
        //
        // For the ball, the next trajectory is going to be based on whatever
        // objects and faces we expected to collide with.
        //
        // We also want to cap our velocity based on this.maxMotion.

        this.initialPosition = [this.x, this.y, this.z];
        const newV = this.v.slice();
        const reversed = Array(3).fill(false);
        for (let c of this.collisions) {
            // If we hit a face in a given orientation, we want to bounce away
            // from that orientation, so reverse our direction. But if we hit
            // multiple faces in the same orientation, don't reverse more than
            // once.

            const orientation = c.face.orientation;
            const obj = c.object;

            if (!reversed[orientation]) {
                newV[orientation] = -newV[orientation];
                reversed[orientation] = true;
            }

            // Some objects can add to our velocity when we hit them.
            if (obj.hasOwnProperty('velocityAdjustment')) {
                obj.velocityAdjustment.forEach((a, i) => newV[i] = newV[i] + a);
            }
            obj.onCollision();
        }

        // Cap the horizontal/vertical velocity to be no greater than
        // this.maxMotion.  We can either 1) cap the overall magnitude of the
        // velocity or 2) cap the individual components of the velocity (x and
        // y) separately.  Currently I think (1) feels more natural - capping
        // both components separately tends to lead to each being maxed out and
        // so the ball travels along a weird diagonal.  Note, we're not messing
        // with the forward/backward motion here.
        if (this.capVComponentsSeparately) {
            if (Math.abs(newV[0]) > this.maxMotion) {
                // Maintain the sign in these calculations.
                newV[0] = this.maxMotion * newV[0] / Math.abs(newV[0]);
            }

            if (Math.abs(this.v[1]) > this.maxMotion) {
                newV[1] = this.maxMotion * newV[1] / Math.abs(newV[1]);
            }
        } else {
            const motion = Math.sqrt(newV[0] ** 2 + newV[1] ** 2);
            if (motion > this.maxMotion) {
                const adj = this.maxMotion / motion;
                newV[0] = newV[0] * adj;
                newV[1] = newV[1] * adj;
            }
        }

        this.v = newV;
    }

    startCourse(collidables) {
        // Report back on how long until we collide next, given:
        //
        // 1) Our current velocity,
        // 2) Our current position,
        // 3) The array of collidable objects we were passed.
        //
        // Also, we need to remember basic information about our trajectory so
        // we know what to do when it needs to be updated. Remember which
        // object(s) and face(s) we're going to collide with next.

        super.startCourse(collidables);

        let soonestTime = null;
        let collisions = [];

        // To figure out when we'll collide, find the "intersection" time for
        // each vertex of our box with each collidable object, then get the
        // earliest of those times.
        //
        // Note, this currently doesn't work for very "thin" objects, since
        // it's possible none of our vertices will hit an object that's
        // narrower than we are, even if we actually do collide with it.
        for (let obj of collidables) {
            let vertexCollisions = this.getVertices().
                map(p => obj.intersection(p, this.v)).
                filter(i => i != null).
                sort((a, b) => a.time > b.time ? 1 : -1);

            if (vertexCollisions.length > 0) {
                const c = vertexCollisions[0];
                if (soonestTime === null || c.time <= soonestTime) {
                    if (soonestTime === c.time) {
                        collisions.push({'object': obj, 'face': c.face});
                    } else {
                        collisions = [{'object': obj, 'face': c.face}];
                    }
                    soonestTime = c.time;
                }
            }
        }

        this.collisions = collisions;
        return soonestTime;
    }
}

