class ReactionGame {
    constructor() {
        console.log("ReactionGame 构造函数被调用");
        this.initializeGame();
    }
    
    initializeGame() {
        console.log("初始化游戏...");
        // 游戏元素
        this.starsContainer = document.querySelector('.stars-container');
        this.stars = document.querySelectorAll('.star');
        this.startScreen = document.querySelector('.start-screen');
        this.startButton = document.querySelector('.start-button');
        this.gameOverScreen = document.querySelector('.game-over');
        this.retryButton = document.querySelector('.retry-button');
        this.reactionLog = document.querySelector('.reaction-log');
        this.countdown = document.querySelector('.countdown');
        
        // 游戏状态
        this.isGameStarted = false;
        this.isGameOver = false;
        this.totalRounds = 30; // 总轮数
        this.currentRound = 0; // 当前轮数
        
        this.activeStars = [];
        this.reactionStartTime = 0;
        this.reactionTimes = [];
        this.correctReactions = 0;
        this.wrongReactions = 0;
        
        // 显示元素
        this.timeDisplay = document.getElementById('timeDisplay');
        if (this.timeDisplay) {
            this.timeDisplay.parentElement.querySelector('.info-label').innerHTML = 
                '<i class="stat-icon">🎯</i>剩余轮数';
        }
        this.avgReactionDisplay = document.getElementById('avgReactionDisplay');
        this.accuracyDisplay = document.getElementById('accuracyDisplay');
        this.testsDisplay = document.getElementById('testsDisplay');
        
        // 难度设置
        this.difficultySettings = {
            timeLimit: {
                start: 3000,    // 初始时间限制：3秒
                end: 1000,      // 最终时间限制：1秒
            },
            interval: {
                start: 2500,    // 初始间隔：2.5秒
                end: 800,       // 最终间隔：0.8秒
            },
            multipleStars: {
                chance: {
                    start: 0.1, // 初始双星概率：10%
                    end: 0.5    // 最终双星概率：50%
                }
            }
        };
        
        // 绑定事件
        if (this.startButton) {
            console.log("绑定开始按钮点击事件");
            this.startButton.onclick = () => {
                console.log("开始按钮被点击");
                this.startCountdown();
            };
        }
        
        if (this.retryButton) {
            this.retryButton.onclick = () => this.resetGame();
        }
        
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        this.resetGame();
        console.log("游戏初始化完成");
    }
    
    resetGame() {
        console.log("重置游戏");
        this.isGameStarted = false;
        this.isGameOver = false;
        this.currentRound = 0;
        this.activeStars = [];
        this.reactionStartTime = 0;
        this.reactionTimes = [];
        this.correctReactions = 0;
        this.wrongReactions = 0;
        
        // 重置显示
        if (this.timeDisplay) this.timeDisplay.textContent = this.totalRounds;
        if (this.avgReactionDisplay) this.avgReactionDisplay.textContent = '0ms';
        if (this.accuracyDisplay) this.accuracyDisplay.textContent = '0%';
        if (this.testsDisplay) this.testsDisplay.textContent = '0';
        
        this.clearActiveStars();
        
        // 清空日志
        if (this.reactionLog) this.reactionLog.innerHTML = '';
        
        // 显示开始屏幕
        if (this.startScreen) this.startScreen.style.display = 'flex';
        if (this.gameOverScreen) this.gameOverScreen.style.display = 'none';
    }
    
    // 计算当前难度
    calculateDifficulty() {
        const progress = this.currentRound / this.totalRounds;
        return {
            timeLimit: this.difficultySettings.timeLimit.start + 
                (this.difficultySettings.timeLimit.end - this.difficultySettings.timeLimit.start) * progress,
            interval: this.difficultySettings.interval.start + 
                (this.difficultySettings.interval.end - this.difficultySettings.interval.start) * progress,
            multipleStarsChance: this.difficultySettings.multipleStars.chance.start + 
                (this.difficultySettings.multipleStars.chance.end - this.difficultySettings.multipleStars.chance.start) * progress
        };
    }
    
