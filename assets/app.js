(function() {
    const tagButtons = document.querySelectorAll('#tagCloud .tag');
    const clearButton = document.querySelector('.tag--clear');
    const cards = document.querySelectorAll('.card');

    if (!tagButtons.length || !cards.length) {
        return;
    }

    let activeTag = null;

    function updateCards() {
        cards.forEach(card => {
            const tags = (card.getAttribute('data-tags') || '').split(' ');
            if (!activeTag || activeTag === 'all') {
                card.classList.remove('card--hidden');
                return;
            }
            if (tags.includes(activeTag)) {
                card.classList.remove('card--hidden');
            } else {
                card.classList.add('card--hidden');
            }
        });
    }

    function setActiveTag(tag) {
        activeTag = tag;
        tagButtons.forEach(btn => {
            btn.classList.toggle('tag--active', btn.dataset.tag === tag);
        });
        if (clearButton) {
            clearButton.classList.toggle('tag--active', tag === 'all');
        }
        updateCards();
    }

    tagButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.dataset.tag;
            if (tag === activeTag) {
                setActiveTag('all');
            } else {
                setActiveTag(tag);
            }
        });
    });

    if (clearButton) {
        clearButton.addEventListener('click', () => setActiveTag('all'));
    }

    updateCards();
})();
