class MemoryGridGame {
    constructor() {
        // 游戏配置
        this.config = {
            minGridSize: 3,        // 最小网格尺寸 (3x3)
            maxGridSize: 10,       // 最大网格尺寸 (10x10)
            baseMemoryTime: 2,     // 基础记忆时间（秒）
            memoryTimeIncrement: 1, // 每难度增加的记忆时间（秒）
            levels: 8,             // 游戏总关卡数
            colorPalette: [        // 方块颜色
                '#3498db', // 蓝色
                '#e74c3c', // 红色
                '#2ecc71', // 绿色
                '#f1c40f', // 黄色
                '#9b59b6', // 紫色
                '#e67e22'  // 橙色
            ],
            maxScore: 100,         // 每轮最高分
            evaluationTime: 2      // 评估阶段显示时间（秒）
        };

        // 游戏状态
        this.currentLevel = 1;
        this.currentPhase = 'idle'; // idle, memorizing, reconstruction, evaluation
        this.timeLeft = 0;
        this.currentScore = 0;
        this.totalScore = 0;
        this.timerInterval = null;
        this.gridSize = this.config.minGridSize;
        this.coloredCells = [];    // 原始着色单元格
        this.userColoredCells = []; // 用户着色单元格
        this.isPlaying = false;
        this.gameStats = {         // 游戏统计数据
            rounds: [],            // 每轮得分和准确率
            totalScore: 0,         // 总分
            averageAccuracy: 0,    // 平均准确率
            highestAccuracy: 0,    // 最高准确率
            lowestAccuracy: 100    // 最低准确率
        };

        // DOM元素
        this.gameBoard = document.getElementById('gameBoard');
        this.gridInner = document.getElementById('gridInner');
        this.phaseIndicator = document.getElementById('phaseIndicator');
        this.startScreen = document.getElementById('startScreen');
        this.levelCompleteScreen = document.getElementById('levelComplete');
        this.startButton = document.getElementById('startButton');
        this.currentLevelDisplay = document.getElementById('currentLevel');
        this.timeLeftDisplay = document.getElementById('timeLeft');
        this.matchedDisplay = document.getElementById('matched');
        this.submitButton = document.getElementById('submitButton');

        // 绑定事件
        this.startButton.addEventListener('click', () => this.startGame());
        this.submitButton.addEventListener('click', () => this.evaluateRound());

        // 初始化
        this.init();
    }

    init() {
        this.currentLevelDisplay.textContent = this.currentLevel;
        this.timeLeftDisplay.textContent = '0';
        this.matchedDisplay.textContent = '0%';
        this.submitButton.style.display = 'none';
        this.phaseIndicator.style.display = 'none';
    }

    startGame() {
        // 重置游戏状态
        this.currentLevel = 1;
        this.totalScore = 0;
        this.gridSize = this.config.minGridSize;
        this.gameStats = {
            rounds: [],
            totalScore: 0,
            averageAccuracy: 0,
            highestAccuracy: 0,
            lowestAccuracy: 100
        };
        
        // 开始第一轮
        this.startRound();
    }

    startRound() {
        // 设置游戏状态
        this.currentPhase = 'memorizing';
        this.coloredCells = [];
        this.userColoredCells = [];
        
        // 更新UI
        this.startScreen.style.display = 'none';
        this.levelCompleteScreen.classList.remove('show');
        this.currentLevelDisplay.textContent = this.currentLevel;
        this.matchedDisplay.textContent = '0%';
        this.submitButton.style.display = 'none';
        
        // 生成网格
        this.createGrid();
        
        // 随机着色单元格
        this.colorRandomCells();
        
        // 开始记忆阶段
        this.startMemorizingPhase();
    }

