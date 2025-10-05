import { defineRoute } from './router.js';

const state = {
    tasks: [],
    templates: null,
    progress: loadProgress(),
    teacherMode: loadTeacherMode(),
    aiSets: [],
    storageMode: 'ukendt',
    practiceSets: {},
    practiceLoading: {},
    practiceErrors: {},
    practiceNotices: {},
    aiNotice: null
};

const answerExpansionState = {
    overlay: null,
    expandedCard: null,
    placeholder: null,
    trigger: null,
    previousScroll: 0,
    keyListenerAttached: false
};

const PRACTICE_TOPIC_LABELS = {
    binary: 'Binær forståelse',
    cidr: 'CIDR og præfikser',
    netmask: 'Netmasker i praksis',
    subnetting: 'Subnetplanlægning',
    vlsm: 'VLSM og avanceret subnetting'
};

const PIN_CODE = '4285';
const STORAGE_KEYS = {
    PROGRESS: 'subnetting-progress',
    TEACHER: 'subnetting-teacher-mode',
    AI_SETS: 'subnetting-ai-sets'
};

async function init() {
    await Promise.all([loadTasks(), loadTemplates()]);
    setupTeacherControls();
    setupRouteHandlers();
    attemptLoadAiSets();
}

defineRoute('/', renderFrontpage);
defineRoute('/learn', renderLearn);
defineRoute('/practice', renderPractice);
defineRoute('/test', renderTest);
defineRoute('/ai', renderAi);

function setupRouteHandlers() {
    document.addEventListener('click', event => {
        const target = event.target;
        if (target.matches('[data-action="start-test"]')) {
            event.preventDefault();
            startTestSession();
        }
    });
}

async function loadTasks() {
    if (state.tasks.length) return;
    try {
        const res = await fetch('assets/tasks.json');
        if (!res.ok) throw new Error('Kunne ikke hente opgaver.');
        const data = await res.json();
        state.tasks = data.tasks || [];
        refreshActiveRoute();
    } catch (error) {
        console.error('Fejl ved hentning af tasks.json', error);
    }
}

async function loadTemplates() {
    if (state.templates) return;
    try {
        const res = await fetch('assets/templates.json');
        if (!res.ok) throw new Error('Kunne ikke hente templates.');
        state.templates = await res.json();
        refreshActiveRoute();
    } catch (error) {
        console.error('Fejl ved hentning af templates.json', error);
    }
}

function loadProgress() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
        return raw ? JSON.parse(raw) : {};
    } catch (error) {
        console.warn('Progress kunne ikke hentes fra LocalStorage.', error);
        return {};
    }
}

function saveProgress() {
    try {
        localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(state.progress));
    } catch (error) {
        console.warn('Progress kunne ikke gemmes.', error);
    }
}

function loadTeacherMode() {
    try {
        return localStorage.getItem(STORAGE_KEYS.TEACHER) === 'true';
    } catch (error) {
        return false;
    }
}

function saveTeacherMode() {
    try {
        localStorage.setItem(STORAGE_KEYS.TEACHER, state.teacherMode ? 'true' : 'false');
    } catch (error) {
        console.warn('Kunne ikke gemme lærerstatus.', error);
    }
}

function setupTeacherControls() {
    const toggle = document.getElementById('toggle-teacher');
    const dialog = document.getElementById('teacher-dialog');
    const input = document.getElementById('teacher-pin');
    const feedback = dialog?.querySelector('.pin-feedback');
    const form = dialog?.querySelector('form');

    if (!toggle || !dialog || !input || !form) return;

    updateTeacherButton(toggle);

    toggle.addEventListener('click', () => {
        dialog.showModal();
        feedback.textContent = '';
        input.value = '';
        input.focus();
    });

    dialog.addEventListener('close', () => {
        feedback.textContent = '';
    });

    form.addEventListener('submit', event => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const pin = formData.get('teacher-pin');
        if (pin === PIN_CODE) {
            state.teacherMode = true;
            saveTeacherMode();
            updateTeacherButton(toggle);
            dialog.close();
        } else {
            feedback.textContent = 'Forkert PIN. Prøv igen eller spørg underviseren.';
        }
    });
}

function updateTeacherButton(button) {
    button.textContent = state.teacherMode ? 'Lærer-tilstand aktiv' : 'Lærer-tilstand';
    button.setAttribute('aria-expanded', state.teacherMode ? 'true' : 'false');
}

function refreshActiveRoute() {
    const hash = window.location.hash.replace('#', '') || '/';
    const path = hash.startsWith('/') ? hash : `/${hash}`;
    const app = document.getElementById('app');
    if (!app) return;
    if (answerExpansionState.expandedCard) {
        closeAnswerArea(answerExpansionState.expandedCard, { skipFocusRestore: true, skipScrollRestore: true });
    }
    switch (path) {
        case '/practice':
            renderPractice(app);
            break;
        case '/test':
            renderTest(app);
            break;
        case '/ai':
            renderAi(app);
            break;
        default:
            break;
    }
}

function renderFrontpage(container) {
    const template = document.getElementById('frontpage-template');
    container.innerHTML = template?.innerHTML ?? '';
}

function renderLearn(container) {
    container.innerHTML = `
        <section class="learning-section" aria-labelledby="learn-heading">
            <h2 id="learn-heading">Start med teorien</h2>
            <p class="learning-intro">Vælg et emne for at bygge din forståelse trin for trin. Begynd med IP-adresser og gå derefter videre til net- og broadcastadresser, før du senere kaster dig over subnetting.</p>
            ${getLearningContent()}
        </section>
    `;
    setupLearnTabs(container);
    setupClassSimulator(container);
    setupSubnettingSimulator(container);
}

