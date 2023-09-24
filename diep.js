const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const UPDATE_LOAD_COEFF = 0.5;
let targetInterval = 1000 / 60;
let prevTime = Date.now() - targetInterval;
let centerX = canvas.width / 2;
let centerY = canvas.height / 2;
let scroolX = 0;
let scroolY = 0;
let mouseX = Infinity;
let mouseY = 0;
let keys = {};
let mouseDown = false;

let polygons = [];
let bullets = [];

class Polygon {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = Math.random() * Math.PI * 2;
        this.vx = 0;
        this.vy = 0;
        this.ax = Math.cos(this.direction)/50;
        this.ay = Math.sin(this.direction)/50;
        this.deg = Math.random() * Math.PI * 2;
        this.sides = Math.random() < 0.7 ? 4 : (Math.random() < 0.75 ? 3 : 5);
        this.ω = Math.random() > 0.5 ? (800 + Math.random() * 400) : -(800 + Math.random() * 400);
    }
    update() {
        this.vx += this.ax;
        this.vx *= 0.9;
        this.x += this.vx;

        this.vy += this.ay;
        this.vy *= 0.9;
        this.y += this.vy;

        this.deg += Math.PI / this.ω;
        this.x2 = this.x + scroolX + centerX - 500;
        this.y2 = this.y + scroolY + centerY - 500;
    }
    draw() {
        ctx.beginPath();
        switch (this.sides) {
            case 4:
                this.size = 40;
                ctx.fillStyle = "#FFE869";
                break;
            case 3:
                this.size = 41;
                ctx.fillStyle = "#FC7677";
                break;
            case 5:
                this.size = 54;
                ctx.fillStyle = "#768DFC";
                break;

            default:
                break;
        }
        ctx.moveTo(this.x2 + Math.cos(this.deg) * this.size, this.y2 + Math.sin(this.deg) * this.size);
        for (let i = 0; i < this.sides + 1; i++) {
            ctx.lineTo(
                this.x2 + Math.cos(this.deg + i * (Math.PI * 2 / this.sides)) * this.size,
                this.y2 + Math.sin(this.deg + i * (Math.PI * 2 / this.sides)) * this.size);
        }
        ctx.fill();
        border();
    }
}

class Basic {
    constructor(lvl) {
        this.x = centerX;
        this.y = centerY;
        this.lvl = lvl;
        this.deg = 0;
        this.vx = 0;
        this.vy = 0;
        this.reload = 0;
        this.barrelThickness = this.size/36 * 15;
        this.barrelLength = this.size/36 * 68;
    }
    update() {
        this.x = centerX + this.vx * 10;
        this.y = centerY + this.vy * 10;
        this.deg = calcAngle(this.x, this.y, mouseX, mouseY);
        this.size = (1 + this.lvl / 100)*36;
        this.barrelThickness = this.size/36 * 15;
        this.barrelLength = this.size/36 * 68;
        // if (Math.abs(scroolX - this.vx * 10) < 500 && Math.abs(scroolY - this.vy * 10) < 500) {
            if (keys['a'] || keys['ArrowLeft']) {
                this.vx -= 0.2;
            }
            if (keys['d'] || keys['ArrowRight']) {
                this.vx += 0.2;
            }
            if (keys['s'] || keys['ArrowDown']) {
                this.vy += 0.2;
            }
            if (keys['w'] || keys['ArrowUp']) {
                this.vy -= 0.2;
            }
        // }

        this.vx *= 0.97;
        this.vy *= 0.97;
        scroolX -= this.vx;
        scroolY -= this.vy;
        // if (Math.abs(scroolX - this.vx * 10) > 500) {
        //     scroolX += this.vx;
        // }
        // if (Math.abs(scroolY - this.vy * 10) > 500) {
        //     scroolY += this.vy;
        // }

        for (let i = 0; i < polygons.length; i++) {
            const checked = checkCollision(this.x, this.y, this.size, polygons[i].x2, polygons[i].y2, polygons[i].size);
            if (checked.check) {
                this.vx -= checked.dx * 0.1;
                this.vy -= checked.dy * 0.1;
                polygons[i].vx += checked.dx*400 / (polygons[i].size**2);
                polygons[i].vy += checked.dy*400 / (polygons[i].size**2);
            }
        }


        this.reload -= 1;
        if (mouseDown && this.reload < 0) {
            bullets.push(new Bullet(this.x, this.y, this.deg, this.size/36, this.barrelLength));
            this.reload = 0;
        }

    }
    draw() {
        ctx.beginPath();
        ctx.moveTo(this.x + Math.cos(this.deg + Math.PI / 2) * this.barrelThickness, this.y + Math.sin(this.deg + Math.PI / 2) * this.barrelThickness);
        ctx.lineTo(this.x + Math.cos(this.deg + Math.PI / 2) * this.barrelThickness + Math.cos(this.deg) * this.barrelLength, this.y + Math.sin(this.deg + Math.PI / 2) * this.barrelThickness + Math.sin(this.deg) * this.barrelLength);
        ctx.lineTo(this.x - Math.cos(this.deg + Math.PI / 2) * this.barrelThickness + Math.cos(this.deg) * this.barrelLength, this.y - Math.sin(this.deg + Math.PI / 2) * this.barrelThickness + Math.sin(this.deg) * this.barrelLength);
        ctx.lineTo(this.x - Math.cos(this.deg + Math.PI / 2) * this.barrelThickness, this.y - Math.sin(this.deg + Math.PI / 2) * this.barrelThickness);

        ctx.fillStyle = "#999999";
        ctx.fill();
        border();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, true);
        ctx.fillStyle = "#00B2E1";
        ctx.fill();
        border();
    }
}

