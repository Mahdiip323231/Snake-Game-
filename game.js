class Snake {
    constructor(game) {
        this.game = game;
        this.segments = [{x: 10, y: 10}];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.growth = 0;
        this.headColor = this.game.getRandomColor();
        this.bodyColor = this.game.getRandomColor();
    }

    update() {
        this.direction = this.nextDirection;
        const head = {...this.segments[0]};

        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        this.segments.unshift(head);
        if (this.growth === 0) {
            this.segments.pop();
        } else {
            this.growth--;
        }
    }

    grow() {
        this.growth += 2;
    }

    checkCollision(width, height) {
        const head = this.segments[0];
        // Check for collision with self
        if (this.segments.slice(1).some(segment => 
            segment.x === head.x && segment.y === head.y
        )) {
            return 'self';
        }
        // No wall collision, handled by wrapAround
        return false;
    }

    wrapAround(width, height) {
        const head = this.segments[0];
        if (head.x < 0) head.x = width - 1;
        if (head.x >= width) head.x = 0;
        if (head.y < 0) head.y = height - 1;
        if (head.y >= height) head.y = 0;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.width = this.canvas.width / this.gridSize;
        this.height = this.canvas.height / this.gridSize;
        this.snake = new Snake(this);
        this.food = this.generateFood();
        this.obstacles = [];
        this.generateObstacles();
        this.score = 0;
        this.gameOver = false;
        this.animationId = null;
        this.lastTime = 0;
        this.initialFrameInterval = 150;
        this.frameInterval = 150;
        this.minFrameInterval = 50;
        this.speedIncreaseFactor = 5;

        this.bindControls();
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
    }

    generateFood() {
        const food = {
            x: Math.floor(Math.random() * this.width),
            y: Math.floor(Math.random() * this.height),
            color: this.getRandomColor() // Assign a random color to the food
        };
        if (this.snake.segments.some(segment => 
            segment.x === food.x && segment.y === food.y
        )) {
            return this.generateFood();
        }
        return food;
    }

    generateObstacles() {
        this.obstacles = [];
        // Removed obstacle generation logic
    }

    restart() {
        this.snake = new Snake(this);
        this.food = this.generateFood();
        this.obstacles = [];
        this.score = 0;
        this.gameOver = false;
        this.frameInterval = this.initialFrameInterval;
        document.getElementById('score').textContent = '0';
        document.getElementById('startBtn').style.display = 'block';
        document.getElementById('startBtn').textContent = 'Start Game';
        document.getElementById('restartBtn').style.display = 'none';
        this.lastTime = 0;
        this.animationId = null;
        this.draw();
    }

    bindControls() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                    if (this.snake.direction !== 'down') this.snake.nextDirection = 'up';
                    break;
                case 'ArrowDown':
                    if (this.snake.direction !== 'up') this.snake.nextDirection = 'down';
                    break;
                case 'ArrowLeft':
                    if (this.snake.direction !== 'right') this.snake.nextDirection = 'left';
                    break;
                case 'ArrowRight':
                    if (this.snake.direction !== 'left') this.snake.nextDirection = 'right';
                    break;
            }
        });
    }

    update() {
        if (this.gameOver) return;

        this.snake.update();
        this.snake.wrapAround(this.width, this.height); // Apply screen wrapping

        const head = this.snake.segments[0];

        // Check for collision with obstacles
        if (this.obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y)) {
            this.gameOver = true;
            document.getElementById('startBtn').style.display = 'none';
            document.getElementById('restartBtn').style.display = 'block';
            return;
        }

        const collisionType = this.snake.checkCollision(this.width, this.height);
        if (collisionType === 'self') {
            this.gameOver = true;
            document.getElementById('startBtn').style.display = 'none';
            document.getElementById('restartBtn').style.display = 'block';
            return;
        }

        // const head = this.snake.segments[0]; // Already defined above
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            document.getElementById('score').textContent = this.score;
            this.snake.grow();
            this.food = this.generateFood();
            // Ensure new food doesn't spawn on an obstacle
            while (this.obstacles.some(obstacle => obstacle.x === this.food.x && obstacle.y === this.food.y)) {
                this.food = this.generateFood();
            }

            // Increase speed
            if (this.frameInterval > this.minFrameInterval) {
                this.frameInterval = Math.max(this.minFrameInterval, this.initialFrameInterval - (this.score * this.speedIncreaseFactor / 10));
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw snake
        this.snake.segments.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? this.snake.headColor : this.snake.bodyColor;
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 1,
                this.gridSize - 1
            );
        });

        // Draw food
        this.ctx.fillStyle = this.food.color;
        this.ctx.fillRect(
            this.food.x * this.gridSize,
            this.food.y * this.gridSize,
            this.gridSize - 1,
            this.gridSize - 1
        ); // Corrected parenthesis

        // Draw obstacles
        this.ctx.fillStyle = '#7f8c8d'; // Obstacle color (e.g., a greyish tone)
        this.obstacles.forEach(obstacle => {
            this.ctx.fillRect(
                obstacle.x * this.gridSize,
                obstacle.y * this.gridSize,
                this.gridSize - 1,
                this.gridSize - 1
            );
        });

        // Redundant gameOver check and food drawing removed from here
        // if (this.gameOver) {
        // this.ctx.fillRect(
        //     this.food.x * this.gridSize,
        //     this.food.y * this.gridSize,
            this.gridSize - 1,
            this.gridSize - 1
        // ); // Removed extra parenthesis

        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    gameLoop(currentTime) {
        if (!this.lastTime) this.lastTime = currentTime;

        const deltaTime = currentTime - this.lastTime;
        if (deltaTime >= this.frameInterval) {
            this.update();
            this.draw();
            this.lastTime = currentTime;
        }

        if (!this.gameOver) {
            this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
        }
    }

    getRandomColor() {
        const r = Math.floor(Math.random() * 200) + 50;
        const g = Math.floor(Math.random() * 200) + 50;
        const b = Math.floor(Math.random() * 200) + 50;
        return `rgb(${r},${g},${b})`;
    }

    start() {
        if (!this.animationId) {
            this.gameOver = false;
            this.lastTime = 0;
            document.getElementById('startBtn').textContent = 'Pause';
            this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
        } else {
            document.getElementById('startBtn').textContent = 'Start Game';
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

window.onload = () => {
    new Game();
};