function getLearningContent() {
    return `
    <div class="learn-tabs" role="tablist" aria-label="Teoriemner">
        <button type="button" class="tab" role="tab" id="tab-ip-intro" aria-controls="panel-ip-intro" aria-selected="true">Hvad er en IP-adresse?</button>
        <button type="button" class="tab" role="tab" id="tab-net-broadcast" aria-controls="panel-net-broadcast" aria-selected="false">Net- og broadcastadresser</button>
        <button type="button" class="tab" role="tab" id="tab-classful" aria-controls="panel-classful" aria-selected="false">Adresseklasser</button>
        <button type="button" class="tab" role="tab" id="tab-subnetting" aria-controls="panel-subnetting" aria-selected="false">Subnetting og CIDR</button>
    </div>
    <div class="tab-panels">
        <section role="tabpanel" id="panel-ip-intro" aria-labelledby="tab-ip-intro">
            <article class="learning-card">
                <h3>IP-adressen – din digitale adresse</h3>
                <p>En IPv4-adresse er en række på <strong>32 bits</strong> (nul eller ét). For at vi mennesker kan læse den, deles den op i fire blokke á <strong>8 bits</strong>, som vi kalder <em>octetter</em>. Hver octet oversættes til decimal og adskilles med punktummer. Eksempel: binært <code>11000000.10101000.00001010.00100010</code> bliver til decimal <code>192.168.10.34</code>.</p>
                <div class="bit-grid" role="presentation" aria-hidden="true">
                    <span>11100000</span><span>10101000</span><span>00001010</span><span>00100010</span>
                </div>
                <p>Octetterne svarer til talværdierne 128, 64, 32, 16, 8, 4, 2 og 1. Når vi læser en octet, lægger vi værdierne for de bits, der er <strong>1</strong>, sammen. Det er derfor adresserne er opdelt i grupper af otte bit: det gør det nemt at oversætte mellem binær og decimal og passer til netværksudstyr, der arbejder i hele bytes.</p>
            </article>
            <article class="learning-card">
                <h3>Hvad bruger vi IP-adresser til i et LAN?</h3>
                <p>I et lokalnetværk (LAN) fungerer IP-adressen som en unik identifikator for hver enhed – computere, printere, kameraer og servere. Når en elev-maskine skal sende en fil til skolens printer, pakkes data med afsenderens og modtagerens IP-adresser, så netværket ved, hvor data skal hen.</p>
                <ul>
                    <li><strong>Netdelen</strong> fortæller, hvilket lokalnet enheden tilhører.</li>
                    <li><strong>Værtsdelen</strong> identificerer den konkrete enhed på det net.</li>
                </ul>
                <p>Routere bruger netdelen til at finde vej til det rigtige netværk, mens switche bruger værtsdelen (sammen med MAC-adresser) til at levere data til den rigtige port. Derfor er korrekt IP-adressering fundamentet for, at et LAN virker stabilt.</p>
                <figure class="lan-figure">
                    <figcaption>IP-adresser forbinder enheder i samme net</figcaption>
                    <div class="lan-diagram" role="presentation" aria-hidden="true">
                        <span>192.168.10.<strong>1</strong> (router)</span>
                        <span>192.168.10.<strong>14</strong> (PC)</span>
                        <span>192.168.10.<strong>25</strong> (printer)</span>
                    </div>
                </figure>
            </article>
            <article class="learning-card">
                <h3>Sådan læser du en IP-adresse</h3>
                <ol>
                    <li>Split adressen i fire octetter (f.eks. <code>172.16.4.25</code> → 172 | 16 | 4 | 25).</li>
                    <li>Oversæt hver octet til binær, hvis du vil se bitmønsteret.</li>
                    <li>Identificér net- og værtsdel ud fra netmasken (kommer i næste faner).</li>
                </ol>
                <p>At mestre dette trin gør resten af subnetting-rejsen langt lettere.</p>
            </article>
        </section>
        <section role="tabpanel" id="panel-net-broadcast" aria-labelledby="tab-net-broadcast" hidden>
            <article class="learning-card">
                <h3>Hvorfor taler vi om netadresser?</h3>
                <p>Netadressen er navneskiltet på selve lokalnettet. Den beskriver hele gruppen af IP-adresser, der hører sammen. Netværksudstyr bruger netadressen til at vide, om en pakke skal blive i LAN'et eller sendes videre til en router.</p>
                <p>Forestil dig et klasseværelse: netadressen svarer til klassens navn på døren. Alle elever (værter) inde i lokalet har deres egne navneskilte, men hører til samme klasse.</p>
                <div class="net-broadcast-diagram" role="presentation" aria-hidden="true">
                    <span class="net">Net: 192.168.10.<strong>0</strong></span>
                    <span class="hosts">Værter: ... .1 – ... .254</span>
                    <span class="broadcast">Broadcast: 192.168.10.<strong>255</strong></span>
                </div>
            </article>
            <article class="learning-card">
                <h3>Broadcastadressen – fællesbeskeden</h3>
                <p>Broadcastadressen er den adresse, alle enheder lytter efter, når der skal sendes en besked til hele netværket på én gang – f.eks. når en lærer-pc vil fortælle alle computere, at der er en vigtig besked.</p>
                <ul>
                    <li>I IPv4 er det adressen med alle værtsbits sat til 1, f.eks. <code>192.168.10.255</code>. Det er noget helt andet end MAC-broadcasten <code>ff:ff:ff:ff:ff:ff</code>, som hører til på lag 2.</li>
                    <li>Den må ikke gives til en enkelt enhed – den er reserveret til fællesbeskeder.</li>
                    <li>Når netværket vokser, hjælper broadcastadressen med at nå alle hurtigt, uden at sende beskeden en ad gangen.</li>
                </ul>
                <p>Eksempel: Når en ny elev-pc tændes og bruger DHCP til at spørge “Er der en DHCP-server?”, sendes spørgsmålet til broadcastadressen, så alle i netværket hører det på samme tid.</p>
            </article>
            <article class="learning-card">
                <h3>Samspillet i praksis</h3>
                <p>En enhed i LAN'et sender normalt til andre værter. Kun når destinationen ligger uden for netadressen, kontakter den routeren. Når en besked skal ud til alle, bruges broadcastadressen. Det er derfor vigtigt at kende begge adresser, før vi begynder på selve subnetting-arbejdet.</p>
                <p class="tip-box">Tip: Du kan altid finde net- og broadcastadressen ved at kigge på netmasken og se, hvilke bits der er låst (net) og hvilke der kan skifte (værter). Selve beregningen lærer du i de næste faner.</p>
            </article>
        </section>
        <section role="tabpanel" id="panel-classful" aria-labelledby="tab-classful" hidden>
            <article class="learning-card">
                <h3>Klasse A, B og C – den oprindelige struktur</h3>
                <p>Inden vi begynder at dele netværk op i mindre bidder, er det nyttigt at forstå de historiske <strong>adresseklasser</strong>. Internetprotokollen delte tidligere alle IPv4-adresser ind i klasse A, B og C. Hver klasse har en fast længde på netdelen og dermed et fast antal værtsadresser.</p>
                <ul>
                    <li><strong>Klasse A</strong>: første octet 1–126. Netmasken er <code>/8</code> (255.0.0.0) og giver over 16 millioner værter i hvert net.</li>
                    <li><strong>Klasse B</strong>: første octet 128–191. Netmasken er <code>/16</code> (255.255.0.0) og giver op til 65&nbsp;534 værter.</li>
                    <li><strong>Klasse C</strong>: første octet 192–223. Netmasken er <code>/24</code> (255.255.255.0) og giver 254 værter.</li>
                </ul>
                <p>Denne opdeling gjorde det nemt at fordele adresser efter størrelse, men gav ofte spild af adresser. Derfor bruger vi i dag CIDR og subnetting – men klassemodellen er stadig nyttig for at forstå standardmasker.</p>
            </article>
            <article class="learning-card class-card">
                <h3>Se hvilken klasse en adresse tilhører</h3>
                <div class="class-simulator" data-class-simulator>
                    <div class="class-inputs">
                        <label for="class-ip">IP-adresse til undersøgelse
                            <input type="text" id="class-ip" name="class-ip" value="192.168.10.34" inputmode="decimal" autocomplete="off" aria-describedby="class-ip-help">
                        </label>
                        <p id="class-ip-help" class="help-text">Indtast en adresse fra dit LAN. Simulatoren viser, hvilken klasse den hører til, og hvilke standardgrænser der gælder.</p>
                    </div>
                    <p class="class-error" data-class-field="error" role="alert" hidden>Indtast en IPv4-adresse i klasse A, B eller C (fx 10.0.0.15 eller 172.16.4.8).</p>
                    <dl class="class-results" aria-live="polite">
                        <div>
                            <dt>Adresseklasse</dt>
                            <dd data-class-field="label">Klasse C (192.0.0.0 – 223.255.255.255)</dd>
                        </div>
                        <div>
                            <dt>Standard netmaske</dt>
                            <dd data-class-field="defaultMask">/24 – 255.255.255.0</dd>
                        </div>
                        <div>
                            <dt>Netadresse (klassemaske)</dt>
                            <dd data-class-field="network">192.168.10.0</dd>
                        </div>
                        <div>
                            <dt>Broadcastadresse</dt>
                            <dd data-class-field="broadcast">192.168.10.255</dd>
                        </div>
                        <div>
                            <dt>Mulige værter</dt>
                            <dd data-class-field="hosts">254 adresser (standard)</dd>
                        </div>
                    </dl>
                    <p class="help-text">Klasseinddelingen er grundlaget for standardmasker. Senere i forløbet viser vi, hvordan subnetting ændrer netmasken for at få net i den størrelse, man har brug for.</p>
                </div>
            </article>
        </section>
        <section role="tabpanel" id="panel-subnetting" aria-labelledby="tab-subnetting" hidden>
            <article class="learning-card subnet-card">
                <h3>Hvorfor subnetting og hvad er CIDR?</h3>
                <p>Subnetting betyder, at vi deler et større netværk op i mindre, kontrollerede bidder. I stedet for kun at bruge de historiske klasser, arbejder vi med <strong>CIDR</strong> (Classless Inter-Domain Routing). Her beskrives masken med en <em>prefixlængde</em>, fx <code>/26</code>, som fortæller hvor mange af de 32 bits der er låst til netdelen.</p>
                <ul>
                    <li><strong>Lån bits</strong>: Vi “låner” værtsbits og gør dem til netbits for at få flere netværk.</li>
                    <li><strong>Passer til behov</strong>: Mindre subnet giver mindre broadcaststøj og bedre kontrol over adresser. Animationen herunder viser to /26-net, hvor broadcastfelterne blinker for at understrege adskillelsen.</li>
                    <li><strong>Respektér klassen</strong>: Vi tager altid udgangspunkt i en klasse A, B eller C-adresse. Adresser som <code>127.x.x.x</code> (loopback) eller klasse D/E bruges ikke til almindelig subnetting.</li>
                </ul>
                <figure class="subnet-animation" aria-labelledby="subnet-animation-caption">
                    <figcaption id="subnet-animation-caption">To /26-delnet fra det oprindelige 192.168.10.0/24-net: hvert net får sit eget broadcastfelt og færre værter.</figcaption>
                    <div class="subnet-animation-stage" aria-hidden="true">
                        <div class="subnet-animation-network">
                            <p class="label">Subnet A – 192.168.10.0/26</p>
                            <div class="bar">
                                <span class="hosts">Værter 192.168.10.1 – 192.168.10.62</span>
                                <span class="broadcast">Broadcast 192.168.10.63</span>
                            </div>
                        </div>
                        <div class="subnet-animation-network">
                            <p class="label">Subnet B – 192.168.10.64/26</p>
                            <div class="bar">
                                <span class="hosts">Værter 192.168.10.65 – 192.168.10.126</span>
                                <span class="broadcast">Broadcast 192.168.10.127</span>
                            </div>
                        </div>
                    </div>
                </figure>
                <p>Prefixlængden og netmasken hænger sammen: <code>/26</code> betyder 26 netbits og en maske på <code>255.255.255.192</code>. Hver gang du øger prefixet med én, halveres antal værter pr. subnet – men du får tilsvarende flere net.</p>
            </article>
            <article class="learning-card subnet-card">
                <h3>Simulator: Fra klasse til subnet</h3>
                <div class="subnet-simulator" data-subnet-simulator>
                    <div class="subnet-inputs">
                        <label for="subnet-ip">Grundadresse (klasse A, B eller C)
                            <input type="text" id="subnet-ip" name="subnet-ip" value="192.168.10.0" inputmode="decimal" autocomplete="off" aria-describedby="subnet-ip-help">
                        </label>
                        <p id="subnet-ip-help" class="help-text">Vælg et net i dit LAN som udgangspunkt. Undgå 0.x.x.x, 127.x.x.x og klasse D/E, da de ikke subnettes i praksis.</p>
                        <label for="subnet-prefix">Prefixlængde (låste netbits)
                            <input type="range" id="subnet-prefix" name="subnet-prefix" min="8" max="30" value="24">
                            <output id="subnet-prefix-display" for="subnet-prefix">24</output>
                        </label>
                    </div>
                    <p class="subnet-error" data-subnet-field="error" role="alert" hidden>Indtast en gyldig klasse A-, B- eller C-adresse (ikke 127.x.x.x).</p>
                    <dl class="subnet-results" aria-live="polite">
                        <div>
                            <dt>Adresseklasse</dt>
                            <dd data-subnet-field="classLabel">Klasse C – 192.0.0.0 – 223.255.255.255</dd>
                        </div>
                        <div>
                            <dt>Standardmaske</dt>
                            <dd data-subnet-field="defaultMask">/24 – 255.255.255.0</dd>
                        </div>
                        <div>
                            <dt>Valgt prefix og maske</dt>
                            <dd data-subnet-field="selectedMask">/24 – 255.255.255.0</dd>
                        </div>
                        <div>
                            <dt>Netmaske (binær)</dt>
                            <dd data-subnet-field="maskBinary" class="bit-field">11111111.11111111.11111111.00000000</dd>
                        </div>
                        <div>
                            <dt>Lånte bits</dt>
                            <dd data-subnet-field="borrowedBits">0 lånte bit (giver 1 delnet)</dd>
                        </div>
                        <div>
                            <dt>Antal subnet</dt>
                            <dd data-subnet-field="subnetCount">1 delnet</dd>
                        </div>
                        <div>
                            <dt>Brugbare værter pr. subnet</dt>
                            <dd data-subnet-field="hostCount">254 adresser (8 værtsbits)</dd>
                        </div>
                        <div>
                            <dt>Subnetoversigt</dt>
                            <dd data-subnet-field="subnetList">—</dd>
                        </div>
                    </dl>
                    <div class="host-requirement">
                        <label for="subnet-hosts">Hvor mange værter skal ét subnet mindst rumme?
                            <input type="number" id="subnet-hosts" name="subnet-hosts" min="1" step="1" placeholder="fx 50">
                        </label>
                        <p class="help-text" data-subnet-field="hostAdvice">Angiv et antal værter for at få en anbefaling til prefix.</p>
                    </div>
                </div>
            </article>
            <article class="learning-card subnet-card">
                <h3>Tips til beregninger</h3>
                <ul class="tip-list">
                    <li><strong>Antal subnet</strong>: <code>2<sup>lånte bits</sup></code>. Låner du fx 3 bits i en klasse C (<code>/27</code>), får du 8 subnet.</li>
                    <li><strong>Brugbare værter</strong>: <code>2<sup>værtsbits</sup> - 2</code>. Ved <code>/27</code> er der 5 værtsbits, altså 30 værter pr. subnet.</li>
                    <li><strong>Spring-størrelse</strong>: Del 256 med antallet af subnet i sidste octet for at finde næste netadresse. Ved <code>/26</code> (4 subnet) er springet 64: <code>192.168.10.0</code>, <code>.64</code>, <code>.128</code>, <code>.192</code>.</li>
                    <li><strong>Undgå særafdelinger</strong>: Hold dig fra 127.x.x.x (loopback) og klasse D/E-adresser til multicast og forskning. De bruges ikke i almindelige LAN-subnet.</li>
                </ul>
            </article>
        </section>
    </div>`;
}

