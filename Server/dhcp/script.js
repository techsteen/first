(function () {
    'use strict';

    const form = document.querySelector('.probe form');
    if (!form) {
        return;
    }

    form.addEventListener('submit', function () {
        const button = form.querySelector('button');
        if (button) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = 'Sender forespørgsel…';
        }
    });
})();
