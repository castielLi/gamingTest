class BrainGame {
    constructor() {
        // 游戏配置
        this.config = {
            baseTimeLimit: 2000, // 基础时间2秒
            timeIncrement: 300,  // 每个难度增加0.3秒
            roundsPerLevel: 3,   // 每个难度需要通过的轮数
            levels: [
                { 
                    balls: 9,    // 修改为9个球以便有更好的分配组合
                    colors: 3,
                    combinations: [
                        [2, 3, 4],
                        [1, 3, 5],
                        [2, 4, 3],
                        [1, 4, 4]  // 这个组合确保最小值唯一
                    ]
                },
                { 
                    balls: 12,   // 修改为12个球
                    colors: 3,
                    combinations: [
                        [2, 4, 6],
                        [3, 4, 5],
                        [2, 5, 5],
                        [1, 5, 6]
                    ]
                },
                { 
                    balls: 15,   // 修改为15个球
                    colors: 3,
                    combinations: [
                        [3, 5, 7],
                        [2, 6, 7],
                        [4, 5, 6],
                        [3, 4, 8]
                    ]
                },
                { 
                    balls: 18,   // 修改为18个球
                    colors: 3,
                    combinations: [
                        [4, 6, 8],
                        [3, 7, 8],
                        [5, 6, 7],
                        [2, 7, 9]
                    ]
                },
                { 
                    balls: 21,   // 修改为21个球
                    colors: 3,
                    combinations: [
                        [5, 7, 9],
                        [4, 8, 9],
                        [6, 7, 8],
                        [3, 8, 10]
                    ]
                }
            ],
            colors: [
                '#e74c3c', // 红色
                '#3498db', // 蓝色
                '#2ecc71', // 绿色
                '#f1c40f', // 黄色
                '#9b59b6'  // 紫色
            ]
        };

        // 游戏状态
        this.currentLevel = 1;
        this.currentRound = 1;
        this.highScore = 0;
        this.isPlaying = false;
        this.timeLeft = this.config.baseTimeLimit;
        this.timerInterval = null;
        this.lastFrameTime = 0;

        // DOM元素
        this.gameBoard = document.getElementById('gameBoard');
        this.startScreen = document.querySelector('.start-screen');
        this.startButton = document.querySelector('.start-button');
        this.timerBar = document.querySelector('.timer-bar');
        this.timeLeftDisplay = document.getElementById('timeLeft');
        this.currentLevelDisplay = document.getElementById('currentLevel');
        this.highScoreDisplay = document.getElementById('highScore');

        // 绑定事件
        this.startButton.addEventListener('click', () => this.startGame());

        // 加载最高分
        this.loadHighScore();
    }

    loadHighScore() {
        const savedScore = localStorage.getItem('brainGameHighScore');
        if (savedScore) {
            this.highScore = parseInt(savedScore);
            this.highScoreDisplay.textContent = this.highScore;
        }
    }

    saveHighScore() {
        if (this.currentLevel > this.highScore) {
            this.highScore = this.currentLevel;
            localStorage.setItem('brainGameHighScore', this.highScore);
            this.highScoreDisplay.textContent = this.highScore;
        }
    }

    startGame() {
        this.currentLevel = 1;
        this.currentRound = 1;
        this.isPlaying = true;
        this.startScreen.style.display = 'none';
        this.startRound();
    }

    startRound() {
        // 更新显示
        this.currentLevelDisplay.textContent = `${this.currentLevel}-${this.currentRound}`;
        
        // 根据当前难度计算时间限制
        this.timeLeft = this.calculateTimeLimit();
        this.timeLeftDisplay.textContent = (this.timeLeft / 1000).toFixed(1);
        this.timerBar.style.width = '100%';

        // 生成本轮的球
        this.generateBalls();

        // 开始计时
        this.lastFrameTime = performance.now();
        this.updateTimer();
    }

    generateBalls() {
        // 清空游戏板
        this.gameBoard.innerHTML = '';
        
        // 获取当前关卡配置
        const levelConfig = this.config.levels[Math.min(this.currentLevel - 1, this.config.levels.length - 1)];
        
        // 生成颜色分配
        const colorCounts = this.generateValidColorDistribution(levelConfig.balls);
        
        // 随机选择三种颜色
        const roundColors = this.shuffleArray([...this.config.colors]).slice(0, 3);
        
        // 将数量分配给实际的颜色
        const finalColorCounts = {
            [roundColors[0]]: colorCounts[0],
            [roundColors[1]]: colorCounts[1],
            [roundColors[2]]: colorCounts[2]
        };

        // 记录每个颜色的数量，用于判断最少颜色
        this.colorDistribution = finalColorCounts;

        // 获取游戏板的尺寸
        const boardRect = this.gameBoard.getBoundingClientRect();
        const boardWidth = boardRect.width - 60;
        const boardHeight = boardRect.height - 60;

        // 生成所有球并随机分布
        const balls = [];
        const positions = [];

        // 计算网格布局
        const gridSize = Math.ceil(Math.sqrt(levelConfig.balls)); // 每行/列的球数
        const cellWidth = boardWidth / gridSize;
        const cellHeight = boardHeight / gridSize;

        Object.entries(finalColorCounts).forEach(([color, count]) => {
            for (let i = 0; i < count; i++) {
                let position;
                let attempts = 0;
                const maxAttempts = 50;

                do {
                    // 在网格单元格内随机位置
                    const cellX = Math.floor(Math.random() * gridSize);
                    const cellY = Math.floor(Math.random() * gridSize);
                    position = {
                        x: cellX * cellWidth + Math.random() * (cellWidth - 60),
                        y: cellY * cellHeight + Math.random() * (cellHeight - 60)
                    };
                    attempts++;
                    if (attempts >= maxAttempts) break;
                } while (this.checkOverlap(position, positions));

                const ball = this.createBall(color);
                ball.style.position = 'absolute';
                ball.style.left = `${position.x}px`;
                ball.style.top = `${position.y}px`;
                
                balls.push(ball);
                positions.push(position);
            }
        });

        // 随机排列并添加到游戏板
        this.shuffleArray(balls).forEach(ball => {
            this.gameBoard.appendChild(ball);
        });

        // 找出数量最少的颜色
        this.correctColor = Object.entries(finalColorCounts).reduce((a, b) => 
            a[1] < b[1] ? a : b
        )[0];

        console.log('Color distribution:', finalColorCounts); // 用于调试
        console.log('Correct color:', this.correctColor); // 用于调试
    }

    // 生成有效的颜色分配
    generateValidColorDistribution(totalBalls) {
        // 获取当前难度的预设组合
        const levelConfig = this.config.levels[Math.min(this.currentLevel - 1, this.config.levels.length - 1)];
        const combinations = levelConfig.combinations;
        
        // 随机选择一个组合
        const selectedCombination = combinations[Math.floor(Math.random() * combinations.length)];
        
        // 返回选中的组合
        return this.shuffleArray([...selectedCombination]);
    }

    checkOverlap(newPos, existingPositions) {
        const minDistance = 65; // 稍微减小最小间距
        return existingPositions.some(pos => {
            const dx = newPos.x - pos.x;
            const dy = newPos.y - pos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < minDistance;
        });
    }

    createBall(color) {
        const ball = document.createElement('div');
        ball.className = 'ball';
        ball.style.backgroundColor = color;
        
        ball.addEventListener('click', () => {
            if (!this.isPlaying) return;
            
            // 检查点击的是否是数量最少的颜色
            const clickedColorCount = this.colorDistribution[color];
            const minCount = Math.min(...Object.values(this.colorDistribution));
            
            if (clickedColorCount === minCount) {
                // 正确答案
                this.currentRound++;
                
                // 检查是否需要升级难度
                if (this.currentRound > this.config.roundsPerLevel) {
                    this.currentLevel = Math.min(this.currentLevel + 1, this.config.levels.length);
                    this.currentRound = 1;
                }
                
                this.saveHighScore();
                this.startRound();
            } else {
                // 错误答案
                this.endGame();
            }
        });

        return ball;
    }

    updateTimer() {
        if (!this.isPlaying) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        this.timeLeft -= deltaTime;
        const timeLeftSeconds = Math.max(0, this.timeLeft / 1000);
        this.timeLeftDisplay.textContent = timeLeftSeconds.toFixed(1);
        
        // 使用当前难度的时间限制来计算进度条
        const currentTimeLimit = this.calculateTimeLimit();
        this.timerBar.style.width = `${(this.timeLeft / currentTimeLimit) * 100}%`;

        if (this.timeLeft <= 0) {
            this.endGame();
            return;
        }

        requestAnimationFrame(() => this.updateTimer());
    }

    endGame() {
        this.isPlaying = false;
        this.saveHighScore();
        
        const gameOver = document.createElement('div');
        gameOver.className = 'start-screen';
        gameOver.innerHTML = `
            <div class="game-title">游戏结束</div>
            <div class="game-instructions">
                你达到了第 ${this.currentLevel} 关 第 ${this.currentRound} 轮！<br>
                最高记录：第 ${this.highScore} 关<br>
                当前关卡时限：${(this.calculateTimeLimit() / 1000).toFixed(1)}秒
            </div>
            <button class="start-button">再来一次</button>
        `;

        gameOver.querySelector('.start-button').addEventListener('click', () => {
            this.gameBoard.innerHTML = '';
            this.startGame();
            gameOver.remove();
        });

        this.gameBoard.appendChild(gameOver);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // 计算当前难度的时间限制
    calculateTimeLimit() {
        // 第一关是基础时间，之后每提升一个难度增加0.3秒
        const additionalTime = (this.currentLevel - 1) * this.config.timeIncrement;
        return this.config.baseTimeLimit + additionalTime;
    }
}

// 当页面加载完成时初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    new BrainGame();
});