    createGrid() {
        // 清空网格
        this.gridInner.innerHTML = '';
        
        // 设置网格样式
        this.gridInner.style.display = 'grid';
        this.gridInner.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        this.gridInner.style.gridTemplateRows = `repeat(${this.gridSize}, 1fr)`;
        
        // 随着网格尺寸变大，调整间距变小
        const gap = Math.max(2, 6 - Math.floor((this.gridSize - 3) / 2));
        this.gridInner.style.gap = `${gap}px`;
        
        // 创建网格单元格
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                // 添加点击事件
                cell.addEventListener('click', () => this.toggleCell(cell));
                
                this.gridInner.appendChild(cell);
            }
        }
    }

    toggleCell(cell) {
        // 只有在重建阶段才能点击单元格
        if (this.currentPhase !== 'reconstruction') return;
        
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        const index = this.userColoredCells.findIndex(c => c.x === x && c.y === y);
        
        if (index === -1) {
            // 添加到用户着色单元格
            cell.classList.add('colored');
            this.userColoredCells.push({ x, y });
        } else {
            // 从用户着色单元格中移除
            cell.classList.remove('colored');
            this.userColoredCells.splice(index, 1);
        }
    }

    colorRandomCells() {
        const totalCells = this.gridSize * this.gridSize;
        // 调整颜色数量随网格大小变化，确保有足够多的挑战性
        // 从30%开始逐渐降低到20%（越大的网格，百分比越低）
        const percentage = 0.3 - ((this.gridSize - this.config.minGridSize) * 0.01);
        const colorCount = Math.min(totalCells, Math.max(3, Math.floor(totalCells * percentage)));
        
        // 使用优化的方法生成随机单元格索引
        const indices = this.getRandomIndices(totalCells, colorCount);
        
        // 获取所有单元格
        const cells = Array.from(this.gridInner.querySelectorAll('.grid-cell'));
        
        // 着色随机单元格
        indices.forEach(index => {
            const cell = cells[index];
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            
            cell.classList.add('colored');
            
            // 存储原始着色单元格
            this.coloredCells.push({ x, y });
        });
    }
    
    // 优化的随机索引生成方法
    getRandomIndices(max, count) {
        // 如果需要的数量超过一半，使用排除法会更高效
        if (count > max / 2) {
            const excluded = new Set();
            while (excluded.size < (max - count)) {
                const randomIndex = Math.floor(Math.random() * max);
                excluded.add(randomIndex);
            }
            
            const result = [];
            for (let i = 0; i < max; i++) {
                if (!excluded.has(i)) {
                    result.push(i);
                }
            }
            return result;
        } else {
            // 否则使用包含法
            const indices = new Set();
            while (indices.size < count) {
                const randomIndex = Math.floor(Math.random() * max);
                indices.add(randomIndex);
            }
            return Array.from(indices);
        }
    }

    startMemorizingPhase() {
        // 计算记忆时间
        const memoryTime = this.config.baseMemoryTime + (this.currentLevel - 1) * this.config.memoryTimeIncrement;
        this.timeLeft = memoryTime;
        
        // 更新UI
        this.timeLeftDisplay.textContent = this.timeLeft;
        
        // 显示阶段指示器
        this.phaseIndicator.textContent = '记忆阶段';
        this.phaseIndicator.style.display = 'block';
        
        // 启动计时器
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.timeLeftDisplay.textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.startReconstructionPhase();
            }
        }, 1000);
    }

    startReconstructionPhase() {
        // 设置游戏状态
        this.currentPhase = 'reconstruction';
        
        // 移除所有着色
        const cells = this.gridInner.querySelectorAll('.grid-cell');
        cells.forEach(cell => {
            cell.classList.remove('colored');
            cell.style.backgroundColor = '';
        });
        
        // 更新阶段指示器
        this.phaseIndicator.textContent = '还原阶段';
        
        // 显示提交按钮
        this.submitButton.style.display = 'block';
    }

    evaluateRound() {
        // 立即禁用提交按钮，避免重复点击
        this.submitButton.disabled = true;
        
        // 设置游戏状态
        this.currentPhase = 'evaluation';
        this.phaseIndicator.textContent = '评估结果';
        
        // 计算得分和准确率
        const { score, accuracy } = this.calculateScore();
        
        // 直接在网格上显示结果，无需额外元素
        this.showOriginalColoring();
        
        // 更新统计数据
        this.gameStats.rounds.push({
            level: this.currentLevel,
            gridSize: this.gridSize,
            score: score,
            accuracy: accuracy
        });
        this.gameStats.totalScore += score;
        this.gameStats.highestAccuracy = Math.max(this.gameStats.highestAccuracy, accuracy);
        this.gameStats.lowestAccuracy = Math.min(this.gameStats.lowestAccuracy, accuracy);
        
        // 计算平均准确率
        const totalAccuracy = this.gameStats.rounds.reduce((sum, round) => sum + round.accuracy, 0);
        this.gameStats.averageAccuracy = totalAccuracy / this.gameStats.rounds.length;
        
        // 预先准备下一关数据
        const nextLevel = this.currentLevel + 1;
        const nextGridSize = Math.min(this.config.maxGridSize, this.config.minGridSize + (nextLevel - 1));
        const isGameComplete = nextLevel > this.config.levels;
        
        // 使用较短的评估时间
        setTimeout(() => {
            this.submitButton.disabled = false;
            this.submitButton.style.display = 'none';
            
            // 更新关卡
            this.currentLevel = nextLevel;
            
            // 更新网格大小
            this.gridSize = nextGridSize;
            
            // 检查游戏是否结束
            if (isGameComplete) {
                this.gameComplete();
                return;
            }
            
            // 显示关卡完成屏幕
            this.levelCompleteScreen.classList.add('show');
            setTimeout(() => {
                this.levelCompleteScreen.classList.remove('show');
                // 使用requestAnimationFrame确保下一轮的平滑过渡
                requestAnimationFrame(() => this.startRound());
            }, 1500);
        }, this.config.evaluationTime * 1000);
    }

    calculateScore() {
        let correctCells = 0;
        let incorrectCells = 0;
        
        // 使用哈希映射优化查找
        const originalCellMap = new Map();
        this.coloredCells.forEach(cell => {
            const key = `${cell.x},${cell.y}`;
            originalCellMap.set(key, true);
        });
        
        // 检查正确和错误的着色单元格
        this.userColoredCells.forEach(user => {
            const key = `${user.x},${user.y}`;
            if (originalCellMap.has(key)) {
                correctCells++;
            } else {
                incorrectCells++;
            }
        });
        
        // 计算准确率
        const totalOriginal = this.coloredCells.length;
        const accuracy = totalOriginal > 0 ? (correctCells / totalOriginal) * 100 : 0;
        
        // 计算惩罚因子（错误单元格越多，惩罚越大）
        const penaltyFactor = 1 - (incorrectCells / (this.gridSize * this.gridSize));
        
        // 计算得分
        const score = Math.floor(this.config.maxScore * (accuracy / 100) * penaltyFactor);
        this.currentScore = score;
        
        // 更新UI
        const accuracyPercentage = Math.floor(accuracy);
        this.matchedDisplay.textContent = `${accuracyPercentage}%`;
        
        return { score, accuracy: accuracyPercentage };
    }

    showOriginalColoring() {
        // 获取所有单元格并建立索引映射
        const cells = Array.from(this.gridInner.querySelectorAll('.grid-cell'));
        const cellMap = new Map();
        
        cells.forEach(cell => {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            cellMap.set(`${x},${y}`, cell);
        });
        
        // 创建两个集合用于快速查找
        const originalSet = new Set(this.coloredCells.map(cell => `${cell.x},${cell.y}`));
        const userSet = new Set(this.userColoredCells.map(cell => `${cell.x},${cell.y}`));
        
        // 简化显示逻辑：只需要给每个单元格设置颜色
        cells.forEach(cell => {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            const key = `${x},${y}`;
            
            // 移除所有之前的类
            cell.classList.remove('colored', 'correct', 'incorrect', 'missed');
            
            // 原始着色中有，用户也选择了 - 正确 (蓝色)
            if (originalSet.has(key) && userSet.has(key)) {
                cell.style.backgroundColor = '#3498db'; // 蓝色
                cell.classList.add('colored');
            }
            // 原始着色中有，但用户没选择 - 漏选 (浅蓝色)
            else if (originalSet.has(key) && !userSet.has(key)) {
                cell.style.backgroundColor = '#3498db'; // 蓝色
                cell.style.opacity = '0.5'; // 降低透明度表示漏选
                cell.classList.add('colored');
            }
            // 原始着色中没有，但用户选择了 - 错误 (红色)
            else if (!originalSet.has(key) && userSet.has(key)) {
                cell.style.backgroundColor = '#e74c3c'; // 红色
                cell.classList.add('colored');
            }
            // 两者都没有 - 空白
            else {
                cell.style.backgroundColor = '';
                cell.style.opacity = '1';
            }
        });
    }

    gameComplete() {
        // 设置游戏状态
        this.currentPhase = 'idle';
        this.phaseIndicator.style.display = 'none';
        
        // 创建统计面板HTML
        const statsHTML = this.createStatsHTML();
        
        // 显示游戏完成屏幕
        this.startScreen.style.display = 'block';
        this.startScreen.querySelector('.game-title').textContent = '挑战完成！';
        this.startScreen.querySelector('.game-instructions').innerHTML = `
            你完成了所有 ${this.config.levels} 个难度的挑战！<br><br>
            ${statsHTML}<br>
            再来一次挑战？
        `;
        this.startButton.textContent = '重新开始';
    }
    
    createStatsHTML() {
        // 创建关卡得分表格
        let roundsTableHTML = `
        <div class="stats-table">
            <table>
                <tr>
                    <th>关卡</th>
                    <th>网格大小</th>
                    <th>得分</th>
                    <th>准确率</th>
                </tr>`;
        
        this.gameStats.rounds.forEach(round => {
            roundsTableHTML += `
                <tr>
                    <td>${round.level}</td>
                    <td>${round.gridSize}×${round.gridSize}</td>
                    <td>${round.score}</td>
                    <td>${round.accuracy}%</td>
                </tr>`;
        });
        
        roundsTableHTML += `</table></div>`;
        
        // 创建总体统计面板
        return `
        <div class="game-stats">
            <div class="stats-row">
                <div class="stat-item">
                    <div class="stat-label">总得分</div>
                    <div class="stat-value">${this.gameStats.totalScore}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">平均准确率</div>
                    <div class="stat-value">${Math.round(this.gameStats.averageAccuracy)}%</div>
                </div>
            </div>
            <div class="stats-row">
                <div class="stat-item">
                    <div class="stat-label">最高准确率</div>
                    <div class="stat-value">${this.gameStats.highestAccuracy}%</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">最低准确率</div>
                    <div class="stat-value">${this.gameStats.lowestAccuracy === 100 ? '0' : this.gameStats.lowestAccuracy}%</div>
                </div>
            </div>
            <div class="stats-details">
                <div class="stats-title">关卡详情</div>
                ${roundsTableHTML}
            </div>
        </div>`;
    }
}

// 当页面加载完成时初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    new MemoryGridGame();
});
