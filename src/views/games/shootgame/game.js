class Circle {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.growthRate = 20; // 每秒增长的像素
        this.creationTime = Date.now();
        this.maxRadius = 50; // 最大半径
        this.isClicked = false;
        this.clickAnimationStart = 0;
        this.clickAnimationDuration = 200; // 200ms的消失动画
        this.isTimedOut = false; // 新增：标记是否因超时而消失
    }

    draw(ctx) {
        const age = (Date.now() - this.creationTime) / 1000;
        const currentRadius = this.radius + (this.growthRate * age);
        
        if (currentRadius >= this.maxRadius) {
            this.isTimedOut = true; // 标记为超时
            return false;
        }
        
        if (this.isClicked) {
            const progress = (Date.now() - this.clickAnimationStart) / this.clickAnimationDuration;
            if (progress >= 1) {
                return false; // 动画结束，移除圆形
            }
            
            // 绘制消失动画中的同心圆
            const alpha = 1 - progress;
            
            // 外圆 (300分区域)
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(173, 216, 230, ${alpha})`;
            ctx.fill();
            
            // 中圆 (350分区域)
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(144, 238, 144, ${alpha})`;
            ctx.fill();
            
            // 内圆 (400分区域)
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(135, 206, 250, ${alpha})`;
            ctx.fill();
            
            // 最内圆 (500分区域)
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.fill();
            
            // 边框
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(211, 211, 211, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();
        } else {
            // 绘制正常状态的同心圆
            
            // 外圆 (300分区域)
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#ADD8E6'; // 浅蓝色
            ctx.fill();
            
            // 中圆 (350分区域)
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = '#90EE90'; // 浅绿色
            ctx.fill();
            
            // 内圆 (400分区域)
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = '#87CEFA'; // 天蓝色
            ctx.fill();
            
            // 最内圆 (500分区域)
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = '#FFD700'; // 金色
            ctx.fill();
            
            // 边框
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
            ctx.strokeStyle = '#D3D3D3';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();
        }
        
        return true;
    }

    checkClick(x, y) {
        const age = (Date.now() - this.creationTime) / 1000;
        const currentRadius = this.radius + (this.growthRate * age);
        const distance = Math.sqrt(
            Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2)
        );
        return distance <= currentRadius;
    }

    // 添加一个方法来检查与其他圆是否重叠
    isOverlapping(otherCircle) {
        const distance = Math.sqrt(
            Math.pow(this.x - otherCircle.x, 2) + 
            Math.pow(this.y - otherCircle.y, 2)
        );
        // 使用最大半径来检查，确保增长过程中不会重叠
        return distance < (this.maxRadius * 2);
    }

    // 添加一个方法来计算点击精度和对应分数
    calculateScore(x, y) {
        const distance = Math.sqrt(
            Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2)
        );
        const age = (Date.now() - this.creationTime) / 1000;
        const currentRadius = this.radius + (this.growthRate * age);
        
        // 计算点击位置与圆心的距离比例
        const ratio = distance / currentRadius;
        
        // 基础分数
        let baseScore = 0;
        let accuracy = "";
        
        // 根据比例返回分数
        if (ratio <= 0.3) {
            baseScore = 500;
            accuracy = "perfect";
        } else if (ratio <= 0.6) {
            baseScore = 400;
            accuracy = "great";
        } else if (ratio <= 0.8) {
            baseScore = 350;
            accuracy = "good";
        } else {
            baseScore = 300;
            accuracy = "ok";
        }
        
        // 计算时间奖励倍数 - 调整时间范围
        let timeMultiplier = 1;
        let timeBonus = "";
        
        if (age <= 0.7) {
            timeMultiplier = 5;
            timeBonus = "极速!";
        } else if (age <= 1.4) {
            timeMultiplier = 2;
            timeBonus = "快速!";
        }
        
        // 计算最终分数
        const finalScore = baseScore * timeMultiplier;
        
        return { 
            score: finalScore, 
            accuracy: accuracy,
            timeMultiplier: timeMultiplier,
            timeBonus: timeBonus
        };
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.circles = [];
        this.initialRadius = 15;
        this.maxRadius = 50;
        this.score = 0;
        this.timeLeft = 60;
        this.isGameOver = false;
        this.gameTimer = null;
        this.isGameStarted = false;
        this.isPaused = false;
        
        // 获取DOM元素
        this.startScreen = document.querySelector('.start-screen');
        this.startButton = document.querySelector('.start-button');
        this.gameOverScreen = document.querySelector('.game-over');
        this.retryButton = document.querySelector('.retry-button');
        this.fullscreenWarning = document.querySelector('.fullscreen-warning');
        this.fullscreenButton = document.querySelector('.fullscreen-button');
        
        // 绑定事件
        this.startButton.addEventListener('click', () => this.startGame());
        this.retryButton.addEventListener('click', () => this.restartGame());
        this.fullscreenButton.addEventListener('click', () => this.enterFullscreen());
        
        // 检查初始窗口状态
        this.checkWindowState();
        
        // 监听全屏变化
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('mozfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('MSFullscreenChange', () => this.handleFullscreenChange());
        
        // 修改窗口大小变化监听
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.checkWindowState();
        });
        
        // 初始化画布
        this.resizeCanvas();
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // 添加粒子系统
        this.particles = [];
        this.sparkles = [];
        
        // 添加准星
        this.createCrosshair();
        
        // 添加击中特效
        this.hitMarkers = [];
        
        // 自定义鼠标样式
        this.canvas.style.cursor = 'none';
        
        // 跟踪鼠标位置
        this.mouseX = 0;
        this.mouseY = 0;
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            
            // 更新连击显示的目标位置
            if (this.combo > 1) {
                this.comboDisplay.targetX = this.mouseX + this.comboDisplay.offsetX;
                this.comboDisplay.targetY = this.mouseY + this.comboDisplay.offsetY;
            }
        });
        
        // 添加精准度统计
        this.totalShots = 0;
        this.hitShots = 0;
        this.accuracy = 0;
        
        // 添加新的统计指标
        this.totalCircles = 0;      // 总共出现的圆形数量
        this.hitCircles = 0;        // 成功命中的圆形数量
        this.missedCircles = 0;     // 未命中消失的圆形数量
        this.totalClicks = 0;       // 总点击次数
        this.missClicks = 0;        // 无效点击次数
        this.ultraFastHits = 0;     // 极速命中次数
        this.fastHits = 0;          // 快速命中次数
        this.normalHits = 0;        // 普通命中次数
        
        // 添加浮动分数数组
        this.floatingScores = [];
        
        // 添加连击系统
        this.combo = 0;
        this.maxCombo = 0;
        this.lastHitTime = 0;
        this.comboTimeout = 1500;
        
        // 连击显示配置
        this.comboDisplay = {
            x: 0,
            y: 0,
            scale: 1,
            alpha: 0,
            pulsePhase: 0,
            offsetX: 30,  // 相对点击位置的偏移量
            offsetY: -40
        };
        
        // 移除DOM中的连击显示
        this.removeComboFromInfo();
        
        // 浮动分数颜色
        this.scoreColors = {
            hit: '#a8e6cf',      // 更柔和的绿色
            miss: '#ffb8b8',     // 更柔和的红色
            combo: '#ffd93d'      // 温和的黄色用于连击
        };
        
        // 分数单位配置
        this.scoreUnit = 'Pt';
    }

    removeComboFromInfo() {
        const existingCombo = document.querySelector('.combo-item');
        if (existingCombo) {
            existingCombo.remove();
        }
    }

    resizeCanvas() {
        const gameContainer = document.querySelector('.game-container');
        const availableWidth = gameContainer.clientWidth - 40;
        const availableHeight = gameContainer.clientHeight - 40;

        let width, height;
        const aspectRatio = 4/3;

        if (availableWidth / availableHeight > aspectRatio) {
            height = Math.min(availableHeight, window.innerHeight * 0.7);
            width = height * aspectRatio;
        } else {
            width = Math.min(availableWidth, window.innerWidth * 0.7);
            height = width / aspectRatio;
        }

        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        const border = document.querySelector('.game-border');
        if (border) {
            border.style.width = `${width}px`;
            border.style.height = `${height}px`;
        }

        this.scale = Math.min(width, height) / 800;
    }

    checkWindowState() {
        // 获取当前窗口尺寸
        const currentWidth = window.innerWidth;
        const currentHeight = window.innerHeight;
        
        // 获取屏幕尺寸
        const screenWidth = window.screen.availWidth;
        const screenHeight = window.screen.availHeight;
        
        // 计算窗口与屏幕的比例
        const widthRatio = currentWidth / screenWidth;
        const heightRatio = currentHeight / screenHeight;
        
        // 如果窗口尺寸达到屏幕可用尺寸的85%以上，认为是最大化状态
        const isMaximized = widthRatio >= 0.85 && heightRatio >= 0.85;
        
        if (!isMaximized && !document.fullscreenElement) {
            this.showFullscreenWarning();
        } else {
            this.hideFullscreenWarning();
        }
    }

    showFullscreenWarning() {
        if (this.fullscreenWarning) {
            this.fullscreenWarning.style.display = 'flex';
        }
    }

    hideFullscreenWarning() {
        if (this.fullscreenWarning) {
            this.fullscreenWarning.style.display = 'none';
        }
    }

    enterFullscreen() {
        const element = document.documentElement;
        
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) { // Chrome, Safari
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) { // IE11
            element.msRequestFullscreen();
        } else if (element.mozRequestFullScreen) { // Firefox
            element.mozRequestFullScreen();
        }
    }

    handleFullscreenChange() {
        if (!document.fullscreenElement && 
            !document.webkitFullscreenElement && 
            !document.mozFullScreenElement && 
            !document.msFullscreenElement) {
            // 退出全屏时检查窗口状态
            this.checkWindowState();
        } else {
            // 进入全屏时隐藏提示
            this.hideFullscreenWarning();
        }
    }

    startGame() {
        // 检查窗口状态
        const currentWidth = window.innerWidth;
        const currentHeight = window.innerHeight;
        const screenWidth = window.screen.availWidth;
        const screenHeight = window.screen.availHeight;
        const widthRatio = currentWidth / screenWidth;
        const heightRatio = currentHeight / screenHeight;
        const isMaximized = widthRatio >= 0.85 && heightRatio >= 0.85;
        
        // 只有在窗口未最大化且未全屏时才显示提示
        if (!isMaximized && !document.fullscreenElement) {
            this.showFullscreenWarning();
            return;
        }
        
        this.isGameStarted = true;
        this.startScreen.style.display = 'none';
        
        // 添加倒计时逻辑
        const countdownElement = document.querySelector('.countdown');
        let count = 3;
        
        // 显示倒计时元素
        countdownElement.textContent = count;
        countdownElement.classList.add('show');
        
        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownElement.textContent = count;
            } else {
                // 倒计时结束
                clearInterval(countdownInterval);
                countdownElement.classList.remove('show');
                // 开始游戏
                this.setupGame();
            }
        }, 1000);
    }

    pauseGame() {
        this.isPaused = true;
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            clearInterval(this.circleGenerator);
        }
    }

    resumeGame() {
        if (this.isPaused && this.isGameStarted && !this.isGameOver) {
            this.isPaused = false;
            this.setupGame();
        }
    }

    restartGame() {
        this.gameOverScreen.style.display = 'none';
        this.isGameOver = false;
        this.startGame();
    }

    setupGame() {
        this.score = 0;
        this.timeLeft = 60;
        this.isGameOver = false;
        this.circles = [];
        this.updateScore(0);
        this.updateTimer();
        
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            clearInterval(this.circleGenerator);
        }
        
        this.gameTimer = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
        
        this.circleGenerator = setInterval(() => this.addCircle(), 500);
        requestAnimationFrame(() => this.gameLoop());
    }

    updateScore(change) {
        this.score += change;
        // 更新分数显示时也添加单位
        const scoreDisplay = document.getElementById('scoreDisplay');
        scoreDisplay.textContent = `${this.score}${this.scoreUnit}`;
    }

    updateTimer() {
        document.getElementById('timeDisplay').textContent = this.timeLeft;
    }

    endGame() {
        this.isGameOver = true;
        clearInterval(this.gameTimer);
        clearInterval(this.circleGenerator);
        
        // 计算各项统计指标
        const circleAccuracy = this.totalCircles > 0 ? (this.hitCircles / this.totalCircles * 100).toFixed(1) : 0;
        const missRate = this.totalClicks > 0 ? (this.missClicks / this.totalClicks * 100).toFixed(1) : 0;
        
        // 重新设计反应力指标
        let reactionPower = 0;
        let reactionLabel = "一般";
        
        if (this.hitCircles > 0) {
            // 计算平均反应系数 (1.0-5.0之间的值)
            const totalMultiplier = this.ultraFastHits * 5 + this.fastHits * 2 + this.normalHits * 1;
            const avgMultiplier = totalMultiplier / this.hitCircles;
            
            // 将平均反应系数映射到0-100的范围
            // 1.0 -> 0, 3.0 -> 50, 5.0 -> 100
            reactionPower = ((avgMultiplier - 1) / 4 * 100).toFixed(1);
            
            // 根据反应力给出评级
            if (avgMultiplier >= 4.5) {
                reactionLabel = "神级";
            } else if (avgMultiplier >= 3.5) {
                reactionLabel = "超神";
            } else if (avgMultiplier >= 2.5) {
                reactionLabel = "极速";
            } else if (avgMultiplier >= 1.5) {
                reactionLabel = "快速";
            } else {
                reactionLabel = "一般";
            }
        }
        
        // 创建详细统计信息
        const gameOver = document.querySelector('.game-over');
        
        // 更新最终得分
        const finalScore = gameOver.querySelector('.final-score');
        finalScore.textContent = `${this.score}${this.scoreUnit}`;
        
        // 移除现有的统计信息（如果有）
        const existingStats = gameOver.querySelectorAll('.game-stats');
        existingStats.forEach(stat => stat.remove());
        
        // 添加新的统计信息
        const statsContainer = document.createElement('div');
        statsContainer.className = 'game-stats';
        statsContainer.innerHTML = `
            <div class="stats-row">
                <div class="stat-item">
                    <div class="stat-label"><i class="stat-icon">🎯</i>准确度</div>
                    <div class="stat-value">${circleAccuracy}%</div>
                    <div class="stat-detail">命中 ${this.hitCircles} / 总计 ${this.totalCircles}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label"><i class="stat-icon">❌</i>失误率</div>
                    <div class="stat-value">${missRate}%</div>
                    <div class="stat-detail">失误 ${this.missClicks} / 点击 ${this.totalClicks}</div>
                </div>
            </div>
            <div class="stats-row">
                <div class="stat-item">
                    <div class="stat-label"><i class="stat-icon">⚡</i>反应力</div>
                    <div class="stat-value">${reactionPower}% <span class="reaction-label">${reactionLabel}</span></div>
                    <div class="stat-detail">
                        极速: ${this.ultraFastHits} | 快速: ${this.fastHits} | 普通: ${this.normalHits}
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-label"><i class="stat-icon">🔥</i>最大连击</div>
                    <div class="stat-value">${this.maxCombo}</div>
                </div>
            </div>
        `;
        
        // 在重试按钮前插入统计信息
        gameOver.insertBefore(statsContainer, gameOver.querySelector('.retry-button'));
        
        gameOver.style.display = 'block';
    }

    addCircle() {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            const x = this.maxRadius * this.scale + 
                     Math.random() * (this.canvas.width - 2 * this.maxRadius * this.scale);
            const y = this.maxRadius * this.scale + 
                     Math.random() * (this.canvas.height - 2 * this.maxRadius * this.scale);
            
            const newCircle = new Circle(x, y, this.initialRadius * this.scale);
            newCircle.maxRadius = this.maxRadius * this.scale;
            newCircle.growthRate = 20 * this.scale;
            
            let hasOverlap = false;
            for (const existingCircle of this.circles) {
                if (newCircle.isOverlapping(existingCircle)) {
                    hasOverlap = true;
                    break;
                }
            }
            
            if (!hasOverlap) {
                this.circles.push(newCircle);
                this.totalCircles++;
                return true;
            }
            
            attempts++;
        }
        
        return false;
    }

    createExplosion(x, y, isSuccess) {
        const particleCount = isSuccess ? 20 : 10; // 减少粒子数量
        const colors = isSuccess ? 
            ['#a8e6cf', '#1abc9c', '#d4fc79', '#96e6a1'] :  // 更柔和的成功颜色
            ['#fab1a0', '#ff7675', '#ffb8b8', '#ffd8d8'];   // 更柔和的失败颜色

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = isSuccess ? 4 : 3; // 降低粒子速度
            const life = isSuccess ? 800 : 600; // 缩短生命周期
            
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * velocity * (0.8 + Math.random() * 0.4),
                vy: Math.sin(angle) * velocity * (0.8 + Math.random() * 0.4),
                radius: isSuccess ? 2 : 1.5, // 减小粒子大小
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 0.8, // 降低初始透明度
                life,
                createdAt: Date.now()
            });
        }

        // 添加闪光效果
        if (isSuccess) {
            for (let i = 0; i < 5; i++) {
                this.sparkles.push({
                    x,
                    y,
                    size: 20 + Math.random() * 20,
                    alpha: 1,
                    createdAt: Date.now(),
                    life: 500
                });
            }
        }
    }

    createCrosshair() {
        this.crosshairSize = 20;
        this.crosshairColor = '#3498db';
        this.crosshairWidth = 2;
        this.crosshairGap = 5;
    }

    drawCrosshair() {
        const { ctx, mouseX, mouseY, crosshairSize, crosshairGap, crosshairWidth } = this;
        ctx.strokeStyle = this.crosshairColor;
        ctx.lineWidth = crosshairWidth;

        // 绘制准星
        ctx.beginPath();
        // 上
        ctx.moveTo(mouseX, mouseY - crosshairGap);
        ctx.lineTo(mouseX, mouseY - crosshairSize);
        // 下
        ctx.moveTo(mouseX, mouseY + crosshairGap);
        ctx.lineTo(mouseX, mouseY + crosshairSize);
        // 左
        ctx.moveTo(mouseX - crosshairGap, mouseY);
        ctx.lineTo(mouseX - crosshairSize, mouseY);
        // 右
        ctx.moveTo(mouseX + crosshairGap, mouseY);
        ctx.lineTo(mouseX + crosshairSize, mouseY);
        
        // 绘制中心点
        ctx.arc(mouseX, mouseY, 2, 0, Math.PI * 2);
        
        ctx.stroke();
    }

    createHitMarker(x, y, isSuccess) {
        this.hitMarkers.push({
            x,
            y,
            createdAt: Date.now(),
            life: 500,
            isSuccess
        });
    }

    drawHitMarkers() {
        const now = Date.now();
        this.hitMarkers = this.hitMarkers.filter(marker => {
            const age = now - marker.createdAt;
            if (age >= marker.life) return false;

            const progress = age / marker.life;
            const size = 20 * (1 - progress);
            const alpha = 1 - progress;
            const color = marker.isSuccess ? '#2ecc71' : '#e74c3c';

            this.ctx.strokeStyle = `rgba(${this.hexToRgb(color)}, ${alpha})`;
            this.ctx.lineWidth = 2;

            this.ctx.beginPath();
            // 绘制 X 形状
            this.ctx.moveTo(marker.x - size, marker.y - size);
            this.ctx.lineTo(marker.x + size, marker.y + size);
            this.ctx.moveTo(marker.x + size, marker.y - size);
            this.ctx.lineTo(marker.x - size, marker.y + size);
            this.ctx.stroke();

            return true;
        });
    }

    createFloatingScore(x, y, score, accuracy = "", timeBonus = "") {
        const color = score > 0 ? this.scoreColors.hit : this.scoreColors.miss;
        // 添加 Pt 单位到分数显示
        const text = score > 0 ? `+${score}${this.scoreUnit}` : `${score}${this.scoreUnit}`;
        
        this.floatingScores.push({
            x,
            y,
            text,
            accuracy,
            timeBonus,
            color,
            alpha: 1,
            scale: 1,
            createdAt: Date.now(),
            life: 1000,
            initialY: y,
            isCombo: false
        });
    }

    drawFloatingScores() {
        const now = Date.now();
        
        this.floatingScores = this.floatingScores.filter(score => {
            const age = now - score.createdAt;
            if (age >= score.life) return false;

            const progress = age / score.life;
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            
            if (score.isCombo) {
                // 连击文字使用特殊动画
                score.y = score.initialY - (20 * Math.sin(progress * Math.PI));
                score.alpha = Math.sin(Math.PI * (1 - progress));
                score.scale = 1.5 + (Math.sin(progress * Math.PI) * 0.5);
            } else {
                // 普通分数动画
                score.y = score.initialY - (50 * easeOutCubic);
                score.alpha = 1 - easeOutCubic;
                score.scale = 1 + (0.3 * (1 - easeOutCubic));
            }

            this.ctx.save();
            this.ctx.translate(score.x, score.y);
            this.ctx.scale(score.scale, score.scale);
            
            // 设置文字样式
            this.ctx.font = score.isCombo ? 'bold 32px Arial' : 'bold 24px Arial';
            this.ctx.fillStyle = `rgba(${this.hexToRgb(score.color)}, ${score.alpha})`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // 为连击文字添加特殊效果
            if (score.isCombo) {
                this.ctx.shadowColor = 'rgba(255, 217, 61, 0.5)';
                this.ctx.shadowBlur = 10;
            } else {
                this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
                this.ctx.shadowBlur = 4;
            }
            
            this.ctx.fillText(score.text, 0, 0);
            
            // 如果有精度文本，显示在分数下方
            if (score.accuracy && score.accuracy !== "") {
                this.ctx.font = 'bold 16px Arial';
                this.ctx.fillStyle = this.getAccuracyTextColor(score.accuracy, score.alpha);
                this.ctx.fillText(score.accuracy.toUpperCase(), 0, 20);
            }
            
            // 如果有时间奖励文本，显示在精度文本下方或分数下方
            if (score.timeBonus && score.timeBonus !== "") {
                this.ctx.font = 'bold 16px Arial';
                this.ctx.fillStyle = `rgba(255, 165, 0, ${score.alpha})`;  // 橙色
                this.ctx.fillText(score.timeBonus, 0, score.accuracy ? 40 : 20);
            }
            
            this.ctx.restore();
            
            return true;
        });
    }

    handleClick(e) {
        if (this.isGameOver || !this.isGameStarted) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.createRecoilEffect();
        this.totalClicks++; // 增加总点击次数
        
        let hit = false;
        let hitScore = 0;
        let hitAccuracy = "";
        let timeBonus = "";
        let timeMultiplier = 1;
        
        for (const circle of this.circles) {
            if (!circle.isClicked && circle.checkClick(x, y)) {
                hit = true;
                circle.isClicked = true;
                circle.clickAnimationStart = Date.now();
                
                // 计算得分和精度
                const result = circle.calculateScore(x, y);
                hitScore = result.score;
                hitAccuracy = result.accuracy;
                timeBonus = result.timeBonus;
                timeMultiplier = result.timeMultiplier;
                
                // 更新命中统计
                this.hitCircles++;
                
                // 更新反应力统计
                if (timeMultiplier === 5) {
                    this.ultraFastHits++;
                } else if (timeMultiplier === 2) {
                    this.fastHits++;
                } else {
                    this.normalHits++;
                }
                
                this.updateScore(hitScore);
                this.createFloatingScore(x, y, hitScore, hitAccuracy, timeBonus);
                this.createExplosion(x, y, true);
                this.createHitMarker(x, y, true);
                break;
            }
        }
        
        this.updateAccuracy(hit);
        
        if (hit) {
            // 只在命中时更新连击显示位置
            this.updateCombo(true);
            this.updateComboDisplay(x, y);
        } else {
            this.missClicks++; // 增加无效点击次数
            this.updateCombo(false);
            this.updateScore(-200);
            this.createFloatingScore(x, y, -200);
            this.createExplosion(x, y, false);
            this.createHitMarker(x, y, false);
        }
    }

    createRecoilEffect() {
        // 模拟后坐力效果
        this.crosshairSize *= 1.5;
        setTimeout(() => {
            this.crosshairSize = 20;
        }, 100);
    }

    drawParticles() {
        const now = Date.now();
        
        this.particles = this.particles.filter(particle => {
            const age = now - particle.createdAt;
            if (age >= particle.life) return false;

            const progress = age / particle.life;
            particle.alpha = 0.8 * (1 - progress); // 更平滑的淡出效果
            
            // 使用缓动函数使运动更自然
            const easeOut = 1 - Math.pow(1 - progress, 3);
            particle.x += particle.vx * (1 - easeOut);
            particle.y += particle.vy * (1 - easeOut);

            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${this.hexToRgb(particle.color)},${particle.alpha})`;
            this.ctx.fill();
            return true;
        });

        // 绘制闪光
        this.sparkles = this.sparkles.filter(sparkle => {
            const age = now - sparkle.createdAt;
            if (age >= sparkle.life) return false;

            const progress = age / sparkle.life;
            sparkle.alpha = 1 - progress;
            sparkle.size *= 0.95;

            this.ctx.save();
            this.ctx.translate(sparkle.x, sparkle.y);
            this.ctx.rotate(progress * Math.PI);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${sparkle.alpha})`;
            
            // 绘制星形闪光
            this.drawStar(0, 0, 5, sparkle.size / 2, sparkle.size / 4);
            
            this.ctx.restore();
            return true;
        });
    }

    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }

        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
        this.ctx.fill();
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
            '255, 255, 255';
    }

    gameLoop() {
        if (this.isGameOver) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格背景
        this.drawGrid();
        
        // 绘制所有圆形并检测超时
        const circlesBeforeUpdate = this.circles.length;
        this.circles = this.circles.filter(circle => {
            const isVisible = circle.draw(this.ctx);
            
            // 如果圆形消失了，并且是因为超时（而不是被点击）
            if (!isVisible && circle.isTimedOut && !circle.isClicked) {
                // 扣除100分
                this.updateScore(-100);
                
                // 更新未命中圆形统计
                this.missedCircles++;
                
                // 在圆形位置创建一个负分的浮动文本
                this.createFloatingScore(circle.x, circle.y, -100, "miss");
                
                // 创建一个失败的爆炸效果
                this.createExplosion(circle.x, circle.y, false);
                
                // 重置连击
                this.updateCombo(false);
                
                // 更新精准度统计（算作未命中）
                this.updateAccuracy(false);
            }
            
            return isVisible;
        });
        
        // 绘制粒子效果
        this.drawParticles();
        
        // 绘制命中标记
        this.drawHitMarkers();
        
        // 绘制浮动分数
        this.drawFloatingScores();
        
        // 绘制连击显示
        this.drawComboDisplay();
        
        // 绘制准星
        this.drawCrosshair();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    drawGrid() {
        const gridSize = 30;
        const alpha = 0.1;
        
        this.ctx.strokeStyle = `rgba(52, 152, 219, ${alpha})`;
        this.ctx.lineWidth = 1;

        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    handleResize() {
        // 检查是否小于最小尺寸
        const windowTooSmall = window.innerWidth < this.minWidth || window.innerHeight < this.minHeight;
        
        if (windowTooSmall) {
            // 如果太小，直接显示警告并重置游戏
            this.sizeWarning.style.display = 'flex';
            wrapper.style.display = 'none';
            this.isTooSmall = true;
            
            if (this.isGameStarted) {
                this.pauseGame();
            }
        } else {
            this.sizeWarning.style.display = 'none';
            wrapper.style.display = 'flex';
            this.isTooSmall = false;
            
            if (this.isGameStarted && this.isPaused) {
                this.resumeGame();
            }
        }
    }

    showResizeConfirmation() {
        // 创建确认对话框（如果不存在）
        if (!this.resizeConfirm) {
            this.resizeConfirm = document.createElement('div');
            this.resizeConfirm.className = 'resize-confirmation';
            this.resizeConfirm.innerHTML = `
                <div class="confirmation-content">
                    <h3>窗口大小已改变</h3>
                    <p>为了确保最佳游戏体验，需要重新开始游戏。</p>
                    <button class="confirm-button">确认</button>
                </div>
            `;
            document.body.appendChild(this.resizeConfirm);

            // 添加确认按钮事件
            this.resizeConfirm.querySelector('.confirm-button').addEventListener('click', () => {
                this.hideResizeConfirmation();
                this.resetGame();
            });
        }

        // 显示确认对话框
        this.resizeConfirm.style.display = 'flex';
    }

    hideResizeConfirmation() {
        if (this.resizeConfirm) {
            this.resizeConfirm.style.display = 'none';
        }
    }

    resetGame() {
        // 停止所有计时器
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            clearInterval(this.circleGenerator);
        }

        // 重置游戏状态
        this.isGameStarted = false;
        this.isGameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.timeLeft = 60;
        this.circles = [];
        this.particles = [];

        // 更新显示
        this.updateScore(0);
        this.updateTimer();

        // 显示开始屏幕
        this.startScreen.style.display = 'block';
        this.gameOverScreen.style.display = 'none';

        // 重新调整画布大小
        if (!this.isTooSmall) {
            this.resizeCanvas();
        }

        // 重置精准度统计
        this.totalShots = 0;
        this.hitShots = 0;
        this.accuracy = 0;
        document.getElementById('accuracyDisplay').textContent = '0%';
        document.querySelector('.accuracy-details').textContent = '命中: 0 | 失误: 0';
        document.getElementById('accuracyDisplay').style.color = '#3498db';
        
        // 清除浮动分数
        this.floatingScores = [];
        
        // 重置连击相关数据
        this.combo = 0;
        this.maxCombo = 0;
        this.lastHitTime = 0;
        
        // 重置连击显示
        this.updateComboDisplay();
        this.fadeOutComboDisplay();
        
        // 重置分数显示时添加单位
        document.getElementById('scoreDisplay').textContent = `0${this.scoreUnit}`;
    }

    updateAccuracy(isHit) {
        this.totalShots++;
        if (isHit) {
            this.hitShots++;
        }
        
        // 计算精准度
        this.accuracy = (this.hitShots / this.totalShots) * 100;
        
        // 更新显示
        const accuracyDisplay = document.getElementById('accuracyDisplay');
        const accuracyDetails = document.querySelector('.accuracy-details');
        
        accuracyDisplay.textContent = `${this.accuracy.toFixed(1)}%`;
        accuracyDetails.textContent = `命中: ${this.hitShots} | 失误: ${this.totalShots - this.hitShots}`;
        
        // 根据精准度改变颜色
        accuracyDisplay.style.color = this.getAccuracyColor(this.accuracy);
    }

    getAccuracyColor(accuracy) {
        if (accuracy >= 80) return '#2ecc71'; // 绿色 - 优秀
        if (accuracy >= 60) return '#3498db'; // 蓝色 - 良好
        if (accuracy >= 40) return '#f1c40f'; // 黄色 - 一般
        return '#e74c3c'; // 红色 - 需要提升
    }

    updateCombo(isHit) {
        const now = Date.now();
        
        if (isHit) {
            if (now - this.lastHitTime <= this.comboTimeout) {
                this.combo++;
            } else {
                this.combo = 1;
            }
            this.lastHitTime = now;
            
            if (this.combo > this.maxCombo) {
                this.maxCombo = this.combo;
            }
            
            // 更新连击显示位置和动画
            this.updateComboDisplay();
            
            // 如果连击达到特定数值，显示特殊效果
            if (this.combo >= 5) {
                this.createComboEffect();
            }
        } else {
            // 失误时渐隐连击显示
            this.fadeOutComboDisplay();
            this.combo = 0;
        }
    }

    updateComboDisplay(clickX, clickY) {
        // 在点击位置显示连击
        this.comboDisplay.x = clickX + this.comboDisplay.offsetX;
        this.comboDisplay.y = clickY + this.comboDisplay.offsetY;
        
        // 确保不超出画布边界
        const padding = 50;
        this.comboDisplay.x = Math.min(Math.max(this.comboDisplay.x, padding), 
                                     this.canvas.width - padding);
        this.comboDisplay.y = Math.min(Math.max(this.comboDisplay.y, padding), 
                                     this.canvas.height - padding);
        
        this.comboDisplay.scale = 1.5;
        this.comboDisplay.alpha = 1;
        this.comboDisplay.pulsePhase = 0;
    }

    fadeOutComboDisplay() {
        this.comboDisplay.alpha = 0;
    }

    createComboEffect() {
        const comboText = this.combo >= 10 ? 
            `超神! x${this.combo}` : 
            `连击 x${this.combo}`;
            
        this.floatingScores.push({
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            text: comboText,
            color: this.scoreColors.combo,
            alpha: 1,
            scale: 1.5,
            createdAt: Date.now(),
            life: 1000,
            initialY: this.canvas.height / 2,
            isCombo: true
        });
    }

    drawComboDisplay() {
        if (this.combo < 2 || this.comboDisplay.alpha <= 0) return;

        const { x, y, scale, alpha } = this.comboDisplay;
        
        // 更新脉动动画
        this.comboDisplay.pulsePhase += 0.1;
        const pulseFactor = 1 + Math.sin(this.comboDisplay.pulsePhase) * 0.1;
        
        this.ctx.save();
        
        // 设置文字样式
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // 获取连击等级颜色
        const comboColor = this.getComboColor(this.combo);
        
        // 绘制连击数
        this.ctx.font = `bold ${36 * scale * pulseFactor}px Arial`;
        this.ctx.fillStyle = `rgba(${this.hexToRgb(comboColor)}, ${alpha})`;
        this.ctx.shadowColor = comboColor;
        this.ctx.shadowBlur = 15;
        this.ctx.fillText(`${this.combo}`, x, y);
        
        // 绘制 "COMBO" 文字
        this.ctx.font = `bold ${18 * scale}px Arial`;
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 8;
        this.ctx.fillText('COMBO', x, y + 25);
        
        // 如果连击数足够高，添加特效
        if (this.combo >= 10) {
            this.drawComboEffects(x, y, scale, alpha, pulseFactor);
        }
        
        this.ctx.restore();
        
        // 逐渐淡出
        this.comboDisplay.alpha -= 0.015;  // 调整淡出速度
    }

    drawComboEffects(x, y, scale, alpha, pulseFactor) {
        // 绘制光环效果
        this.ctx.beginPath();
        const gradient = this.ctx.createRadialGradient(
            x, y, 0,
            x, y, 60 * scale * pulseFactor
        );
        gradient.addColorStop(0, `rgba(${this.hexToRgb(this.getComboColor(this.combo))}, 0)`);
        gradient.addColorStop(0.5, `rgba(${this.hexToRgb(this.getComboColor(this.combo))}, ${alpha * 0.1})`);
        gradient.addColorStop(1, `rgba(${this.hexToRgb(this.getComboColor(this.combo))}, 0)`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.arc(x, y, 60 * scale * pulseFactor, 0, Math.PI * 2);
        this.ctx.fill();
    }

    getComboColor(combo) {
        if (combo >= 20) return '#e74c3c';      // 红色
        if (combo >= 15) return '#e67e22';      // 橙色
        if (combo >= 10) return '#f1c40f';      // 黄色
        if (combo >= 5)  return '#3498db';      // 蓝色
        return '#95a5a6';                       // 默认灰色
    }

    // 添加一个方法来获取精度文本的颜色
    getAccuracyTextColor(accuracy, alpha) {
        const colors = {
            perfect: `rgba(255, 215, 0, ${alpha})`,    // 金色
            great: `rgba(0, 191, 255, ${alpha})`,      // 深天蓝
            good: `rgba(50, 205, 50, ${alpha})`,       // 酸橙绿
            ok: `rgba(255, 255, 255, ${alpha})`        // 白色
        };
        
        return colors[accuracy] || `rgba(255, 255, 255, ${alpha})`;
    }
}

// 启动游戏
window.onload = () => {
    new Game();
};

function startCountdown() {
    const countdownElement = document.querySelector('.countdown');
    let count = 3;
    
    // 显示倒计时元素
    countdownElement.textContent = count;
    countdownElement.classList.add('show');
    
    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownElement.textContent = count;
        } else {
            // 倒计时结束
            clearInterval(countdownInterval);
            countdownElement.classList.remove('show');
            // 这里开始真正的游戏
            startGame();
        }
    }, 1000);
}

// 修改原来的开始游戏事件处理
document.querySelector('.start-button').addEventListener('click', () => {
    document.querySelector('.start-screen').style.display = 'none';
    startCountdown(); // 先开始倒计时，而不是直接开始游戏
}); 