function setupLearnTabs(container) {
    const tablist = container.querySelector('.learn-tabs');
    if (!tablist) return;

    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    const panels = tabs.map(tab => container.querySelector(`#${tab.getAttribute('aria-controls')}`));

    function activateTab(tab) {
        tabs.forEach((button, index) => {
            const isActive = button === tab;
            button.setAttribute('aria-selected', isActive ? 'true' : 'false');
            button.setAttribute('tabindex', isActive ? '0' : '-1');
            button.classList.toggle('active', isActive);
            const panel = panels[index];
            if (panel) {
                if (isActive) {
                    panel.removeAttribute('hidden');
                } else {
                    panel.setAttribute('hidden', '');
                }
            }
        });
    }

    function focusTab(tab) {
        tab.focus();
    }

    tablist.addEventListener('click', event => {
        const target = event.target;
        if (target instanceof HTMLElement && target.getAttribute('role') === 'tab') {
            activateTab(target);
            focusTab(target);
        }
    });

    tablist.addEventListener('keydown', event => {
        const currentTab = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const currentIndex = currentTab ? tabs.indexOf(currentTab) : -1;
        if (currentIndex === -1) return;

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            const next = tabs[(currentIndex + 1) % tabs.length];
            activateTab(next);
            focusTab(next);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            const prev = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
            activateTab(prev);
            focusTab(prev);
        } else if (event.key === 'Home') {
            event.preventDefault();
            activateTab(tabs[0]);
            focusTab(tabs[0]);
        } else if (event.key === 'End') {
            event.preventDefault();
            const last = tabs[tabs.length - 1];
            activateTab(last);
            focusTab(last);
        }
    });

    activateTab(tabs[0]);
}

function setupClassSimulator(container) {
    const simulator = container.querySelector('[data-class-simulator]');
    if (!simulator) return;

    const ipInput = simulator.querySelector('#class-ip');
    const errorField = simulator.querySelector('[data-class-field="error"]');
    const fields = {
        label: simulator.querySelector('[data-class-field="label"]'),
        defaultMask: simulator.querySelector('[data-class-field="defaultMask"]'),
        network: simulator.querySelector('[data-class-field="network"]'),
        broadcast: simulator.querySelector('[data-class-field="broadcast"]'),
        hosts: simulator.querySelector('[data-class-field="hosts"]')
    };

    if (!ipInput) return;

    function updateSimulator() {
        const ipParts = parseIp(ipInput.value.trim());
        if (!ipParts) {
            showError('Indtast en IPv4-adresse i klasse A, B eller C (fx 10.0.0.15 eller 172.16.4.8).');
            setPlaceholders();
            return;
        }

        const classInfo = getClassInfo(ipParts[0]);
        if (!classInfo) {
            showError('Adressen skal ligge i klasse A, B eller C for denne simulering.');
            setPlaceholders();
            return;
        }

        hideError();
        const maskNumber = maskFromBits(classInfo.defaultBits);
        const ipNumber = ipPartsToNumber(ipParts);
        const networkNumber = ipNumber & maskNumber;
        const broadcastNumber = networkNumber | (~maskNumber >>> 0);

        updateField('label', `${classInfo.label} (${classInfo.range})`);
        updateField('defaultMask', `/${classInfo.defaultBits} – ${numberToIp(maskNumber)}`);
        updateField('network', numberToIp(networkNumber));
        updateField('broadcast', numberToIp(broadcastNumber));
        updateField('hosts', formatClassHostCount(32 - classInfo.defaultBits));
    }

    function showError(message) {
        if (!errorField) return;
        errorField.textContent = message;
        errorField.hidden = false;
    }

    function hideError() {
        if (!errorField) return;
        errorField.hidden = true;
    }

    function setPlaceholders() {
        Object.values(fields).forEach(field => {
            if (field) field.textContent = '—';
        });
    }

    function updateField(key, value) {
        const field = fields[key];
        if (field) {
            field.textContent = value;
        }
    }

    ipInput.addEventListener('input', updateSimulator);

    updateSimulator();
}

