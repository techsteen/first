(function () {
    'use strict';

    const assistButtonId = 'chat-assist-button';
    const assistPanelId = 'chat-assist-panel';
    const assistMenuId = 'chat-assist-menu';

    function getSelectionContext() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return null;
        }
        const text = selection.toString().trim();
        if (!text) {
            return null;
        }
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const anchorNode = selection.anchorNode;
        const parentElement = anchorNode && anchorNode.parentElement ? anchorNode.parentElement : null;
        return {
            text,
            surroundingHtml: parentElement ? parentElement.outerHTML : '',
            boundingClientRect: rect,
            metadata: {
                url: window.location.href,
                timestamp: new Date().toISOString()
            }
        };
    }

    function resolveClient() {
        if (window.gf2ChatClient && typeof window.gf2ChatClient.explainSelection === 'function') {
            return window.gf2ChatClient;
        }
        if (window.sharedChatClient && typeof window.sharedChatClient.explainSelection === 'function') {
            return window.sharedChatClient;
        }
        return null;
    }

    function ensureAssistPanel() {
        let panel = document.getElementById(assistPanelId);
        if (panel) {
            return panel;
        }
        panel = document.createElement('aside');
        panel.id = assistPanelId;
        panel.className = 'assist-panel';
        panel.innerHTML = `
            <header>
                <h3>ChatGPT forklaring</h3>
                <button type="button" class="close-panel" aria-label="Luk">×</button>
            </header>
            <div class="assist-content">
                <p class="assist-placeholder">Vælg et område eller klik på et spørgsmålstegn for at få hjælp.</p>
            </div>
        `;
        document.body.appendChild(panel);
        const closeButton = panel.querySelector('.close-panel');
        closeButton.addEventListener('click', () => hideAssistPanel());
        return panel;
    }

    function ensureAssistMenu() {
        let menu = document.getElementById(assistMenuId);
        if (menu) {
            return menu;
        }
        menu = document.createElement('div');
        menu.id = assistMenuId;
        menu.className = 'assist-menu';
        const explainButton = document.createElement('button');
        explainButton.type = 'button';
        explainButton.textContent = 'Forklar markering';
        explainButton.addEventListener('click', () => {
            const context = getSelectionContext();
            hideAssistMenu();
            requestAssistance(context);
        });
        menu.appendChild(explainButton);
        document.body.appendChild(menu);
        return menu;
    }

    function positionAssistMenu(rect) {
        const menu = ensureAssistMenu();
        if (!rect || !menu) {
            hideAssistMenu();
            return;
        }
        menu.style.left = `${rect.left + window.scrollX}px`;
        menu.style.top = `${rect.bottom + window.scrollY + 6}px`;
        menu.style.display = 'flex';
    }

    function hideAssistMenu() {
        const menu = document.getElementById(assistMenuId);
        if (menu) {
            menu.style.display = 'none';
        }
    }

    function showAssistPanel(content, context) {
        const panel = ensureAssistPanel();
        const body = panel.querySelector('.assist-content');
        if (!body) {
            return;
        }
        body.innerHTML = '';
        if (context) {
            const meta = document.createElement('div');
            meta.className = 'assist-meta';
            meta.textContent = 'Markering: ' + (context.text || '').substring(0, 120);
            body.appendChild(meta);
        }
        if (content && content.trim().length > 0) {
            const paragraph = document.createElement('p');
            paragraph.innerHTML = content;
            body.appendChild(paragraph);
        } else {
            const fallback = document.createElement('p');
            fallback.textContent = 'Ingen forklaring modtaget fra API. Tjek integrationen.';
            body.appendChild(fallback);
        }
        panel.style.display = 'flex';
    }

    function hideAssistPanel() {
        const panel = document.getElementById(assistPanelId);
        if (panel) {
            panel.style.display = 'none';
        }
    }

    async function requestAssistance(selectionData) {
        if (!selectionData) {
            return;
        }
        const client = resolveClient();
        if (!client) {
            console.warn('Ingen ChatGPT-klient fundet. Se dokumentationen for integration.');
            showAssistPanel('Der er ikke forbundet nogen ChatGPT-klient endnu. Importér den fælles klient og eksponér den som <code>window.gf2ChatClient</code>.', selectionData);
            return;
        }
        try {
            const response = await client.explainSelection({
                text: selectionData.text,
                surroundingHtml: selectionData.surroundingHtml,
                metadata: selectionData.metadata || {}
            });
            const message = response && response.message ? response.message : (typeof response === 'string' ? response : 'Ingen forklaring modtaget.');
            showAssistPanel(message, selectionData);
        } catch (error) {
            console.error('Kunne ikke hente assistance', error);
            showAssistPanel('Der opstod en fejl ved kald til ChatGPT API. Prøv igen eller kontakt underviseren.', selectionData);
        }
    }

    function createAssistButton() {
        let button = document.getElementById(assistButtonId);
        if (!button) {
            button = document.createElement('button');
            button.id = assistButtonId;
            button.type = 'button';
            button.textContent = 'Forklar';
            button.className = 'assist-button';
            document.body.appendChild(button);
            button.addEventListener('click', () => {
                const context = getSelectionContext();
                if (!context) {
                    showAssistPanel('Marker noget tekst eller brug ?-knapperne for at få forklaring.', null);
                    return;
                }
                requestAssistance(context);
            });
        }
        return button;
    }

    function handleSelectionChange() {
        const context = getSelectionContext();
        if (!context) {
            hideAssistMenu();
            return;
        }
        if (context.boundingClientRect) {
            positionAssistMenu(context.boundingClientRect);
        }
    }

    function handleAssistTriggerClick(event) {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }
        if (target.classList.contains('assist-trigger')) {
            const assistText = target.getAttribute('data-assist-text');
            if (assistText) {
                requestAssistance({
                    text: assistText,
                    surroundingHtml: target.closest('[data-module-id]') ? target.closest('[data-module-id]').outerHTML : target.outerHTML,
                    metadata: {
                        url: window.location.href,
                        timestamp: new Date().toISOString(),
                        trigger: target.className
                    }
                });
            }
        }
    }

    document.addEventListener('selectionchange', () => {
        window.requestAnimationFrame(handleSelectionChange);
    });

    document.addEventListener('click', (event) => {
        const menu = document.getElementById(assistMenuId);
        if (menu && menu.contains(event.target)) {
            return;
        }
        if (!(event.target && event.target.classList && event.target.classList.contains('assist-trigger'))) {
            hideAssistMenu();
        }
    });

    document.addEventListener('click', handleAssistTriggerClick);

    document.addEventListener('DOMContentLoaded', () => {
        createAssistButton();
        ensureAssistPanel();
    });

    window.chatAssist = {
        requestAssistance,
        showAssistPanel
    };
})();
