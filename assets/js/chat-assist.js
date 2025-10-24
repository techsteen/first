(function () {
    'use strict';

    const assistButtonId = 'chat-assist-button';

    function getSelectionContext() {
        const selection = window.getSelection();
        if (!selection || selection.toString().trim() === '') {
            return null;
        }
        return {
            text: selection.toString(),
            surroundingHtml: selection.anchorNode ? selection.anchorNode.parentElement.outerHTML : ''
        };
    }

    async function requestAssistance(selectionData) {
        if (!selectionData) {
            return;
        }

        try {
            // TODO: Erstat med kald til fælles ChatGPT API-klient.
            // Eksempel:
            // const response = await window.sharedChatClient.explainSelection(selectionData);
            // showResponse(response);
            console.info('Stub til API-kald', selectionData);
        } catch (error) {
            console.error('Kunne ikke hente assistance', error);
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
                requestAssistance(context);
            });
        }
        return button;
    }

    document.addEventListener('DOMContentLoaded', () => {
        createAssistButton();
    });

    window.chatAssist = {
        requestAssistance
    };
})();