function setupSubnettingSimulator(container) {
    const simulator = container.querySelector('[data-subnet-simulator]');
    if (!simulator) return;

    const ipInput = simulator.querySelector('#subnet-ip');
    const prefixInput = simulator.querySelector('#subnet-prefix');
    const prefixDisplay = simulator.querySelector('#subnet-prefix-display');
    const hostInput = simulator.querySelector('#subnet-hosts');
    const errorField = simulator.querySelector('[data-subnet-field="error"]');
    const fields = {
        classLabel: simulator.querySelector('[data-subnet-field="classLabel"]'),
        defaultMask: simulator.querySelector('[data-subnet-field="defaultMask"]'),
        selectedMask: simulator.querySelector('[data-subnet-field="selectedMask"]'),
        maskBinary: simulator.querySelector('[data-subnet-field="maskBinary"]'),
        borrowedBits: simulator.querySelector('[data-subnet-field="borrowedBits"]'),
        subnetCount: simulator.querySelector('[data-subnet-field="subnetCount"]'),
        hostCount: simulator.querySelector('[data-subnet-field="hostCount"]'),
        subnetList: simulator.querySelector('[data-subnet-field="subnetList"]'),
        hostAdvice: simulator.querySelector('[data-subnet-field="hostAdvice"]')
    };

    if (!ipInput || !prefixInput || !prefixDisplay || !hostInput) return;

    function updateSimulator() {
        let prefixBits = parseInt(prefixInput.value, 10);
        if (!Number.isInteger(prefixBits)) {
            prefixBits = 24;
        }

        const ipParts = parseIp(ipInput.value.trim());
        if (!ipParts) {
            prefixInput.min = '8';
            prefixInput.max = '30';
            prefixDisplay.textContent = String(prefixBits);
            showError('Indtast en gyldig IPv4-adresse i klasse A, B eller C (fx 10.0.0.0 eller 192.168.0.0).');
            setPlaceholders();
            return;
        }

        const classInfo = getClassInfo(ipParts[0]);
        if (!classInfo) {
            prefixInput.min = '8';
            prefixInput.max = '30';
            prefixDisplay.textContent = String(prefixBits);
            showError('Adressen skal være i klasse A, B eller C. 127.x.x.x og klasse D/E subnettes ikke.');
            setPlaceholders();
            return;
        }

        hideError();
        const minPrefix = classInfo.defaultBits;
        const maxPrefix = 30;
        prefixBits = Math.min(Math.max(prefixBits, minPrefix), maxPrefix);
        if (prefixBits !== parseInt(prefixInput.value, 10)) {
            prefixInput.value = String(prefixBits);
        }
        prefixInput.min = String(minPrefix);
        prefixInput.max = String(maxPrefix);
        prefixDisplay.textContent = String(prefixBits);

        const selectedMaskNumber = maskFromBits(prefixBits);
        const selectedMask = numberToIp(selectedMaskNumber);
        const defaultMaskNumber = maskFromBits(classInfo.defaultBits);
        const ipNumber = ipPartsToNumber(ipParts);
        const classNetworkNumber = ipNumber & defaultMaskNumber;
        const borrowedBits = Math.max(0, prefixBits - classInfo.defaultBits);
        const subnetCount = 2 ** borrowedBits;
        const hostBits = 32 - prefixBits;

        updateField('classLabel', `${classInfo.label} – ${classInfo.range}`);
        updateField('defaultMask', `/${classInfo.defaultBits} – ${numberToIp(defaultMaskNumber)}`);
        updateField('selectedMask', `/${prefixBits} – ${selectedMask}`);
        updateField('maskBinary', formatMaskBinary(prefixBits, classInfo.defaultBits));
        updateField('borrowedBits', formatBorrowedBits(borrowedBits));
        updateField('subnetCount', formatSubnetCount(subnetCount));
        updateField('hostCount', formatHostCount(hostBits));
        updateField('subnetList', formatSubnetList(classNetworkNumber, prefixBits, subnetCount, hostBits, classInfo.defaultBits));

        updateHostAdvice(classInfo, prefixBits, hostBits);
    }

    function updateHostAdvice(classInfo, prefixBits, hostBits) {
        const adviceField = fields.hostAdvice;
        if (!adviceField) return;

        const value = hostInput.value.trim();
        if (!value) {
            adviceField.textContent = 'Angiv et antal værter for at få en anbefaling til prefix.';
            return;
        }

        const required = Number(value);
        if (!Number.isFinite(required) || required <= 0) {
            adviceField.textContent = 'Indtast et positivt heltal for antal værter.';
            return;
        }

        const requiredInt = Math.floor(required);
        const neededHostBits = Math.max(2, Math.ceil(Math.log2(requiredInt + 2)));
        const recommendedPrefix = 32 - neededHostBits;

        if (recommendedPrefix < classInfo.defaultBits) {
            adviceField.textContent = `${classInfo.label} kan højst give ${formatHostCount(32 - classInfo.defaultBits)}. Vælg en adresse i ${suggestClass(requiredInt)} eller fordel værterne på flere subnet.`;
            return;
        }

        const recommendedCapacity = formatHostCount(neededHostBits);
        const currentCapacity = formatHostCount(hostBits);

        if (prefixBits <= recommendedPrefix) {
            adviceField.textContent = `Prefix /${recommendedPrefix} dækker behovet (${recommendedCapacity}). Din nuværende indstilling /${prefixBits} giver ${currentCapacity}.`;
        } else {
            adviceField.textContent = `Dit valgte prefix /${prefixBits} giver ${currentCapacity}. For mindst ${requiredInt} værter skal du vælge mindst /${recommendedPrefix} (${recommendedCapacity}).`;
        }
    }

    function showError(message) {
        if (!errorField) return;
        errorField.textContent = message;
        errorField.hidden = false;
    }

    function hideError() {
        if (!errorField) return;
        errorField.hidden = true;
    }

    function setPlaceholders() {
        updateField('classLabel', '—');
        updateField('defaultMask', '—');
        updateField('selectedMask', '—');
        updateField('maskBinary', '—');
        updateField('borrowedBits', '—');
        updateField('subnetCount', '—');
        updateField('hostCount', '—');
        updateField('subnetList', '—');
        const adviceField = fields.hostAdvice;
        if (adviceField) {
            adviceField.textContent = 'Angiv et antal værter for at få en anbefaling til prefix.';
        }
    }

    function updateField(key, value) {
        const field = fields[key];
        if (field) {
            if (typeof value === 'object' && value !== null && 'html' in value) {
                field.innerHTML = value.html;
            } else {
                field.textContent = value;
            }
        }
    }

    ipInput.addEventListener('input', updateSimulator);
    prefixInput.addEventListener('input', updateSimulator);
    hostInput.addEventListener('input', updateSimulator);

    updateSimulator();
}

function parseIp(value) {
    const parts = value.split('.').map(part => part.trim());
    if (parts.length !== 4) return null;
    const numbers = parts.map(part => {
        if (part === '') return NaN;
        const num = Number(part);
        return Number.isInteger(num) ? num : NaN;
    });
    if (numbers.some(num => Number.isNaN(num) || num < 0 || num > 255)) {
        return null;
    }
    return numbers;
}

function ipPartsToNumber(parts) {
    return ((parts[0] << 24) >>> 0) | ((parts[1] << 16) >>> 0) | ((parts[2] << 8) >>> 0) | (parts[3] >>> 0);
}

function numberToIp(number) {
    const octets = [
        (number >>> 24) & 0xff,
        (number >>> 16) & 0xff,
        (number >>> 8) & 0xff,
        number & 0xff
    ];
    return octets.join('.');
}

function maskFromBits(bits) {
    if (bits <= 0) return 0;
    return (0xffffffff << (32 - bits)) >>> 0;
}

function maskToBinaryString(mask) {
    const octets = [
        (mask >>> 24) & 0xff,
        (mask >>> 16) & 0xff,
        (mask >>> 8) & 0xff,
        mask & 0xff
    ];
    return octets.map(octet => octet.toString(2).padStart(8, '0')).join('.');
}

function getBinaryOctets(number) {
    return [
        ((number >>> 24) & 0xff).toString(2).padStart(8, '0'),
        ((number >>> 16) & 0xff).toString(2).padStart(8, '0'),
        ((number >>> 8) & 0xff).toString(2).padStart(8, '0'),
        (number & 0xff).toString(2).padStart(8, '0')
    ];
}

function formatHostCount(hostBits) {
    if (hostBits <= 0) {
        return 'Ingen brugbare værter (kun netadressen)';
    }
    if (hostBits === 1) {
        return '0 adresser (kun net- og broadcastadresse)';
    }
    const hosts = (2 ** hostBits) - 2;
    return `${hosts.toLocaleString('da-DK')} adresser (${hostBits} værtsbits)`;
}

function formatClassHostCount(hostBits) {
    if (hostBits <= 1) {
        return 'Standardmasken giver ingen brugbare værter';
    }
    return `${formatHostCount(hostBits)} (standard)`;
}

function formatSubnetCount(subnetCount) {
    const rounded = Math.max(1, Math.floor(subnetCount));
    const label = rounded === 1 ? 'delnet' : 'delnet';
    return `${rounded.toLocaleString('da-DK')} ${label}`;
}

function formatBorrowedBits(borrowedBits) {
    if (borrowedBits <= 0) {
        return '0 lånte bit (giver 1 delnet)';
    }
    const subnetCount = 2 ** borrowedBits;
    const bitLabel = borrowedBits === 1 ? 'lånt bit' : 'lånte bit';
    return `${borrowedBits} ${bitLabel} (giver ${subnetCount.toLocaleString('da-DK')} delnet)`;
}

