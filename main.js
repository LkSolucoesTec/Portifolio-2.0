// OBRIGATÓRIO: window.load garante que o GSAP só calcule as distâncias
// DEPOIS que todas as imagens pesadas do site terminarem de baixar.
window.addEventListener("load", () => {
    
    // ==========================================
    // 1. CURSOR MAGNÉTICO E HACKER TEXT
    // ==========================================
    const cursor = document.getElementById('cursor');
    const magneticElements = document.querySelectorAll('.magnetic');
    let mouseX = 0, mouseY = 0; let cursorX = 0, cursorY = 0;

    window.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
    function lerp(start, end, factor) { return start + (end - start) * factor; }

    function animateCursor() {
        cursorX = lerp(cursorX, mouseX, 0.15);
        cursorY = lerp(cursorY, mouseY, 0.15);
        if(cursor) cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    magneticElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2;
            const moveX = (e.clientX - centerX) * 0.3; const moveY = (e.clientY - centerY) * 0.3;
            el.style.transform = `translate(${moveX}px, ${moveY}px)`;
            if(cursor) cursor.classList.add('magnet');
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = 'translate(0, 0)'; 
            if(cursor) cursor.classList.remove('magnet');
        });
    });

    const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#";
    document.querySelectorAll('[data-text]').forEach(link => {
        link.addEventListener('mouseenter', event => {
            let iter = 0; const original = event.target.dataset.text;
            clearInterval(event.target.interval);
            event.target.interval = setInterval(() => {
                event.target.innerText = original.split("").map((l, i) => {
                    if (i < iter) return original[i];
                    return alpha[Math.floor(Math.random() * alpha.length)]
                }).join("");
                if (iter >= original.length) clearInterval(event.target.interval);
                iter += 1 / 3;
            }, 30);
        });
        link.addEventListener('mouseleave', e => {
            clearInterval(e.target.interval); e.target.innerText = e.target.dataset.text;
        });
    });

    // ==========================================
    // 2. LÓGICA DA NAVBAR
    // ==========================================
    const nav = document.querySelector('.brutal-nav');
    let isScrolled = false;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            if (!isScrolled && nav) { nav.classList.add('scrolled'); isScrolled = true; }
        } else {
            if (isScrolled && nav) { nav.classList.remove('scrolled'); nav.style.transform = ''; isScrolled = false; }
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!isScrolled || !nav) return;
        const cx = window.innerWidth / 2; const cy = 100;
        const rx = (e.clientY - cy) * 0.02; const ry = (e.clientX - cx) * 0.02;
        const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
        nav.style.transform = `translateX(-50%) perspective(1000px) rotateX(${-clamp(rx, -10, 10)}deg) rotateY(${clamp(ry, -10, 10)}deg)`;
    });

    // ==========================================
    // 3. MENU HAMBÚRGUER CLICÁVEL (MOBILE)
    // ==========================================
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    menuToggle.classList.remove('active');
                }
            });
        });
    }

    // ==========================================
    // 4. MOTOR UNIFICADO GSAP (SKEW + FITAS + GALERIA)
    // ==========================================
    if (typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        const scrollContent = document.getElementById('scroll-content');
        const tapeLRText = document.querySelector("#tape-left-right .tape-text");
        const tapeRLText = document.querySelector("#tape-right-left .tape-text");
        let skew = 0; 
        let lastScrollTop = 0;

        // O PULO DO GATO: GSAP MatchMedia
        let mm = gsap.matchMedia();

        // [DESKTOP] > 900px
        mm.add("(min-width: 901px)", () => {
            
            // Fitas
            if (tapeLRText && tapeRLText) {
                gsap.to(tapeLRText, { x: "0%", duration: 50, repeat: -1, ease: "none" });
                gsap.to(tapeRLText, { x: "-100%", duration: 50, repeat: -1, ease: "none" });
            }

            // A MÁGICA: Galeria Horizontal Corrigida
            const track = document.querySelector(".gallery-track");
                let sections = gsap.utils.toArray(".gallery-slide");

                if (track && sections.length > 0) {
                    
                    // Conta quantos slides temos que mover (Total - 1)
                    const moveAmount = sections.length - 1;

                    gsap.to(track, {
                        // Move a pista exatemente "X" vezes a largura da tela!
                        x: () => -(window.innerWidth * moveAmount), 
                        ease: "none",
                        scrollTrigger: {
                            trigger: "#lks-gallery-container",
                            pin: true,
                            scrub: 1,
                            // O scroll dura exatamente "X" larguras de tela
                            end: () => "+=" + (window.innerWidth * moveAmount),
                            invalidateOnRefresh: true
                        }
                    });
                }

            // Motor de Skew (Hero e Fitas)
            function scrollLoop() {
                const scrollTop = window.scrollY;
                const velocity = scrollTop - lastScrollTop;
                lastScrollTop = scrollTop;
                
                const speed = Math.min(Math.max(velocity * 0.05, -5), 5); 
                skew = lerp(skew, speed, 0.1);
                
                if (scrollContent) {
                    if (Math.abs(skew) > 0.05) scrollContent.style.transform = `skewY(${skew}deg)`;
                    else scrollContent.style.transform = `skewY(0deg)`;
                }

                if (tapeLRText && tapeRLText) {
                    if (Math.abs(skew) > 0.1) {
                        gsap.set("#tape-left-right", { skewY: `${skew}deg` });
                        gsap.set("#tape-right-left", { skewY: `${-skew}deg` });
                    } else {
                        gsap.set("#tape-left-right", { skewY: `0deg` });
                        gsap.set("#tape-right-left", { skewY: `0deg` });
                    }
                }
                requestAnimationFrame(scrollLoop);
            }
            scrollLoop();

            // Cleanup ao ir para mobile
            return () => { 
                skew = 0; 
                if(scrollContent) scrollContent.style.transform = `skewY(0deg)`; 
            };
        });

        // [MOBILE] <= 900px
        mm.add("(max-width: 900px)", () => {
            // Mantém apenas as fitas rodando leve no mobile
            if (tapeLRText && tapeRLText) {
                gsap.to(tapeLRText, { x: "0%", duration: 45, repeat: -1, ease: "none" });
                gsap.to(tapeRLText, { x: "-100%", duration: 50, repeat: -1, ease: "none" });
            }
        });
    }

    // ==========================================
    // 5. CARTA POKÉMON (TILT 3D E GIRO BLINDADO)
    // ==========================================
    const cardStage = document.querySelector('.pokemon-card-stage');
    const card = document.getElementById('founder-card');
    const glareFront = document.querySelector('.card-front .card-glare');
    const glareBack = document.querySelector('.card-back .card-glare');

    let isAnimating = false; // Trava LKS

    if(cardStage && card) {
        
        // 🛑 O SEGREDO: Mata a transição do CSS para o GSAP poder trabalhar livre sem travar
        card.style.transition = "none";

        // 1. Tilt 3D com o Mouse
        cardStage.addEventListener('mousemove', (e) => {
            if (isAnimating) return; // Se a carta estiver girando, o mouse não interfere

            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; const y = e.clientY - rect.top;
            const centerX = rect.width / 2; const centerY = rect.height / 2;
            let rotateX = ((y - centerY) / centerY) * -10; 
            let rotateY = ((x - centerX) / centerX) * 10; 
            
            if(card.classList.contains('flipped')){ rotateY = 180 - rotateY; }
            
            gsap.set(card, {
                rotateX: rotateX,
                rotateY: rotateY,
                scale: 1.05,
                transformPerspective: 2000,
                overwrite: "auto"
            });
            
            const moveX = (x / rect.width) * 100;
            const targetGlare = card.classList.contains('flipped') ? glareBack : glareFront;
            if(targetGlare) targetGlare.style.background = `linear-gradient(105deg, transparent ${moveX - 20}%, rgba(0, 230, 255, 0.4) ${moveX}%, rgba(255, 0, 255, 0.4) ${moveX + 20}%, transparent ${moveX + 40}%)`;
        });

        // 2. Tira o Mouse (Reseta a posição)
        cardStage.addEventListener('mouseleave', () => {
            if (isAnimating) return;
            gsap.to(card, {
                rotateX: 0,
                rotateY: card.classList.contains('flipped') ? 180 : 0,
                scale: 1,
                transformPerspective: 2000,
                duration: 0.5,
                ease: "power2.out",
                overwrite: "auto"
            });
        });

        // 3. O Clique (Giro Mestre)
        card.addEventListener('click', () => {
            if (isAnimating) return; // Previne bugar se o usuário clicar 2x rápido
            isAnimating = true; // Aciona a Trava
            
            // Alterna a classe para ativar a barra de progresso do CSS (Verso)
            card.classList.toggle('flipped');
            const isFlipped = card.classList.contains('flipped');
            
            // GSAP faz o giro 3D perfeito e limpo
            gsap.to(card, {
                duration: 0.8,
                rotationY: isFlipped ? 180 : 0,
                rotationX: 0,
                scale: 1,
                transformPerspective: 2000,
                ease: "power2.inOut",
                onComplete: () => {
                    isAnimating = false; // Destrava após o giro terminar
                }
            });
        });
    }

    // ==========================================
    // 6. MOTOR DE PORTFÓLIO (GSAP SLIDER LKS)
    // ==========================================
    const thumbs = document.querySelectorAll('.nav-thumb');
    const slides = document.querySelectorAll('.portfolio-slide');
    const portfolioEngine = document.querySelector('.lks-portfolio-engine');

    if(thumbs.length > 0 && slides.length > 0 && portfolioEngine) {
        thumbs.forEach(thumb => {
            thumb.addEventListener('click', () => {
                if(thumb.classList.contains('active')) return;

                const targetIndex = thumb.getAttribute('data-target');
                const currentActiveSlide = document.querySelector('.portfolio-slide.active');
                const nextActiveSlide = document.querySelector(`.portfolio-slide[data-index="${targetIndex}"]`);
                
                thumbs.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');

                if(nextActiveSlide) {
                    const newColor = nextActiveSlide.getAttribute('data-color');
                    portfolioEngine.style.setProperty('--theme-color', newColor);

                    if(currentActiveSlide) {
                        gsap.to(currentActiveSlide, {
                            opacity: 0, duration: 0.5, ease: "power2.inOut",
                            onComplete: () => currentActiveSlide.classList.remove('active')
                        });
                    }

                    nextActiveSlide.classList.add('active');
                    
                    gsap.fromTo(nextActiveSlide, 
                        { opacity: 0 }, 
                        { opacity: 1, duration: 0.5, ease: "power2.inOut" }
                    );
                    
                    const bgImg = nextActiveSlide.querySelector('.slide-bg img');
                    if(bgImg){
                        gsap.fromTo(bgImg,
                            { scale: 1.15, x: 50 },
                            { scale: 1.1, x: 0, duration: 1.5, ease: "power3.out" }
                        );
                    }

                    const slideContent = nextActiveSlide.querySelector('.slide-content');
                    if(slideContent){
                        gsap.fromTo(slideContent,
                            { x: -50, opacity: 0 },
                            { x: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power3.out" }
                        );
                    }
                }
            });
        });

        portfolioEngine.addEventListener('mousemove', (e) => {
            const activeBg = document.querySelector('.portfolio-slide.active .slide-bg img');
            if(activeBg) {
                const x = (e.clientX / window.innerWidth - 0.5) * 20;
                const y = (e.clientY / window.innerHeight - 0.5) * 20;
                gsap.to(activeBg, { x: -x, y: -y, duration: 1, ease: "power1.out" });
            }
        });
    }

    // ==========================================
    // 7. ARQUIVO DE PROJETOS (ACCORDION)
    // ==========================================
    const archiveHeader = document.querySelector(".archive-header.text-item");
    if(archiveHeader) {
        gsap.fromTo(archiveHeader,
            { y: "100%", opacity: 0 },
            { y: "0%", opacity: 1, duration: 1.2, ease: "expo.out",
              scrollTrigger: { trigger: ".archive-section", start: "top 80%" }
            }
        );
    }

    document.querySelectorAll(".accordion-item").forEach((item) => {
        const hoverImg = item.querySelector(".service-hover-image");
        const titleWrap = item.querySelector(".title-wrapper");
        const titles = item.querySelectorAll(".service-title");
        const content = item.querySelector(".accordion-content");
        const arrow = item.querySelector(".service-arrow");
        let isOpen = false;

        if (hoverImg) {
            gsap.set(hoverImg, { yPercent: -50, scale: 0.8, opacity: 0 });
        }

        item.addEventListener("mouseenter", () => {
            if (hoverImg) { gsap.to(hoverImg, { opacity: 0.8, scale: 1, duration: 0.6, ease: "power3.out", overwrite: "auto" }); }
            gsap.to(titleWrap, { x: 20, duration: 0.6, ease: "power3.out", overwrite: "auto" });
            gsap.to(titles, { y: "-100%", duration: 0.5, ease: "power3.out", overwrite: "auto" });
            if(cursor) cursor.classList.add('magnet');
        });

        item.addEventListener("mouseleave", () => {
            if (hoverImg) { gsap.to(hoverImg, { opacity: 0, scale: 0.8, duration: 0.5, ease: "power3.out", overwrite: "auto" }); }
            gsap.to(titleWrap, { x: 0, duration: 0.6, ease: "power3.out", overwrite: "auto" });
            gsap.to(titles, { y: "0%", duration: 0.5, ease: "power3.out", overwrite: "auto" });
            if(cursor) cursor.classList.remove('magnet');
        });

        const header = item.querySelector(".accordion-header");
        if(header) {
            header.addEventListener("click", () => {
                isOpen = !isOpen;
                if (isOpen) {
                    gsap.to(content, { height: "auto", duration: 0.6, ease: "power3.inOut" });
                    gsap.to(arrow, { rotationZ: 180, duration: 0.6, ease: "power3.inOut" });
                } else {
                    gsap.to(content, { height: 0, duration: 0.5, ease: "power3.inOut" });
                    gsap.to(arrow, { rotationZ: 0, duration: 0.5, ease: "power3.inOut" });
                }
            });
        }
    });

    // ==========================================
    // 8. ULTRA MODERN BUTTON (MOUSE TRACKING LKS)
    // ==========================================
    const modernBtn = document.getElementById('lks-modern-btn');
    if (modernBtn) {
        document.addEventListener('mousemove', (e) => {
            const rect = modernBtn.getBoundingClientRect();
            const btnX = e.clientX - rect.left;
            const btnY = e.clientY - rect.top;
            modernBtn.style.setProperty('--btn-mouse-x', btnX + 'px');
            modernBtn.style.setProperty('--btn-mouse-y', btnY + 'px');
        });
    }

}); // FIM DO WINDOW.LOAD