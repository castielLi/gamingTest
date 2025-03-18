class MatchGame {
    constructor() {
        // 游戏配置
        this.config = {
            difficulties: {
                easy: {
                    gridSize: 4, // 4x4 网格
                    pairs: 8,    // 8对卡片
                    timeLimit: 90, // 90秒
                    symbols: ['🍎', '🍌', '🍒', '🍓', '🍊', '🍋', '🍍', '🥝', '🍇', '🍉', '🥭', '🍑']
                },
                medium: {
                    gridSize: 4, // 4x4 网格
                    pairs: 8,    // 8对卡片
                    timeLimit: 60, // 60秒
                    symbols: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮']
                },
                hard: {
                    gridSize: 6, // 6x6 网格
                    pairs: 18,   // 18对卡片
                    timeLimit: 120, // 120秒
                    symbols: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', 
                              '🚛', '🚜', '🛵', '🏍️', '🛺', '🚲', '🛴', '🚂', '✈️', '🚀', '🚁', '⛵']
                }
            },
            levels: 3, // 游戏总关卡数
            levelTimeBonus: 10 // 每关额外增加的时间（秒）
        };

        // 游戏状态
        this.currentDifficulty = 'medium';
        this.currentLevel = 1;
        this.timeLeft = 0;
        this.moves = 0;
        this.matchedPairs = 0;
        this.totalPairs = 0;
        this.isPlaying = false;
        this.timerInterval = null;
        this.flippedCards = [];
        this.canFlip = true;

        // DOM元素
        this.gameBoard = document.getElementById('gameBoard');
        this.startScreen = document.getElementById('startScreen');
        this.levelCompleteScreen = document.getElementById('levelComplete');
        this.startButton = document.getElementById('startButton');
        this.difficultyButtons = document.querySelectorAll('.difficulty-btn');
        this.currentLevelDisplay = document.getElementById('currentLevel');
        this.timeLeftDisplay = document.getElementById('timeLeft');
        this.movesDisplay = document.getElementById('moves');
        this.matchedDisplay = document.getElementById('matched');

        // 绑定事件
        this.startButton.addEventListener('click', () => this.startGame());
        this.difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => this.selectDifficulty(btn.dataset.difficulty));
        });

        // 初始化
        this.init();
    }

    init() {
        this.currentLevelDisplay.textContent = this.currentLevel;
        this.selectDifficulty('medium'); // 默认中等难度
    }

    selectDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        
        // 更新UI
        this.difficultyButtons.forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.difficulty === difficulty);
        });

        // 更新游戏板网格
        const gridSize = this.config.difficulties[difficulty].gridSize;
        this.gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        this.gameBoard.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
    }

    startGame() {
        // 重置游戏状态
        this.moves = 0;
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.canFlip = true;
        this.isPlaying = true;

        // 获取当前难度配置
        const diffConfig = this.config.difficulties[this.currentDifficulty];
        this.totalPairs = diffConfig.pairs;
        
        // 设置时间限制（基础时间 + 关卡奖励时间）
        this.timeLeft = diffConfig.timeLimit + (this.currentLevel - 1) * this.config.levelTimeBonus;
        
        // 更新UI
        this.startScreen.style.display = 'none';
        this.levelCompleteScreen.classList.remove('show');
        this.currentLevelDisplay.textContent = this.currentLevel;
        this.timeLeftDisplay.textContent = this.timeLeft;
        this.movesDisplay.textContent = this.moves;
        this.matchedDisplay.textContent = `0/${this.totalPairs}`;

        // 生成卡片
        this.generateCards();

        // 开始计时器
        this.startTimer();
    }

    generateCards() {
        // 清空游戏板
        this.gameBoard.innerHTML = '';
        
        // 获取当前难度配置
        const diffConfig = this.config.difficulties[this.currentDifficulty];
        const totalCards = diffConfig.pairs * 2;
        
        // 选择符号
        const selectedSymbols = this.shuffleArray([...diffConfig.symbols])
            .slice(0, diffConfig.pairs);
        
        // 创建卡片对
        let cards = [];
        selectedSymbols.forEach(symbol => {
            cards.push(symbol, symbol); // 每个符号添加两次
        });
        
        // 洗牌
        cards = this.shuffleArray(cards);
        
        // 创建卡片元素
        cards.forEach((symbol, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.cardIndex = index;
            card.dataset.symbol = symbol;
            
            const cardFront = document.createElement('div');
            cardFront.className = 'card-face card-front';
            cardFront.innerHTML = '?';
            
            const cardBack = document.createElement('div');
            cardBack.className = 'card-face card-back';
            cardBack.innerHTML = symbol;
            
            card.appendChild(cardFront);
            card.appendChild(cardBack);
            
            card.addEventListener('click', () => this.flipCard(card));
            
            this.gameBoard.appendChild(card);
        });
    }

    flipCard(card) {
        // 如果不能翻牌或者卡片已经匹配或者已经翻开，则返回
        if (!this.canFlip || card.classList.contains('matched') || card.classList.contains('flipped')) {
            return;
        }
        
        // 翻开卡片
        card.classList.add('flipped');
        this.flippedCards.push(card);
        
        // 如果翻开了两张卡片，检查是否匹配
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.movesDisplay.textContent = this.moves;
            this.canFlip = false;
            
            const [card1, card2] = this.flippedCards;
            
            if (card1.dataset.symbol === card2.dataset.symbol) {
                // 匹配成功
                setTimeout(() => {
                    card1.classList.add('matched');
                    card2.classList.add('matched');
                    this.flippedCards = [];
                    this.canFlip = true;
                    this.matchedPairs++;
                    this.matchedDisplay.textContent = `${this.matchedPairs}/${this.totalPairs}`;
                    
                    // 检查是否完成关卡
                    if (this.matchedPairs === this.totalPairs) {
                        this.levelComplete();
                    }
                }, 500);
            } else {
                // 不匹配，翻回去
                setTimeout(() => {
                    card1.classList.remove('flipped');
                    card2.classList.remove('flipped');
                    this.flippedCards = [];
                    this.canFlip = true;
                }, 1000);
            }
        }
    }

    startTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.timeLeftDisplay.textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                this.gameOver();
            }
        }, 1000);
    }

    levelComplete() {
        clearInterval(this.timerInterval);
        
        // 显示关卡完成提示
        this.levelCompleteScreen.classList.add('show');
        
        // 3秒后进入下一关或结束游戏
        setTimeout(() => {
            this.levelCompleteScreen.classList.remove('show');
            
            if (this.currentLevel < this.config.levels) {
                // 进入下一关
                this.currentLevel++;
                this.startGame();
            } else {
                // 游戏胜利
                this.gameWin();
            }
        }, 2000);
    }

    gameOver() {
        clearInterval(this.timerInterval);
        this.isPlaying = false;
        
        // 显示游戏结束界面
        this.startScreen.style.display = 'block';
        this.startScreen.querySelector('.game-title').textContent = '游戏结束';
        this.startScreen.querySelector('.game-instructions').innerHTML = `
            时间用尽！<br>
            你完成了 ${this.currentLevel - 1} 个关卡，匹配了 ${this.matchedPairs} 对卡片。<br>
            翻牌次数：${this.moves}<br>
            再来一次？
        `;
        this.startButton.textContent = '重新开始';
        
        // 重置游戏
        this.currentLevel = 1;
    }

    gameWin() {
        clearInterval(this.timerInterval);
        this.isPlaying = false;
        
        // 显示游戏胜利界面
        this.startScreen.style.display = 'block';
        this.startScreen.querySelector('.game-title').textContent = '恭喜！';
        this.startScreen.querySelector('.game-instructions').innerHTML = `
            你成功完成了所有 ${this.config.levels} 个关卡！<br>
            剩余时间：${this.timeLeft} 秒<br>
            总翻牌次数：${this.moves}<br>
            再来一次？
        `;
        this.startButton.textContent = '重新开始';
        
        // 重置游戏
        this.currentLevel = 1;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// 当页面加载完成时初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    new MatchGame();
});
