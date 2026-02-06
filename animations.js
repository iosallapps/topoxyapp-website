/**
 * TopoXY Website - Animations & Interactions
 * Handles Lottie animations, mobile navigation, and language switching
 */

(function() {
    'use strict';

    // ===== Language Switching =====
    const STORAGE_KEY = 'topoxy-lang';

    function detectLanguage() {
        // Check localStorage first
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return stored;

        // Detect browser language
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang && browserLang.toLowerCase().startsWith('ro')) {
            return 'ro';
        }
        return 'en';
    }

    function applyLanguage(lang) {
        // Update all bilingual elements
        document.querySelectorAll('[data-en][data-ro]').forEach(el => {
            const text = el.getAttribute('data-' + lang);
            if (text) el.innerHTML = text;
        });

        // Update document language
        document.documentElement.lang = lang;

        // Update toggle button text
        const toggle = document.getElementById('lang-toggle');
        if (toggle) {
            toggle.textContent = lang === 'en' ? 'RO' : 'EN';
        }

        // Persist preference
        localStorage.setItem(STORAGE_KEY, lang);
    }

    // ===== Mobile Menu =====
    function initMobileMenu() {
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');

        if (menuBtn && navLinks) {
            menuBtn.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                // Update aria-expanded
                const isExpanded = navLinks.classList.contains('active');
                menuBtn.setAttribute('aria-expanded', isExpanded);
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!menuBtn.contains(e.target) && !navLinks.contains(e.target)) {
                    navLinks.classList.remove('active');
                    menuBtn.setAttribute('aria-expanded', 'false');
                }
            });

            // Close menu when clicking a link
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    menuBtn.setAttribute('aria-expanded', 'false');
                });
            });
        }
    }

    // ===== Lottie Animations =====
    function initLottieAnimations() {
        // Skip animations if user prefers reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            // Hide Lottie containers
            document.querySelectorAll('#lottie-hero, #lottie-cta').forEach(el => {
                el.style.display = 'none';
            });
            return;
        }

        // Check if lottie library is loaded
        if (typeof lottie === 'undefined') {
            console.warn('Lottie library not loaded');
            return;
        }

        const lottieTargets = [
            {
                id: 'lottie-hero',
                path: 'animations/AreaMap.json',
                loop: true
            },
            {
                id: 'lottie-cta',
                path: 'animations/thumbs-up.json',
                loop: true
            }
        ];

        // Use Intersection Observer for lazy loading
        const observerOptions = {
            rootMargin: '100px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const container = entry.target;
                    const config = lottieTargets.find(t => t.id === container.id);

                    // Only load once
                    if (config && !container.dataset.loaded) {
                        try {
                            lottie.loadAnimation({
                                container: container,
                                renderer: 'svg',
                                loop: config.loop,
                                autoplay: true,
                                path: config.path
                            });
                            container.dataset.loaded = 'true';
                        } catch (error) {
                            console.warn('Failed to load Lottie animation:', error);
                        }
                    }

                    // Stop observing after loading
                    observer.unobserve(container);
                }
            });
        }, observerOptions);

        // Observe all Lottie containers
        lottieTargets.forEach(target => {
            const el = document.getElementById(target.id);
            if (el) {
                observer.observe(el);
            }
        });
    }

    // ===== Smooth Scroll for Anchor Links =====
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // ===== Initialize Everything =====
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize language
        let currentLang = detectLanguage();
        applyLanguage(currentLang);

        // Language toggle
        const langToggle = document.getElementById('lang-toggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => {
                currentLang = currentLang === 'en' ? 'ro' : 'en';
                applyLanguage(currentLang);
            });
        }

        // Initialize other features
        initMobileMenu();
        initSmoothScroll();

        // Initialize Lottie after a small delay to ensure library is loaded
        if (typeof lottie !== 'undefined') {
            initLottieAnimations();
        } else {
            // Wait for lottie to load (it's deferred)
            window.addEventListener('load', initLottieAnimations);
        }
    });

})();