    scheduleNextTest() {
        this.clearActiveStars();
        if (this.activeTimeout) {
            clearTimeout(this.activeTimeout);
        }

        // 检查是否达到总轮数
        if (this.currentRound >= this.totalRounds) {
            this.endGame();
            return;
        }
        
        // 获取当前难度设置
        const difficulty = this.calculateDifficulty();
        const delay = difficulty.interval;
        
        console.log(`第 ${this.currentRound + 1}/${this.totalRounds} 轮，延迟: ${delay}ms`);
        
        setTimeout(() => {
            if (!this.isGameStarted || this.isGameOver) return;
            
            // 根据当前难度决定是否激活多个星星
            const numStarsToActivate = Math.random() < difficulty.multipleStarsChance ? 2 : 1;
            const availableStars = Array.from(this.stars);
            this.activeStars = [];
            
            for (let i = 0; i < numStarsToActivate; i++) {
                if (availableStars.length === 0) break;
                
                const randomIndex = Math.floor(Math.random() * availableStars.length);
                const selectedStar = availableStars.splice(randomIndex, 1)[0];
                
                selectedStar.classList.add('active');
                this.activeStars.push(selectedStar);
                console.log(`激活星星: ${selectedStar.dataset.key}`);
            }
            
            this.reactionStartTime = Date.now();
            
            // 设置基于当前难度的超时
            this.activeTimeout = setTimeout(() => {
                if (this.activeStars.length > 0) {
                    this.wrongReactions++;
                    this.addLogEntry(`超时! 反应时间超过${Math.round(difficulty.timeLimit/1000)}秒`, false);
                    this.updateStats();
                    this.clearActiveStars();
                    this.currentRound++;
                    if (this.timeDisplay) this.timeDisplay.textContent = this.totalRounds - this.currentRound;
                    this.scheduleNextTest();
                }
            }, difficulty.timeLimit);
            
        }, delay);
    }
    
    clearActiveStars() {
        // 清除所有激活状态
        this.stars.forEach(star => {
            star.classList.remove('active');
            star.classList.remove('pressed');
        });
        this.activeStars = [];
    }
    
    handleKeyPress(e) {
        if (!this.isGameStarted || this.isGameOver) return;
        
        const key = e.key.toUpperCase();
        const pressedStar = Array.from(this.stars).find(star => 
            star.dataset.key.toUpperCase() === key
        );
        
        if (!pressedStar) return;
        
        pressedStar.classList.add('pressed');
        setTimeout(() => {
            pressedStar.classList.remove('pressed');
        }, 100);
        
        const isCorrect = this.activeStars.includes(pressedStar);
        
        if (isCorrect) {
            if (this.activeTimeout) {
                clearTimeout(this.activeTimeout);
            }

            const reactionTime = Date.now() - this.reactionStartTime;
            this.reactionTimes.push(reactionTime);
            this.correctReactions++;
            
            this.addLogEntry(`正确! 反应时间: ${reactionTime}ms`, true);
            
            this.clearActiveStars();
            this.currentRound++;
            if (this.timeDisplay) this.timeDisplay.textContent = this.totalRounds - this.currentRound;
            this.scheduleNextTest();
        } else {
            this.wrongReactions++;
            this.addLogEntry(`错误! 按下了错误的按键`, false);
        }
        
        this.updateStats();
    }
    
    addLogEntry(message, isCorrect) {
        if (!this.reactionLog) return;
        
        const entry = document.createElement('div');
        entry.className = `log-entry ${isCorrect ? 'correct' : 'wrong'}`;
        entry.textContent = message;
        
        this.reactionLog.insertBefore(entry, this.reactionLog.firstChild);
        
        // 限制日志条目数量
        if (this.reactionLog.children.length > 5) {
            this.reactionLog.removeChild(this.reactionLog.lastChild);
        }
    }
    
