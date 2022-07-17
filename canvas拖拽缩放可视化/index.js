import data from "./data.js";

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

class Canvas {
    constructor() {
        this.dtx = 0;//记录当前画布的偏移量
        this.dty = 0;
        this.m = 1;//初始放大倍数
        this.dm = 0.1;//每次改变的放大倍数
        this.m_max = 2;//最大的放大倍数
        this.m_min = 0.5;//最小的放大倍数
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
    }
    //初始化
    init() {
        this.draw();
    }

    drag(dx, dy) {
        this.dtx += dx;
        this.dty += dy;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(this.dtx, this.dty);
        ctx.scale(this.m, this.m);
        arrBall.forEach(item => {
            item.ball.draw();
        })
        ctx.restore();
    }

    zoom(offsetX, offsetY, wheelDelta) {
        this.dm = 0.1;
        //当前鼠标在整个画布上的坐标
        let mouseX = offsetX - this.dtx;
        let mouseY = offsetY - this.dty;
        //每次偏移量的增量
        let deltaX = mouseX / this.m * this.dm;
        let deltaY = mouseY / this.m * this.dm;
        if (wheelDelta > 0) {
            //需要每次改变画布的偏移量
            if (this.m >= this.m_max) {
                deltaX = 0; deltaY = 0;
                this.dm = 0;
            }
            this.dtx -= deltaX;
            this.dty -= deltaY;
            this.m += this.dm;
        } else if (wheelDelta < 0) {
            if (this.m <= this.m_min) {
                deltaX = 0; deltaY = 0;
                this.dm = 0;
            }
            this.dtx += deltaX;
            this.dty += deltaY;
            this.m -= this.dm;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        //移动原点每次都要在变形之前移动
        ctx.translate(this.dtx, this.dty);
        ctx.scale(this.m, this.m);
        arrBall.forEach(item => {
            item.ball.draw();
        })
        ctx.restore();
    }
}

class Ball extends Canvas {
    constructor(x, y, r, color) {
        super();
        this.x = x;
        this.y = y;
        this.r = r;
        this.color = color;
        //球心在整个画布上的初始坐标
        this.ballX = this.x;
        this.ballY = this.y;
    }
    //判断鼠标是否在球上
    judgeMousePosition(offsetX, offsetY) {
        //当前鼠标在整个画布上的坐标
        let mouseX = offsetX - can.dtx;
        let mouseY = offsetY - can.dty;
        //当前球心在整个画布上的坐标
        /*  this.ballX = this.x * can.m;
         this.ballY = this.y * can.m; */
        let distance = Math.sqrt(Math.pow((this.x * can.m - mouseX), 2) + Math.pow((this.y * can.m - mouseY), 2));
        if (distance < (this.r * can.m)) {
            return true;
        }
        return false;
    }
    //拖动小球
    dragball(dx, dy) {
        /* 
        *通过this.x转接一下this.ballX，当放大倍(can.m)数大时，dx要慢点变化，当放大倍数
        *小时，dx要快点变化。
        */
        this.x += (dx / can.m);
        this.y += (dy / can.m);
        this.ballX = this.x;
        this.ballY = this.y;
        ctx.save();
        ctx.translate(can.dtx, can.dty);
        ctx.scale(can.m, can.m);
        this.draw(this.ballX, this.ballY);
        ctx.restore();
    }
    //小球之间连线
    lineball() {
        let redX = '';
        let redY = '';
        for (let j = 0; j < arrBall.length; j++) {
            if (arrBall[j].id === 'red') {
                redX = arrBall[j].ball.ballX;
                redY = arrBall[j].ball.ballY;
            }
            ctx.save();
            ctx.translate(can.dtx, can.dty);
            ctx.scale(can.m, can.m);
            ctx.beginPath();
            ctx.strokeStyle = '#9CDCFE';
            ctx.moveTo(redX, redY);
            ctx.lineTo(arrBall[j].ball.ballX, arrBall[j].ball.ballY);
            ctx.stroke();
            ctx.restore();
        }
    }
}

let can = new Canvas();

//将很多new的小球存放的数组中
let arrBall = [];
data.forEach(item => {
    let { x, y, r, color, id } = item;
    let ball = new Ball(x, y, r, color);
    arrBall.push({ ball, id });
})

arrBall.forEach(item => {
    item.ball.init();
    item.ball.lineball();
})

canvas.onmousedown = function (e) {
    //记录鼠标第一次移动之前的坐标
    let lastX = e.offsetX;
    let lastY = e.offsetY;
    for (let i = 0; i < arrBall.length; i++) {

        let isInCircle = arrBall[i].ball.judgeMousePosition(e.offsetX, e.offsetY);
        canvas.onmousemove = function (e) {

            //鼠标每次移动时相对于上一次的地方移动的距离
            let moveX = e.offsetX - lastX;
            let moveY = e.offsetY - lastY;
            lastX = e.offsetX;
            lastY = e.offsetY;
            if (isInCircle) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                arrBall[i].ball.dragball(moveX, moveY);
            } else {
                can.drag(moveX, moveY);
            }
            arrBall.forEach(item => {
                item.ball.lineball();
                ctx.save();
                ctx.translate(can.dtx, can.dty);
                ctx.scale(can.m, can.m);
                item.ball.draw(item.ballX, item.ballY);
                ctx.restore();
            })
        }
        if (isInCircle) {
            break;
        }
    }
    document.onmouseup = function () {
        canvas.onmousemove = null;
    }
}
canvas.onwheel = function (e) {
    let offsetX = e.offsetX;
    let offsetY = e.offsetY;
    can.zoom(offsetX, offsetY, e.wheelDelta);
    arrBall.forEach(item => {
        item.ball.lineball();
    })
}