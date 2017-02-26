const level1 = {
    bricks: [],
    xMax: 300,
    yMax: 300,
    zMax: 5000,
    zMin: 1000,  // For playability, the viewing frustum should be a ways out
};

for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
        const b = new GLBox(-150 + 180 * x, -150 + 180 * y, level1.zMin + (level1.zMax - level1.zMin) / 2, 150, 150, 150);
        b.colors.front = [122, 255, 255];
        level1.bricks.push(b);
    }
}

const level2 = {
    bricks: [],
    xMax: 300,
    yMax: 300,
    zMax: 5000,
    zMin: 1000,
};

for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
        const b = new GLBox(-150 + 180 * x, -150 + 180 * y, level2.zMin + (level2.zMax - level2.zMin) / 2, 100, 100, 100);
        b.colors.front = [122, 255, 122];
        level2.bricks.push(b);

        const b2 = new GLBox(-150 + 180 * x, -150 + 180 * y, level2.zMin + (level2.zMax - level2.zMin) / 2 + 200, 150, 150, 150);
        b2.colors.front = [122, 255, 255];
        level2.bricks.push(b2);
    }
}

levels = [level1, level2];
