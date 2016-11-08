// used tutorials on http://webglfundamentals.org to make these

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        return shader;
    }
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randInts(min, max, num) {
    return function* () {
        while(num > 0) {
            yield randInt(min, max);
            num--;
        }
    }
}

const vShaderSrc = `
        attribute vec4 a_position;

        uniform mat4 u_objectTransform;
        uniform mat4 u_projection;

        attribute vec4 a_color;
        varying vec4 v_color;

        void main() {
            gl_Position = u_projection * u_objectTransform * a_position;
            v_color = a_color;
        }
    `;

const fShaderSrc = `
    precision mediump float;

    varying vec4 v_color;

    void main() {
        gl_FragColor = v_color;
    }
    `;

class GL {
    constructor(canvasElement) {
        const gl = canvas.getContext('webgl');

        if (!gl) {
            alert('WebGL not working!');
            return;
        }

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Create program
        const vShader = createShader(gl, gl.VERTEX_SHADER, vShaderSrc);
        const fShader = createShader(gl, gl.FRAGMENT_SHADER, fShaderSrc);
        const program = createProgram(gl, vShader, fShader);
        gl.useProgram(program);

        gl.enable(gl.DEPTH_TEST);

        this.posLoc = gl.getAttribLocation(program, "a_position");
        this.colorLoc = gl.getAttribLocation(program, 'a_color');
        this.projectionLoc = gl.getUniformLocation(program, 'u_projection');
        this.objectTransformLoc= gl.getUniformLocation(program, 'u_objectTransform');

        this.gl = gl;

        this.objects = [];
    }

    addObj(obj) {
        this.objects.push(obj);
    }

    draw(objs) {
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        for (let obj of objs) {
            if (obj.visible) {
                gl.uniformMatrix4fv(this.objectTransformLoc, false, obj.transformation.m);
                let polys = obj.getPolys();
                let colors = obj.getColors();
                this.setVertices(new Float32Array(polys));
                this.setColors(new Int8Array(colors));
                gl.drawArrays(gl.TRIANGLES, 0, polys.length / 3);
            }
        }
    }

    setColors(colors) {
        const gl = this.gl;

        const color_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.colorLoc);
        gl.vertexAttribPointer(this.colorLoc, 3, gl.UNSIGNED_BYTE, true, 0, 0);
    }

    setVertices(vertices) {
        const gl = this.gl;

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // Connect the buffered data to the attribute a_position in our vShader
        gl.enableVertexAttribArray(this.posLoc);

        // args to vertexAttribPointer: attribute location, number of components per iteration,
        // data type, whether data should be normalized, stride, offset
        gl.vertexAttribPointer(this.posLoc, 3, gl.FLOAT, false, 0, 0);
    }

    setPerspective(fov, aspect, near, far, xMax, yMax) {
        // https://unspecified.wordpress.com/2012/06/21/calculating-the-gluperspective-matrix-and-other-opengl-matrix-maths/

        // Sets the perspective matrix used by this GL context, based on the
        // provided parameters.
        //
        // fov: the angle in radians of the field of view
        // aspect: the aspect ratio of the display area (like canvas width / height)
        // near: the "near" z value - vertices nearer than this z value are clipped
        // far: the max z value - vertices farther than this z value are clipped
        // xMax: the largest x value visible at z = near
        // yMax: the largest y value visible at z = near

        const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
        const rangeInv = 1.0 / (near - far);

        const matrix = new PositionMatrix(4, 4, [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, -(near + far) * rangeInv, 1,
            0, 0, near * far * rangeInv * 2, 0,
        ]);

        const oldXMax = (near * aspect) / f;
        const oldYMax = near / f;

        matrix.scale(
            oldXMax / xMax,
            oldYMax / yMax,
            1
        );

        this.gl.uniformMatrix4fv(this.projectionLoc, false, matrix.m);
    }
}

class Matrix {
    constructor(w, h, initial) {
        if (initial === undefined) {
            initial = Array(w * h).fill(0);
        }
        if (initial.length != w * h) {
            throw 'Initial value isn\'t the right length';
        }
        this.w = w;
        this.h = h;
        this.m = initial;
    }

    static multiply(m1, m2) {
        if (m1.w != m2.h) {
            throw `Cannot multiply a matrix with width ${m1.w} by a matrix with height ${m2.h}`;
        }
        const newM = [];
        for (let y = 0; y < m1.h; y++) {
            for (let x = 0; x < m2.w; x++) {
                let e = 0;
                for (let i = 0; i < m1.w; i++) {
                    e += m1.get(i, y) * m2.get(x, i);
                }
                newM.push(e);
            }
        }
        return new Matrix(m2.w, m1.h, newM);
    }

    get(x, y) {
        return this.m[x + this.w * y];
    }

    set(x, y, val) {
        this.m[x + this.w * y] = val;
    }

    multiply_update(m2) {
        this.m = Matrix.multiply(this, m2).m;
    }

    show() {
        for (let y = 0; y < this.h; y++) {
            let s = '';
            for (let x = 0; x < this.w; x++) {
                s += this.get(x, y) + ' ';
            }
            console.log(s);
        }
    }
}

class PositionMatrix extends Matrix {
    constructor(w, h, initial) {
        super(w, h, initial);
        this.projectionMatrix = PositionMatrix.getIdentity();
    }

    static getIdentity() {
        return new Matrix(4, 4, [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    translate(tx, ty, tz) {
        this.multiply_update(new PositionMatrix(4, 4, [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            tx, ty, tz, 1
        ]));
    }

    scale(sx, sy, sz) {
        this.multiply_update(new PositionMatrix(4, 4, [
            sx, 0, 0, 0,
            0, sy, 0, 0,
            0, 0, sz, 0,
            0, 0, 0, 1,
        ]));
    }

    rotateX(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        this.multiply_update(new PositionMatrix(4, 4, [
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1
        ]));
    }

    rotateY(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        this.multiply_update(new PositionMatrix(4, 4, [
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1
        ]));
    }

    rotateZ(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        this.multiply_update(new PositionMatrix(4, 4, [
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]));
    }

    getProjection() {
        return Matrix.multiply(this, this.projectionMatrix).m;
    }
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
    // Represents a piece of a plane that has a constant x, y, or z, depending
    // on value of this.orientation
    constructor(position, dimA, dimB, color, orientation) {
        [this.x, this.y, this.z] = position;
        this.dimA = dimA;
        this.dimB = dimB;

        this.color = color;
        this.orientation = orientation;

        this.transformation = new PositionMatrix(4, 4, [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);

        this.visible = true;
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
            ...v[0], ...v[1], ...v[2],
            ...v[0], ...v[2], ...v[3],
        ];
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

        this.transformation = new PositionMatrix(4, 4, [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);

        this.visible = true;
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

class Brick extends GLBox {
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

