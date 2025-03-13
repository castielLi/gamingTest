class BrainGame {
    constructor() {
        // 游戏配置
        this.config = {
            baseTimeLimit: 2000, // 基础时间2秒
            timeIncrement: 300,  // 每个难度增加0.3秒
            roundsPerLevel: 3,   // 每个难度需要通过的轮数
            levels: [
                { balls: 6, colors: 3 },   // 第1难度：6个球
                { balls: 10, colors: 3 },  // 第2难度：10个球
                { balls: 14, colors: 3 },  // 第3难度：14个球
                { balls: 17, colors: 3 },  // 第4难度：17个球
                { balls: 20, colors: 3 }   // 第5难度：20个球
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
        const totalBalls = levelConfig.balls;
        
        // 生成颜色分配
        const colorCounts = this.generateValidColorDistribution(totalBalls);
        
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

        Object.entries(finalColorCounts).forEach(([color, count]) => {
            for (let i = 0; i < count; i++) {
                let position;
                let attempts = 0;
                const maxAttempts = 50;

                do {
                    position = {
                        x: Math.random() * boardWidth,
                        y: Math.random() * boardHeight
                    };
                    attempts++;
                    if (attempts >= maxAttempts) {
                        // 如果尝试次数过多，增加最小间距的容忍度
                        break;
                    }
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
        // 计算可能的最小值范围（确保剩余球能够合理分配）
        const maxPossibleMin = Math.floor(totalBalls / 4); // 最小值不超过总数的1/4
        const minCount = Math.max(1, Math.min(maxPossibleMin, Math.floor(Math.random() * 3) + 2));
        
        // 确保剩余球数足够分配给其他两种颜色
        const remainingBalls = totalBalls - minCount;
        
        // 计算第二种颜色的数量（比最小值多1-3个）
        const minSecondCount = minCount + 1;
        const maxSecondCount = Math.min(remainingBalls - minSecondCount, minCount + 3);
        const secondCount = Math.min(maxSecondCount, minSecondCount + Math.floor(Math.random() * 3));
        
        // 第三种颜色获得剩余的所有球
        const thirdCount = totalBalls - minCount - secondCount;
        
        // 对三个数进行排序，确保它们是不同的值
        const counts = [minCount, secondCount, thirdCount].sort((a, b) => a - b);
        
        // 如果有相等的值，稍微调整它们
        if (counts[0] === counts[1]) {
            counts[1] += 1;
            counts[2] -= 1;
        }
        if (counts[1] === counts[2]) {
            counts[1] -= 1;
            counts[0] += 1;
        }
        
        return this.shuffleArray([...counts]);
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
