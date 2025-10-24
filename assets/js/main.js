(function () {
    'use strict';

    const STORAGE_PREFIX = 'adds-training:';

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

    function updateSequenceStatus(sequence) {
        const status = sequence.querySelector('[data-sequence-status]');
        if (!status) {
            return;
        }
        const steps = sequence.querySelectorAll('.sim-step');
        const completed = sequence.querySelectorAll('.sim-step.completed').length;
        status.textContent = `${completed} / ${steps.length} trin gennemført`;
    }

    function initSimSequences() {
        const sequences = document.querySelectorAll('[data-sequence-id]');
        sequences.forEach((sequence) => {
            const buttons = sequence.querySelectorAll('[data-run-step]');
            buttons.forEach((button) => {
                button.addEventListener('click', () => {
                    if (button.disabled) {
                        return;
                    }
                    const step = button.closest('.sim-step');
                    button.disabled = true;
                    if (step) {
                        step.classList.add('completed');
                        const output = step.querySelector('.sim-output');
                        if (output) {
                            output.hidden = false;
                        }
                    }
                    updateSequenceStatus(sequence);
                });
            });
            updateSequenceStatus(sequence);
        });
    }

    function initChecklists() {
        const inputs = document.querySelectorAll('input[data-track]');
        inputs.forEach((input) => {
            const key = STORAGE_PREFIX + input.getAttribute('data-track');
            const saved = window.localStorage.getItem(key);
            if (saved === '1') {
                input.checked = true;
            }
            input.addEventListener('change', () => {
                window.localStorage.setItem(key, input.checked ? '1' : '0');
            });
        });
    }

    function initOuBuilder() {
        const builder = document.querySelector('[data-ou-builder]');
        if (!builder) {
            return;
        }
        const preview = builder.querySelector('[data-ou-preview]');
        const checkboxes = builder.querySelectorAll('input[type="checkbox"][data-ou]');

        function render() {
            const selections = {
                'Brugere': [],
                'Enheder': []
            };
            checkboxes.forEach((checkbox) => {
                if (!checkbox.checked) {
                    return;
                }
                const parent = checkbox.getAttribute('data-parent');
                const label = checkbox.getAttribute('data-ou');
                if (parent && selections[parent]) {
                    selections[parent].push(label);
                }
            });
            Object.keys(selections).forEach((key) => selections[key].sort());
            const lines = [
                'Skolelab.local',
                '└── Standard grupper (Security Groups)',
                '└── Brugere'
            ];
            if (selections['Brugere'].length) {
                selections['Brugere'].forEach((child) => {
                    lines.push(`    └── ${child}`);
                });
            } else {
                lines.push('    └── (ingen valgte undermapper)');
            }
            lines.push('└── Enheder');
            if (selections['Enheder'].length) {
                selections['Enheder'].forEach((child) => {
                    lines.push(`    └── ${child}`);
                });
            } else {
                lines.push('    └── (ingen valgte undermapper)');
            }
            if (preview) {
                preview.textContent = lines.join('\n');
            }
        }

        checkboxes.forEach((checkbox) => {
            const key = STORAGE_PREFIX + 'ou:' + checkbox.getAttribute('data-ou');
            const saved = window.localStorage.getItem(key);
            if (saved === '1') {
                checkbox.checked = true;
            }
            checkbox.addEventListener('change', () => {
                window.localStorage.setItem(key, checkbox.checked ? '1' : '0');
                render();
            });
        });

        render();
    }

    function initPlacementSim() {
        const container = document.querySelector('[data-placement-sim]');
        if (!container) {
            return;
        }
        const rows = container.querySelectorAll('.placement-row');
        const scoreElement = container.querySelector('[data-placement-score]');

        function updateScore() {
            const correctRows = container.querySelectorAll('.placement-row.correct').length;
            if (scoreElement) {
                scoreElement.textContent = `${correctRows} / ${rows.length} korrekte`;
            }
        }

        rows.forEach((row) => {
            const select = row.querySelector('select');
            const feedback = row.querySelector('.placement-feedback');
            if (!select || !feedback) {
                return;
            }
            select.addEventListener('change', () => {
                const correct = row.getAttribute('data-correct');
                const value = select.value;
                if (!value) {
                    feedback.textContent = '';
                    feedback.classList.remove('error', 'success');
                    row.classList.remove('correct');
                    updateScore();
                    return;
                }
                if (value === correct) {
                    feedback.textContent = 'Korrekt';
                    feedback.classList.remove('error');
                    feedback.classList.add('success');
                    row.classList.add('correct');
                } else {
                    feedback.textContent = 'Prøv igen';
                    feedback.classList.add('error');
                    feedback.classList.remove('success');
                    row.classList.remove('correct');
                }
                updateScore();
            });
        });

        updateScore();
    }

    function initGpoLab() {
        const lab = document.querySelector('[data-gpo-lab]');
        if (!lab) {
            return;
        }
        const summaryList = lab.querySelector('[data-gpo-summary]');
        const options = lab.querySelectorAll('input[type="checkbox"][data-gpo-option]');

        function render() {
            if (!summaryList) {
                return;
            }
            summaryList.innerHTML = '';
            const selected = Array.from(options).filter((option) => option.checked);
            if (!selected.length) {
                const item = document.createElement('li');
                item.className = 'placeholder';
                item.textContent = 'Ingen indstillinger valgt endnu.';
                summaryList.appendChild(item);
                return;
            }
            selected.forEach((option) => {
                const label = option.closest('label');
                const description = label ? label.textContent.trim() : option.getAttribute('data-gpo-option');
                const target = option.getAttribute('data-target');
                const item = document.createElement('li');
                item.textContent = `${description} → mål: ${target}`;
                summaryList.appendChild(item);
            });
        }

        options.forEach((option) => {
            const key = STORAGE_PREFIX + 'gpo:' + option.getAttribute('data-gpo-option');
            const saved = window.localStorage.getItem(key);
            if (saved === '1') {
                option.checked = true;
            }
            option.addEventListener('change', () => {
                window.localStorage.setItem(key, option.checked ? '1' : '0');
                render();
            });
        });

        render();
    }

    function optionType(target) {
        if (!target) {
            return 'unknown';
        }
        return target.includes('Konti') || target.includes('Brugere') ? 'user' : 'computer';
    }

    function initLinkSim() {
        const container = document.querySelector('[data-link-sim]');
        if (!container) {
            return;
        }
        const radios = container.querySelectorAll('input[name="gpo-link"]');
        const result = container.querySelector('[data-link-result]');
        const storageKey = STORAGE_PREFIX + 'gpo-link';

        function describeSelection(value) {
            const lab = document.querySelector('[data-gpo-lab]');
            const options = lab ? Array.from(lab.querySelectorAll('input[type="checkbox"][data-gpo-option]:checked')) : [];
            if (!result) {
                return;
            }
            let baseMessage = '';
            if (value === 'Elev-Konti') {
                baseMessage = 'Politikken rammer kun elevbrugere. Brugerindstillinger anvendes, men computerindstillinger ignoreres.';
            } else if (value === 'Brugere') {
                baseMessage = 'Politikken arves til alle underliggende bruger-OUs, så både elever, lærere og servicekonti påvirkes.';
            } else if (value === 'Enheder') {
                baseMessage = 'Politikken rammer alle enheds-OUs. Brugerindstillinger ignoreres, men maskinpolitikker træder i kraft.';
            } else {
                baseMessage = 'Vælg et link for at se effekten.';
            }
            const listItems = options.map((option) => {
                const label = option.closest('label');
                const description = label ? label.textContent.trim() : option.getAttribute('data-gpo-option');
                const target = option.getAttribute('data-target') || '';
                const type = optionType(target);
                let applies = false;
                if (value === 'Elev-Konti') {
                    applies = type === 'user' && target === 'Elev-Konti';
                } else if (value === 'Brugere') {
                    applies = type === 'user';
                } else if (value === 'Enheder') {
                    applies = type === 'computer';
                }
                const icon = applies ? '✔︎' : '✖︎';
                return `${icon} ${description}`;
            });
            const content = [`<p>${baseMessage}</p>`];
            if (listItems.length) {
                content.push('<ul>');
                listItems.forEach((item) => content.push(`<li>${item}</li>`));
                content.push('</ul>');
            }
            result.innerHTML = content.join('');
        }

        const saved = window.localStorage.getItem(storageKey);
        if (saved) {
            const savedRadio = container.querySelector(`input[name="gpo-link"][value="${saved}"]`);
            if (savedRadio) {
                savedRadio.checked = true;
                describeSelection(saved);
            }
        }

        radios.forEach((radio) => {
            radio.addEventListener('change', () => {
                if (!radio.checked) {
                    return;
                }
                window.localStorage.setItem(storageKey, radio.value);
                describeSelection(radio.value);
            });
        });
    }

    function initRunbook() {
        const runbook = document.querySelector('[data-runbook]');
        if (!runbook) {
            return;
        }
        const steps = runbook.querySelectorAll('[data-runbook-step]');
        const status = runbook.querySelector('[data-runbook-status]');

        function updateStatus() {
            const done = runbook.querySelectorAll('.done').length;
            if (status) {
                status.textContent = `${done} / ${steps.length} trin markeret`;
            }
        }

        steps.forEach((step) => {
            const toggle = step.querySelector('.runbook-toggle');
            const body = step.querySelector('.runbook-body');
            const complete = step.querySelector('.runbook-complete');
            if (toggle && body) {
                toggle.addEventListener('click', () => {
                    body.hidden = !body.hidden;
                });
            }
            if (complete) {
                const key = STORAGE_PREFIX + complete.getAttribute('data-track');
                const saved = window.localStorage.getItem(key);
                if (saved === '1') {
                    step.classList.add('done');
                    complete.disabled = true;
                    complete.textContent = 'Markeret';
                }
                complete.addEventListener('click', () => {
                    step.classList.add('done');
                    complete.disabled = true;
                    complete.textContent = 'Markeret';
                    window.localStorage.setItem(key, '1');
                    updateStatus();
                });
            }
        });

        updateStatus();
    }

    function initQuiz() {
        const quiz = document.querySelector('[data-quiz]');
        if (!quiz) {
            return;
        }
        const form = quiz.querySelector('form');
        const submit = quiz.querySelector('.quiz-submit');
        const result = quiz.querySelector('[data-quiz-result]');
        if (!form || !submit || !result) {
            return;
        }
        submit.addEventListener('click', () => {
            const fieldsets = form.querySelectorAll('fieldset');
            let total = 0;
            let correct = 0;
            fieldsets.forEach((fieldset) => {
                total += 1;
                const expected = fieldset.getAttribute('data-correct');
                const selected = fieldset.querySelector('input[type="radio"]:checked');
                if (selected && selected.value === expected) {
                    correct += 1;
                }
            });
            result.textContent = `Du fik ${correct} ud af ${total} rigtige.`;
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initSmoothScroll();
        initSimSequences();
        initChecklists();
        initOuBuilder();
        initPlacementSim();
        initGpoLab();
        initLinkSim();
        initRunbook();
        initQuiz();
    });
})();
