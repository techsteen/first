const TASKS = [
  {
    id: "1-1",
    level: 1,
    title: "Første fremryk",
    objective: "Robotten skal bevæge sig lige frem fra start til mål.",
    learningFocus: "Gentagelse af kommandoer og forståelse af retning.",
    board: {
      size: 8,
      start: { x: 0, y: 7, direction: "east" },
      goal: { x: 4, y: 7 },
      obstacles: []
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Startkoden er gjort klar til dig. Du skal udfylde manglerne.
    // Flyt robotten fem felter frem.
    // Brug kommandoen frem(); flere gange.
    // Eksempel: frem();

    // Skriv dine kommandoer her:
}

program();
`,
      powershell: `# Startkoden er gjort klar til dig. Du skal udfylde manglerne.
# Flyt robotten fem felter frem.
# Brug kommandoen frem flere gange.
# Eksempel: frem

function Invoke-Program {
    # Skriv dine kommandoer her:
}

Invoke-Program
`
    },
    tips: [
      "Robotten starter nederst til venstre og vender mod højre.",
      "Du behøver kun kommandoen frem()."
    ]
  },
  {
    id: "1-2",
    level: 1,
    title: "Det første sving",
    objective: "Robotten skal dreje og gå mod nord.",
    learningFocus: "Sammensætning af rotation og bevægelse.",
    board: {
      size: 8,
      start: { x: 2, y: 7, direction: "north" },
      goal: { x: 2, y: 2 },
      obstacles: []
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Robotten vender allerede mod nord.
    // Brug venstre(); eller højre(); hvis du vil øve dig i at dreje.
    // Flyt den frem til målet.
}

program();
`,
      powershell: `# Robotten vender allerede mod nord.
# Brug venstre eller højre hvis du vil øve dig i at dreje.
# Flyt den frem til målet.

function Invoke-Program {
    # Skriv dine kommandoer her:
}

Invoke-Program
`
    },
    tips: [
      "Overvej hvor mange skridt der er op til målet.",
      "Du behøver ikke at dreje, men prøv at eksperimentere."
    ]
  },
  {
    id: "1-3",
    level: 1,
    title: "Gennem hjørnet",
    objective: "Robotten skal rundt om et hjørne.",
    learningFocus: "Planlægning af sekvens af drejninger.",
    board: {
      size: 8,
      start: { x: 0, y: 7, direction: "north" },
      goal: { x: 3, y: 4 },
      obstacles: []
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Robotten skal først bevæge sig opad og derefter mod højre.
    // Tilføj de manglende venstre();/højre(); og frem(); kommandoer.
}

program();
`,
      powershell: `# Robotten skal først bevæge sig opad og derefter mod højre.
# Tilføj de manglende venstre/højre og frem kommandoer.

function Invoke-Program {
    # Skriv dine kommandoer her:
}

Invoke-Program
`
    },
    tips: [
      "Drej robotten mod øst, når du er på den rette række.",
      "Prøv at skrive kommandoerne i små blokke, så du kan se mønsteret."
    ]
  },
  {
    id: "2-1",
    level: 2,
    title: "Gentagelser gør stærk",
    objective: "Brug en løkke til at gå flere felter.",
    learningFocus: "Brug af for-løkker til gentagelse.",
    board: {
      size: 8,
      start: { x: 0, y: 7, direction: "east" },
      goal: { x: 5, y: 7 },
      obstacles: []
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Brug en for-løkke til at gentage frem().
    for (int i = 0; i < 5; i++) {
        // TODO: kald kommandoen der flytter robotten fremad
    }
}

program();
`,
      powershell: `# Brug en for-løkke til at gentage frem().
function Invoke-Program {
    for ($i = 0; $i -lt 5; $i++) {
        # TODO: kald kommandoen der flytter robotten fremad
    }
}

Invoke-Program
`
    },
    tips: [
      "Indsæt kommandoen frem() inde i løkken.",
      "Du kan ændre antallet af gentagelser ved at justere 5."
    ]
  },
  {
    id: "2-2",
    level: 2,
    title: "Kvadrat-ruten",
    objective: "Robotten skal følge kanten af et lille kvadrat.",
    learningFocus: "Kombination af løkker og drejninger.",
    board: {
      size: 8,
      start: { x: 2, y: 5, direction: "east" },
      goal: { x: 2, y: 5 },
      obstacles: []
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Fuldend et kvadrat. Brug en for-løkke og drejninger.
    for (int side = 0; side < 4; side++) {
        // TODO: bevæg frem to felter
        // TODO: drej til højre
    }
}

program();
`,
      powershell: `# Fuldend et kvadrat. Brug en for-løkke og drejninger.
function Invoke-Program {
    for ($side = 0; $side -lt 4; $side++) {
        # TODO: bevæg frem to felter
        # TODO: drej til højre
    }
}

Invoke-Program
`
    },
    tips: [
      "Robotten skal gå to felter frem og dreje højre hver gang.",
      "Tilføj frem(); frem(); og derefter højre();"
    ]
  },
  {
    id: "2-3",
    level: 2,
    title: "Tilbage til start",
    objective: "Robotten skal gå ud til et punkt og tilbage igen.",
    learningFocus: "Genbrug af kode og planlægning.",
    board: {
      size: 8,
      start: { x: 1, y: 7, direction: "east" },
      goal: { x: 1, y: 7 },
      obstacles: []
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Før robotten til søjle 6 og tilbage til start.
    // Brug to løkker eller funktioner for at gentage bevægelser.
}

program();
`,
      powershell: `# Før robotten til søjle 6 og tilbage til start.
# Brug to løkker eller funktioner for at gentage bevægelser.

function Invoke-Program {
    # Skriv dine kommandoer her:
}

Invoke-Program
`
    },
    tips: [
      "En løkke kan tage dig ud, en anden kan tage dig hjem.",
      "Husk at vende robotten 180° før du går tilbage."
    ]
  },
  {
    id: "3-1",
    level: 3,
    title: "Usynlige forhindringer",
    objective: "Undgå skjulte forhindringer ved at teste med blokering().",
    learningFocus: "Introduktion til betingede udsagn.",
    board: {
      size: 8,
      start: { x: 0, y: 7, direction: "east" },
      goal: { x: 6, y: 7 },
      obstacles: [
        { x: 2, y: 7 },
        { x: 4, y: 7 }
      ],
      revealOnRun: true
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Brug if-sætninger til at tjekke om der er blokering foran.
    while (1) {
        if (blokering("frem")) {
            højre();
            frem();
            venstre();
        } else {
            frem();
        }

        // Stop når du når målet
        if (blokering("mål")) {
            break;
        }
    }
}

program();
`,
      powershell: `# Brug if-sætninger til at tjekke om der er blokering foran.
function Invoke-Program {
    while ($true) {
        if (blokering "frem") {
            højre
            frem
            venstre
        } else {
            frem
        }

        # Stop når du når målet
        if (blokering "mål") {
            break
        }
    }
}

Invoke-Program
`
    },
    tips: [
      "Funktionen blokering(\"frem\") giver true hvis der er en forhindring forude.",
      "Tilpas koden så robotten finder en vej udenom forhindringen."
    ]
  },
  {
    id: "3-2",
    level: 3,
    title: "Tilpasset sti",
    objective: "Gå i zigzag for at undgå forhindringer.",
    learningFocus: "Betingelser og planlægning.",
    board: {
      size: 8,
      start: { x: 0, y: 7, direction: "north" },
      goal: { x: 4, y: 3 },
      obstacles: [
        { x: 0, y: 5 },
        { x: 1, y: 4 },
        { x: 2, y: 3 }
      ],
      revealOnRun: true
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Planlæg en zigzag-rute. Test før du går frem.
    // Brug if (blokering("frem")) til at beslutte om du skal dreje.
}

program();
`,
      powershell: `# Planlæg en zigzag-rute. Test før du går frem.
# Brug if (blokering "frem") til at beslutte om du skal dreje.

function Invoke-Program {
    # Skriv dine kommandoer her:
}

Invoke-Program
`
    },
    tips: [
      "Blokeringerne afsløres når programmet kører.",
      "Du kan kombinere if-else med løkker for en sikker rute."
    ]
  },
  {
    id: "3-3",
    level: 3,
    title: "Søgning efter mål",
    objective: "Find mål uden at kende ruten på forhånd.",
    learningFocus: "Strategi med if-else og hukommelse.",
    board: {
      size: 8,
      start: { x: 3, y: 7, direction: "north" },
      goal: { x: 6, y: 2 },
      obstacles: [
        { x: 3, y: 5 },
        { x: 4, y: 5 },
        { x: 5, y: 4 },
        { x: 6, y: 3 }
      ],
      revealOnRun: true
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Brug if-else til at afgøre om du skal gå frem eller dreje.
    // Tip: prøv at følge væggen på højre side.
}

program();
`,
      powershell: `# Brug if-else til at afgøre om du skal gå frem eller dreje.
# Tip: prøv at følge væggen på højre side.

function Invoke-Program {
    # Skriv dine kommandoer her:
}

Invoke-Program
`
    },
    tips: [
      "Du kan bruge while-løkker til at fortsætte indtil du er i mål.",
      "Husk at dreje tilbage hvis du rammer en blind vej."
    ]
  },
  {
    id: "4-1",
    level: 4,
    title: "Reaktionsmønster",
    objective: "Robotten skal reagere dynamisk på forhindringer.",
    learningFocus: "Kombination af løkker, if og variabler.",
    board: {
      size: 8,
      start: { x: 1, y: 7, direction: "north" },
      goal: { x: 6, y: 1 },
      obstacles: [
        { x: 1, y: 5 },
        { x: 2, y: 4 },
        { x: 3, y: 3 },
        { x: 4, y: 2 }
      ],
      revealOnRun: true
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    int skridt = 0;
    while (skridt < 30) {
        if (blokering("frem")) {
            højre();
        } else {
            frem();
            skridt++;
        }
    }
}

program();
`,
      powershell: `# Brug en tæller til at undgå uendelige løkker.
function Invoke-Program {
    $skridt = 0
    while ($skridt -lt 30) {
        if (blokering "frem") {
            højre
        } else {
            frem
            $skridt++
        }
    }
}

Invoke-Program
`
    },
    tips: [
      "Brug en tæller til at undgå uendelige løkker.",
      "Hvis du sidder fast, så prøv også at dreje venstre i nogle tilfælde."
    ]
  },
  {
    id: "4-2",
    level: 4,
    title: "Højre hånd på væggen",
    objective: "Følg en væg rundt om et område.",
    learningFocus: "Udvidet brug af blokering() i flere retninger.",
    board: {
      size: 8,
      start: { x: 0, y: 4, direction: "east" },
      goal: { x: 7, y: 4 },
      obstacles: [
        { x: 2, y: 4 },
        { x: 2, y: 3 },
        { x: 2, y: 5 },
        { x: 3, y: 5 },
        { x: 3, y: 3 }
      ],
      revealOnRun: true
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Udvid blokering() til også at tjekke højre og venstre.
    // Hint: du kan sende "højre" eller "venstre" som argument.
}

program();
`,
      powershell: `# Udvid blokering() til også at tjekke højre og venstre.
# Hint: du kan sende "højre" eller "venstre" som argument.

function Invoke-Program {
    # Skriv dine kommandoer her:
}

Invoke-Program
`
    },
    tips: [
      "Hold højre hånd på væggen: hvis højre side er fri, så drej der.",
      "Brug ellers frem() og drej venstre hvis du rammer en mur."
    ]
  },
  {
    id: "4-3",
    level: 4,
    title: "Planlagt rundtur",
    objective: "Besøg tre checkpoints før målet.",
    learningFocus: "Opdeling af problemløsning i delmål.",
    board: {
      size: 8,
      start: { x: 0, y: 7, direction: "east" },
      goal: { x: 7, y: 0 },
      obstacles: [
        { x: 1, y: 6 },
        { x: 2, y: 6 },
        { x: 3, y: 4 },
        { x: 4, y: 3 },
        { x: 5, y: 2 }
      ],
      checkpoints: [
        { x: 3, y: 7 },
        { x: 3, y: 3 },
        { x: 5, y: 1 }
      ],
      revealOnRun: true
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Skriv små funktioner til hvert delmål.
    // Eksempel: void gaTilFørsteCheckpoint(void) { /* ... */ }
    // Kald dine funktioner her i den rigtige rækkefølge.
}

program();
`,
      powershell: `# Skriv små funktioner til hvert delmål.
# Eksempel: function Ga-TilFoersteCheckpoint { ... }
# Kald dine funktioner her i den rigtige rækkefølge.

function Invoke-Program {
    # Skriv dine funktionskald her:
}

Invoke-Program
`
    },
    tips: [
      "Brug funktioner til at strukturere din kode.",
      "Tænk over hvornår du skal dreje for at ramme hvert punkt."
    ]
  },
  {
    id: "5-1",
    level: 5,
    title: "Adaptiv udforsker",
    objective: "Robotten skal udforske hele brættet og finde målet selv.",
    learningFocus: "Algoritmisk tænkning og fejlhåndtering.",
    board: {
      size: 8,
      start: { x: 0, y: 7, direction: "north" },
      goal: { x: 7, y: 0 },
      obstacles: [
        { x: 1, y: 6 },
        { x: 1, y: 5 },
        { x: 2, y: 4 },
        { x: 3, y: 3 },
        { x: 4, y: 2 },
        { x: 5, y: 1 }
      ],
      revealOnRun: true
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Kombinér alt du har lært.
    // Lav en strategi der kan navigere gennem hele brættet.
}

program();
`,
      powershell: `# Kombinér alt du har lært.
# Lav en strategi der kan navigere gennem hele brættet.

function Invoke-Program {
    # Skriv dine kommandoer her:
}

Invoke-Program
`
    },
    tips: [
      "Overvej at bruge rekursion eller en kø/stack til at udforske.",
      "Lav sikkerhedstjek så du ikke kører uendeligt."
    ]
  },
  {
    id: "5-2",
    level: 5,
    title: "Tidsbegrænset løser",
    objective: "Klar opgaven på færrest mulige skridt.",
    learningFocus: "Optimering og effektiv kode.",
    board: {
      size: 8,
      start: { x: 1, y: 6, direction: "east" },
      goal: { x: 6, y: 1 },
      obstacles: [
        { x: 2, y: 6 },
        { x: 3, y: 6 },
        { x: 3, y: 5 },
        { x: 4, y: 4 },
        { x: 5, y: 3 }
      ],
      revealOnRun: true
    },
    templates: {
      c: `#include <stdio.h>

int skridt = 0;

void gaFrem(void) {
    if (!blokering("frem")) {
        frem();
        skridt++;
    }
}

void program(void) {
    // Skriv din strategi her og brug gaFrem() til at tælle skridt.
}

program();
`,
      powershell: `# Hold styr på antal skridt og stop når du er i mål.
$skridt = 0

function Ga-Frem {
    if (-not (blokering "frem")) {
        frem
        $skridt++
    }
}

function Invoke-Program {
    # Skriv din strategi her og brug Ga-Frem til at tælle skridt.
}

Invoke-Program
`
    },
    tips: [
      "Hold styr på antal skridt og stop når du er i mål.",
      "Hvis du sidder fast, så prøv en anden rute."
    ]
  },
  {
    id: "5-3",
    level: 5,
    title: "Tilfældige barrierer",
    objective: "Håndter forhindringer der skifter fra kørsel til kørsel.",
    learningFocus: "Robuste algoritmer der håndterer tilfældighed.",
    board: {
      size: 8,
      start: { x: 0, y: 7, direction: "east" },
      goal: { x: 7, y: 0 },
      obstacles: [
        { x: 1, y: 7 },
        { x: 2, y: 6 },
        { x: 3, y: 5 },
        { x: 4, y: 4 },
        { x: 5, y: 3 }
      ],
      randomizeObstacles: true,
      revealOnRun: true
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Forhindringerne kan flytte sig. Kontroller hele tiden.
    // Brug blokering() hyppigt og planlæg alternative ruter.
}

program();
`,
      powershell: `# Forhindringerne kan flytte sig. Kontroller hele tiden.
# Brug blokering() hyppigt og planlæg alternative ruter.

function Invoke-Program {
    # Skriv dine kommandoer her:
}

Invoke-Program
`
    },
    tips: [
      "Brug loops og betingelser til at reagere på ændringer.",
      "Log gerne dine skridt i konsollen for at se mønstre."
    ]
  }
];
