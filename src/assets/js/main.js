document.addEventListener('DOMContentLoaded', () => {
    // 导航栏滚动效果
    const nav = document.querySelector('.nav');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
        lastScrollY = window.scrollY;
    });

    // 漫画轮播功能
    const sliderTrack = document.querySelector('.slider-track');
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = 1; // 从中间的slide开始
    let autoSlideInterval;
    let startX;
    let isDragging = false;
    let currentTranslate = 0;
    let prevTranslate = 0;

    // 初始化轮播位置
    updateSlidePosition();

    // 自动轮播
    startAutoSlide();

    // 点击圆点切换
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            updateSlidePosition();
            updateDots();
            resetAutoSlide();
        });
    });

    // 触摸事件处理
    sliderTrack.addEventListener('touchstart', touchStart);
    sliderTrack.addEventListener('touchmove', touchMove);
    sliderTrack.addEventListener('touchend', touchEnd);

    // 鼠标事件处理
    sliderTrack.addEventListener('mousedown', touchStart);
    sliderTrack.addEventListener('mousemove', touchMove);
    sliderTrack.addEventListener('mouseup', touchEnd);
    sliderTrack.addEventListener('mouseleave', touchEnd);

    function touchStart(event) {
        isDragging = true;
        startX = getPositionX(event);
        sliderTrack.style.transition = 'none';
    }

    function touchMove(event) {
        if (!isDragging) return;
        const currentX = getPositionX(event);
        const diff = currentX - startX;
        currentTranslate = prevTranslate + diff;
        setSliderPosition(currentTranslate);
    }

    function touchEnd() {
        isDragging = false;
        const movedBy = currentTranslate - prevTranslate;

        // 判断滑动方向
        if (movedBy < -100 && currentSlide < slides.length - 1) {
            currentSlide += 1;
        } else if (movedBy > 100 && currentSlide > 0) {
            currentSlide -= 1;
        }

        updateSlidePosition();
        updateDots();
        resetAutoSlide();
    }

    function getPositionX(event) {
        return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
    }

    function updateSlidePosition() {
        const slideWidth = slides[0].offsetWidth;
        currentTranslate = -currentSlide * slideWidth;
        prevTranslate = currentTranslate;
        setSliderPosition(currentTranslate);
    }

    function setSliderPosition(position) {
        sliderTrack.style.transform = `translateX(${position}px)`;
    }

    function updateDots() {
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }

    function startAutoSlide() {
        autoSlideInterval = setInterval(() => {
            currentSlide = (currentSlide + 1) % slides.length;
            updateSlidePosition();
            updateDots();
        }, 5000); // 每5秒切换一次
    }

    function resetAutoSlide() {
        clearInterval(autoSlideInterval);
        startAutoSlide();
    }

    // 数字增长动画
    const statItems = document.querySelectorAll('.stat-item h3');
    const observerOptions = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const finalValue = parseInt(target.textContent.replace(/[^0-9]/g, ''));
                animateValue(target, 0, finalValue, 2000);
                observer.unobserve(target);
            }
        });
    }, observerOptions);

    statItems.forEach(item => observer.observe(item));

    function animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const current = Math.floor(progress * (end - start) + start);
            
            // 添加单位（如果有）
            if (element.textContent.includes('亿')) {
                element.textContent = current.toFixed(2) + '亿';
            } else if (element.textContent.includes('万')) {
                element.textContent = current + '万';
            } else {
                element.textContent = current;
            }

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // 页面滚动动画
    const sections = document.querySelectorAll('section');
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });

    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(50px)';
        section.style.transition = 'all 0.8s ease-out';
        sectionObserver.observe(section);
    });

    // 数字动画函数
    function animateNumbers() {
        const numberElements = document.querySelectorAll('.animate-number');
        
        // 检查是否有元素需要动画
        if (numberElements.length === 0) {
            console.warn('No .animate-number elements found');
            return;
        }
        
        const options = {
            threshold: 0.1 // 元素10%可见时触发
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // 当元素进入视口时
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const targetAttr = element.getAttribute('data-target');
                    
                    // 验证data-target是否存在
                    if (!targetAttr) {
                        console.warn('Missing data-target attribute on:', element);
                        return;
                    }
                    
                    const target = parseFloat(targetAttr);
                    const suffix = element.getAttribute('data-suffix') || '';
                    const duration = 2000; // 动画持续时间，单位毫秒
                    
                    // 计算小数位数
                    let decimals = 0;
                    if (targetAttr.includes('.')) {
                        decimals = targetAttr.split('.')[1].length;
                    }
                    
                    const startTime = performance.now();
                    let frameId = null;
                    
                    // 创建动画
                    function updateNumber(currentTime) {
                        const elapsedTime = currentTime - startTime;
                        
                        if (elapsedTime < duration) {
                            // 使用easeOutExpo缓动函数使动画更平滑
                            const progress = 1 - Math.pow(1 - elapsedTime / duration, 4);
                            const currentValue = progress * target;
                            
                            // 格式化数字，保留小数位
                            element.textContent = currentValue.toFixed(decimals) + suffix;
                            
                            frameId = requestAnimationFrame(updateNumber);
                        } else {
                            // 动画结束，设置最终值
                            element.textContent = target.toFixed(decimals) + suffix;
                            cancelAnimationFrame(frameId);
                        }
                    }
                    
                    // 使用try-catch捕获可能的错误
                    try {
                        frameId = requestAnimationFrame(updateNumber);
                    } catch (err) {
                        console.error('Animation error:', err);
                        // 回退到直接设置最终值
                        element.textContent = target.toFixed(decimals) + suffix;
                    }
                    
                    // 停止观察这个元素
                    observer.unobserve(element);
                }
            });
        }, options);
        
        // 开始观察所有数字元素
        numberElements.forEach(element => {
            observer.observe(element);
        });
        
        console.log('Number animation initialized for', numberElements.length, 'elements');
    }

    // 确保DOM加载完成后初始化动画
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM fully loaded, initializing animations');
        animateNumbers();
    });

    // 初始化后的一段时间再次检查，以防初始化时出现问题
    setTimeout(function() {
        const animated = document.querySelectorAll('.animate-number');
        const notStarted = Array.from(animated).filter(el => el.textContent === '0');
        
        if (notStarted.length > 0) {
            console.warn('Some animations did not start, retrying...', notStarted.length);
            animateNumbers();
        }
    }, 2000);

    // 添加轮播图功能
    function initCarousels() {
        // 初始化所有轮播图
        const carousels = document.querySelectorAll('.branch-carousel');
        
        carousels.forEach(carousel => {
            const track = carousel.querySelector('.carousel-track');
            const slides = carousel.querySelectorAll('.carousel-slide');
            const dots = carousel.querySelectorAll('.carousel-dot');
            const prevBtn = carousel.querySelector('.carousel-arrow.prev');
            const nextBtn = carousel.querySelector('.carousel-arrow.next');
            
            let currentIndex = 0;
            const slideCount = slides.length;
            
            // 设置轮播图宽度
            track.style.width = slideCount * 100 + '%';
            slides.forEach(slide => {
                slide.style.width = (100 / slideCount) + '%';
            });
            
            // 更新轮播图位置
            function updateCarousel() {
                track.style.transform = `translateX(-${currentIndex * (100 / slideCount)}%)`;
                
                // 更新指示点
                dots.forEach((dot, index) => {
                    dot.classList.toggle('active', index === currentIndex);
                });
            }
            
            // 切换到下一张
            function nextSlide() {
                currentIndex = (currentIndex + 1) % slideCount;
                updateCarousel();
            }
            
            // 切换到上一张
            function prevSlide() {
                currentIndex = (currentIndex - 1 + slideCount) % slideCount;
                updateCarousel();
            }
            
            // 点击指示点切换
            dots.forEach((dot, index) => {
                dot.addEventListener('click', () => {
                    currentIndex = index;
                    updateCarousel();
                });
            });
            
            // 按钮事件
            if (prevBtn) prevBtn.addEventListener('click', prevSlide);
            if (nextBtn) nextBtn.addEventListener('click', nextSlide);
            
            // 自动轮播
            let interval = setInterval(nextSlide, 5000);
            
            // 鼠标悬停暂停
            carousel.addEventListener('mouseenter', () => {
                clearInterval(interval);
            });
            
            // 鼠标离开继续
            carousel.addEventListener('mouseleave', () => {
                interval = setInterval(nextSlide, 5000);
            });
            
            // 初始化
            updateCarousel();
        });
    }

    // 确保DOM加载完成后初始化轮播图
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM fully loaded, initializing carousels');
        initCarousels();
    });

    // 初始化后的一段时间再次检查，以防初始化时出现问题
    setTimeout(function() {
        const carousels = document.querySelectorAll('.branch-carousel');
        const notStarted = Array.from(carousels).filter(el => el.style.transform === 'translateX(0%)');
        
        if (notStarted.length > 0) {
            console.warn('Some carousels did not start, retrying...', notStarted.length);
            initCarousels();
        }
    }, 2000);

    // 鼠标移动光效
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        
        document.documentElement.style.setProperty('--mouse-x', `${x}%`);
        document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    });

    // 优化性能：使用 requestAnimationFrame
    let ticking = false;
    document.addEventListener('mousemove', (e) => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const x = (e.clientX / window.innerWidth) * 100;
                const y = (e.clientY / window.innerHeight) * 100;
                
                document.documentElement.style.setProperty('--mouse-x', `${x}%`);
                document.documentElement.style.setProperty('--mouse-y', `${y}%`);
                ticking = false;
            });
            ticking = true;
        }
    });
}); 