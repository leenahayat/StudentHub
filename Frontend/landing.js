
function createParticles() {
    const container = document.getElementById('particles-container');
    if (!container) {
        console.warn('⚠️ Particles container not found');
        return;
    }
    
    const particleCount = 60;
    const colors = ['purple', 'pink', 'blue', 'white'];
    
    container.innerHTML = '';
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        const size = Math.random() * 5 + 2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const duration = 15 + Math.random() * 25;
        const delay = Math.random() * 20;
        
        particle.className = `particle ${color}`;
        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
            opacity: ${0.1 + Math.random() * 0.3};
        `;
        
        container.appendChild(particle);
    }
    
    console.log('✨ ' + document.querySelectorAll('.particle').length + ' particles created');
}


function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    console.log('📊 Found ' + statNumbers.length + ' stats to animate');

    function animateNumber(element) {
        const target = parseInt(element.getAttribute('data-count'));
        const duration = 2000;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(easeOutCubic * target);

            if (target > 50) {
                element.textContent = current + '+';
            } else {
                element.textContent = current;
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                if (target > 50) {
                    element.textContent = target + '+';
                } else {
                    element.textContent = target;
                }
            }
        }

        requestAnimationFrame(update);
    }

    if (statNumbers.length > 0) {
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    console.log('👀 Stat visible, animating!');
                    animateNumber(element);
                    observer.unobserve(element);
                }
            });
        }, {
            threshold: 0.3
        });

        statNumbers.forEach(function(stat) {
            observer.observe(stat);
        });
        
        setTimeout(function() {
            statNumbers.forEach(function(stat) {
                const rect = stat.getBoundingClientRect();
                if (rect.top < window.innerHeight) {
                    console.log('⚡ Fallback: stat already visible');
                    animateNumber(stat);
                }
            });
        }, 500);
    }
}

function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}


function setupNavbarEffect() {
    window.addEventListener('scroll', function() {
        const nav = document.querySelector('.landing-nav');
        if (window.scrollY > 50) {
            nav.style.background = 'rgba(10, 14, 26, 0.95)';
            nav.style.boxShadow = '0 4px 30px rgba(0,0,0,0.3)';
        } else {
            nav.style.background = 'rgba(10, 14, 26, 0.8)';
            nav.style.boxShadow = 'none';
        }
    });
}


function setupPageLoadAnimation() {
    const hero = document.querySelector('.hero-section');
    if (hero) {
        hero.style.opacity = '0';
        hero.style.transform = 'translateY(20px)';
        setTimeout(function() {
            hero.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            hero.style.opacity = '1';
            hero.style.transform = 'translateY(0)';
        }, 100);
    }
}


let resizeTimeout;
function setupResizeHandler() {
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            createParticles();
        }, 500);
    });
}



document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 StudentHub Landing Page loading...');
    

    createParticles();
    

    animateStats();
    setupSmoothScroll();
    setupNavbarEffect();
    setupPageLoadAnimation();
    setupResizeHandler();
    
    console.log('✨ StudentHub ready!');
});