class Bullet {
    constructor(x, y, deg, size, launchPosition) {
        this.deg = deg + Math.PI * (Math.random() * 0.05 - 0.025);
        this.x = x + Math.cos(this.deg) * launchPosition;
        this.y = y + Math.sin(this.deg) * launchPosition;
        this.ax = Math.cos(this.deg) * 0.7 + Math.random() * 0.1;
        this.ay = Math.sin(this.deg) * 0.7 + Math.random() * 0.1;
        this.vx = Math.cos(this.deg) * 10;
        this.vy = Math.sin(this.deg) * 10;
        this.size = size * 16;
        this.launchX = scroolX;
        this.launchY = scroolY;
        this.disappear = 180;
    }
    update() {
        this.vx += this.ax;
        this.vx *= 0.9;
        this.x += this.vx;
        this.x2 = this.x - this.launchX + scroolX;

        this.vy += this.ay;
        this.vy *= 0.9;
        this.y += this.vy;
        this.y2 = this.y - this.launchY + scroolY;

        this.disappear -= 1;
        for (let i = 0; i < polygons.length; i++) {
            const checked = checkCollision(this.x2, this.y2, this.size, polygons[i].x2, polygons[i].y2, polygons[i].size);
            if (checked.check) {
                this.vx -= checked.dx * 0.7;
                this.vy -= checked.dy * 0.7;
                polygons[i].vx += checked.dx*200 / (polygons[i].size**2);
                polygons[i].vy += checked.dy*200 / (polygons[i].size**2);
            }
        }
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x2, this.y2, this.size, 0, Math.PI * 2, true);
        ctx.fillStyle = "#00B2E1";
        ctx.fill();
        border();
    }
}




canvas.addEventListener("mousemove", (event) => {
    mouseX = (event.clientX - canvas.getBoundingClientRect().left) * window.devicePixelRatio;
    mouseY = (event.clientY - canvas.getBoundingClientRect().top) * window.devicePixelRatio;
});

canvas.addEventListener('mousedown', (event) => {
    mouseDown = true;
});

canvas.addEventListener('mouseup', (event) => {
    mouseDown = false;
});

window.addEventListener('keydown', (event) => {
    keys[event.key] = true;
});

window.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});



for (let i = 0; i < 15; i++) {
    polygons.push(new Polygon(Math.random() * 1000, Math.random() * 1000));
}
const basic = new Basic(1)


function calcAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

function border() {
    const red = parseInt(ctx.fillStyle.slice(1, 3), 16);
    const green = parseInt(ctx.fillStyle.slice(3, 5), 16);
    const blue = parseInt(ctx.fillStyle.slice(5, 7), 16);
    const darknessFactor = 55;
    const newRed = Math.round(red * 0.75);
    const newGreen = Math.round(green * 0.75);
    const newBlue = Math.round(blue * 0.75);
    ctx.strokeStyle = `#${newRed.toString(16).padStart(2, "0")}${newGreen.toString(16).padStart(2, "0")}${newBlue.toString(16).padStart(2, "0")}`;
    ctx.lineWidth = 5.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
}

function checkCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy)
    return {
        check: dist <= r1 + r2,
        dx: dx / dist,
        dy: dy / dist
    };
}

window.onresize = function () {
    resize();
}

function resize() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
}











function mainUpdate() {
    resize();
    for (let i = 0; i < polygons.length; i++) {
        polygons[i].update();
    }
    for (let i = 0; i < bullets.length; i++) {
        bullets[i].update();
        if (bullets[i].disappear < 0) {
            bullets.splice(i, 1);
        }
    }
    basic.update();
}


function mainDraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#B8B8B8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#CDCDCD";
    ctx.fillRect(centerX - 500 + scroolX, centerY - 500 + scroolY, 1000, 1000);


    for (let i = 0; i < polygons.length; i++) {
        polygons[i].draw();
    }
    for (let i = 0; i < bullets.length; i++) {
        bullets[i].draw();
    }
    basic.draw();
}















function mainloop() {
    let currentTime = Date.now();
    let updated = false;
    while (currentTime - prevTime > targetInterval * 0.5) {
        mainUpdate();
        updated = true;
        prevTime += targetInterval;
        const now = Date.now();
        const updateTime = now - currentTime;
        if (updateTime > targetInterval * UPDATE_LOAD_COEFF) {
            if (prevTime < now - targetInterval) {
                prevTime = now - targetInterval;
            }
            break;
        }
    }
    if (updated) {
        mainDraw();
    }
    requestAnimationFrame(mainloop);
}

mainloop();






