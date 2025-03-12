class Player {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.speed = 5;
        this.score = 0;
        this.isAlive = true;

        // 添加碰撞体积缩小的属性
        this.collisionReduction = 0.2; // 20%的碰撞体积减少
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        // 绘制飞机主体
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // 绘制机翼
        ctx.beginPath();
        ctx.moveTo(this.x - this.width / 4, this.y + this.height * 0.7);
        ctx.lineTo(this.x + this.width * 1.25, this.y + this.height * 0.7);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height * 0.4);
        ctx.closePath();
        ctx.fill();
    }

    // 获取实际碰撞区域
    getCollisionBounds() {
        const reductionX = this.width * this.collisionReduction;
        const reductionY = this.height * this.collisionReduction;
        
        return {
            x: this.x + reductionX / 2,
            y: this.y + reductionY / 2,
            width: this.width - reductionX,
            height: this.height - reductionY
        };
    }

    moveLeft(boundary) {
        // 移动到边界时停止，但不会坠机
        this.x = Math.max(0, this.x - this.speed);
    }

    moveRight(boundary) {
        // 移动到边界时停止，但不会坠机
        this.x = Math.min(boundary - this.width, this.x + this.speed);
    }

    // 可以添加一个方法来显示碰撞区域（用于调试）
    drawCollisionBox(ctx) {
        const bounds = this.getCollisionBounds();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }
}

class Obstacle {
    constructor(x, y, width, height, speed, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.color = color;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    move() {
        this.y += this.speed;
    }

    isOffScreen(canvasHeight) {
        return this.y > canvasHeight;
    }
}

class Game {
    constructor() {
        // 获取画布和上下文
        this.leftCanvas = document.getElementById('leftCanvas');
        this.rightCanvas = document.getElementById('rightCanvas');
        this.leftCtx = this.leftCanvas.getContext('2d');
        this.rightCtx = this.rightCanvas.getContext('2d');

        // 游戏状态
        this.isGameStarted = false;
        this.isGameOver = false;
        this.gameTime = 0;
        this.lastTime = 0;
        this.difficultyLevel = 1; // 难度等级
        this.obstaclesPassed = 0; // 通过的障碍物数量
        this.obstaclesForNextLevel = 40; // 升级所需的障碍物数量 (10组 * 4个障碍物)
        this.isWaitingForUpgrade = false; // 是否等待升级
        
        // 难度设置
        this.difficultySettings = {
            1: { obstacleInterval: 1500, speed: 3, maxObstacles: 3 },
            2: { obstacleInterval: 1200, speed: 4, maxObstacles: 4 },
            3: { obstacleInterval: 1000, speed: 5, maxObstacles: 5 },
            4: { obstacleInterval: 800, speed: 6, maxObstacles: 6 },
            5: { obstacleInterval: 600, speed: 7, maxObstacles: 7 },
            6: { obstacleInterval: 500, speed: 8, maxObstacles: 8 }
        };

        this.obstacleInterval = this.difficultySettings[1].obstacleInterval;
        this.lastObstacleTime = 0;

        // 初始化玩家
        this.initializePlayers();

        // 初始化障碍物数组
        this.leftObstacles = [];
        this.rightObstacles = [];

        // 绑定按键事件
        this.setupControls();

        // 设置画布尺寸
        this.resizeCanvases();
        window.addEventListener('resize', () => this.resizeCanvases());

        // 获取UI元素
        this.startButton = document.querySelector('.start-button');
        this.startScreen = document.querySelector('.start-screen');
        this.countdown = document.querySelector('.countdown');

        // 绑定开始游戏事件
        this.startButton.addEventListener('click', () => this.startGame());
    }

