<?php
return [
    [
        'id' => 'grundlag',
        'title' => 'Trin 1 · Grundlæggende AD-DS',
        'duration' => '2 lektioner',
        'summary' => 'Eleverne følger en fælles introduktion og opbygger deres første domænecontroller i et kontrolleret klasselab.',
        'competencies' => [
            'Forklare hvad et domæne, en domain controller og et forest er.',
            'Installere AD-DS rollen og promovere en server til domain controller.',
            'Bruge Active Directory Users and Computers til at oprette og finde brugere.',
        ],
        'activities' => [
            'learn' => [
                [
                    'text' => 'Fælles gennemgang af AD-DS begreber på tavlen med eksempelorganisationen "SkoleLab".',
                    'assist' => 'Genfortæl forskellen på lokale brugere og domænebrugere med udgangspunkt i SkoleLab.'
                ],
                [
                    'text' => 'Demonstration: underviseren viser installation af AD-DS rollen i Server Manager.',
                    'assist' => 'Beskriv de vigtigste trin underviseren følger i Server Manager.'
                ],
                [
                    'text' => 'Eleverne udfylder et kort begrebskort med nøgleord og forklaringer.',
                    'assist' => 'Giv eksempler på tre nøglebegreber og hvordan de hænger sammen.'
                ],
            ],
            'simulate' => [
                [
                    'title' => 'Guidet simulation: Installer AD-DS',
                    'description' => 'Alle arbejder i den forberedte Windows Server VM og følger den viste opskrift på projektoren trin for trin.',
                    'steps' => [
                        'Åbn Server Manager og vælg "Add roles and features".',
                        'Vælg "Role-based or feature-based installation" og markér serveren "GF2-DC".',
                        'Tilføj rollen "Active Directory Domain Services" og accepter alle forudsætninger.',
                        'Efter genstart: vælg flagikonet og promover serveren til domain controller for "skolelab.local".',
                        'Gennemfør guiden og log på igen som domæneadministrator.',
                    ],
                    'checkpoints' => [
                        'Skærmbillede der viser succesfuld promotion til domain controller.',
                        'Notat i logbogen om hvilke legitimationsoplysninger der blev brugt.',
                    ],
                    'assist' => 'Forklar hvorfor serveren skal genstartes efter installationen.'
                ],
                [
                    'title' => 'Mini-simulation: Opret brugere',
                    'description' => 'Eleverne opretter to brugerkonti og en sikkerhedsgruppe i ADUC.',
                    'steps' => [
                        'Åbn "Active Directory Users and Computers" og find OU "GF2".',
                        'Opret en ny bruger til din sidemakker og sæt en midlertidig adgangskode.',
                        'Opret en gruppe "GF2-Workshop" og tilføj begge brugere.',
                        'Kontroller at brugerne ligger i den rigtige OU.',
                    ],
                    'checkpoints' => [
                        'Lille logbogsnote med navne på brugerne og gruppen.',
                    ],
                    'assist' => 'Beskriv hvordan man ændrer adgangskodepolitikken for en bruger.'
                ],
            ],
            'real_life' => [
                [
                    'title' => 'Hands-on: Dokumentér din første AD-DS opsætning',
                    'tasks' => [
                        'Udfyld skabelonen "AD-DS begrebsark" med dine egne forklaringer.',
                        'Optag et 1 minuts skærmklip hvor du viser ADUC og forklarer OU-strukturen.',
                    ],
                    'assist' => 'Giv forslag til hvordan man kan forklare OU-strukturen til en klassekammerat.'
                ],
            ],
            'reflection' => [
                'Hvilke trin i installationen var mest udfordrende, og hvordan løste du dem?',
                'Hvordan kan du se forskel på en lokal og en domænebruger i praksis?',
            ],
        ],
        'checkpoints' => [
            ['id' => 'role-install', 'label' => 'AD-DS rollen er installeret.'],
            ['id' => 'dc-promote', 'label' => 'Serveren er promoveret til domain controller.'],
            ['id' => 'users-created', 'label' => 'Brugere og grupper er oprettet i OU GF2.'],
        ],
        'resources' => [
            ['label' => 'Begrebsark', 'path' => 'resources/student-materials/ad-ds-begrebsark.md'],
            ['label' => 'Lærernotat · Grundlæggende AD-DS', 'path' => 'resources/teacher-guides/modulplan-intro-ad-ds.md'],
        ],
        'rubric' => [
            'criteria' => [
                [
                    'name' => 'Forståelse af begreber',
                    'beginner' => 'Kan nævne enkelte begreber når der spørges direkte.',
                    'developing' => 'Kan forklare sammenhængen mellem domæne, OU og bruger.',
                    'proficient' => 'Kan selvstændigt bruge begreberne til at forklare en opsætning.'
                ],
                [
                    'name' => 'Teknisk gennemførsel',
                    'beginner' => 'Installerer rollen med vejledning.',
                    'developing' => 'Fuldender installationen og promoveringen med minimale hints.',
                    'proficient' => 'Fejlretter selv små problemer og dokumenterer løsningen.'
                ],
            ],
        ],
    ],
    [
        'id' => 'ou-struktur',
        'title' => 'Trin 2 · Organisér med OU',
        'duration' => '3 lektioner',
        'summary' => 'Eleverne designer en simpel OU-struktur og tester delegation i et kontrolleret scenarie.',
        'competencies' => [
            'Analysere et scenarie og foreslå en logisk OU-struktur.',
            'Implementere og navngive OUs efter aftalte standarder.',
            'Delegera rettigheder til en helpdesk-gruppe.',
        ],
        'activities' => [
            'learn' => [
                [
                    'text' => 'Fælles case: "Makerspace" – kort analyse af teams, lokationer og fælles ressourcer.',
                    'assist' => 'Opsummer hvilke afdelinger Makerspace har og hvilke krav de stiller.'
                ],
                [
                    'text' => 'Underviseren tegner et forslag til OU-struktur på tavlen og forklarer navngivningskonventionerne.',
                    'assist' => 'Forklar hvorfor navne som "MS-Staff" og "MS-Students" er nemme at arbejde med.'
                ],
                [
                    'text' => 'Mini-workshop: eleverne skitserer deres egen OU-struktur på papir og får feedback.',
                    'assist' => 'Giv to spørgsmål der kan hjælpe med at forbedre en OU-skitse.'
                ],
            ],
            'simulate' => [
                [
                    'title' => 'Simulation: Byg OU-træet',
                    'description' => 'Eleverne følger den fælles gennemgang på projektoren og genskaber strukturen på deres server.',
                    'steps' => [
                        'Opret roden "MS" under domænet og tilføj underenheder for "Administration", "Workshops" og "Support".',
                        'Tilføj underenheder for "3D-Print" og "Robotteknik" under "Workshops".',
                        'Flyt eksisterende brugere ind i passende OUs.',
                        'Opret grupper til "Instruktører" og "Elever" i de relevante OUs.',
                    ],
                    'checkpoints' => [
                        'Skærmbillede af OU-strukturen efter flytning af brugere.',
                    ],
                    'assist' => 'Hjælp med at forklare forskellen på at flytte og kopiere en bruger i ADUC.'
                ],
                [
                    'title' => 'Simulation: Delegér rettigheder',
                    'description' => 'Øvelsen viser hvordan helpdesk får lov til at nulstille adgangskoder i en specifik OU.',
                    'steps' => [
                        'Opret gruppen "MS-Helpdesk" i OU "Support".',
                        'Start Delegation of Control Wizard på OU "MS-Students".',
                        'Tildel rettigheden "Reset user passwords" til gruppen.',
                        'Test med en demobruker om delegationen virker.',
                    ],
                    'checkpoints' => [
                        'Notér i logbogen hvem der nu må nulstille adgangskoder.',
                    ],
                    'assist' => 'Forklar hvad der sker i baggrunden når man fuldfører delegationen.'
                ],
            ],
            'real_life' => [
                [
                    'title' => 'Hands-on: Dokumentér designet',
                    'tasks' => [
                        'Udfyld "OU designlog" med begrundelser for dine valg.',
                        'Optag et kort lydklip hvor du guider en ny elev igennem strukturen.',
                    ],
                    'assist' => 'Foreslå hvordan man begrunder placeringen af en afdeling i en OU.'
                ],
            ],
            'reflection' => [
                'Hvordan sikrer din struktur at nye brugere hurtigt kan placeres korrekt?',
                'Hvilke opgaver vil du overlade til helpdesk, og hvorfor?',
            ],
        ],
        'checkpoints' => [
            ['id' => 'ou-created', 'label' => 'OU-strukturen er oprettet.'],
            ['id' => 'users-moved', 'label' => 'Brugere er flyttet til de rigtige OUs.'],
            ['id' => 'delegation', 'label' => 'Helpdesk-gruppen kan nulstille adgangskoder.'],
        ],
        'resources' => [
            ['label' => 'OU designlog', 'path' => 'resources/student-materials/ou-designlog.md'],
            ['label' => 'Casebeskrivelse', 'path' => 'resources/teacher-guides/case-nordtech.md'],
        ],
        'rubric' => [
            'criteria' => [
                [
                    'name' => 'Struktur og navngivning',
                    'beginner' => 'Strukturen er ujævn og følger ikke aftalte navne.',
                    'developing' => 'De fleste elementer følger navngivningsreglerne.',
                    'proficient' => 'Hele strukturen er konsekvent og let at forstå for andre.',
                ],
                [
                    'name' => 'Delegation',
                    'beginner' => 'Har brug for støtte til at køre guiden.',
                    'developing' => 'Gennemfører guiden og kan forklare hvad der er sket.',
                    'proficient' => 'Tilpasser delegationen til nye behov og dokumenterer ændringer.',
                ],
            ],
        ],
    ],
    [
        'id' => 'gpo',
        'title' => 'Trin 3 · Group Policy i praksis',
        'duration' => '3 lektioner',
        'summary' => 'Eleverne skaber og tester politikker, der sikrer ens konfiguration på tværs af organisationen.',
        'competencies' => [
            'Oprette og linke GPO\'er til relevante OUs.',
            'Teste effekten af politikker på en klientmaskine.',
            'Dokumentere ændringer og planlægge opfølgning.',
        ],
        'activities' => [
            'learn' => [
                [
                    'text' => 'Introduktion til Group Policy: underviseren viser hvordan en GPO bygges op.',
                    'assist' => 'Forklar forskellen på Computer Configuration og User Configuration i en GPO.'
                ],
                [
                    'text' => 'Eleverne undersøger eksisterende politikker i "Default Domain Policy" og noterer standardindstillinger.',
                    'assist' => 'Hvilke indstillinger bør man være forsigtig med at ændre i Default Domain Policy?'
                ],
                [
                    'text' => 'Sammenligning: hvad er fordelene ved at bruge GPO fremfor manuelle ændringer?',
                    'assist' => 'List tre fordele ved at bruge GPO i en skoleorganisation.'
                ],
            ],
            'simulate' => [
                [
                    'title' => 'Simulation: Skab en sikkerheds-GPO',
                    'description' => 'Eleverne laver en politik der låser skærmen efter 10 minutters inaktivitet.',
                    'steps' => [
                        'Åbn Group Policy Management og opret en ny GPO ved navn "MS-Sikkerhed".',
                        'Redigér politikken og gå til "Computer Configuration → Policies → Administrative Templates → Control Panel".',
                        'Aktiver politikken "Password protect the screen saver" og sæt ventetid til 10 minutter.',
                        'Link politikken til OU "MS-Students".',
                        'Kør "gpupdate /force" på en testklient og observer resultatet.',
                    ],
                    'checkpoints' => [
                        'Notér tidspunktet hvor skærmen låser på testklienten.',
                        'Gem et screenshot af GPO indstillingerne.',
                    ],
                    'assist' => 'Hjælp med at forstå hvad gpupdate /force gør.'
                ],
                [
                    'title' => 'Simulation: Brugerspecifik GPO',
                    'description' => 'Opsæt en politik der tildeler et fælles skrivebordstapet til elever.',
                    'steps' => [
                        'Redigér samme GPO og gå til "User Configuration → Policies → Administrative Templates → Desktop → Desktop".',
                        'Aktiver "Desktop Wallpaper" og angiv stien \\\\GF2-DC\\DelteFiler\\MS\\tapet.jpg.',
                        'Log på som testbruger og kontroller tapetet.',
                    ],
                    'checkpoints' => [
                        'Foto af skrivebordet på testbrugeren.',
                    ],
                    'assist' => 'Forklar hvorfor det er en god idé at gemme tapetet på en delt mappe.'
                ],
            ],
            'real_life' => [
                [
                    'title' => 'Hands-on: Overvågning og feedback',
                    'tasks' => [
                        'Udfyld "GPO ændringslog" med dato, politik og forventet effekt.',
                        'Planlæg et kort stand-up møde hvor holdet tjekker om politikkerne virker som planlagt.',
                    ],
                    'assist' => 'Giv ideer til spørgsmål man kan stille i stand-up mødet.'
                ],
            ],
            'reflection' => [
                'Hvordan kan du se at en politik er blevet anvendt på en klient?',
                'Hvilke fordele giver central styring af indstillinger for skolens it-team?',
            ],
        ],
        'checkpoints' => [
            ['id' => 'gpo-created', 'label' => 'Sikkerheds-GPO er oprettet og linket.'],
            ['id' => 'gpo-tested', 'label' => 'Politikken er testet på en klient.'],
            ['id' => 'log-updated', 'label' => 'GPO ændringslog er udfyldt.'],
        ],
        'resources' => [
            ['label' => 'GPO ændringslog', 'path' => 'resources/student-materials/gpo-aendringslog.md'],
            ['label' => 'Lærernotat · GPO demonstration', 'path' => 'resources/teacher-guides/gpo-demo-manus.md'],
        ],
        'rubric' => [
            'criteria' => [
                [
                    'name' => 'Politikdesign',
                    'beginner' => 'Opretter politikker med tæt støtte.',
                    'developing' => 'Kan forklare hvad politikken gør og teste den.',
                    'proficient' => 'Tilpasser politikkerne og vurderer effekten på elevernes arbejdsgange.',
                ],
                [
                    'name' => 'Dokumentation',
                    'beginner' => 'Noterer få detaljer i loggen.',
                    'developing' => 'Registrerer ændringer med klare beskrivelser.',
                    'proficient' => 'Planlægger opfølgning og foreslår forbedringer baseret på observationer.',
                ],
            ],
        ],
    ],
];
