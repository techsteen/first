const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.querySelector('.modal-close');
const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const glossarySearch = document.getElementById('glossary-search');
const glossaryList = document.getElementById('glossary-list');

function openModal(content) {
    modalBody.textContent = content;
    modal.removeAttribute('hidden');
}

function closeModal() {
    modal.setAttribute('hidden', '');
}

function addMessage(role, text) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('message', role);
    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    bubble.textContent = text;
    wrapper.appendChild(bubble);
    chatWindow.appendChild(wrapper);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function fetchExplanation(term) {
    modalBody.textContent = `Henter kort forklaring om ${term}...`;
    modal.removeAttribute('hidden');
    try {
        const response = await fetch('proxy.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'glossary',
                term
            })
        });

        if (!response.ok) {
            throw new Error('Uventet svar fra serveren.');
        }

        const data = await response.json();
        if (data.error) {
            openModal(`Beklager, der opstod en fejl: ${data.error}`);
            return;
        }

        modalBody.textContent = data.answer;
        modal.removeAttribute('hidden');
    } catch (error) {
        modalBody.textContent = 'Serveren kunne ikke hente forklaringen lige nu. Prøv igen senere.';
        modal.removeAttribute('hidden');
    }
}

async function sendChatMessage(message) {
    addMessage('user', message);
    addMessage('bot', 'Tænker over dit spørgsmål...');

    try {
        const response = await fetch('proxy.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'chat',
                message
            })
        });

        if (!response.ok) {
            throw new Error('Der opstod et problem med forbindelsen.');
        }

        const data = await response.json();
        chatWindow.removeChild(chatWindow.lastElementChild);

        if (data.error) {
            addMessage('bot', data.error);
            return;
        }

        addMessage('bot', data.answer);
    } catch (error) {
        chatWindow.removeChild(chatWindow.lastElementChild);
        addMessage('bot', 'Jeg kunne ikke hente svar fra serveren. Tjek din forbindelse og prøv igen.');
    }
}

function filterGlossary(event) {
    const value = event.target.value.toLowerCase();
    const items = glossaryList.querySelectorAll('li');
    items.forEach((item) => {
        const term = item.querySelector('.glossary-term').textContent.toLowerCase();
        const definition = item.querySelector('.definition').textContent.toLowerCase();
        const visible = term.includes(value) || definition.includes(value);
        item.style.display = visible ? '' : 'none';
    });
}

function setupAntiCopy() {
    document.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });

    document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && ['c', 'x', 's', 'u'].includes(event.key.toLowerCase())) {
            event.preventDefault();
        }
        if (event.key === 'PrintScreen') {
            event.preventDefault();
        }
    });
}

function moderateClientSide(message) {
    const whitelist = ['ai', 'undervis', 'differentier', 'subnet', 'netværk', 'programmer', 'prompt', 'dns', 'dhcp', 'kritisk', 'læring'];
    const normalized = message.toLowerCase();
    return whitelist.some((keyword) => normalized.includes(keyword));
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.term').forEach((termEl) => {
        termEl.addEventListener('click', () => {
            const term = termEl.dataset.term || termEl.textContent.trim();
            fetchExplanation(term);
        });
    });

    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    chatForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;

        if (!moderateClientSide(message)) {
            addMessage('bot', 'Spørgsmålet ligger uden for sidens fokus. Prøv igen med et emne om AI, subnetting, programmering eller differentiering.');
            chatInput.value = '';
            return;
        }

        sendChatMessage(message);
        chatInput.value = '';
    });

    if (glossarySearch) {
        glossarySearch.addEventListener('input', filterGlossary);
    }

    setupAntiCopy();
});