function formatMaskBinary(prefixBits, defaultBits) {
    const maskNumber = maskFromBits(prefixBits);
    const binaryMask = getBinaryOctets(maskNumber).join('.');
    let bitIndex = 0;
    let patternHtml = '';

    for (const char of binaryMask) {
        if (char === '.') {
            patternHtml += '<span class="bit-sep">.</span>';
            continue;
        }

        let bitClass = 'bit-host';
        if (bitIndex < defaultBits) {
            bitClass = 'bit-default';
        } else if (bitIndex < prefixBits) {
            bitClass = 'bit-borrowed';
        }

        patternHtml += `<span class="${bitClass}">${char}</span>`;
        bitIndex += 1;
    }

    const borrowedBits = Math.max(0, prefixBits - defaultBits);
    const hostBits = Math.max(0, 32 - prefixBits);
    const borrowedText = borrowedBits > 0 ? `${borrowedBits} lånte bit er markeret med fed guld.` : 'Ingen lånte bit – masken er standard for adressens klasse.';
    const hostText = hostBits > 0 ? `${hostBits} værtsbit er vist i grå.` : 'Ingen værtsbit er tilbage i denne maske.';
    return {
        html: `<code class="bit-pattern" aria-hidden="true">${patternHtml}</code><p class="bit-legend">Blå = oprindelige netbit, <strong>guld = lånte bit</strong>, grå = værtsbit.</p><p class="sr-only">${borrowedText} ${hostText}</p>`
    };
}

function formatSubnetList(baseNetworkNumber, prefixBits, subnetCount, hostBits, defaultBits) {
    if (!Number.isFinite(baseNetworkNumber) || subnetCount <= 0) {
        return '—';
    }
    const subnetSize = 2 ** (32 - prefixBits);
    const maxPreview = Math.max(1, Math.min(subnetCount, 8));
    const items = [];
    for (let index = 0; index < maxPreview; index += 1) {
        const networkNumber = (baseNetworkNumber + index * subnetSize) >>> 0;
        const broadcastNumber = (networkNumber + subnetSize - 1) >>> 0;
        items.push(formatSubnetListItem(index + 1, networkNumber, broadcastNumber, prefixBits, hostBits));
    }
    const listHtml = `<ol class="subnet-list" aria-label="Subnetoversigt">${items.join('')}</ol>`;
    const remainder = subnetCount - maxPreview;
    if (remainder > 0) {
        const baseLabel = numberToIp(baseNetworkNumber);
        return {
            html: `${listHtml}<p class="subnet-list-note">Viser de første ${maxPreview} af ${subnetCount.toLocaleString('da-DK')} delnet i ${baseLabel}/${defaultBits}-området.</p>`
        };
    }
    return { html: listHtml };
}

function formatSubnetListItem(index, networkNumber, broadcastNumber, prefixBits, hostBits) {
    const networkLabel = numberToIp(networkNumber);
    const broadcastLabel = numberToIp(broadcastNumber);
    const hostRange = formatHostRange(networkNumber, broadcastNumber, hostBits);
    return `<li><div class="subnet-line"><span class="subnet-index">${index}.</span><span class="subnet-network"><strong>${networkLabel}/${prefixBits}</strong></span></div><div class="subnet-meta"><span class="subnet-broadcast">Broadcast ${broadcastLabel}</span><span class="subnet-hosts">${hostRange}</span></div></li>`;
}

function formatHostRange(networkNumber, broadcastNumber, hostBits) {
    if (hostBits <= 1) {
        return 'Ingen brugbare værter (kun net- og broadcastadresse)';
    }
    const firstHost = numberToIp((networkNumber + 1) >>> 0);
    const lastHost = numberToIp((broadcastNumber - 1) >>> 0);
    const hostCount = (2 ** hostBits) - 2;
    return `${firstHost} – ${lastHost} (${hostCount.toLocaleString('da-DK')} værter)`;
}

function suggestClass(requiredHosts) {
    if (requiredHosts <= 254) {
        return 'klasse C';
    }
    if (requiredHosts <= 65534) {
        return 'klasse B';
    }
    if (requiredHosts <= 16777214) {
        return 'klasse A';
    }
    return 'IPv6';
}

function getClassInfo(firstOctet) {
    if (firstOctet >= 1 && firstOctet <= 126) {
        return {
            label: 'Klasse A',
            defaultBits: 8,
            range: '1.0.0.0 – 126.255.255.255'
        };
    }
    if (firstOctet === 127) {
        return null;
    }
    if (firstOctet >= 128 && firstOctet <= 191) {
        return {
            label: 'Klasse B',
            defaultBits: 16,
            range: '128.0.0.0 – 191.255.255.255'
        };
    }
    if (firstOctet >= 192 && firstOctet <= 223) {
        return {
            label: 'Klasse C',
            defaultBits: 24,
            range: '192.0.0.0 – 223.255.255.255'
        };
    }
    return null;
}

function renderPractice(container) {
    if (!state.templates) {
        container.innerHTML = `
            <section aria-labelledby="practice-heading">
                <h2 id="practice-heading">Øvelsesopgaver</h2>
                <p>Indlæser skabeloner til AI-opgaver …</p>
            </section>
        `;
        return;
    }

    const topics = Object.keys(state.templates.topics || {});

    if (!topics.length) {
        container.innerHTML = `
            <section aria-labelledby="practice-heading">
                <h2 id="practice-heading">Øvelsesopgaver</h2>
                <p>Der er endnu ikke defineret nogen emner i skabelonbiblioteket.</p>
            </section>
        `;
        return;
    }

    container.innerHTML = `
        <section aria-labelledby="practice-heading" class="practice-section">
            <h2 id="practice-heading">Øv dig med AI-genererede opgaver</h2>
            <p>Vælg et emne, generér et sæt opgaver og træn flere opgaver i samme spor. Alle besvarelser evalueres automatisk, og du får hjælpende feedback når der er fejl.</p>
            <div class="practice-topic-grid">
                ${topics.map(topic => renderPracticeTopicSection(topic)).join('')}
            </div>
        </section>
    `;

    setupPracticeTopicHandlers(container);
    bindTaskEvents(container);
}

function renderPracticeTopicSection(topic) {
    const label = PRACTICE_TOPIC_LABELS[topic] || topic.toUpperCase();
    const topicConfig = state.templates?.topics?.[topic] || {};
    const availableDifficulties = Object.keys(topicConfig).map(Number).sort((a, b) => a - b);
    const stored = state.practiceSets[topic] || { tasks: [] };
    const selectedDifficulty = stored.difficulty || availableDifficulties[0] || 1;
    const selectedCount = Math.min(10, Math.max(1, stored.count || 3));
    const loading = Boolean(state.practiceLoading[topic]);
    const error = state.practiceErrors[topic];
    const tasks = Array.isArray(stored.tasks) ? stored.tasks : [];
    const notice = state.practiceNotices[topic];

    const difficultyOptions = (availableDifficulties.length ? availableDifficulties : [selectedDifficulty]).map(value => `
        <option value="${value}" ${value === selectedDifficulty ? 'selected' : ''}>Niveau ${value}</option>
    `).join('');

    const taskMarkup = tasks.length
        ? tasks.map((task, index) => renderTaskCard(task, 'practice', { topic, index })).join('')
        : '<p class="empty">Ingen opgaver endnu. Vælg sværhedsgrad og generér et sæt.</p>';

    const loadingMarkup = loading ? '<p class="loading" role="status">Genererer opgaver …</p>' : '';
    const errorMarkup = error ? `<p class="error" role="alert">${error}</p>` : '';
    const noticeMarkup = notice ? `<p class="info-notice" role="status">${escapeHtml(notice)}</p>` : '';

    return `
        <article class="practice-topic" data-topic="${topic}">
            <header>
                <h3>${label}</h3>
            </header>
            <form class="practice-generator" data-topic="${topic}" novalidate>
                <label>Vælg sværhedsgrad
                    <select name="difficulty">${difficultyOptions}</select>
                </label>
                <label>Antal opgaver
                    <input type="number" name="count" min="1" max="10" step="1" value="${selectedCount}">
                </label>
                <button type="submit" class="button">Generér opgaver</button>
            </form>
            ${errorMarkup}
            ${loadingMarkup}
            <div class="task-list" data-topic="${topic}">${noticeMarkup}${!loading || tasks.length ? taskMarkup : ''}</div>
        </article>
    `;
}

function setupPracticeTopicHandlers(container) {
    container.querySelectorAll('.practice-generator').forEach(form => {
        form.addEventListener('submit', handlePracticeGenerate);
    });
}

function renderTest(container) {
    const existing = state.progress.testSession;
    if (!existing) {
        container.innerHTML = `
            <section class="learning-card" aria-labelledby="test-heading">
                <h2 id="test-heading">Test dig selv</h2>
                <p>Testen består af 10 spørgsmål i stigende sværhedsgrad. Du kan tage testen så mange gange du vil.</p>
                <a href="#/test" class="button" data-action="start-test">Start test</a>
            </section>
        `;
    } else {
        container.innerHTML = buildTestView(existing);
        bindTaskEvents(container);
    }
}

