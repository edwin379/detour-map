/**
 * Opening Animation - Kanji brush stroke animation
 */
class BrushAnimation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        window.addEventListener('resize', () => this.setupCanvas());
        this.startAnimation();
    }

    setupCanvas() {
        if (!this.canvas || !this.ctx) return;

        const width = this.canvas.offsetWidth || this.canvas.getBoundingClientRect().width;
        const height = this.canvas.offsetHeight || this.canvas.getBoundingClientRect().height;

        this.canvas.width = width * devicePixelRatio;
        this.canvas.height = height * devicePixelRatio;
        this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    startAnimation() {
        // Sequence of animations
        const sequence = [
            { text: '俺', duration: 0.9, large: true },
            { text: 'た', duration: 0.7, large: true },
            { text: 'ち', duration: 0.7, large: true },
            { text: 'の', duration: 0.6, large: false },
            { text: '青', duration: 0.6, large: false },
            { text: '春', duration: 0.6, large: false },
            { text: 'マ', duration: 0.6, large: false },
            { text: 'ッ', duration: 0.5, large: false },
            { text: 'プ', duration: 0.6, large: false }
        ];

        let totalTime = 0;
        const animations = [];

        sequence.forEach((item, index) => {
            animations.push({
                text: item.text,
                startTime: totalTime,
                duration: item.duration * 1000,
                large: item.large
            });
            totalTime += item.duration * 1000 + 120; // shorter 120ms gap between characters
        });

        this.animate(animations);
    }

    animate(animations) {
        const startTime = Date.now();
        const totalDuration = animations[animations.length - 1].startTime + animations[animations.length - 1].duration + 500;

        const animationFrame = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / totalDuration, 1);

            this.ctx.clearRect(0, 0, this.canvas.width / devicePixelRatio, this.canvas.height / devicePixelRatio);

            // Draw all characters
            animations.forEach((anim) => {
                if (elapsed >= anim.startTime) {
                    const charProgress = Math.min((elapsed - anim.startTime) / anim.duration, 1);
                    this.drawCharacter(anim.text, charProgress, anim.large, animations.indexOf(anim));
                }
            });

            if (progress < 1) {
                requestAnimationFrame(animationFrame);
            }
        };

        requestAnimationFrame(animationFrame);
    }

    drawCharacter(char, progress, large, index) {
        const width = this.canvas.width / devicePixelRatio;
        const baseSize = large ? 130 : 70;
        const fontSize = baseSize * (1 + progress * 0.18);
        const centerY = this.canvas.height / devicePixelRatio / 2;

        const positions = [-320, -180, -40, 80, 160, 240, 310, 370, 420];
        const x = width / 2 + (positions[index] || 0);

        this.ctx.save();
        this.ctx.globalAlpha = Math.min(progress * 1.5, 1);
        
        this.ctx.font = `bold ${fontSize}px 'Noto Sans CJK JP', 'Microsoft YaHei'`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#000000';
        
        // Add brush stroke effect with shadow
        this.ctx.shadowColor = `rgba(0, 0, 0, ${0.3 * progress})`;
        this.ctx.shadowBlur = 8 * progress;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;

        // Draw with animation stroke
        this.ctx.fillText(char, x, centerY);
        
        // Add glow effect
        this.ctx.strokeStyle = `rgba(0, 0, 0, ${0.2 * progress})`;
        this.ctx.lineWidth = 2;
        this.ctx.strokeText(char, x, centerY);

        this.ctx.restore();
    }
}

// Start animation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BrushAnimation('brush-canvas');

    const bgm = document.getElementById('bgm-audio');
    const splash = document.getElementById('splash-screen');

    const tryPlayBgm = () => {
        if (!bgm) return;
        bgm.volume = 0.24;
        bgm.loop = true;
        const playPromise = bgm.play();
        if (playPromise && playPromise.catch) {
            playPromise.catch((err) => {
                console.warn('BGM autoplay blocked:', err);
                const resumeOnInteraction = () => {
                    if (bgm.paused) {
                        bgm.play().catch(() => {});
                    }
                };
                document.addEventListener('click', resumeOnInteraction, { once: true, passive: true });
            });
        }
    };

    if (splash) {
        splash.addEventListener('animationend', (event) => {
            if (event.animationName === 'fadeOutScreen') {
                splash.classList.add('hidden');
                tryPlayBgm();
            }
        });
    }
});
