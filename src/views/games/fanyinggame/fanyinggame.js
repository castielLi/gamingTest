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
        this.gameContainer = document.querySelector('.game-container');
        this.feedbackOverlay = document.querySelector('.feedback-overlay');
        
        // 游戏状态
        this.isGameStarted = false;
        this.isGameOver = false;
        this.totalRounds = 30; // 总轮数
        this.currentRound = 0; // 当前轮数
        
        this.activeStars = [];
        this.reactionStartTime = 0;
        this.reactionTimes = {
            single: [],    // 单键反应时间
            double: [],    // 双键反应时间
            triple: []     // 三键反应时间
        };
        this.correctReactions = {
            single: 0,
            double: 0,
            triple: 0
        };
        this.wrongReactions = {
            single: 0,
            double: 0,
            triple: 0
        };
        
        // 多键位按下状态追踪
        this.pressedKeys = new Set();
        this.firstKeyPressTime = 0;
        this.keyPressTolerance = 100; // 0.1秒的容差时间（毫秒）
        
        // 显示元素
        this.timeDisplay = document.getElementById('timeDisplay');
        if (this.timeDisplay) {
            this.timeDisplay.parentElement.querySelector('.info-label').innerHTML = 
                '<i class="stat-icon">🎯</i>剩余轮数';
        }
        this.accuracyDisplay = document.getElementById('accuracyDisplay');
        this.testsDisplay = document.getElementById('testsDisplay');
        
        // 难度设置
        this.difficultySettings = {
            timeLimit: 3000,    // 固定3秒时间限制
            interval: {
                single: 1000,   // 单键间隔：1秒
                multi: 2000     // 多键间隔：2秒
            },
            phaseInterval: 200  // 多键位之间的固定间隔：0.2秒
        };
        
        // 游戏阶段设置
        this.gamePhases = {
            single: { start: 1, end: 15 },    // 单按键阶段：1-15轮
            double: { start: 16, end: 25 },   // 双按键阶段：16-25轮
            triple: { start: 26, end: 30 }    // 三按键阶段：26-30轮
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
        this.reactionTimes = {
            single: [],
            double: [],
            triple: []
        };
        this.correctReactions = {
            single: 0,
            double: 0,
            triple: 0
        };
        this.wrongReactions = {
            single: 0,
            double: 0,
            triple: 0
        };
        
        // 重置显示
        if (this.timeDisplay) this.timeDisplay.textContent = this.totalRounds;
        if (this.accuracyDisplay) this.accuracyDisplay.textContent = '0%';
        if (this.testsDisplay) this.testsDisplay.textContent = '0';
        
        this.clearActiveStars();
        
        // 清空日志
        if (this.reactionLog) this.reactionLog.innerHTML = '';
        
        // 显示开始屏幕
        if (this.startScreen) this.startScreen.style.display = 'flex';
        if (this.gameOverScreen) this.gameOverScreen.style.display = 'none';
    }
    
    // 获取当前游戏阶段
    getCurrentPhase() {
        const currentRound = this.currentRound + 1;
        if (currentRound >= this.gamePhases.triple.start) return 'triple';
        if (currentRound >= this.gamePhases.double.start) return 'double';
        return 'single';
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
        
        const currentPhase = this.getCurrentPhase();
        const delay = currentPhase === 'single' ? 
            this.difficultySettings.interval.single : 
            this.difficultySettings.interval.multi;
        
        // 确定当前轮次应该激活的星星数量
        let numStarsToActivate = 1;
        const currentRound = this.currentRound + 1;
        
        if (currentRound >= this.gamePhases.triple.start) {
            numStarsToActivate = 3;  // 三按键阶段
        } else if (currentRound >= this.gamePhases.double.start) {
            numStarsToActivate = 2;  // 双按键阶段
        }
        
        console.log(`第 ${currentRound}/${this.totalRounds} 轮，延迟: ${delay}ms，按键数: ${numStarsToActivate}`);
        
        // 添加200ms的固定延迟
        setTimeout(() => {
            if (!this.isGameStarted || this.isGameOver) return;
            
            const availableStars = Array.from(this.stars);
            this.activeStars = [];
            
            // 一次性选择所需的所有星星
            for (let i = 0; i < numStarsToActivate && availableStars.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * availableStars.length);
                const star = availableStars.splice(randomIndex, 1)[0];
                star.classList.add('active');
                this.activeStars.push(star);
                console.log(`激活星星: ${star.dataset.key}`);
            }
            
            this.reactionStartTime = Date.now();
            
            // 设置超时
            this.activeTimeout = setTimeout(() => {
                if (this.activeStars.length > 0) {
                    const phase = this.getCurrentPhase();
                    this.wrongReactions[phase]++;
                    this.updateStats();
                    this.clearActiveStars();
                    this.currentRound++;
                    if (this.timeDisplay) this.timeDisplay.textContent = this.totalRounds - this.currentRound;
                    this.scheduleNextTest();
                }
            }, this.difficultySettings.timeLimit);
            
        }, delay + 200); // 添加200ms的固定延迟
    }
    
    clearActiveStars() {
        // 清除所有激活状态
        this.stars.forEach(star => {
            star.classList.remove('active');
            star.classList.remove('pressed');
        });
        this.activeStars = [];
        // 重置按键状态
        this.pressedKeys.clear();
        this.firstKeyPressTime = 0;
    }
    
    handleKeyPress(e) {
        // 基本状态检查
        if (!this.isGameStarted || this.isGameOver) return;
        
        // 如果当前没有活跃的按键，直接返回
        if (this.activeStars.length === 0) {
            return;
        }
        
        const key = e.key.toUpperCase();
        const pressedStar = Array.from(this.stars).find(star => 
            star.dataset.key.toUpperCase() === key
        );
        
        if (!pressedStar) return;
        
        pressedStar.classList.add('pressed');
        setTimeout(() => {
            pressedStar.classList.remove('pressed');
        }, 100);

        // 如果这个键已经被按过了，直接返回
        if (this.pressedKeys.has(key)) return;
        
        const currentTime = Date.now();
        const isTargetKey = this.activeStars.includes(pressedStar);
        const currentPhase = this.getCurrentPhase();
        
        // 如果是第一次按键
        if (this.pressedKeys.size === 0) {
            if (!isTargetKey) {
                // 第一次按错了
                this.wrongReactions[currentPhase]++;
                this.showFeedback(false);
                this.currentRound++;
                if (this.timeDisplay) this.timeDisplay.textContent = this.totalRounds - this.currentRound;
                this.updateStats();
                this.clearActiveStars();
                this.scheduleNextTest();
                return;
            }
            this.firstKeyPressTime = currentTime;
        }
        
        // 添加当前按键到已按键集合
        this.pressedKeys.add(key);
        
        // 检查是否所有需要的键都已按下
        const allKeysPressed = this.activeStars.every(star => 
            this.pressedKeys.has(star.dataset.key.toUpperCase())
        );
        
        // 检查是否只按下了需要的键（没有多余的键）
        const onlyCorrectKeysPressed = this.pressedKeys.size <= this.activeStars.length;
        
        if (allKeysPressed && onlyCorrectKeysPressed) {
            const timeDifference = currentTime - this.firstKeyPressTime;
            
            // 检查多键位情况下的时间容差
            const isWithinTolerance = this.activeStars.length === 1 || timeDifference <= this.keyPressTolerance;
            
            if (isWithinTolerance) {
                // 成功通过
                if (this.activeTimeout) {
                    clearTimeout(this.activeTimeout);
                }
                
                const reactionTime = currentTime - this.reactionStartTime;
                this.reactionTimes[currentPhase].push(reactionTime);
                this.correctReactions[currentPhase]++;
                
                this.showFeedback(true);
            } else {
                // 按键时间间隔过长
                this.wrongReactions[currentPhase]++;
                this.showFeedback(false);
            }
        } else if (this.pressedKeys.size >= this.activeStars.length || !isTargetKey) {
            // 按错键或按键数超出
            this.wrongReactions[currentPhase]++;
            this.showFeedback(false);
        }
        
        // 无论成功与否，只要达到了应按的键数或按错了键，就结束当前轮
        if (this.pressedKeys.size >= this.activeStars.length || !isTargetKey) {
            this.currentRound++;
            if (this.timeDisplay) this.timeDisplay.textContent = this.totalRounds - this.currentRound;
            this.clearActiveStars();
            this.scheduleNextTest();
        }
        
        this.updateStats();
    }
    
    showFeedback(isCorrect) {
        // 移除之前的动画类
        this.feedbackOverlay.classList.remove('correct', 'wrong');
        
        // 强制重绘
        void this.feedbackOverlay.offsetWidth;
        
        // 添加新的动画类
        this.feedbackOverlay.classList.add(isCorrect ? 'correct' : 'wrong');
        
        // 动画结束后移除类
        setTimeout(() => {
            this.feedbackOverlay.classList.remove('correct', 'wrong');
        }, 500);
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
        // 更新所有阶段的统计信息
        ['single', 'double', 'triple'].forEach(phase => {
            const correct = this.correctReactions[phase];
            const wrong = this.wrongReactions[phase];
            const total = correct + wrong;
            const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
            
            // 更新各阶段的显示
            const phaseElement = document.querySelector(`.info-item.${phase}-phase`);
            if (phaseElement) {
                const accuracyDisplay = phaseElement.querySelector('.accuracy-value');
                if (accuracyDisplay) accuracyDisplay.textContent = `${accuracy}%`;

                // 更新进度显示
                const phaseDisplay = document.getElementById(`${phase}PhaseDisplay`);
                if (phaseDisplay) {
                    const phaseConfig = this.gamePhases[phase];
                    const currentPhaseRounds = this.currentRound + 1 >= phaseConfig.start ? 
                        Math.min(this.currentRound + 1, phaseConfig.end) - phaseConfig.start + 1 : 0;
                    phaseDisplay.textContent = currentPhaseRounds;
                }
            }
        });
        
        // 更新总体统计
        const totalCorrect = Object.values(this.correctReactions).reduce((a, b) => a + b, 0);
        const totalWrong = Object.values(this.wrongReactions).reduce((a, b) => a + b, 0);
        const totalTests = totalCorrect + totalWrong;
        const totalAccuracy = totalTests > 0 ? Math.round((totalCorrect / totalTests) * 100) : 0;
        
        if (this.accuracyDisplay) {
            this.accuracyDisplay.textContent = `${totalAccuracy}%`;
            this.testsDisplay.textContent = `${this.currentRound + 1}/${this.totalRounds}`;
        }
    }
    
    // 获取反应时间等级
    getSpeedGrade(time, phase) {
        const gradeThresholds = {
            single: { s: 300, a: 400, b: 500 },
            double: { s: 400, a: 500, b: 600 },
            triple: { s: 500, a: 600, b: 700 }
        };
        
        const thresholds = gradeThresholds[phase];
        if (time <= thresholds.s) return 'speed-s';
        if (time <= thresholds.a) return 'speed-a';
        if (time <= thresholds.b) return 'speed-b';
        return 'speed-c';
    }
    
    // 获取准确率等级
    getAccuracyGrade(accuracy) {
        if (accuracy >= 95) return 'accuracy-s';
        if (accuracy >= 85) return 'accuracy-a';
        if (accuracy >= 75) return 'accuracy-b';
        return 'accuracy-c';
    }

    endGame() {
        this.isGameOver = true;
        clearInterval(this.gameTimer);
        
        // 计算各阶段的统计数据
        const phaseStats = {};
        ['single', 'double', 'triple'].forEach(phase => {
            const times = this.reactionTimes[phase];
            const correct = this.correctReactions[phase];
            const wrong = this.wrongReactions[phase];
            const total = correct + wrong;
            
            const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
            const isValidTest = accuracy >= 50; // 判断是否为有效测试
            
            phaseStats[phase] = {
                fastestTime: times.length > 0 && isValidTest ? Math.min(...times) : 0,
                slowestTime: times.length > 0 && isValidTest ? Math.max(...times) : 0,
                accuracy,
                correct,
                wrong,
                total,
                isValidTest,
                speedGrade: isValidTest ? this.getSpeedGrade(Math.min(...times) || 0, phase) : 'speed-c',
                accuracyGrade: this.getAccuracyGrade(accuracy)
            };
        });
        
        // 更新结束屏幕
        const phaseNames = {
            single: '单键',
            double: '双键',
            triple: '三键'
        };
        
        // 更新详细统计信息
        const statsContainer = document.querySelector('.game-stats');
        statsContainer.innerHTML = '';
        
        ['single', 'double', 'triple'].forEach(phase => {
            const stats = phaseStats[phase];
            const phaseDiv = document.createElement('div');
            phaseDiv.className = `phase-stats ${phase}`;
            
            // 根据是否为有效测试显示不同的内容
            if (stats.isValidTest) {
                phaseDiv.innerHTML = `
                    <h3>${phaseNames[phase]}模式</h3>
                    <div class="stats-row">
                        <div class="stat-item">
                            <div class="stat-label">最快/最慢</div>
                            <div class="stat-value ${stats.speedGrade}">${stats.fastestTime}/${stats.slowestTime}ms</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">准确率</div>
                            <div class="stat-value ${stats.accuracyGrade}">${stats.accuracy}%</div>
                            <div class="stat-detail">
                                <span class="correct">✓${stats.correct}</span>
                                <span class="wrong">✗${stats.wrong}</span>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                phaseDiv.innerHTML = `
                    <h3>${phaseNames[phase]}模式</h3>
                    <div class="stats-row">
                        <div class="stat-item invalid-test">
                            <div class="stat-label">测试无效</div>
                            <div class="stat-value accuracy-c">准确率过低: ${stats.accuracy}%</div>
                            <div class="stat-detail">
                                <span class="correct">✓${stats.correct}</span>
                                <span class="wrong">✗${stats.wrong}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            statsContainer.appendChild(phaseDiv);
        });
        
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
        let count = 3; // 改回3秒
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
        this.reactionTimes = {
            single: [],
            double: [],
            triple: []
        };
        this.correctReactions = {
            single: 0,
            double: 0,
            triple: 0
        };
        this.wrongReactions = {
            single: 0,
            double: 0,
            triple: 0
        };
        
        // 更新显示
        if (this.timeDisplay) this.timeDisplay.textContent = this.totalRounds;
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
