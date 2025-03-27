// 游戏数据管理
class GameDataManager {
    constructor() {
        this.games = {
            reactiontest: {
                name: '反应速度测试',
                bestScore: '0.185s',
                totalTests: 12,
                history: [
                    { score: '0.185s', date: '2024-03-15' },
                    { score: '0.192s', date: '2024-03-14' },
                    { score: '0.201s', date: '2024-03-13' }
                ]
            },
            trackingtest: {
                name: '目标追踪测试',
                bestScore: '89%',
                totalTests: 8,
                history: [
                    { score: '89%', date: '2024-03-15' },
                    { score: '85%', date: '2024-03-14' },
                    { score: '82%', date: '2024-03-13' }
                ]
            },
            shootgame: {
                name: '精准射击测试',
                bestScore: '92%',
                totalTests: 15,
                history: [
                    { score: '92%', date: '2024-03-15' },
                    { score: '88%', date: '2024-03-14' },
                    { score: '85%', date: '2024-03-13' }
                ]
            },
            matchgame: {
                name: '记忆力测试',
                bestScore: '8',
                totalTests: 6,
                history: [
                    { score: '8', date: '2024-03-15' },
                    { score: '7', date: '2024-03-14' },
                    { score: '6', date: '2024-03-13' }
                ]
            },
            multitask: {
                name: '多任务处理测试',
                bestScore: '76分',
                totalTests: 4,
                history: [
                    { score: '76分', date: '2024-03-15' },
                    { score: '70分', date: '2024-03-14' },
                    { score: '65分', date: '2024-03-13' }
                ]
            },
            strategy: {
                name: '策略决策测试',
                bestScore: '85分',
                totalTests: 7,
                history: [
                    { score: '85分', date: '2024-03-15' },
                    { score: '82分', date: '2024-03-14' },
                    { score: '78分', date: '2024-03-13' }
                ]
            }
        };
    }

    // 获取游戏数据
    getGameData(gameId) {
        return this.games[gameId] || null;
    }

    // 更新游戏数据
    updateGameData(gameId, newScore) {
        if (this.games[gameId]) {
            const game = this.games[gameId];
            game.totalTests++;
            game.history.unshift({
                score: newScore,
                date: new Date().toISOString().split('T')[0]
            });
            game.history = game.history.slice(0, 10); // 只保留最近10条记录
            
            // 更新最佳分数（根据游戏类型判断）
            if (this.isNewBestScore(gameId, newScore, game.bestScore)) {
                game.bestScore = newScore;
            }
        }
    }

    // 判断是否为新的最佳分数
    isNewBestScore(gameId, newScore, bestScore) {
        // 移除单位后比较数值
        const newValue = parseFloat(newScore.replace(/[^0-9.]/g, ''));
        const bestValue = parseFloat(bestScore.replace(/[^0-9.]/g, ''));
        
        // 反应速度测试是越小越好，其他是越大越好
        if (gameId === 'reactiontest') {
            return newValue < bestValue;
        }
        return newValue > bestValue;
    }
}

// 历史记录弹窗管理
class HistoryModal {
    constructor() {
        this.createModal();
        this.gameDataManager = new GameDataManager();
    }

    createModal() {
        const modal = document.createElement('div');
        modal.className = 'history-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">历史记录</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="history-list"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // 添加关闭事件
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.hideModal();
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });

        this.modal = modal;
    }

    showModal(gameId) {
        const gameData = this.gameDataManager.getGameData(gameId);
        if (!gameData) return;

        const historyList = this.modal.querySelector('.history-list');
        historyList.innerHTML = gameData.history.map(record => `
            <div class="history-item">
                <span class="history-score">${record.score}</span>
                <span class="history-date">${record.date}</span>
            </div>
        `).join('');

        this.modal.querySelector('.modal-title').textContent = `${gameData.name} - 历史记录`;
        this.modal.classList.add('show');
    }

    hideModal() {
        this.modal.classList.remove('show');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    const historyModal = new HistoryModal();

    // 为所有历史记录按钮添加点击事件
    document.querySelectorAll('.history-button').forEach(button => {
        const gameCard = button.closest('.game-card');
        const gameLink = gameCard.querySelector('.start-button').getAttribute('href');
        const gameId = gameLink.split('/').pop().replace('index.html', '');

        button.addEventListener('click', () => {
            historyModal.showModal(gameId);
        });
    });
}); 