    initializePlayers() {
        const playerWidth = 30;
        const playerHeight = 40;
        const playerY = this.leftCanvas ? this.leftCanvas.height - playerHeight - 20 : 540;
        
        // 设置初始玩家速度为障碍物速度的2倍
        const initialPlayerSpeed = this.difficultySettings[1].speed * 2;

        // 左侧飞机（蓝色）
        this.leftPlayer = new Player(
            this.leftCanvas ? this.leftCanvas.width / 2 - playerWidth / 2 : 185,
            playerY,
            playerWidth,
            playerHeight,
            '#3498db'
        );
        this.leftPlayer.speed = initialPlayerSpeed;

        // 右侧飞机（红色）
        this.rightPlayer = new Player(
            this.rightCanvas ? this.rightCanvas.width / 2 - playerWidth / 2 : 185,
            playerY,
            playerWidth,
            playerHeight,
            '#e74c3c'
        );
        this.rightPlayer.speed = initialPlayerSpeed;
    }

    resizeCanvases() {
        if (this.leftCanvas && this.rightCanvas) {
            const containerWidth = this.leftCanvas.parentElement.clientWidth - 4; // 减去分隔线宽度
            const containerHeight = this.leftCanvas.parentElement.clientHeight;
            
            const canvasWidth = containerWidth / 2;
            const canvasHeight = containerHeight;

            this.leftCanvas.width = canvasWidth;
            this.leftCanvas.height = canvasHeight;
            this.rightCanvas.width = canvasWidth;
            this.rightCanvas.height = canvasHeight;

            // 重新定位玩家
            if (this.leftPlayer && this.rightPlayer) {
                this.leftPlayer.y = canvasHeight - this.leftPlayer.height - 20;
                this.rightPlayer.y = canvasHeight - this.rightPlayer.height - 20;
            }
        }
    }

