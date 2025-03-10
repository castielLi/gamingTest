// 登录模态框控制
window.showLoginModal = function() {
    const modal = document.getElementById('loginModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

window.closeLoginModal = function() {
    const modal = document.getElementById('loginModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// 注册模态框控制
window.showRegisterModal = function() {
    closeLoginModal();
    const modal = document.getElementById('registerModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

window.closeRegisterModal = function() {
    const modal = document.getElementById('registerModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// 登录表单处理
window.handleLogin = function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // TODO: 这里添加实际的登录逻辑
    console.log('Login attempt:', { username, password });

    // 模拟登录成功
    closeLoginModal();
    updateUserStatus(username);
    return false;
}

// 更新用户状态
window.updateUserStatus = function(username) {
    const userSection = document.querySelector('.user-section');
    userSection.innerHTML = `
        <div class="user-info">
            <span class="username">${username}</span>
            <button class="logout-btn" onclick="handleLogout()">退出</button>
        </div>
        <a href="views/games/shootgame/index.html" class="cta-button">开始测试</a>
    `;
}

// 退出登录
window.handleLogout = function() {
    const userSection = document.querySelector('.user-section');
    userSection.innerHTML = `
        <button class="login-btn" onclick="showLoginModal()">登录</button>
        <a href="views/games/shootgame/index.html" class="cta-button">开始测试</a>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    // 处理滚动动画
    const fadeElements = document.querySelectorAll('.fade-in');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const fadeObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeElements.forEach(element => {
        fadeObserver.observe(element);
    });

    // 处理导航栏
    let lastScrollY = window.scrollY;
    const nav = document.querySelector('.nav');

    const handleScroll = () => {
        const currentScrollY = window.scrollY;
        
        // 添加/移除背景色
        if (currentScrollY > 50) {
            nav.style.background = 'rgba(255, 255, 255, 0.9)';
        } else {
            nav.style.background = 'rgba(255, 255, 255, 0.8)';
        }
        
        lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);

    // 平滑滚动处理
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // 成功案例轮播
    const stories = [
        {
            name: "UZI：从网吧少年到电竞传奇",
            description: "简单的故事介绍，点击了解更多...",
            image: "path/to/uzi-image.jpg"
        },
        {
            name: "Faker：电竞界的天才少年",
            description: "简单的故事介绍，点击了解更多...",
            image: "path/to/faker-image.jpg"
        },
        {
            name: "JackeyLove：00后冠军选手",
            description: "简单的故事介绍，点击了解更多...",
            image: "path/to/jackeylove-image.jpg"
        }
    ];

    let currentStory = 0;
    const storyCard = document.querySelector('.story-card');
    const dots = document.querySelectorAll('.slider-dot');

    function updateStory(index) {
        // 更新故事内容
        const story = stories[index];
        storyCard.innerHTML = `
            <div class="story-image" style="background: #f5f5f7; display: flex; align-items: center; justify-content: center;">
                [等待添加：${story.name}照片]
            </div>
            <div class="story-content">
                <h3>${story.name}</h3>
                <p>${story.description}</p>
            </div>
        `;

        // 更新轮播点
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    // 自动轮播
    setInterval(() => {
        currentStory = (currentStory + 1) % stories.length;
        updateStory(currentStory);
    }, 5000);

    // 点击轮播点切换故事
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentStory = index;
            updateStory(currentStory);
        });
    });

    // 点击模态框外部关闭
    window.addEventListener('click', (event) => {
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');
        
        if (event.target === loginModal) {
            closeLoginModal();
        }
        if (event.target === registerModal) {
            closeRegisterModal();
        }
    });

    // 阻止模态框内部点击事件冒泡
    document.querySelectorAll('.modal-content').forEach(modal => {
        modal.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    });
}); 