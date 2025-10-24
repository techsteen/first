<?php
return [
    [
        'id' => 'intro-ad-ds',
        'title' => 'Modul 1 · Active Directory fundament',
        'duration' => '3 lektioner',
        'summary' => 'Eleverne får styr på AD-DS begreber, roller og værktøjer gennem korte oplæg, guidede simuleringer og simple reallife-øvelser.',
        'competencies' => [
            'Forklare hvad et domæne, en domain controller og et forest er.',
            'Navigere i AD Users and Computers og finde centrale administrationspunkter.',
            'Importere brugere via CSV og anvende standardiserede navngivningspolitikker.',
        ],
        'activities' => [
            'learn' => [
                [
                    'text' => 'Se intro-screencast: "Hvorfor AD-DS?" og udfyld begrebsnoter.',
                    'assist' => 'Giv en forklaring på hvorfor organisationer bruger Active Directory Domain Services.'
                ],
                [
                    'text' => 'Mini-quiz i klassen (Mentimeter/Kahoot) med 10 kernespørgsmål til AD-DS.',
                    'assist' => 'Forklar de vigtigste forskelle på lokale brugere og domænebrugere.'
                ],
                [
                    'text' => 'Parøvelse: tegn AD-komponenter på whiteboard ud fra et kundescenarie.',
                    'assist' => 'Hjælp med at beskrive rollerne: domain controller, global catalog og DNS-integration.'
                ],
            ],
            'simulate' => [
                [
                    'title' => 'SimLab: AD Users and Computers orienteringsløb',
                    'description' => 'Eleverne bruger en sandbox (browser-baseret Remote Lab) til at løse konkrete mikroopgaver i ADUC.',
                    'steps' => [
                        'Log på sandbox med elevkontoen og åbn "Active Directory Users and Computers".',
                        'Find OU "GF2 Students" og identificer brugeren fra intro-scenariet.',
                        'Højreklik og undersøg fanerne for at finde hvor man nulstiller adgangskoder.',
                        'Importer en CSV med 5 demo-brugere og verificer at de lander i korrekt OU.',
                    ],
                    'checkpoints' => [
                        'Screenshot af OU-strukturen efter import.',
                        'Noter hvilket værktøj der bruges til masseimport.',
                    ],
                    'assist' => 'Forklar hvordan man importerer brugere fra CSV i AD Users and Computers.'
                ],
                [
                    'title' => 'Quick sim: Delegér rettigheder',
                    'description' => 'Vis hvordan man delegerer password reset til helpdesk OU.',
                    'steps' => [
                        'Åbn Delegation of Control Wizard på OU "Support".',
                        'Vælg gruppen "Helpdesk Trainees" og tildel dem muligheden "Reset user passwords".',
                        'Test delegationen på en testbruger.',
                    ],
                    'checkpoints' => [
                        'Liste over tildelte rettigheder til Helpdesk Trainees.',
                    ],
                    'assist' => 'Hvad sker der bag kulisserne når man bruger Delegation of Control Wizard?'
                ],
            ],
            'real_life' => [
                [
                    'title' => 'Opsætning i fysisk/virtuel lab',
                    'tasks' => [
                        'Installer AD-DS rollen på en Windows Server VM (brug fælles skabelon).',
                        'Promover serveren til domain controller for domænet skolens-lab.local.',
                        'Opret sikkerhedsgruppen "GF2-Elever" og tilføj klassens konti.',
                    ],
                    'assist' => 'Beskriv de trin der skal til for at promovere en server til domain controller med Server Manager.'
                ],
                [
                    'title' => 'Refleksionspitch',
                    'tasks' => [
                        'Forbered en 2-minutters stand-up hvor holdet forklarer hvornår AD-DS giver værdi.',
                        'Brug tavle eller Miro-board til at illustrere datalogistikken.',
                    ],
                    'assist' => 'Hjælp med at forklare hvordan central brugeradministration øger sikkerheden.'
                ],
            ],
            'reflection' => [
                'Hvilke nye begreber kan du forklare for en klassekammerat i dag?',
                'Hvilke værktøjer i ADUC fandt du mest intuitive, og hvorfor?',
            ],
        ],
        'checkpoints' => [
            [
                'id' => 'intro-video',
                'label' => 'Har set introvideoen og udfyldt noter.'
            ],
            [
                'id' => 'sim-import',
                'label' => 'Har gennemført CSV-import i sandbox.'
            ],
            [
                'id' => 'dc-setup',
                'label' => 'Har promoveret domain controller i lab-miljøet.'
            ],
        ],
        'resources' => [
            [
                'label' => 'Lærerens modulplan',
                'path' => 'resources/teacher-guides/modulplan-intro-ad-ds.md'
            ],
            [
                'label' => 'Elev: AD-DS begrebsark',
                'path' => 'resources/student-materials/ad-ds-begrebsark.md'
            ],
        ],
        'rubric' => [
            'criteria' => [
                [
                    'name' => 'Begrebsforståelse',
                    'beginner' => 'Kan gengive enkelte definitioner med støtte.',
                    'developing' => 'Forklarer sammenhængen mellem domæne, OU og bruger.',
                    'proficient' => 'Kan selvstændigt koble begreberne til konkrete scenarier.'
                ],
                [
                    'name' => 'Teknisk udførsel',
                    'beginner' => 'Kan følge en guide trin for trin.',
                    'developing' => 'Kan løse standardopgaver og rette simple fejl.',
                    'proficient' => 'Kan selvstændigt konfigurere og dokumentere AD-DS opsætning.'
                ],
            ],
        ],
    ],
    [
        'id' => 'ou-design',
        'title' => 'Modul 2 · Design af OU-strukturer',
        'duration' => '4 lektioner',
        'summary' => 'Eleverne lærer at analysere organisationsbehov, strukturere OUs og forberede rettigheder til forskellige teams.',
        'competencies' => [
            'Analysere et virksomhedsscenarie og omsætte det til en OU-struktur.',
            'Anvende navngivningsstandarder og administrative delegeringer.',
            'Dokumentere designvalg i en standardiseret skabelon.',
        ],
        'activities' => [
            'learn' => [
                [
                    'text' => 'Casegennemgang: "NordTech" (fiktiv virksomhed) og deres it-behov.',
                    'assist' => 'Opsummer hovedkravene fra NordTech-casen.'
                ],
                [
                    'text' => 'Mini-lecture: OU design patterns (geografisk, funktionel, hybrid).',
                    'assist' => 'Forklar forskellen på geografisk og funktionel OU-struktur.'
                ],
                [
                    'text' => 'Peer review: analyser hinandens udkast i par og giv feed-forward.',
                    'assist' => 'Hvordan kan man give konstruktiv feedback på en OU-struktur?'
                ],
            ],
            'simulate' => [
                [
                    'title' => 'SimLab: Træk-og-slip OU designer',
                    'description' => 'Drag-and-drop interface (Simflow) hvor eleverne placerer afdelinger og roller i et OU-træ.',
                    'steps' => [
                        'Læs kravspecifikationen fra NordTech og marker tværgående teams.',
                        'Træk afdelinger ind i passende parent OUs og navngiv dem korrekt.',
                        'Angiv hvilke OUs der skal have GPO-link for sikkerhedspolitik.',
                        'Eksporter designet som JSON/XML og upload i LMS.',
                    ],
                    'checkpoints' => [
                        'Screenshot af endelig OU-struktur.',
                        'Kort video (60 sek.) hvor eleven forklarer sit design.',
                    ],
                    'assist' => 'Forklar hvordan man sikrer at et OU-design understøtter fremtidig vækst.'
                ],
            ],
            'real_life' => [
                [
                    'title' => 'Workshop: OU implementering',
                    'tasks' => [
                        'Implementer dit design på skolens lab-domain controller.',
                        'Delegér relevante rettigheder til team leads.',
                        'Udfyld designlog med begrundelser for valg.',
                    ],
                    'assist' => 'Hvilke overvejelser skal man gøre sig, før man delegerer rettigheder til en OU?'
                ],
                [
                    'title' => 'Kundemøde-rollespil',
                    'tasks' => [
                        'Elevgruppe præsenterer designet for "kunden" (underviser).',
                        'Besvar spørgsmål om compliance, backup og fremtidig skalering.',
                    ],
                    'assist' => 'Hvordan argumenterer man for et OU-design overfor en ikke-teknisk kunde?'
                ],
            ],
            'reflection' => [
                'Hvordan understøtter din struktur både drift og sikkerhed?',
                'Hvilke dele af casen var sværest at omsætte til OU-design, og hvorfor?',
            ],
        ],
        'checkpoints' => [
            ['id' => 'case-analyse', 'label' => 'Caseanalyse udfyldt.'],
            ['id' => 'sim-designer', 'label' => 'OU-design sim gennemført.'],
            ['id' => 'implementering', 'label' => 'Design implementeret i lab.'],
        ],
        'resources' => [
            ['label' => 'Skabelon: OU designlog', 'path' => 'resources/student-materials/ou-designlog.md'],
            ['label' => 'Casebeskrivelse: NordTech', 'path' => 'resources/teacher-guides/case-nordtech.md'],
        ],
        'rubric' => [
            'criteria' => [
                [
                    'name' => 'Analyse',
                    'beginner' => 'Identificerer enkelte organisatoriske krav.',
                    'developing' => 'Kortlægger roller og behov systematisk.',
                    'proficient' => 'Omsætter komplekse krav til et skalerbart OU-design.'
                ],
                [
                    'name' => 'Dokumentation',
                    'beginner' => 'Leverer kortfattet liste over OUs.',
                    'developing' => 'Udfylder designlog med begrundelser.',
                    'proficient' => 'Producerer komplet dokumentation inkl. diagram og rettighedsplan.'
                ],
            ],
        ],
    ],
    [
        'id' => 'gpo-basics',
        'title' => 'Modul 3 · GPO grundlæggende politikker',
        'duration' => '4 lektioner',
        'summary' => 'Eleverne designer, tester og dokumenterer politikker til login, sikkerhed og brugeroplevelse.',
        'competencies' => [
            'Oprette og linke Group Policy Objects til relevante OUs.',
            'Teste politikker i et kontrolleret miljø før udrulning.',
            'Dokumentere ændringer og kommunikere konsekvenser til brugere.',
        ],
        'activities' => [
            'learn' => [
                [
                    'text' => 'Teorioplæg: GPO processing order og inheritance.',
                    'assist' => 'Forklar i hvilken rækkefølge GPO\'er anvendes, og hvad loopback processing er.'
                ],
                [
                    'text' => 'Live-demo: Opret standard logon-banner og password policy.',
                    'assist' => 'Hjælp med at beskrive hvordan man laver et logon-banner i en GPO.'
                ],
                [
                    'text' => 'Fejlsøgningsgalleri: gennemgå skærmbilleder fra almindelige fejl.',
                    'assist' => 'Hvordan bruger man gpresult til at fejlfinde?'
                ],
            ],
            'simulate' => [
                [
                    'title' => 'SimLab: Politikker i sikker sandkasse',
                    'description' => 'Virtuelt miljø hvor eleverne kan teste politikker uden risiko.',
                    'steps' => [
                        'Opret en GPO "GF2-Login" og tilføj logon-banneret fra elevmaterialet.',
                        'Konfigurer passwordkrav: minimum 10 tegn, kompleksitet aktiveret.',
                        'Brug Group Policy Modeling til at teste en bruger fra OU "Support".',
                        'Dokumenter resultatet i GPO ændringsloggen.',
                    ],
                    'checkpoints' => [
                        'Eksporter GPO-rapport som HTML og vedhæft i LMS.',
                        'Tilføj refleksion i loggen: Hvilke brugere påvirkes?'
                    ],
                    'assist' => 'Beskriv hvordan Group Policy Modeling kan bruges før udrulning.'
                ],
                [
                    'title' => 'Quick sim: Tidsstyret GPO',
                    'description' => 'Sæt en politik til kun at gælde i eksamensugen.',
                    'steps' => [
                        'Aktivér WMI filter for tidsperiode.',
                        'Link filter til en midlertidig OU.',
                    ],
                    'checkpoints' => [
                        'Log tid og dato for aktivering.',
                    ],
                    'assist' => 'Hvordan bruges WMI filters til at styre hvornår en GPO aktiveres?'
                ],
            ],
            'real_life' => [
                [
                    'title' => 'GPO change management',
                    'tasks' => [
                        'Udfyld change request skabelon og få godkendelse.',
                        'Implementer politikken i skolens lab og dokumenter tests.',
                        'Præsentér konsekvensanalyse for læreren.',
                    ],
                    'assist' => 'Hvilke elementer skal en change request til en GPO indeholde?'
                ],
                [
                    'title' => 'Elevsupport scenarie',
                    'tasks' => [
                        'Rollespil hvor elev A er helpdesk og elev B er bruger der rammes af politikken.',
                        'Udarbejd FAQ-artikel med screenshot og instruktioner.',
                    ],
                    'assist' => 'Hjælp med at formulere et elevvenligt svar til en bruger der spørger om logon-banneret.'
                ],
            ],
            'reflection' => [
                'Hvad gør du for at undgå at en GPO skaber nedetid?',
                'Hvordan kan man kommunikere ændringer så brugerne føler sig trygge?',
            ],
        ],
        'checkpoints' => [
            ['id' => 'gpo-modeling', 'label' => 'Har kørt Group Policy Modeling.'],
            ['id' => 'change-log', 'label' => 'Har dokumenteret change request.'],
            ['id' => 'faq', 'label' => 'Har skrevet FAQ-artikel.'],
        ],
        'resources' => [
            ['label' => 'Skabelon: GPO ændringslog', 'path' => 'resources/student-materials/gpo-aendringslog.md'],
            ['label' => 'Lærer: GPO demo manus', 'path' => 'resources/teacher-guides/gpo-demo-manus.md'],
        ],
        'rubric' => [
            'criteria' => [
                [
                    'name' => 'Politikdesign',
                    'beginner' => 'Genbruger eksisterende skabeloner med hjælp.',
                    'developing' => 'Tilpasser politikker til casens behov.',
                    'proficient' => 'Designer og begrunder politikker, der balancerer sikkerhed og brugervenlighed.'
                ],
                [
                    'name' => 'Kommunikation',
                    'beginner' => 'Skriver kort teknisk note.',
                    'developing' => 'Forklarer ændringer på let forståeligt dansk.',
                    'proficient' => 'Producerer målgruppe-tilpasset kommunikation og FAQ.'
                ],
            ],
        ],
    ],
    [
        'id' => 'advanced-scenarios',
        'title' => 'Modul 4 · Avancerede scenarier og evaluering',
        'duration' => '5 lektioner',
        'summary' => 'Holdbaseret projekt hvor eleverne kombinerer OU-design, GPO og change management i et samlet forløb.',
        'competencies' => [
            'Planlægge og gennemføre en samlet AD-DS løsning for en casevirksomhed.',
            'Automatisere gentagne opgaver via scripts og skabeloner.',
            'Evaluere løsningen i forhold til sikkerhed, drift og brugeroplevelse.',
        ],
        'activities' => [
            'learn' => [
                [
                    'text' => 'Kick-off: projektplan og roller i teams (Scrum light).',
                    'assist' => 'Hvordan kan man bruge stand-ups og kanban i et it-projekt?'
                ],
                [
                    'text' => 'Miniworkshop: PowerShell til AD-administration.',
                    'assist' => 'Vis et eksempel på et PowerShell-script der opretter OUs og brugere.'
                ],
                [
                    'text' => 'Sikkerhedssession: Group Policy Security baselines.',
                    'assist' => 'Forklar hvorfor sikkerhedsbaselines er vigtige i AD-DS.'
                ],
            ],
            'simulate' => [
                [
                    'title' => 'Scenario-sim: Incident response',
                    'description' => 'Simuleret sikkerhedsbrud hvor eleverne skal isolere en OU og rulle nødpolitikker ud.',
                    'steps' => [
                        'Identificer påvirkede brugere via rapporten i sim-miljøet.',
                        'Opret midlertidig "Quarantine" OU og flyt kompromitterede konti.',
                        'Anvend nød-GPO der låser konti og logger forsøg.',
                        'Rapportér hændelsen i incident-skabelonen.',
                    ],
                    'checkpoints' => [
                        'Incidentrapport udfyldt og uploadet.',
                    ],
                    'assist' => 'Hvilke tiltag bør man iværksætte ved et muligt AD-kompromis?'
                ],
            ],
            'real_life' => [
                [
                    'title' => 'Projektleverance',
                    'tasks' => [
                        'Udarbejd komplet løsningsdokumentation (diagram, designlog, GPO-oversigt).',
                        'Opsæt demo-miljø hvor underviser kan teste funktionalitet.',
                        'Forbered kundemødet med fokus på værdi og sikkerhed.',
                    ],
                    'assist' => 'Hvad skal et afleveringsklart løsningsdokument indeholde?'
                ],
                [
                    'title' => '360° evaluering',
                    'tasks' => [
                        'Teams giver hinanden peer feedback via evalueringsark.',
                        'Sæt personlige læringsmål for næste praktikforløb.',
                    ],
                    'assist' => 'Hvordan kan man formulere brugbar peer feedback i it-projekter?'
                ],
            ],
            'reflection' => [
                'Hvad ville du gøre anderledes næste gang du planlægger en AD-DS løsning?',
                'Hvordan sikrer du at brugere og ledelse er med ombord på ændringerne?',
            ],
        ],
        'checkpoints' => [
            ['id' => 'incident-plan', 'label' => 'Incident respons sim gennemført.'],
            ['id' => 'projekt-dokumentation', 'label' => 'Projekt dokumenteret og uploadet.'],
            ['id' => 'peer-feedback', 'label' => 'Peer feedback afleveret.'],
        ],
        'resources' => [
            ['label' => 'Incidentrapport skabelon', 'path' => 'resources/student-materials/incidentrapport.md'],
            ['label' => 'Projekt rubrik til underviser', 'path' => 'resources/teacher-guides/projekt-rubrik.md'],
            ['label' => 'Powershell snippets', 'path' => 'resources/tools/powershell-snippets.ps1'],
        ],
        'rubric' => [
            'criteria' => [
                [
                    'name' => 'Projektledelse',
                    'beginner' => 'Behøver konstant støtte til at planlægge opgaver.',
                    'developing' => 'Bruger enkle planlægningsværktøjer og følger op.',
                    'proficient' => 'Driver teamet med tydelige mål, backlog og statusrapporter.'
                ],
                [
                    'name' => 'Sikkerhedsbevidsthed',
                    'beginner' => 'Reagerer først når fejl opstår.',
                    'developing' => 'Forudser risici og foreslår modtræk.',
                    'proficient' => 'Indarbejder sikkerhed i alle leverancer og dokumenterer det.'
                ],
            ],
        ],
    ],
];
