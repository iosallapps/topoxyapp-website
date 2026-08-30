/**
 * TopoXY Website - Animations & Interactions
 * Handles Lottie animations, mobile navigation, and language switching
 */

(function() {
    'use strict';

    // ===== Language Switching =====
    const STORAGE_KEY = 'topoxy-lang';

    function detectLanguage() {
        // ?lang=ro is advertised in every hreflang tag and in sitemap.xml, so it
        // has to actually work. Explicit choice first, then stored, then browser.
        const q = new URLSearchParams(location.search).get('lang');
        if (q === 'ro' || q === 'en') return q;
        const stored = readStored();
        if (stored) return stored;
        const b = (navigator.language || '').toLowerCase();
        return b.startsWith('ro') ? 'ro' : 'en';
    }

    function readStored() {
        // Managed devices and blocked site data throw SecurityError here rather
        // than returning null. An escaping throw used to kill every later init,
        // including the mobile menu, leaving phones with no navigation at all.
        try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    }

    function writeStored(value) {
        try { localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
    }

    function applyLanguage(lang) {
        // Update all bilingual elements
        document.querySelectorAll('[data-en][data-ro]').forEach(el => {
            const text = el.getAttribute('data-' + lang);
            if (!text) return;
            // A plain-text attribute must never overwrite real markup: that used to
            // delete 28 elements' links, including the GDPR rights mailto and every
            // processor policy link in the privacy policy.
            if (el.children.length && text.indexOf('<') === -1) return;
            el.innerHTML = text;
        });

        // Update document language
        document.documentElement.lang = lang;

        // Update toggle button text
        const toggle = document.getElementById('lang-toggle');
        if (toggle) {
            toggle.textContent = lang === 'en' ? 'RO' : 'EN';
        }

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
            document.querySelectorAll('#lottie-cta').forEach(el => {
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
            // lottie-hero removed: the hero now uses a static photo, which costs
            // less than the CDN library and paints immediately.
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

    // ===== Initialize Everything =====
    // No single feature may take the others down. A localStorage throw used to
    // escape from the language block and stop initMobileMenu() ever running,
    // which left phones with no navigation at all.
    function safely(name, fn) {
        try { fn(); } catch (e) { console.error('init failed: ' + name, e); }
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Initialize language
        let currentLang = 'en';
        safely('language', () => {
            currentLang = detectLanguage();
            applyLanguage(currentLang);
        });

        // Language toggle
        const langToggle = document.getElementById('lang-toggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => {
                currentLang = currentLang === 'en' ? 'ro' : 'en';
                applyLanguage(currentLang);
                // Persist only a deliberate choice, never a browser-language guess.
                writeStored(currentLang);
                // Keep the address bar shareable, matching the advertised hreflang.
                try {
                    history.replaceState(null, '', currentLang === 'ro' ? '?lang=ro' : location.pathname);
                } catch (e) {}
            });
        }

        // Initialize other features
        safely('mobile menu', initMobileMenu);

        // Initialize Lottie after a small delay to ensure library is loaded
        safely('lottie', () => {
            if (typeof lottie !== 'undefined') {
                initLottieAnimations();
            } else {
                // Wait for lottie to load (it's deferred)
                window.addEventListener('load', initLottieAnimations);
            }
        });
    });

})();