    updateStats() {
        // 计算平均反应时间
        let avgTime = 0;
        if (this.reactionTimes.length > 0) {
            avgTime = Math.round(this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length);
        }
        
        // 计算准确率
        const totalReactions = this.correctReactions + this.wrongReactions;
        const accuracy = totalReactions > 0 
            ? Math.round((this.correctReactions / totalReactions) * 100) 
            : 0;
        
        // 更新显示
        if (this.avgReactionDisplay) this.avgReactionDisplay.textContent = `${avgTime}ms`;
        if (this.accuracyDisplay) this.accuracyDisplay.textContent = `${accuracy}%`;
        if (this.testsDisplay) this.testsDisplay.textContent = totalReactions;
    }
    
    endGame() {
        this.isGameOver = true;
        clearInterval(this.gameTimer);
        
        // 计算最终统计数据
        const totalReactions = this.correctReactions + this.wrongReactions;
        const accuracy = totalReactions > 0 
            ? Math.round((this.correctReactions / totalReactions) * 100) 
            : 0;
        
        let avgTime = 0;
        let fastestTime = 0;
        let slowestTime = 0;
        
        if (this.reactionTimes.length > 0) {
            avgTime = Math.round(this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length);
            fastestTime = Math.min(...this.reactionTimes);
            slowestTime = Math.max(...this.reactionTimes);
        }
        
        // 更新结束屏幕
        document.querySelector('.final-score').textContent = `${avgTime}ms`;
        document.getElementById('fastestTime').textContent = `${fastestTime}ms`;
        document.getElementById('slowestTime').textContent = `${slowestTime}ms`;
        document.getElementById('accuracy').textContent = `${accuracy}%`;
        document.getElementById('accuracy').nextElementSibling.textContent = 
            `正确: ${this.correctReactions} | 错误: ${this.wrongReactions}`;
        document.getElementById('totalTests').textContent = totalReactions;
        
        // 显示结束屏幕
        this.gameOverScreen.style.display = 'block';
    }

    startCountdown() {
        console.log("开始倒计时");
        // 隐藏开始屏幕的内容，但保持屏幕本身可见
        if (this.startScreen) {
            const startTitle = this.startScreen.querySelector('.start-title');
            const gameInstructions = this.startScreen.querySelector('.game-instructions');
            const startButton = this.startScreen.querySelector('.start-button');
            
            if (startTitle) startTitle.style.display = 'none';
            if (gameInstructions) gameInstructions.style.display = 'none';
            if (startButton) startButton.style.display = 'none';
        }
        
        // 显示倒计时
        let count = 3;
        if (this.countdown) {
            this.countdown.textContent = count;
            this.countdown.classList.add('show');
            
            const countdownInterval = setInterval(() => {
                count--;
                if (count > 0) {
                    this.countdown.textContent = count;
                } else {
                    clearInterval(countdownInterval);
                    this.countdown.classList.remove('show');
                    // 倒计时结束，开始游戏
                    this.startGame();
                }
            }, 1000);
        } else {
            // 如果找不到倒计时元素，直接开始游戏
            this.startGame();
        }
    }

    startGame() {
        console.log("游戏正式开始");
        this.isGameStarted = true;
        this.currentRound = 0;
        
        // 隐藏开始屏幕
        if (this.startScreen) {
            this.startScreen.style.display = 'none';
        }
        
        // 重置所有状态
        this.reactionTimes = [];
        this.correctReactions = 0;
        this.wrongReactions = 0;
        
        // 更新显示
        if (this.timeDisplay) this.timeDisplay.textContent = this.totalRounds;
        if (this.avgReactionDisplay) this.avgReactionDisplay.textContent = '0ms';
        if (this.accuracyDisplay) this.accuracyDisplay.textContent = '0%';
        if (this.testsDisplay) this.testsDisplay.textContent = '0';
        
        // 开始第一轮测试
        this.scheduleNextTest();
    }
}

// 确保在页面加载完成后初始化游戏
console.log("脚本已加载");
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM已加载完成，创建游戏实例");
    window.game = new ReactionGame(); // 将游戏实例存储在全局变量中，便于调试
});