function startTestSession() {
    const shuffled = [...state.tasks].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));
    const testSession = {
        id: `test-${Date.now()}`,
        startedAt: new Date().toISOString(),
        tasks: selected,
        results: {}
    };
    state.progress.testSession = testSession;
    saveProgress();
    renderTest(document.getElementById('app'));
}

function buildTestView(session) {
    const answered = Object.values(session.results);
    const totalScore = answered.reduce((sum, item) => sum + (item.score || 0), 0);
    const completed = answered.length;
    const summary = completed === session.tasks.length ? `Du har afsluttet testen med ${totalScore} ud af ${session.tasks.length} mulige point.` : `Du har besvaret ${completed} af ${session.tasks.length} spørgsmål.`;

    return `
        <section aria-labelledby="test-running">
            <h2 id="test-running">Aktiv test</h2>
            <p>${summary}</p>
            <div class="task-list">
                ${session.tasks.map(task => renderTaskCard(task, 'test')).join('')}
            </div>
        </section>
    `;
}

function renderAi(container) {
    const teacherNotice = state.teacherMode ? '' : '<p class="storage-notice">Du er i elevtilstand. Kun visning af opgaver er mulig.</p>';
    const topicOptions = state.templates ? Object.keys(state.templates.topics || {}).map(topic => `<option value="${topic}">${topic.toUpperCase()}</option>`).join('') : '';

    container.innerHTML = `
        <section class="ai-panel" aria-labelledby="ai-heading">
            <h2 id="ai-heading">AI-genererede opgavesæt</h2>
            ${teacherNotice}
            ${state.teacherMode ? `
            <section class="ai-settings">
                <h3>Generér opgaver</h3>
                <form id="ai-generator" novalidate>
                    <fieldset ${state.teacherMode ? '' : 'disabled'}>
                        <label>Emne
                            <select name="topic" required>
                                <option value="" disabled selected>Vælg emne</option>
                                ${topicOptions}
                            </select>
                        </label>
                        <label>Sværhedsgrad (1-5)
                            <input name="difficulty" type="number" min="1" max="5" step="1" required>
                        </label>
                        <label>Antal opgaver (1-10)
                            <input name="count" type="number" min="1" max="10" step="1" required>
                        </label>
                        <div class="task-controls">
                            <button type="submit" class="button">Generér</button>
                            <button type="button" id="ai-save" class="button secondary">Gem sæt</button>
                            <button type="button" id="ai-load" class="button secondary">Indlæs gemte sæt</button>
                        </div>
                    </fieldset>
                </form>
                <p id="ai-storage-status" class="pin-feedback"></p>
            </section>` : ''}
            <section>
                <h3>Aktuelt opgavesæt</h3>
                <div id="ai-task-container" class="ai-tasks" role="region" aria-live="polite"></div>
            </section>
        </section>
    `;

    const form = container.querySelector('#ai-generator');
    const saveBtn = container.querySelector('#ai-save');
    const loadBtn = container.querySelector('#ai-load');
    const statusEl = container.querySelector('#ai-storage-status');

    if (form) {
        form.addEventListener('submit', handleGenerateTasks);
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => handleSaveAiSet(statusEl));
    }

    if (loadBtn) {
        loadBtn.addEventListener('click', () => handleLoadSavedSets(statusEl));
    }

    renderAiTasks(container.querySelector('#ai-task-container'));
}

function renderAiTasks(container) {
    if (!container) return;

    if (!state.aiSets.length) {
        container.innerHTML = '<p>Ingen AI-opgaver endnu. Generér eller indlæs et sæt.</p>';
        return;
    }

    const notice = state.aiNotice ? `<div class="info-notice" role="status">${escapeHtml(state.aiNotice)}</div>` : '';
    container.innerHTML = notice + state.aiSets.map((task, index) => renderTaskCard(task, 'ai', { index })).join('');
    bindTaskEvents(container);
}

function renderTaskCard(task, mode, options = {}) {
    const hasIndex = typeof options.index === 'number' && Number.isFinite(options.index);
    const index = hasIndex ? options.index : 0;
    const topic = options.topic || '';
    const progress = getTaskProgress(task.id, mode);
    const hints = Array.isArray(task.hints) ? task.hints : [];
    const hintHtml = progress?.hintsShown ? hints.slice(0, progress.hintsShown).map((hint, i) => `<div class="hint-text">Hint ${i + 1}: ${hint}</div>`).join('') : '';
    const answered = progress?.lastResult;
    const statusClass = answered ? (answered.is_correct ? 'correct' : 'incorrect') : '';
    const statusLabel = answered ? (answered.is_correct ? '✅ Korrekt' : '❌ Ikke korrekt endnu') : '';
    const disableInput = answered?.is_correct;

    let inputHtml = `<textarea name="answer" rows="4" ${disableInput ? 'disabled' : ''} aria-label="Dit svar"></textarea>`;

    if (task.type === 'multiple_choice' && Array.isArray(task.options)) {
        inputHtml = `
            <fieldset class="mc-fieldset" ${disableInput ? 'disabled' : ''}>
                <legend class="sr-only">Vælg svar</legend>
                ${task.options.map((option, optionIndex) => {
                    const optionId = `${task.id}-${optionIndex}`;
                    return `
                        <label class="mc-option">
                            <input type="checkbox" name="option" value="${option}" data-option-index="${optionIndex}" ${disableInput ? 'disabled' : ''}>
                            <span>${option}</span>
                        </label>`;
                }).join('')}
            </fieldset>`;
    }

    if (task.type === 'fill_in_table' && task.table) {
        const tables = Array.isArray(task.table) ? task.table : [task.table];
        let inputIndex = 0;

        inputHtml = tables.map((table, tableIndex) => {
            const headers = Array.isArray(table?.headers) ? table.headers : [];
            const title = typeof table?.title === 'string' ? table.title : '';
            const rows = Array.isArray(table?.rows) ? table.rows : [];
            const normalizedTitle = title.trim().toLowerCase();
            let tableType = 'generic';
            if (normalizedTitle.includes('opsummering')) {
                tableType = 'summary';
            } else if (normalizedTitle.includes('delnet')) {
                tableType = 'subnet-list';
            }
            const caption = title ? `<caption class="sr-only">${escapeHtml(title)}</caption>` : '';
            const tableTitle = title ? `<div class="table-title">${escapeHtml(title)}</div>` : '';

            const body = rows.map((row, rowIdx) => {
                const cells = normalizeTableRow(row).map((cell, cellIdx) => {
                    if (cell.editable) {
                        const labelParts = [];
                        if (title) labelParts.push(title);
                        const headerLabel = headers[cellIdx] || `Kolonne ${cellIdx + 1}`;
                        labelParts.push(`${headerLabel.toLowerCase()} række ${rowIdx + 1}`);
                        const ariaLabel = labelParts.join(', ');
                        const placeholder = cell.placeholder ? ` placeholder="${escapeAttribute(cell.placeholder)}"` : '';
                        const currentIndex = inputIndex;
                        inputIndex++;
                        return `<td><input type="text" name="table-${currentIndex}" data-input-index="${currentIndex}" ${disableInput ? 'disabled' : ''} aria-label="${escapeAttribute(ariaLabel)}"${placeholder}></td>`;
                    }
                    return `<td>${escapeHtml(cell.value)}</td>`;
                }).join('');
                return `<tr>${cells}</tr>`;
            }).join('');

            const headerRow = headers.length
                ? `<thead><tr>${headers.map(header => `<th scope="col">${escapeHtml(header)}</th>`).join('')}</tr></thead>`
                : '';

            return `
                <div class="table-wrapper" data-table-index="${tableIndex}" data-table-type="${tableType}">
                    ${tableTitle}
                    <table role="grid">
                        ${caption}
                        ${headerRow}
                        <tbody>${body}</tbody>
                    </table>
                </div>
            `;
        }).join('');
    }

    const showHintButton = hints.length > (progress?.hintsShown || 0);

    const solutionBlock = answered?.show_solution && answered.solution ? `<details><summary>Se løsning</summary><p>${answered.solution}</p></details>` : '';

    const attributes = [
        `data-task-id="${task.id}"`,
        `data-mode="${mode}"`
    ];
    if (hasIndex) {
        attributes.push(`data-index="${index}"`);
    }
    if (topic) {
        attributes.push(`data-topic="${topic}"`);
    }

    const statusChip = statusLabel ? `<span class="status-chip ${statusClass}">${statusLabel}</span>` : '';

    return `
        <article class="task-card" ${attributes.join(' ')}>
            <header>
                <h3>${task.title || 'Opgave'}</h3>
                ${statusChip}
            </header>
            <p>${task.question}</p>
            ${Array.isArray(task.steps) ? `<ol>${task.steps.map(step => `<li>${step}</li>`).join('')}</ol>` : ''}
            <form class="task-form">
                <div class="answer-wrapper">
                    <button type="button" class="close-answer-icon" data-action="close-answer" aria-label="Luk svarfelt">✕</button>
                    <div class="answer-inputs">${inputHtml}</div>
                </div>
                <div class="task-controls">
                    <button type="submit" class="button" ${disableInput ? 'disabled' : ''}>Aflevér</button>
                    ${showHintButton ? '<button type="button" class="hint-button" data-action="hint">Hint</button>' : ''}
                    <button type="button" class="hint-button" data-action="reset">Nulstil</button>
                    <button type="button" class="button secondary close-answer-button" data-action="close-answer">Luk svarfelt</button>
                </div>
            </form>
            ${hintHtml}
            ${answered ? renderFeedback(answered) : ''}
            ${solutionBlock}
        </article>`;
}

