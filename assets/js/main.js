(function () {
    'use strict';

    const STORAGE_PREFIX = 'ws-adds-progress:';

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

    function updateModuleProgress(moduleElement) {
        if (!moduleElement) {
            return;
        }
        const checkboxes = moduleElement.querySelectorAll('[data-progress-key]');
        if (!checkboxes.length) {
            return;
        }
        const checkedCount = Array.from(checkboxes).filter((checkbox) => checkbox.checked).length;
        const percentage = Math.round((checkedCount / checkboxes.length) * 100);
        const bar = moduleElement.querySelector('.module-progress-bar');
        const text = moduleElement.querySelector('.module-progress-text');
        if (bar) {
            bar.style.width = `${percentage}%`;
            bar.setAttribute('aria-valuenow', String(percentage));
        }
        if (text) {
            text.textContent = `${percentage}% gennemført`;
        }
    }

    function initProgressTracking() {
        const checkboxes = document.querySelectorAll('[data-progress-key]');
        checkboxes.forEach((checkbox) => {
            const key = checkbox.getAttribute('data-progress-key');
            const storageKey = STORAGE_PREFIX + key;
            const savedValue = window.localStorage.getItem(storageKey);
            if (savedValue === '1') {
                checkbox.checked = true;
            }
            const moduleElement = checkbox.closest('[data-module-id]');
            updateModuleProgress(moduleElement);
            checkbox.addEventListener('change', () => {
                window.localStorage.setItem(storageKey, checkbox.checked ? '1' : '0');
                updateModuleProgress(moduleElement);
            });
        });
    }

    function initDetailsObservers() {
        const details = document.querySelectorAll('[data-module-details]');
        details.forEach((detail) => {
            detail.addEventListener('toggle', () => {
                if (detail.open) {
                    const moduleElement = detail.closest('[data-module-id]');
                    updateModuleProgress(moduleElement);
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initSmoothScroll();
        initProgressTracking();
        initDetailsObservers();
    });
})();
