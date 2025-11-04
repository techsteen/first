const languageButtons = document.querySelectorAll('.language-switch__btn');
const typeCards = document.querySelectorAll('.type-card');
const simulatorForm = document.getElementById('simulatorForm');
const simLanguage = document.getElementById('simLanguage');
const simType = document.getElementById('simType');
const simName = document.getElementById('simName');
const simValue = document.getElementById('simValue');
const simulatorOutput = document.getElementById('simulatorOutput');
const quizContainer = document.getElementById('quizContainer');
const submitQuizBtn = document.getElementById('submitQuiz');
const quizResult = document.getElementById('quizResult');

let activeLanguage = 'C#';

function updateTypeCards(language) {
    typeCards.forEach(card => {
        const matches = card.dataset.language === language;
        card.hidden = !matches;
    });
}

function setActiveLanguageButton(language) {
    languageButtons.forEach(btn => {
        const isActive = btn.dataset.language === language;
        btn.classList.toggle('is-active', isActive);
    });
}

function populateTypeSelect(language) {
    const entries = window.typeData[language];
    simType.innerHTML = '';
    entries.forEach(entry => {
        const option = document.createElement('option');
        option.value = entry.name;
        option.textContent = entry.name;
        simType.append(option);
    });
}

languageButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        activeLanguage = btn.dataset.language;
        updateTypeCards(activeLanguage);
        setActiveLanguageButton(activeLanguage);
        populateTypeSelect(activeLanguage);
    });
});

function validateVariable(language, type, name, value) {
    const identifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!identifierRegex.test(name)) {
        return {
            isValid: false,
            message: 'Variabelnavnet skal starte med et bogstav eller _ og kun indeholde bogstaver, tal og _. '
        };
    }

    if (!value.length) {
        return {
            isValid: false,
            message: 'Indtast en værdi for din variabel.'
        };
    }

    let codeExample = '';
    if (language === 'C#') {
        const valueRepresentation = type === 'string' ? `"${value}"` : value;
        codeExample = `${type} ${name} = ${valueRepresentation};`;
    } else {
        const boolValue = value.toLowerCase();
        let formattedValue = value;
        if (type === '[string]') {
            formattedValue = `"${value}"`;
        } else if (type === '[bool]') {
            if (boolValue === 'true' || boolValue === '$true') {
                formattedValue = '$true';
            } else if (boolValue === 'false' || boolValue === '$false') {
                formattedValue = '$false';
            } else {
                return {
                    isValid: false,
                    message: 'Boolsk værdi i PowerShell skal være $true eller $false.'
                };
            }
        }
        codeExample = `$${name} = ${type}${formattedValue}`;
    }

    return {
        isValid: true,
        message: 'Stærkt! Din variabel følger syntaksen for ' + language + '.',
        code: codeExample
    };
}

if (simulatorForm) {
    simulatorForm.addEventListener('submit', event => {
        event.preventDefault();
        const language = simLanguage.value;
        const type = simType.value;
        const name = simName.value.trim();
        const value = simValue.value.trim();

        const result = validateVariable(language, type, name, value);
        simulatorOutput.classList.toggle('simulator__output--error', !result.isValid);
        simulatorOutput.innerHTML = '';

        const message = document.createElement('p');
        message.textContent = result.message;
        simulatorOutput.append(message);

        if (result.isValid && result.code) {
            const codeBlock = document.createElement('code');
            codeBlock.textContent = result.code;
            simulatorOutput.append(codeBlock);
        }
    });
}

const quizQuestions = [
    {
        question: 'Du skal gemme navnet på et hold i C#. Hvilken type vælger du?',
        options: ['int', 'double', 'string', 'bool'],
        answer: 'string'
    },
    {
        question: 'Du tæller, hvor mange scripts der er kørt i PowerShell. Hvilken type giver mening?',
        options: ['[int]', '[string]', '[bool]', '[double]'],
        answer: '[int]'
    },
    {
        question: 'En sensor returnerer sand eller falsk. Hvilken type bruger du i C#?',
        options: ['double', 'string', 'bool', 'int'],
        answer: 'bool'
    },
    {
        question: 'Du skal gemme en temperatur med decimaler i PowerShell. Vælg typen.',
        options: ['[double]', '[string]', '[bool]', '[int]'],
        answer: '[double]'
    }
];

function buildQuiz() {
    quizContainer.innerHTML = '';
    quizQuestions.forEach((item, index) => {
        const questionWrapper = document.createElement('article');
        questionWrapper.className = 'quiz__question';

        const questionTitle = document.createElement('h3');
        questionTitle.textContent = `Spørgsmål ${index + 1}`;

        const questionText = document.createElement('p');
        questionText.textContent = item.question;

        const optionsWrapper = document.createElement('div');
        optionsWrapper.className = 'quiz__options';

        item.options.forEach(option => {
            const label = document.createElement('label');
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = `question-${index}`;
            input.value = option;

            label.append(input, document.createTextNode(option));
            optionsWrapper.append(label);
        });

        questionWrapper.append(questionTitle, questionText, optionsWrapper);
        quizContainer.append(questionWrapper);
    });
}

if (quizContainer) {
    buildQuiz();
}

if (submitQuizBtn) {
    submitQuizBtn.addEventListener('click', () => {
        let score = 0;
        quizQuestions.forEach((item, index) => {
            const selected = document.querySelector(`input[name="question-${index}"]:checked`);
            if (selected && selected.value === item.answer) {
                score += 1;
            }
        });
        quizResult.textContent = `Du fik ${score} ud af ${quizQuestions.length} rigtige.`;
    });
}

function init() {
    updateTypeCards(activeLanguage);
    setActiveLanguageButton(activeLanguage);
    populateTypeSelect(activeLanguage);
}

document.addEventListener('DOMContentLoaded', init);