function renderFeedback(result) {
    const classes = ['feedback'];
    classes.push(result.is_correct ? 'correct' : 'incorrect');
    const brief = result.feedback_brief || (result.is_correct ? 'Flot klaret.' : 'Godt forsøg – tjek dine mellemregninger.');
    const next = result.feedback_next_step || (result.is_correct ? 'Gå videre til næste opgave.' : 'Brug hintsene eller gennemgå eksemplet igen.');
    return `
        <section class="${classes.join(' ')}" aria-live="polite">
            <h4>${result.is_correct ? 'Godt arbejde!' : 'Næsten i mål'}</h4>
            <p>${brief}</p>
            <p><strong>Næste skridt:</strong> ${next}</p>
        </section>`;
}

function bindTaskEvents(container) {
    container.querySelectorAll('.task-card').forEach(card => {
        const form = card.querySelector('.task-form');
        const hintBtn = card.querySelector('[data-action="hint"]');
        const resetBtn = card.querySelector('[data-action="reset"]');
        if (form) {
            form.addEventListener('submit', async event => {
                event.preventDefault();
                await handleSubmit(card, form);
            });
        }
        if (hintBtn) {
            hintBtn.addEventListener('click', () => handleHint(card));
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => resetTask(card));
        }
        setupAnswerExpansion(card);
    });
}

function handleHint(card) {
    const taskId = card.dataset.taskId;
    const mode = card.dataset.mode;
    const task = findTask(taskId, mode);
    const progress = getTaskProgress(taskId, mode);
    if (!task) return;
    const hints = Array.isArray(task.hints) ? task.hints : [];
    const shown = progress?.hintsShown || 0;
    if (shown >= Math.min(2, hints.length)) return;

    updateTaskProgress(taskId, mode, {
        hintsShown: shown + 1
    });
    rerenderTask(card, task, mode);
}

function resetTask(card) {
    const taskId = card.dataset.taskId;
    const mode = card.dataset.mode;
    updateTaskProgress(taskId, mode, {
        attempts: 0,
        hintsShown: 0,
        lastResult: null
    });
    rerenderTask(card, findTask(taskId, mode), mode);
}

function getTaskProgress(taskId, mode) {
    const key = `${mode}-${taskId}`;
    return state.progress[key] || null;
}

function updateTaskProgress(taskId, mode, data) {
    const key = `${mode}-${taskId}`;
    const current = state.progress[key] || {};
    state.progress[key] = { ...current, ...data };
    saveProgress();
}

function findTask(taskId, mode) {
    if (mode === 'ai') {
        return state.aiSets.find(task => task.id === taskId);
    }
    if (mode === 'practice') {
        for (const topicKey of Object.keys(state.practiceSets)) {
            const topicData = state.practiceSets[topicKey];
            if (!topicData || !Array.isArray(topicData.tasks)) continue;
            const found = topicData.tasks.find(task => task.id === taskId);
            if (found) return found;
        }
        return null;
    }
    return state.tasks.find(task => task.id === taskId);
}

async function handleSubmit(card, form) {
    const taskId = card.dataset.taskId;
    const mode = card.dataset.mode;
    const task = findTask(taskId, mode);
    if (!task) return;

    const answer = extractAnswer(form, task);
    const progress = getTaskProgress(taskId, mode) || {};
    const attempts = (progress.attempts || 0) + 1;

    try {
        const response = await fetch('server/api_evaluate.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task, userAnswer: answer, attempts })
        });

        if (!response.ok) {
            throw new Error('Serverfejl');
        }

        const result = await response.json();
        if (mode === 'practice' && !state.teacherMode) {
            result.show_solution = false;
            if ('solution' in result) {
                result.solution = null;
            }
        }
        if (state.teacherMode) {
            result.show_solution = true;
        }
        if (mode === 'test' && state.progress.testSession) {
            state.progress.testSession.results = state.progress.testSession.results || {};
            state.progress.testSession.results[taskId] = {
                score: result.score ?? 0,
                is_correct: result.is_correct ?? false
            };
        }
        updateTaskProgress(taskId, mode, {
            attempts,
            lastResult: result
        });
        rerenderTask(card, task, mode);
        logAttempt(taskId, mode, result);
    } catch (error) {
        console.error('Evalueringsfejl', error);
        showError(card, 'Der opstod en fejl under evalueringen. Prøv igen senere.');
    }
}

function extractAnswer(form, task) {
    if (task.type === 'multiple_choice') {
        return Array.from(form.querySelectorAll('input[name="option"]:checked')).map(input => input.value);
    }
    if (task.type === 'fill_in_table') {
        return Array.from(form.querySelectorAll('input[data-input-index]'))
            .sort((a, b) => Number(a.dataset.inputIndex) - Number(b.dataset.inputIndex))
            .map(input => input.value.trim());
    }
    const textarea = form.querySelector('textarea');
    return textarea ? textarea.value.trim() : '';
}

function normalizeTableRow(row) {
    if (Array.isArray(row)) {
        return row.map(normalizeTableCell);
    }
    if (row && typeof row === 'object') {
        const entries = Object.entries(row);
        return entries.map(([_, value], index) => {
            if (value && typeof value === 'object' && 'value' in value) {
                return normalizeTableCell(value);
            }
            return {
                value: typeof value === 'string' ? value : String(value ?? ''),
                editable: index > 0,
                placeholder: ''
            };
        });
    }
    return [{
        value: typeof row === 'string' ? row : String(row ?? ''),
        editable: true,
        placeholder: ''
    }];
}