    setupControls() {
        const keys = {
            a: false,
            d: false,
            ArrowLeft: false,
            ArrowRight: false
        };

        window.addEventListener('keydown', (e) => {
            if (keys.hasOwnProperty(e.key)) {
                keys[e.key] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (keys.hasOwnProperty(e.key)) {
                keys[e.key] = false;
            }
        });

        this.gameLoop = () => {
            if (!this.isGameStarted || this.isGameOver) return;

            // 左侧飞机使用 A/D 控制
            if (keys.a) this.leftPlayer.moveLeft(0);
            if (keys.d) this.leftPlayer.moveRight(this.leftCanvas.width);

            // 右侧飞机使用方向键控制
            if (keys.ArrowLeft) this.rightPlayer.moveLeft(0);
            if (keys.ArrowRight) this.rightPlayer.moveRight(this.rightCanvas.width);

            this.update();
            requestAnimationFrame(this.gameLoop);
        };
    }

    startGame() {
        this.startScreen.style.display = 'none';
        this.startCountdown();
    }

    startCountdown() {
        let count = 3;
        this.countdown.textContent = count;
        this.countdown.classList.add('show');

        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                this.countdown.textContent = count;
            } else {
                clearInterval(countdownInterval);
                this.countdown.classList.remove('show');
                this.initializeGame();
            }
        }, 1000);
    }

    initializeGame() {
        this.isGameStarted = true;
        this.isGameOver = false;
        this.gameTime = 0;
        this.lastTime = Date.now();
        this.difficultyLevel = 1;
        this.obstaclesPassed = 0;
        this.obstaclesForNextLevel = 40;
        this.isWaitingForUpgrade = false;
        this.obstacleInterval = this.difficultySettings[1].obstacleInterval;
        
        // 重置两个玩家
        this.leftPlayer.isAlive = true;
        this.rightPlayer.isAlive = true;
        this.leftPlayer.score = 0;
        this.rightPlayer.score = 0;
        
        // 清空障碍物
        this.leftObstacles = [];
        this.rightObstacles = [];
        
        this.updateScore();
        requestAnimationFrame(this.gameLoop);
    }

    generateObstacle(canvas, isLeft) {
        const settings = this.difficultySettings[this.difficultyLevel];
        const player = isLeft ? this.leftPlayer : this.rightPlayer;
        
        // 基于难度等级计算开口大小
        // 难度从1到6，开口从4倍逐渐减小到1.5倍
        const maxMultiplier = 4;     // 最大倍数（最简单）
        const minMultiplier = 1.5;   // 最小倍数（最难）
        const maxLevel = 6;          // 最高难度等级
        
        // 计算当前难度下的开口倍数
        // 使用线性插值计算当前难度对应的倍数
        const multiplier = maxMultiplier - 
            ((maxMultiplier - minMultiplier) * (this.difficultyLevel - 1) / (maxLevel - 1));
        
        // 计算当前难度下的开口宽度
        const gapWidth = player.width * multiplier;
        
        // 确保开口不会出现在画布边缘
        const maxGapPosition = canvas.width - gapWidth;
        const gapPosition = Math.random() * maxGapPosition;
        
        const obstacles = [];
        
        // 生成左边的障碍物
        if (gapPosition > 0) {
            obstacles.push(new Obstacle(
                0,
                -20,
                gapPosition,
                20,
                settings.speed,
                isLeft ? '#2ecc71' : '#e67e22'
            ));
        }
        
        // 生成右边的障碍物
        const rightObstacleStart = gapPosition + gapWidth;
        if (rightObstacleStart < canvas.width) {
            obstacles.push(new Obstacle(
                rightObstacleStart,
                -20,
                canvas.width - rightObstacleStart,
                20,
                settings.speed,
                isLeft ? '#2ecc71' : '#e67e22'
            ));
        }
        
        return obstacles;
    }

    update() {
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // 更新游戏时间
        this.gameTime += deltaTime;
        
        // 更新显示的通过组数（每4个障碍物算1组）
        const passedGroups = Math.floor(this.obstaclesPassed / 4);
        document.getElementById('timeDisplay').textContent = passedGroups;

        // 检查是否需要升级难度
        if (this.obstaclesPassed >= this.obstaclesForNextLevel && 
            this.difficultyLevel < 6 && 
            !this.isWaitingForUpgrade) {
            this.isWaitingForUpgrade = true;
        }

        // 只有在不等待升级时才生成新的障碍物
        if (!this.isWaitingForUpgrade && 
            currentTime - this.lastObstacleTime > this.obstacleInterval) {
            const leftObstacles = this.generateObstacle(this.leftCanvas, true);
            const rightObstacles = this.generateObstacle(this.rightCanvas, false);
            this.leftObstacles.push(...leftObstacles);
            this.rightObstacles.push(...rightObstacles);
            this.lastObstacleTime = currentTime;
        }

        // 如果正在等待升级且没有剩余障碍物，则执行升级
        if (this.isWaitingForUpgrade && 
            this.leftObstacles.length === 0 && 
            this.rightObstacles.length === 0) {
            this.increaseDifficulty();
            this.isWaitingForUpgrade = false;
        }

        // 清空画布
        this.leftCtx.clearRect(0, 0, this.leftCanvas.width, this.leftCanvas.height);
        this.rightCtx.clearRect(0, 0, this.rightCanvas.width, this.rightCanvas.height);

        // 更新左侧
        this.updateObstacles(this.leftObstacles, this.leftCanvas, this.leftPlayer);
        if (this.leftPlayer.isAlive) {
            this.leftPlayer.draw(this.leftCtx);
            // 如果需要显示碰撞区域（调试用），取消下面这行的注释
            // this.leftPlayer.drawCollisionBox(this.leftCtx);
        }

        // 更新右侧
        this.updateObstacles(this.rightObstacles, this.rightCanvas, this.rightPlayer);
        if (this.rightPlayer.isAlive) {
            this.rightPlayer.draw(this.rightCtx);
            // 如果需要显示碰撞区域（调试用），取消下面这行的注释
            // this.rightPlayer.drawCollisionBox(this.rightCtx);
        }

        // 只检查与障碍物的碰撞导致的游戏结束
        if (!this.leftPlayer.isAlive || !this.rightPlayer.isAlive || 
            Math.floor((this.totalGameTime * 1000 - this.gameTime) / 1000) <= 0) {
            this.endGame();
        }
    }

    updateObstacles(obstacles, canvas, player) {
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obstacle = obstacles[i];
            obstacle.move();
            obstacle.draw(canvas.getContext('2d'));

            // 检查碰撞
            if (player.isAlive && this.checkCollision(player, obstacle)) {
                player.isAlive = false;
            }

            // 移除超出画布的障碍物并增加分数
            if (obstacle.isOffScreen(canvas.height)) {
                obstacles.splice(i, 1);
                if (player.isAlive) {
                    player.score += 10;
                    this.obstaclesPassed++; // 增加通过的障碍物计数
                    this.updateScore();
                }
            }
        }
    }

    checkCollision(player, obstacle) {
        // 使用缩小后的碰撞区域进行检测
        const bounds = player.getCollisionBounds();
        
        return bounds.x < obstacle.x + obstacle.width &&
               bounds.x + bounds.width > obstacle.x &&
               bounds.y < obstacle.y + obstacle.height &&
               bounds.y + bounds.height > obstacle.y;
    }

    updateScore() {
        // 更新总分（两边分数之和）
        const totalScore = this.leftPlayer.score + this.rightPlayer.score;
        document.getElementById('player1Score').textContent = this.leftPlayer.score;
        document.getElementById('player2Score').textContent = this.rightPlayer.score;
    }

    increaseDifficulty() {
        this.difficultyLevel++;
        const settings = this.difficultySettings[this.difficultyLevel];
        this.obstacleInterval = settings.obstacleInterval;
        
        // 更新玩家速度为新的障碍物速度的2倍
        const newPlayerSpeed = settings.speed * 2;
        this.leftPlayer.speed = newPlayerSpeed;
        this.rightPlayer.speed = newPlayerSpeed;
        
        // 更新下一级所需的障碍物数量（15组 * 4个障碍物）
        this.obstaclesForNextLevel += 60;
        
        // 显示难度提升提示
        this.showDifficultyUpgrade();
    }

    showDifficultyUpgrade() {
        const upgrade = document.createElement('div');
        upgrade.className = 'difficulty-upgrade';
        upgrade.innerHTML = `
            <div class="upgrade-content">
                <div class="upgrade-text">难度提升！</div>
                <div class="upgrade-subtext">Level ${this.difficultyLevel}</div>
            </div>
        `;
        
        document.querySelector('.game-container').appendChild(upgrade);
        
        // 更新难度指示器
        const indicator = document.querySelector('.difficulty-indicator') || 
            document.createElement('div');
        indicator.className = 'difficulty-indicator';
        indicator.innerHTML = `
            难度: <span class="difficulty-level">Level ${this.difficultyLevel}</span>
        `;
        
        if (!document.querySelector('.difficulty-indicator')) {
            document.querySelector('.game-container').appendChild(indicator);
        }
        
        // 2秒后移除提示
        setTimeout(() => {
            upgrade.remove();
        }, 2000);
    }

    endGame() {
        this.isGameOver = true;
        this.isGameStarted = false;
        
        const totalScore = this.leftPlayer.score + this.rightPlayer.score;
        const passedGroups = Math.floor(this.obstaclesPassed / 4);
        const gameOver = document.createElement('div');
        gameOver.className = 'start-screen';
        gameOver.innerHTML = `
            <div class="game-title">游戏结束</div>
            <div class="final-scores">
                <div>左侧得分: ${this.leftPlayer.score}</div>
                <div>右侧得分: ${this.rightPlayer.score}</div>
                <div>总分: ${totalScore}</div>
                <div>通过障碍组数: ${passedGroups}组</div>
                <div>最高难度: Level ${this.difficultyLevel}</div>
            </div>
            <button class="start-button">再来一次</button>
        `;

        const gameContainer = document.querySelector('.game-container');
        gameContainer.appendChild(gameOver);

        gameOver.querySelector('.start-button').addEventListener('click', () => {
            gameContainer.removeChild(gameOver);
            this.startGame();
        });
    }
}

// 当页面加载完成时初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    new Game();
}); 