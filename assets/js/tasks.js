window.FALLBACK_TASKS = [
  {
    id: "1-1",
    level: 1,
    title: "Første fremryk",
    objective: "Flyt robotten lige frem til målet.",
    learningFocus: "Gentagelse af den samme kommando.",
    board: {
      size: 8,
      start: { x: 0, y: 7, direction: "east" },
      goal: { x: 4, y: 7 },
      obstacles: [],
      checkpoints: [],
      revealOnRun: false,
      randomizeObstacles: false
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Flyt robotten fem felter frem.
}

program();
`,
      powershell: `function Invoke-Program {
    # Flyt robotten fem felter frem.
}

Invoke-Program
`
    },
    tips: [
      "Robotten starter nederst til venstre.",
      "Brug frem(); eller frem kommandoen." 
    ]
  },
  {
    id: "1-2",
    level: 1,
    title: "Det første sving",
    objective: "Drej robotten mod nord og gå til målet.",
    learningFocus: "Kombiner rotation og bevægelse.",
    board: {
      size: 8,
      start: { x: 2, y: 7, direction: "east" },
      goal: { x: 2, y: 3 },
      obstacles: [],
      checkpoints: [],
      revealOnRun: false,
      randomizeObstacles: false
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Drej robotten mod nord og gå frem.
}

program();
`,
      powershell: `function Invoke-Program {
    # Drej robotten mod nord og gå frem.
}

Invoke-Program
`
    },
    tips: [
      "Du skal dreje én gang.",
      "Tæl hvor mange felter der er til målet."
    ]
  },
  {
    id: "1-3",
    level: 1,
    title: "Hjørnemanøvre",
    objective: "Kom rundt om et hjørne og nå målet.",
    learningFocus: "Planlæg rækkefølgen af kommandoer.",
    board: {
      size: 8,
      start: { x: 0, y: 7, direction: "north" },
      goal: { x: 3, y: 4 },
      obstacles: [],
      checkpoints: [],
      revealOnRun: false,
      randomizeObstacles: false
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Bevæg dig opad og derefter mod højre.
}

program();
`,
      powershell: `function Invoke-Program {
    # Bevæg dig opad og derefter mod højre.
}

Invoke-Program
`
    },
    tips: [
      "Skift retning midtvejs.",
      "Hold styr på hvor mange skridt der er tilbage." 
    ]
  },
  {
    id: "2-1",
    level: 2,
    title: "Gentagelser",
    objective: "Brug en løkke til at bevæge dig frem.",
    learningFocus: "Introduktion til løkker.",
    board: {
      size: 8,
      start: { x: 0, y: 7, direction: "east" },
      goal: { x: 5, y: 7 },
      obstacles: [],
      checkpoints: [],
      revealOnRun: false,
      randomizeObstacles: false
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    for (int i = 0; i < 5; i++) {
        // Kald bevægelseskommandoen.
    }
}

program();
`,
      powershell: `function Invoke-Program {
    for ($i = 0; $i -lt 5; $i++) {
        # Kald bevægelseskommandoen.
    }
}

Invoke-Program
`
    },
    tips: [
      "Erstat kommentaren med frem kommandoen.",
      "Juster antallet af gentagelser hvis du går for langt." 
    ]
  },
  {
    id: "2-2",
    level: 2,
    title: "To sving",
    objective: "Brug løkker til at bevæge dig i et L.",
    learningFocus: "Kombinér løkker med drej.",
    board: {
      size: 8,
      start: { x: 1, y: 7, direction: "north" },
      goal: { x: 5, y: 3 },
      obstacles: [],
      checkpoints: [],
      revealOnRun: false,
      randomizeObstacles: false
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Brug en løkke til den lange strækning.
    // Drej og gentag med en ny løkke.
}

program();
`,
      powershell: `function Invoke-Program {
    # Brug en løkke til den lange strækning.
    # Drej og gentag med en ny løkke.
}

Invoke-Program
`
    },
    tips: [
      "Du kan have to separate løkker.",
      "Husk at dreje den korrekte vej mellem løkkerne." 
    ]
  },
  {
    id: "2-3",
    level: 2,
    title: "Checkpoint",
    objective: "Rund et checkpoint på vejen.",
    learningFocus: "Navigér via midlertidige mål.",
    board: {
      size: 8,
      start: { x: 0, y: 6, direction: "east" },
      goal: { x: 6, y: 1 },
      obstacles: [],
      checkpoints: [{ x: 3, y: 3 }],
      revealOnRun: false,
      randomizeObstacles: false
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Besøg checkpointet før du går til målet.
}

program();
`,
      powershell: `function Invoke-Program {
    # Besøg checkpointet før du går til målet.
}

Invoke-Program
`
    },
    tips: [
      "Planlæg ruten i to etaper.",
      "Checkpointet er markeret med C på brættet." 
    ]
  },
  {
    id: "3-1",
    level: 3,
    title: "Synlig blokade",
    objective: "Gå uden om de to tydelige forhindringer.",
    learningFocus: "Planlægning med synlige forhindringer.",
    board: {
      size: 8,
      start: { x: 0, y: 7, direction: "east" },
      goal: { x: 6, y: 7 },
      obstacles: [
        { x: 2, y: 7 },
        { x: 3, y: 7 }
      ],
      checkpoints: [],
      revealOnRun: false,
      randomizeObstacles: false
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Brug drejninger til at komme uden om forhindringerne.
}

program();
`,
      powershell: `function Invoke-Program {
    # Brug drejninger til at komme uden om forhindringerne.
}

Invoke-Program
`
    },
    tips: [
      "Forhindringerne er markeret med X.",
      "Overvej en kort omvej op eller ned." 
    ]
  },
  {
    id: "3-2",
    level: 3,
    title: "Slalom",
    objective: "Navigér igennem en synlig port.",
    learningFocus: "Præcis styring uden skjulte overraskelser.",
    board: {
      size: 8,
      start: { x: 1, y: 7, direction: "north" },
      goal: { x: 5, y: 1 },
      obstacles: [
        { x: 2, y: 5 },
        { x: 4, y: 3 },
        { x: 3, y: 2 }
      ],
      checkpoints: [],
      revealOnRun: false,
      randomizeObstacles: false
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Planlæg svingene så du undgår alle X felter.
}

program();
`,
      powershell: `function Invoke-Program {
    # Planlæg svingene så du undgår alle X felter.
}

Invoke-Program
`
    },
    tips: [
      "Skriv koden i små blokke og test mentalt.",
      "Der er plads til at gå rundt om hver forhindring." 
    ]
  },
  {
    id: "3-3",
    level: 3,
    title: "Checkpoint med mur",
    objective: "Besøg checkpointet uden at ramme muren.",
    learningFocus: "Brug synlige forhindringer til at planlægge rute.",
    board: {
      size: 8,
      start: { x: 0, y: 6, direction: "east" },
      goal: { x: 7, y: 2 },
      obstacles: [
        { x: 2, y: 6 },
        { x: 3, y: 6 },
        { x: 4, y: 6 },
        { x: 4, y: 5 }
      ],
      checkpoints: [{ x: 4, y: 4 }],
      revealOnRun: false,
      randomizeObstacles: false
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Find en vej op til checkpointet og derefter til målet.
}

program();
`,
      powershell: `function Invoke-Program {
    # Find en vej op til checkpointet og derefter til målet.
}

Invoke-Program
`
    },
    tips: [
      "Murens længde kræver to drej.",
      "Checkpointet hjælper dig gennem midten." 
    ]
  },
  {
    id: "4-1",
    level: 4,
    title: "Skjult blokering",
    objective: "Undersøg med blokering() før du går frem.",
    learningFocus: "Bruge if til at undgå skjulte forhindringer.",
    board: {
      size: 8,
      start: { x: 1, y: 7, direction: "east" },
      goal: { x: 6, y: 5 },
      obstacles: [
        { x: 3, y: 7 },
        { x: 3, y: 6 },
        { x: 3, y: 5 }
      ],
      checkpoints: [],
      revealOnRun: true,
      randomizeObstacles: false
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Brug if (blokering("frem")) til at beslutte ruten.
}

program();
`,
      powershell: `function Invoke-Program {
    # Brug if (blokering "frem") til at beslutte ruten.
}

Invoke-Program
`
    },
    tips: [
      "Blokeringen er skjult indtil koden kører.",
      "Log eventuelle valg i konsollen." 
    ]
  },
  {
    id: "4-2",
    level: 4,
    title: "Sensor tur",
    objective: "Tjek flere retninger før du vælger vejen.",
    learningFocus: "Arbejdsflow med flere blokering-kald.",
    board: {
      size: 8,
      start: { x: 0, y: 7, direction: "north" },
      goal: { x: 6, y: 1 },
      obstacles: [
        { x: 0, y: 5 },
        { x: 1, y: 5 },
        { x: 2, y: 3 },
        { x: 4, y: 2 }
      ],
      checkpoints: [],
      revealOnRun: true,
      randomizeObstacles: false
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Kombinér flere blokering-kald til at finde en sikker rute.
}

program();
`,
      powershell: `function Invoke-Program {
    # Kombinér flere blokering-kald til at finde en sikker rute.
}

Invoke-Program
`
    },
    tips: [
      "Tjek både frem og højre før du bevæger dig.",
      "Overvej at gemme valget i en variabel." 
    ]
  },
  {
    id: "4-3",
    level: 4,
    title: "Alternativ vej",
    objective: "Reagér dynamisk når en blokering findes.",
    learningFocus: "If-else struktur til at vælge ruter.",
    board: {
      size: 8,
      start: { x: 2, y: 7, direction: "east" },
      goal: { x: 7, y: 2 },
      obstacles: [
        { x: 4, y: 7 },
        { x: 5, y: 7 },
        { x: 6, y: 6 },
        { x: 6, y: 5 }
      ],
      checkpoints: [{ x: 5, y: 4 }],
      revealOnRun: true,
      randomizeObstacles: false
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Hvis blokering("frem") så find en alternativ sti.
}

program();
`,
      powershell: `function Invoke-Program {
    # Hvis blokering "frem" så find en alternativ sti.
}

Invoke-Program
`
    },
    tips: [
      "Checkpointet guider dig mod toppen.",
      "Vis feedback med printf eller Write-Host." 
    ]
  },
  {
    id: "5-1",
    level: 5,
    title: "Tilfældige forhindringer",
    objective: "Tilpas ruten når forhindringerne flytter sig.",
    learningFocus: "Arbejd med randomizeObstacles.",
    board: {
      size: 8,
      start: { x: 0, y: 7, direction: "east" },
      goal: { x: 7, y: 0 },
      obstacles: [
        { x: 2, y: 6 },
        { x: 3, y: 5 },
        { x: 4, y: 4 }
      ],
      checkpoints: [],
      revealOnRun: true,
      randomizeObstacles: true
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Brug blokering() efter hvert skridt for at reagere.
}

program();
`,
      powershell: `function Invoke-Program {
    # Brug blokering efter hvert skridt for at reagere.
}

Invoke-Program
`
    },
    tips: [
      "Forhindringerne ændres for hver kørsel.",
      "Hold styr på retningen med variabler." 
    ]
  },
  {
    id: "5-2",
    level: 5,
    title: "Finder målet",
    objective: "Brug blokering('mål') til at afgøre om du er fremme.",
    learningFocus: "Udnyt returværdier fra funktioner.",
    board: {
      size: 8,
      start: { x: 7, y: 7, direction: "north" },
      goal: { x: 1, y: 1 },
      obstacles: [
        { x: 6, y: 6 },
        { x: 5, y: 5 },
        { x: 4, y: 4 },
        { x: 3, y: 3 }
      ],
      checkpoints: [{ x: 2, y: 2 }],
      revealOnRun: true,
      randomizeObstacles: false
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Tjek blokering("mål") i en løkke for at vide hvornår du er fremme.
}

program();
`,
      powershell: `function Invoke-Program {
    # Tjek blokering "mål" i en løkke for at vide hvornår du er fremme.
}

Invoke-Program
`
    },
    tips: [
      "Når blokering('mål') er true er du fremme.",
      "Overvej en while-løkke." 
    ]
  },
  {
    id: "5-3",
    level: 5,
    title: "Tilbage til start",
    objective: "Find en rute tilbage til startfeltet.",
    learningFocus: "Avanceret navigation med flere drej.",
    board: {
      size: 8,
      start: { x: 7, y: 0, direction: "west" },
      goal: { x: 0, y: 7 },
      obstacles: [
        { x: 5, y: 1 },
        { x: 4, y: 2 },
        { x: 3, y: 3 },
        { x: 2, y: 4 }
      ],
      checkpoints: [{ x: 1, y: 5 }],
      revealOnRun: true,
      randomizeObstacles: false
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Planlæg en Z-formet rute hjem.
}

program();
`,
      powershell: `function Invoke-Program {
    # Planlæg en Z-formet rute hjem.
}

Invoke-Program
`
    },
    tips: [
      "Brug checkpoints til at holde styr på ruten.",
      "Log retningen efter hvert drej." 
    ]
  },
  {
    id: "6-1",
    level: 6,
    title: "Maze udfordring",
    objective: "Find udgangen i en tæt labyrint.",
    learningFocus: "Systematisk udforskning med sensorer.",
    board: {
      size: 8,
      start: { x: 0, y: 7, direction: "east" },
      goal: { x: 7, y: 0 },
      obstacles: [
        { x: 1, y: 7 },
        { x: 2, y: 7 },
        { x: 3, y: 6 },
        { x: 4, y: 5 },
        { x: 5, y: 4 },
        { x: 6, y: 3 }
      ],
      checkpoints: [],
      revealOnRun: true,
      randomizeObstacles: false
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Implementér en strategi fx højrehåndsmetoden.
}

program();
`,
      powershell: `function Invoke-Program {
    # Implementér en strategi fx højrehåndsmetoden.
}

Invoke-Program
`
    },
    tips: [
      "Gentag mønstre så du ikke går i ring.",
      "Log dine beslutninger i konsollen." 
    ]
  },
  {
    id: "6-2",
    level: 6,
    title: "Skiftende mål",
    objective: "Find målet selvom ruten blokeres uventet.",
    learningFocus: "Genplanlægning når blokering() ændres.",
    board: {
      size: 8,
      start: { x: 2, y: 7, direction: "north" },
      goal: { x: 6, y: 0 },
      obstacles: [
        { x: 2, y: 5 },
        { x: 3, y: 5 },
        { x: 4, y: 4 },
        { x: 5, y: 3 }
      ],
      checkpoints: [{ x: 4, y: 2 }],
      revealOnRun: true,
      randomizeObstacles: true
    },
    templates: {
      c: `#include <stdio.h>

void program(void) {
    // Kombinér løkker og blokering() til at finde en ny vej.
}

program();
`,
      powershell: `function Invoke-Program {
    # Kombinér løkker og blokering til at finde en ny vej.
}

Invoke-Program
`
    },
    tips: [
      "Randomize betyder at X kan flytte sig.",
      "Gem din strategi i funktioner for overblik." 
    ]
  },
  {
    id: "6-3",
    level: 6,
    title: "Fuld mission",
    objective: "Besøg begge checkpoints og nå målet.",
    learningFocus: "Lang sekvens med funktioner og kontrolstrukturer.",
    board: {
      size: 8,
      start: { x: 7, y: 7, direction: "north" },
      goal: { x: 0, y: 0 },
      obstacles: [
        { x: 6, y: 6 },
        { x: 5, y: 6 },
        { x: 4, y: 5 },
        { x: 3, y: 4 },
        { x: 2, y: 3 }
      ],
      checkpoints: [{ x: 5, y: 2 }, { x: 2, y: 1 }],
      revealOnRun: true,
      randomizeObstacles: false
    },
    templates: {
      c: `#include <stdio.h>

void gåTilFørste(void) {
    // Navigér til første checkpoint.
}

void gåTilAndet(void) {
    // Navigér til andet checkpoint.
}

void program(void) {
    gåTilFørste();
    gåTilAndet();
    // Afslut ved målet.
}

program();
`,
      powershell: `function Invoke-Første {
    # Navigér til første checkpoint.
}

function Invoke-Andet {
    # Navigér til andet checkpoint.
}

function Invoke-Program {
    Invoke-Første
    Invoke-Andet
    # Afslut ved målet.
}

Invoke-Program
`
    },
    tips: [
      "Opdel løsningen i flere funktioner.",
      "Checkpointene skal besøges i rækkefølge." 
    ]
  }
];