function normalizeTableCell(cell) {
    if (cell && typeof cell === 'object') {
        const value = 'value' in cell ? cell.value : '';
        return {
            value: typeof value === 'string' ? value : String(value ?? ''),
            editable: Boolean(cell.editable),
            placeholder: typeof cell.placeholder === 'string' ? cell.placeholder : ''
        };
    }
    return {
        value: typeof cell === 'string' ? cell : String(cell ?? ''),
        editable: false,
        placeholder: ''
    };
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeAttribute(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

function rerenderTask(card, task, mode) {
    if (card.classList.contains('answer-expanded')) {
        closeAnswerArea(card, { skipFocusRestore: true, skipScrollRestore: true });
    }
    const container = card.parentElement;
    if (!container) return;
    const options = {};
    const indexValue = card.dataset.index ? parseInt(card.dataset.index, 10) : NaN;
    if (!Number.isNaN(indexValue)) {
        options.index = indexValue;
    }
    if (card.dataset.topic) {
        options.topic = card.dataset.topic;
    }
    card.outerHTML = renderTaskCard(task, mode, options);
    bindTaskEvents(container);
}

function setupAnswerExpansion(card) {
    const inputs = card.querySelectorAll('.answer-inputs textarea, .answer-inputs input, .answer-inputs select');
    inputs.forEach(input => {
        if (input.dataset.expandBound) return;
        input.dataset.expandBound = 'true';
        input.addEventListener('focus', () => {
            if (input.disabled || card.classList.contains('answer-expanded')) return;
            openAnswerArea(card, input);
        });
    });

    card.querySelectorAll('[data-action="close-answer"]').forEach(button => {
        if (button.dataset.expandBound) return;
        button.dataset.expandBound = 'true';
        button.addEventListener('click', event => {
            event.preventDefault();
            closeAnswerArea(card);
        });
    });
}

function ensureAnswerOverlay() {
    if (!answerExpansionState.overlay) {
        const overlay = document.createElement('div');
        overlay.className = 'answer-overlay';
        document.body.appendChild(overlay);
        answerExpansionState.overlay = overlay;
        if (!answerExpansionState.keyListenerAttached) {
            document.addEventListener('keydown', event => {
                if (event.key === 'Escape' && answerExpansionState.expandedCard) {
                    event.preventDefault();
                    closeAnswerArea(answerExpansionState.expandedCard);
                }
            });
            answerExpansionState.keyListenerAttached = true;
        }
    }
    return answerExpansionState.overlay;
}

function openAnswerArea(card, focusTarget) {
    const overlay = ensureAnswerOverlay();
    if (!overlay) return;
    if (answerExpansionState.expandedCard && answerExpansionState.expandedCard !== card) {
        closeAnswerArea(answerExpansionState.expandedCard, { skipFocusRestore: true, skipScrollRestore: true });
    }
    if (card.classList.contains('answer-expanded')) return;

    const placeholder = document.createElement('div');
    placeholder.className = 'task-card-placeholder';
    placeholder.style.height = `${card.offsetHeight}px`;
    answerExpansionState.previousScroll = window.scrollY;
    answerExpansionState.trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const parent = card.parentElement;
    if (parent) {
        parent.insertBefore(placeholder, card);
        answerExpansionState.placeholder = placeholder;
    } else {
        answerExpansionState.placeholder = null;
    }

    overlay.appendChild(card);
    overlay.classList.add('visible');
    document.body.classList.add('answer-overlay-active');
    card.classList.add('answer-expanded');
    answerExpansionState.expandedCard = card;

    requestAnimationFrame(() => {
        if (focusTarget && typeof focusTarget.focus === 'function') {
            focusTarget.focus();
        }
    });
}

function closeAnswerArea(card, options = {}) {
    const overlay = answerExpansionState.overlay;
    if (!overlay) return;
    if (!card.classList.contains('answer-expanded')) return;

    card.classList.remove('answer-expanded');
    overlay.classList.remove('visible');
    document.body.classList.remove('answer-overlay-active');

    if (answerExpansionState.placeholder && answerExpansionState.placeholder.parentElement) {
        answerExpansionState.placeholder.parentElement.replaceChild(card, answerExpansionState.placeholder);
    }
    answerExpansionState.placeholder = null;

    if (!options.skipScrollRestore) {
        window.scrollTo(0, answerExpansionState.previousScroll);
    }

    if (!options.skipFocusRestore && answerExpansionState.trigger && typeof answerExpansionState.trigger.focus === 'function') {
        answerExpansionState.trigger.focus();
    }

    answerExpansionState.expandedCard = null;
    answerExpansionState.trigger = null;
    answerExpansionState.previousScroll = 0;
}

function showError(card, message) {
    const existing = card.querySelector('.feedback');
    if (existing) {
        existing.outerHTML = `<section class="feedback incorrect" aria-live="polite"><h4>Fejl</h4><p>${message}</p></section>`;
    } else {
        card.insertAdjacentHTML('beforeend', `<section class="feedback incorrect" aria-live="polite"><h4>Fejl</h4><p>${message}</p></section>`);
    }
}

function logAttempt(taskId, mode, result) {
    try {
        const logEntry = {
            taskId,
            mode,
            is_correct: result?.is_correct ?? false,
            timestamp: new Date().toISOString()
        };
        const existing = JSON.parse(localStorage.getItem('subnetting-attempt-log') || '[]');
        existing.push(logEntry);
        localStorage.setItem('subnetting-attempt-log', JSON.stringify(existing.slice(-200)));
    } catch (error) {
        console.warn('Kunne ikke logge forsøg lokalt.', error);
    }
}

async function handleGenerateTasks(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const payload = {
        topic: formData.get('topic'),
        difficulty: Number(formData.get('difficulty')),
        count: Number(formData.get('count'))
    };

    try {
        state.aiNotice = null;
        const result = await requestAiTasks(payload);
        state.aiSets = result.tasks;
        state.aiNotice = result.message;
        renderAiTasks(document.getElementById('ai-task-container'));
    } catch (error) {
        console.error('Fejl ved generering', error);
        state.aiNotice = null;
        const container = document.getElementById('ai-task-container');
        if (container) {
            container.innerHTML = '<p>Kunne ikke generere opgaver. Prøv igen senere.</p>';
        }
    }
}

async function handlePracticeGenerate(event) {
    event.preventDefault();
    const form = event.target;
    const topic = form.dataset.topic;
    if (!topic) return;

    const formData = new FormData(form);
    const payload = {
        topic,
        difficulty: Number(formData.get('difficulty')),
        count: Number(formData.get('count'))
    };

    const availableDifficulties = Object.keys(state.templates?.topics?.[topic] || {}).map(Number);
    if (!Number.isFinite(payload.difficulty) || payload.difficulty < 1) {
        payload.difficulty = 1;
    }
    if (!Number.isFinite(payload.count) || payload.count < 1) {
        payload.count = 1;
    }
    payload.count = Math.min(10, Math.round(payload.count));

    if (!availableDifficulties.includes(payload.difficulty)) {
        payload.difficulty = availableDifficulties[0] || 1;
    }

    state.practiceLoading[topic] = true;
    state.practiceErrors[topic] = null;
    state.practiceNotices[topic] = null;
    renderPractice(document.getElementById('app'));

    try {
        const result = await requestAiTasks(payload);
        const tasks = result.tasks;
        state.practiceSets[topic] = {
            tasks: tasks.map(task => ({ ...task, practiceTopic: topic })),
            difficulty: payload.difficulty,
            count: payload.count
        };
        state.practiceNotices[topic] = result.message;
        state.practiceErrors[topic] = tasks.length ? null : 'Der kom ingen opgaver retur. Prøv med en anden sværhedsgrad.';
        state.practiceLoading[topic] = false;
        renderPractice(document.getElementById('app'));
    } catch (error) {
        console.error('Fejl ved generering af øveopgaver', error);
        state.practiceLoading[topic] = false;
        state.practiceNotices[topic] = null;
        state.practiceErrors[topic] = 'Kunne ikke generere opgaver lige nu. Prøv igen lidt senere.';
        renderPractice(document.getElementById('app'));
    }
}

async function requestAiTasks(payload) {
    const body = JSON.stringify(payload);
    const response = await fetch('server/api_generate_tasks.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
    });

    if (!response.ok) {
        throw new Error('Serverfejl');
    }

    const data = await response.json();
    if (Array.isArray(data.tasks)) {
        return {
            tasks: data.tasks,
            message: typeof data.message === 'string' ? data.message : null,
            source: typeof data.source === 'string' ? data.source : 'live'
        };
    }

    const message = typeof data.message === 'string' ? data.message : 'Ugyldigt svarformat';
    throw new Error(message);
}

async function handleSaveAiSet(statusEl) {
    if (!state.aiSets.length) {
        statusEl.textContent = 'Ingen opgaver at gemme endnu.';
        return;
    }
    try {
        const response = await fetch('server/api_generate_tasks.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save', tasks: state.aiSets })
        });
        if (!response.ok) throw new Error('Serverfejl');
        const data = await response.json();
        if (data.status === 'saved') {
            state.storageMode = data.storage_mode;
            statusEl.textContent = data.message;
        } else if (data.status === 'fallback') {
            state.storageMode = 'localStorage';
            statusEl.textContent = data.message;
            saveAiSetsLocally();
        }
    } catch (error) {
        console.warn('Gemning mislykkedes, bruger LocalStorage.', error);
        state.storageMode = 'localStorage';
        saveAiSetsLocally();
        statusEl.textContent = 'Kunne ikke gemme på serveren. Sættet er gemt lokalt på denne enhed.';
    }
}

async function handleLoadSavedSets(statusEl) {
    try {
        const response = await fetch('server/api_generate_tasks.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'load' })
        });
        if (!response.ok) throw new Error('Serverfejl');
        const data = await response.json();
        if (Array.isArray(data.tasks) && data.tasks.length) {
            state.aiSets = data.tasks;
            state.storageMode = data.storage_mode || 'fil';
            renderAiTasks(document.getElementById('ai-task-container'));
            statusEl.textContent = data.message || 'Gemte sæt er hentet.';
        } else if (data.status === 'fallback') {
            loadAiSetsLocally(statusEl);
        } else {
            statusEl.textContent = 'Ingen gemte sæt fundet.';
        }
    } catch (error) {
        console.warn('Kunne ikke hente fra server, forsøger LocalStorage.', error);
        loadAiSetsLocally(statusEl);
    }
}

function saveAiSetsLocally() {
    try {
        localStorage.setItem(STORAGE_KEYS.AI_SETS, JSON.stringify(state.aiSets));
    } catch (error) {
        console.warn('Kunne ikke gemme AI-sæt i LocalStorage.', error);
    }
}

function loadAiSetsLocally(statusEl) {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.AI_SETS);
        if (!raw) {
            statusEl.textContent = 'Ingen lokale sæt fundet.';
            return;
        }
        state.aiSets = JSON.parse(raw);
        state.storageMode = 'localStorage';
        renderAiTasks(document.getElementById('ai-task-container'));
        statusEl.textContent = 'Indlæst fra LocalStorage (kun på denne enhed).';
    } catch (error) {
        statusEl.textContent = 'Kunne ikke indlæse lokale sæt.';
    }
}

function attemptLoadAiSets() {
    const raw = localStorage.getItem(STORAGE_KEYS.AI_SETS);
    if (raw) {
        try {
            state.aiSets = JSON.parse(raw);
        } catch (error) {
            state.aiSets = [];
        }
    }
}

init();
