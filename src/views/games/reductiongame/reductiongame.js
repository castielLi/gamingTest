class ReductionGame {
    constructor() {
        // 游戏配置
        this.config = {
            initialShapes: 3,         // 初始图形数量
            shapesPerLevel: 1,        // 每个难度增加的图形数量
            observationTime: 3,       // 观察阶段时间（秒）
            initialReconstructTime: 20, // 初始还原时间（秒）
            timeIncrement: 10,        // 每个难度增加的时间（秒）
            roundsPerLevel: 3,        // 每个难度的轮数
            levels: 4,                // 总难度数（改为4个关卡）
            shapeTypes: ['triangle', 'square', 'circle'], // 图形类型
            shapeColors: {
                triangle: '#f1c40f', // 黄色
                square: '#e74c3c',   // 红色
                circle: '#3498db'    // 蓝色
            },
            maxScore: 100,            // 每轮最高分
            animationSpeed: 24,       // 动画速度（降低到原来的2/3）
            minScreenWidth: 800,      // 最小屏幕宽度
            minScreenHeight: 600      // 最小屏幕高度
        };

        // 游戏状态
        this.currentLevel = 1;        // 当前难度
        this.currentRound = 1;        // 当前轮数
        this.currentPhase = 'idle';   // 当前阶段：idle, observation, reconstruction, paused
        this.timeLeft = 0;            // 剩余时间
        this.currentScore = 0;        // 当前得分
        this.totalScore = 0;          // 总得分
        this.originalShapes = [];     // 原始图形数据
        this.userShapes = [];         // 用户放置的图形
        this.timerInterval = null;    // 计时器
        this.animationFrameId = null; // 动画帧ID
        this.draggedShapeType = null; // 当前拖拽的图形类型
        this.isGameActive = false;    // 游戏是否激活
        this.isSubmitting = false;    // 是否正在提交答案（防止重复点击）
        this.gameStats = {            // 游戏统计数据
            totalShapes: 0,           // 总图形数
            correctShapes: 0,         // 正确图形数
            accuracy: 0,              // 准确率
            averageScore: 0,          // 平均分
            highestScore: 0,          // 最高分
            totalRounds: 0            // 总轮数
        };

        // DOM元素
        this.gameBoard = document.getElementById('gameBoard');
        this.shapePalette = document.getElementById('shapePalette');
        this.startScreen = document.getElementById('startScreen');
        this.countdown = document.getElementById('countdown');
        this.phaseIndicator = document.getElementById('phaseIndicator');
        this.levelIndicator = document.getElementById('levelIndicator');
        this.timerBar = document.getElementById('timerBar');
        this.startButton = document.getElementById('startButton');
        this.submitButton = document.getElementById('submitButton');
        this.currentScoreDisplay = document.getElementById('currentScore');
        this.totalScoreDisplay = document.getElementById('totalScore');
        this.screenSizeWarning = document.getElementById('screenSizeWarning');

        // 绑定事件
        this.startButton.addEventListener('click', () => this.startGame());
        this.submitButton.addEventListener('click', () => {
            if (!this.isSubmitting && this.currentPhase === 'reconstruction') {
                this.isSubmitting = true;
                this.submitButton.disabled = true;
                this.evaluateRound();
            }
        });
        this.setupDragAndDrop();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => this.checkScreenSize());

        // 初始化
        this.init();
    }

    init() {
        // 尝试最大化浏览器窗口
        if (window.innerWidth < screen.width || window.innerHeight < screen.height) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) { // Chrome, Safari
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) { // IE11
                document.documentElement.msRequestFullscreen();
            }
        }
        
        // 检查屏幕大小
        this.checkScreenSize();
        
        // 初始状态下禁用提交按钮
        this.submitButton.disabled = true;
        
        // 更新显示
        this.levelIndicator.textContent = `关卡 ${this.currentLevel}-${this.currentRound}`;
        this.currentScoreDisplay.textContent = this.currentScore;
        this.totalScoreDisplay.textContent = this.totalScore;
    }

    checkScreenSize() {
        const currentWidth = window.innerWidth;
        const currentHeight = window.innerHeight;
        const screenWidth = window.screen.availWidth;
        const screenHeight = window.screen.availHeight;
        
        const widthRatio = currentWidth / screenWidth;
        const heightRatio = currentHeight / screenHeight;
        const isMaximized = widthRatio >= 0.85 && heightRatio >= 0.85;
        
        if (!isMaximized && !document.fullscreenElement) {
            const warning = document.createElement('div');
            warning.className = 'warning-content';
            warning.innerHTML = `
                <div class="warning-icon">⚠️</div>
                <div class="warning-title">窗口未最大化</div>
                <div class="warning-text">
                    为了获得最佳游戏体验，建议将浏览器窗口最大化。<br>
                    点击下方按钮进入全屏模式。<br>
                    <button id="autoAdjustButton" class="button">进入全屏模式</button>
                </div>
            `;
            
            document.getElementById('screenSizeWarning').innerHTML = '';
            document.getElementById('screenSizeWarning').appendChild(warning);
            document.getElementById('screenSizeWarning').style.display = 'flex';
            document.querySelector('.game-wrapper').style.display = 'none';
            
            document.getElementById('autoAdjustButton').addEventListener('click', () => {
                this.enterFullscreen();
            });
            
            return false;
        }
        
        document.getElementById('screenSizeWarning').style.display = 'none';
        document.querySelector('.game-wrapper').style.display = 'grid';
        return true;
    }

    startGame() {
        // 检查屏幕大小
        if (window.innerWidth < this.config.minScreenWidth || 
            window.innerHeight < this.config.minScreenHeight) {
            return; // 屏幕太小，不启动游戏
        }
        
        // 设置游戏为激活状态
        this.isGameActive = true;
        
        // 重置游戏状态
        this.currentLevel = 1;
        this.currentRound = 1;
        this.totalScore = 0;
        this.gameStats = {
            totalShapes: 0,
            correctShapes: 0,
            accuracy: 0,
            averageScore: 0,
            highestScore: 0,
            totalRounds: 0
        };
        
        this.startRound();
    }

    startRound() {
        // 清空游戏板和用户图形
        this.clearGameBoard();
        this.userShapes = [];
        
        // 隐藏开始屏幕
        this.startScreen.style.display = 'none';
        
        // 禁用提交按钮
        this.submitButton.disabled = true;
        this.isSubmitting = false;
        
        // 更新显示
        this.levelIndicator.textContent = `关卡 ${this.currentLevel}-${this.currentRound}`;
        this.currentScoreDisplay.textContent = '0';
        this.totalScoreDisplay.textContent = this.totalScore;
        
        // 计算当前难度的图形数量和时间
        const shapeCount = this.config.initialShapes + (this.currentLevel - 1) * this.config.shapesPerLevel;
        const reconstructTime = this.config.initialReconstructTime + (this.currentLevel - 1) * this.config.timeIncrement;
        this.timeLeft = reconstructTime;
        
        // 生成随机图形
        this.generateRandomShapes(shapeCount);
        
        // 更新统计数据
        this.gameStats.totalShapes += shapeCount;
        this.gameStats.totalRounds++;
        
        // 开始观察阶段
        this.startObservationPhase();
    }

    generateRandomShapes(count) {
        this.originalShapes = [];
        const boardRect = this.gameBoard.getBoundingClientRect();
        const gridSize = 50;    // 网格大小
        const margin = gridSize; // 边距设置为一个网格大小
        
        // 生成随机图形
        for (let i = 0; i < count; i++) {
            // 随机选择图形类型
            const type = this.config.shapeTypes[Math.floor(Math.random() * this.config.shapeTypes.length)];
            
            // 随机位置（考虑边距和网格对齐）
            const gridColumns = Math.floor((boardRect.width - 2 * margin) / gridSize);
            const gridRows = Math.floor((boardRect.height - 2 * margin) / gridSize);
            
            const gridX = Math.floor(Math.random() * gridColumns);
            const gridY = Math.floor(Math.random() * gridRows);
            
            const x = margin + gridX * gridSize;
            const y = margin + gridY * gridSize;
            
            // 创建图形元素
            const shape = document.createElement('div');
            shape.className = `shape ${type}`;
            shape.style.left = `${x}px`;
            shape.style.top = `${y}px`;
            
            // 存储原始图形数据
            this.originalShapes.push({
                type,
                x,
                y,
                element: shape
            });
            
            // 添加到游戏板
            this.gameBoard.appendChild(shape);
        }
    }

    startObservationPhase() {
        this.currentPhase = 'observation';
        this.phaseIndicator.textContent = '观察阶段';
        this.countdown.textContent = this.config.observationTime;
        this.countdown.classList.add('show');
        
        // 开始图形移动动画
        this.startShapeAnimation();
        
        // 倒计时
        let timeLeft = this.config.observationTime;
        const countdownInterval = setInterval(() => {
            timeLeft--;
            this.countdown.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                this.countdown.classList.remove('show');
                this.stopShapeAnimation();
                this.startReconstructionPhase(); // 直接进入还原阶段
            }
        }, 1000);
    }

    startShapeAnimation() {
        const boardRect = this.gameBoard.getBoundingClientRect();
        const margin = 50;
        
        // 为每个图形设置随机速度
        this.originalShapes.forEach(shape => {
            shape.vx = (Math.random() - 0.5) * this.config.animationSpeed; // x方向速度
            shape.vy = (Math.random() - 0.5) * this.config.animationSpeed; // y方向速度
        });
        
        // 动画函数
        const animate = () => {
            // 移动每个图形
            this.originalShapes.forEach(shape => {
                // 更新位置
                shape.x += shape.vx;
                shape.y += shape.vy;
                
                // 边界检测
                if (shape.x < margin || shape.x > boardRect.width - margin) {
                    shape.vx = -shape.vx;
                    shape.x = Math.max(margin, Math.min(shape.x, boardRect.width - margin));
                }
                if (shape.y < margin || shape.y > boardRect.height - margin) {
                    shape.vy = -shape.vy;
                    shape.y = Math.max(margin, Math.min(shape.y, boardRect.height - margin));
                }
                
                // 更新元素位置
                shape.element.style.left = `${shape.x}px`;
                shape.element.style.top = `${shape.y}px`;
            });
            
            // 继续动画
            if (this.currentPhase === 'observation') {
                this.animationFrameId = requestAnimationFrame(animate);
            }
        };
        
        // 开始动画
        this.animationFrameId = requestAnimationFrame(animate);
    }

    stopShapeAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    startReconstructionPhase() {
        this.currentPhase = 'reconstruction';
        this.phaseIndicator.textContent = '还原阶段';
        
        // 隐藏原始图形
        this.originalShapes.forEach(shape => {
            shape.element.style.opacity = '0';
            setTimeout(() => {
                if (shape.element.parentNode) {
                    this.gameBoard.removeChild(shape.element);
                }
            }, 300);
        });
        
        // 启用提交按钮
        this.submitButton.disabled = false;
        this.isSubmitting = false;
        
        // 开始计时
        this.startTimer();
    }

    startTimer() {
        // 计算当前难度的时间
        const totalTime = this.config.initialReconstructTime + (this.currentLevel - 1) * this.config.timeIncrement;
        this.timeLeft = totalTime;
        this.timerBar.style.width = '100%';
        
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.timerBar.style.width = `${(this.timeLeft / totalTime) * 100}%`;
            
            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.evaluateRound();
            }
        }, 1000);
    }

    setupDragAndDrop() {
        // 设置图形调色板的拖拽事件
        this.shapePalette.querySelectorAll('.palette-shape').forEach(paletteShape => {
            paletteShape.addEventListener('dragstart', (e) => {
                if (this.currentPhase !== 'reconstruction') {
                    e.preventDefault();
                    return;
                }
                
                // 设置拖拽数据
                this.draggedShapeType = paletteShape.dataset.shape;
                e.dataTransfer.setData('text/plain', this.draggedShapeType);
                e.dataTransfer.effectAllowed = 'copy';
                
                // 创建自定义拖拽图像
                const dragImage = document.createElement('div');
                dragImage.className = `shape ${this.draggedShapeType}`;
                dragImage.style.position = 'absolute';
                dragImage.style.top = '-1000px';
                document.body.appendChild(dragImage);
                
                // 设置拖拽图像
                e.dataTransfer.setDragImage(dragImage, 25, 25);
                
                // 延迟移除拖拽图像
                setTimeout(() => {
                    document.body.removeChild(dragImage);
                }, 0);
            });
        });
        
        // 设置游戏板的拖拽事件
        this.gameBoard.addEventListener('dragover', (e) => {
            if (this.currentPhase !== 'reconstruction') return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        this.gameBoard.addEventListener('drop', (e) => {
            if (this.currentPhase !== 'reconstruction') return;
            e.preventDefault();
            
            // 获取拖拽的图形类型
            const shapeType = e.dataTransfer.getData('text/plain') || this.draggedShapeType;
            if (!shapeType) return;
            
            // 获取放置位置
            const boardRect = this.gameBoard.getBoundingClientRect();
            const x = e.clientX - boardRect.left;
            const y = e.clientY - boardRect.top;
            
            // 创建新图形
            this.createShape(shapeType, x, y);
        });
        
        // 设置游戏板的点击和拖拽事件（用于移动已放置的图形）
        this.gameBoard.addEventListener('mousedown', (e) => {
            if (this.currentPhase !== 'reconstruction') return;
            
            // 检查是否点击了图形
            if (e.target.classList.contains('shape')) {
                // 右键点击删除图形
                if (e.button === 2) {
                    e.preventDefault();
                    this.removeShape(e.target);
                    return;
                }
                
                // 左键点击开始拖动
                e.preventDefault();
                const shape = e.target;
                const startX = e.clientX;
                const startY = e.clientY;
                const startLeft = parseInt(shape.style.left) || 0;
                const startTop = parseInt(shape.style.top) || 0;
                
                // 鼠标移动事件
                const mouseMoveHandler = (e) => {
                    // 计算新位置（不再进行网格对齐）
                    const newLeft = startLeft + (e.clientX - startX);
                    const newTop = startTop + (e.clientY - startY);
                    
                    // 更新元素位置
                    shape.style.left = `${newLeft}px`;
                    shape.style.top = `${newTop}px`;
                    
                    // 更新用户图形数据
                    const userShape = this.userShapes.find(s => s.element === shape);
                    if (userShape) {
                        userShape.x = newLeft;
                        userShape.y = newTop;
                    }
                };
                
                // 鼠标释放事件
                const mouseUpHandler = () => {
                    // 移除事件监听器
                    document.removeEventListener('mousemove', mouseMoveHandler);
                    document.removeEventListener('mouseup', mouseUpHandler);
                };
                
                // 添加事件监听器
                document.addEventListener('mousemove', mouseMoveHandler);
                document.addEventListener('mouseup', mouseUpHandler);
            }
        });
        
        // 阻止游戏板的右键菜单
        this.gameBoard.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    createShape(type, x, y) {
        const shapeSize = 50;  // 图形大小
        
        // 计算放置位置（考虑图形大小的一半进行居中）
        const posX = x - shapeSize/2;
        const posY = y - shapeSize/2;
        
        // 创建新图形
        const newShape = document.createElement('div');
        newShape.className = `shape ${type}`;
        newShape.style.left = `${posX}px`;
        newShape.style.top = `${posY}px`;
        
        // 添加到游戏板
        this.gameBoard.appendChild(newShape);
        
        // 存储用户图形数据
        const userShape = {
            type,
            x: posX,
            y: posY,
            element: newShape
        };
        this.userShapes.push(userShape);
        
        return userShape;
    }

    removeShape(element) {
        // 从DOM中移除
        if (element.parentNode) {
            this.gameBoard.removeChild(element);
        }
        
        // 从用户图形数组中移除
        const index = this.userShapes.findIndex(s => s.element === element);
        if (index !== -1) {
            this.userShapes.splice(index, 1);
        }
    }

    evaluateRound() {
        clearInterval(this.timerInterval);
        
        // 计算得分
        this.currentScore = this.calculateScore();
        this.totalScore += this.currentScore;
        
        // 更新统计数据
        this.gameStats.highestScore = Math.max(this.gameStats.highestScore, this.currentScore);
        this.gameStats.averageScore = Math.round(this.totalScore / this.gameStats.totalRounds);
        
        // 更新显示
        this.currentScoreDisplay.textContent = this.currentScore;
        this.totalScoreDisplay.textContent = this.totalScore;
        
        // 显示原始图形（用于比较）
        this.showOriginalShapes();
        
        // 2秒后进入下一轮或结束游戏
        setTimeout(() => {
            // 检查是否需要进入下一轮或下一难度
            this.currentRound++;
            
            if (this.currentRound > this.config.roundsPerLevel) {
                this.currentRound = 1;
                this.currentLevel++;
                
                if (this.currentLevel > this.config.levels) {
                    // 游戏结束
                    this.gameOver(true);
                    return;
                }
            }
            
            // 开始下一轮
            this.startRound();
        }, 2000);
    }

    showOriginalShapes() {
        // 清除用户图形
        this.userShapes.forEach(shape => {
            if (shape.element.parentNode) {
                this.gameBoard.removeChild(shape.element);
            }
        });
        
        // 显示原始图形
        this.originalShapes.forEach(shape => {
            const originalShape = document.createElement('div');
            originalShape.className = `shape ${shape.type}`;
            originalShape.style.left = `${shape.x}px`;
            originalShape.style.top = `${shape.y}px`;
            originalShape.style.opacity = '0';
            
            this.gameBoard.appendChild(originalShape);
            
            // 淡入显示
            setTimeout(() => {
                originalShape.style.opacity = '1';
            }, 100);
        });
    }

    calculateScore() {
        if (this.userShapes.length === 0) return 0;
        
        // 首先按类型分组
        const originalShapesByType = {};
        const userShapesByType = {};
        
        this.originalShapes.forEach(shape => {
            if (!originalShapesByType[shape.type]) {
                originalShapesByType[shape.type] = [];
            }
            originalShapesByType[shape.type].push(shape);
        });
        
        this.userShapes.forEach(shape => {
            if (!userShapesByType[shape.type]) {
                userShapesByType[shape.type] = [];
            }
            userShapesByType[shape.type].push(shape);
        });
        
        let totalPositionAccuracy = 0;
        let matchedShapes = 0;
        const maxAllowedDistance = 50; // 最大允许距离为50像素
        
        // 对每种类型的图形分别计算最佳匹配
        for (const type of this.config.shapeTypes) {
            const originalShapes = originalShapesByType[type] || [];
            const userShapes = userShapesByType[type] || [];
            
            // 构建距离矩阵
            const distanceMatrix = [];
            originalShapes.forEach(originalShape => {
                const distances = userShapes.map(userShape => {
                    // 计算中心点距离
                    const centerX1 = originalShape.x + 25; // 25是图形大小的一半
                    const centerY1 = originalShape.y + 25;
                    const centerX2 = userShape.x + 25;
                    const centerY2 = userShape.y + 25;
                    
                    return Math.sqrt(
                        Math.pow(centerX1 - centerX2, 2) + 
                        Math.pow(centerY1 - centerY2, 2)
                    );
                });
                distanceMatrix.push(distances);
            });
            
            // 使用匈牙利算法找到最佳匹配
            const matches = this.hungarianAlgorithm(distanceMatrix);
            
            // 计算这种类型的得分
            matches.forEach(([originalIndex, userIndex]) => {
                if (userIndex !== -1) {
                    const distance = distanceMatrix[originalIndex][userIndex];
                    if (distance <= maxAllowedDistance) {
                        // 使用二次函数计算准确度，使得距离越近分数越高
                        // (1 - (d/50)^2) 会在距离为0时得到1，在距离为50时得到0
                        const positionAccuracy = Math.max(0, 1 - Math.pow(distance / maxAllowedDistance, 2));
                        totalPositionAccuracy += positionAccuracy;
                        matchedShapes++;
                    }
                }
            });
        }
        
        // 更新统计数据
        this.gameStats.correctShapes += matchedShapes;
        this.gameStats.accuracy = Math.round((this.gameStats.correctShapes / this.gameStats.totalShapes) * 100);
        
        // 计算最终得分
        const avgPositionAccuracy = matchedShapes > 0 ? totalPositionAccuracy / this.originalShapes.length : 0;
        const score = Math.round(
            avgPositionAccuracy * this.config.maxScore * 
            (matchedShapes / this.originalShapes.length)
        );
        
        return score;
    }
    
    hungarianAlgorithm(costMatrix) {
        if (costMatrix.length === 0) return [];
        
        const rows = costMatrix.length;
        const cols = costMatrix[0].length;
        const n = Math.max(rows, cols);
        
        // 扩展矩阵为方阵
        const matrix = Array(n).fill().map(() => Array(n).fill(Infinity));
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                matrix[i][j] = costMatrix[i][j];
            }
        }
        
        // 行减去最小值
        for (let i = 0; i < n; i++) {
            const minVal = Math.min(...matrix[i]);
            for (let j = 0; j < n; j++) {
                if (matrix[i][j] !== Infinity) {
                    matrix[i][j] -= minVal;
                }
            }
        }
        
        // 列减去最小值
        for (let j = 0; j < n; j++) {
            const minVal = Math.min(...matrix.map(row => row[j]));
            for (let i = 0; i < n; i++) {
                if (matrix[i][j] !== Infinity) {
                    matrix[i][j] -= minVal;
                }
            }
        }
        
        // 找到最小覆盖
        const matches = [];
        const used = new Set();
        
        for (let i = 0; i < rows; i++) {
            let bestJ = -1;
            let bestVal = Infinity;
            
            for (let j = 0; j < cols; j++) {
                if (!used.has(j) && matrix[i][j] < bestVal) {
                    bestVal = matrix[i][j];
                    bestJ = j;
                }
            }
            
            if (bestJ !== -1) {
                matches.push([i, bestJ]);
                used.add(bestJ);
            } else {
                matches.push([i, -1]);
            }
        }
        
        return matches;
    }

    gameOver(completed, reason = "") {
        clearInterval(this.timerInterval);
        this.isGameActive = false;
        this.currentPhase = 'idle';
        
        // 显示游戏结束屏幕
        this.startScreen.style.display = 'block';
        
        if (completed) {
            // 创建统计面板
            const statsHTML = this.createStatsHTML();
            
            this.startScreen.querySelector('.game-title').textContent = '恭喜完成挑战！';
            this.startScreen.querySelector('.game-instructions').innerHTML = `
                你成功完成了所有难度！<br>
                最终得分：${this.totalScore}<br><br>
                ${statsHTML}<br>
                再来一次挑战？
            `;
        } else if (reason === "屏幕尺寸改变") {
            this.startScreen.querySelector('.game-title').textContent = '游戏中断';
            this.startScreen.querySelector('.game-instructions').innerHTML = `
                由于屏幕尺寸改变，游戏已中断。<br>
                当前得分：${this.totalScore}<br><br>
                请调整浏览器窗口大小后重新开始游戏。
            `;
        } else {
            this.startScreen.querySelector('.game-title').textContent = '游戏结束';
            this.startScreen.querySelector('.game-instructions').innerHTML = `
                你的得分：${this.totalScore}<br><br>
                再来一次挑战？
            `;
        }
        
        this.startScreen.querySelector('.button').textContent = '重新开始';
    }

    createStatsHTML() {
        return `
        <div class="game-stats">
            <div class="stats-row">
                <div class="stat-item">
                    <div class="stat-label">准确率</div>
                    <div class="stat-value">${this.gameStats.accuracy}%</div>
                    <div class="stat-detail">正确图形: ${this.gameStats.correctShapes}/${this.gameStats.totalShapes}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">平均分</div>
                    <div class="stat-value">${this.gameStats.averageScore}</div>
                    <div class="stat-detail">总分: ${this.totalScore}</div>
                </div>
            </div>
            <div class="stats-row">
                <div class="stat-item">
                    <div class="stat-label">最高分</div>
                    <div class="stat-value">${this.gameStats.highestScore}</div>
                    <div class="stat-detail">单轮最高</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">总轮数</div>
                    <div class="stat-value">${this.gameStats.totalRounds}</div>
                    <div class="stat-detail">完成轮数</div>
                </div>
            </div>
        </div>`;
    }

    clearGameBoard() {
        // 清除所有图形
        const shapes = this.gameBoard.querySelectorAll('.shape');
        shapes.forEach(shape => {
            this.gameBoard.removeChild(shape);
        });
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new ReductionGame();
});
