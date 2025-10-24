(function () {
    'use strict';

    function initSmoothScroll() {
        const links = document.querySelectorAll('a[href^="#"]');
        links.forEach((link) => {
            link.addEventListener('click', (event) => {
                const targetId = link.getAttribute('href');
                if (!targetId || targetId === '#') {
                    return;
                }
                const target = document.querySelector(targetId);
                if (target) {
                    event.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initSmoothScroll();
    });
})();
