(function () {
  function createTemplates(cLines, psLines) {
    const formatBlock = (lines, indent) =>
      lines
        .map(line => {
          if (line === null) return "";
          if (!line) return indent;
          return `${indent}${line}`;
        })
        .join("\n");

    const csharpBody = formatBlock(cLines, "        ");
    const psBody = formatBlock(psLines, "    ");

    return {
      csharp: `using System;\n\nclass Program\n{\n    static void Main(string[] args)\n    {\n${csharpBody}\n    }\n}\n`,
      powershell: `function Invoke-Program {\n${psBody}\n}\n\nInvoke-Program\n`
    };
  }

  function boardConfig({ size = 8, start, goal, obstacles = [], checkpoints = [], revealOnRun = false }) {
    return {
      size,
      start,
      goal,
      obstacles,
      checkpoints,
      revealOnRun,
      randomizeObstacles: false
    };
  }

  const LEVELS = {
    1: [
      {
        title: "Frem til flaget",
        objective: "Flyt robotten fire felter frem til målet.",
        learningFocus: "Sekvenser af frem-kommandoen.",
        board: boardConfig({
          start: { x: 0, y: 7, direction: "east" },
          goal: { x: 4, y: 7 }
        }),
        templates: createTemplates(
          ["// Kald frem(); fire gange."],
          ["# Kald kommandoen frem fire gange"]
        ),
        tips: [
          "Robotten starter nederst til venstre og peger mod øst.",
          "Gentag frem(); det antal gange du skal rykke.",
          "Tjek at du ikke bevæger dig for langt forbi målet."
        ]
      },
      {
        title: "Første drej",
        objective: "Drej robotten mod nord og gå tre felter til målet.",
        learningFocus: "Brug af drej og bevæg.",
        board: boardConfig({
          start: { x: 3, y: 7, direction: "east" },
          goal: { x: 3, y: 4 }
        }),
        templates: createTemplates(
          ["// Drej mod nord og brug derefter frem(); flere gange."],
          ["# Drej mod nord og brug derefter kommandoen frem flere gange"]
        ),
        tips: [
          "En venstre-drej ændrer retning mod nord.",
          "Tænk over hvor mange skridt der er til målet efter drejet.",
          "Du kan bruge flere frem(); i træk uden tomme linjer."
        ]
      },
      {
        title: "Hjørnet",
        objective: "Gå to felter frem, drej mod nord og gå tre felter til målet.",
        learningFocus: "Planlægning af to sekvenser.",
        board: boardConfig({
          start: { x: 1, y: 7, direction: "east" },
          goal: { x: 3, y: 4 }
        }),
        templates: createTemplates(
          ["// Flyt mod øst, drej og fortsæt mod nord."],
          ["# Flyt mod øst, drej og fortsæt mod nord"]
        ),
        tips: [
          "Drej først når du står på hjørnefeltet.",
          "Mål feltet du står på efter hvert skridt.",
          "Brug højre() når du skal fra øst til syd og venstre() fra øst til nord."
        ]
      },
      {
        title: "Mod syd",
        objective: "Vend robotten om og gå to felter mod syd.",
        learningFocus: "Kombinere to drej for at vende om.",
        board: boardConfig({
          start: { x: 5, y: 3, direction: "north" },
          goal: { x: 5, y: 5 }
        }),
        templates: createTemplates(
          ["// Brug to højre() eller to venstre() til at vende om."],
          ["# Brug to drej til at vende robotten om"]
        ),
        tips: [
          "To højre() i træk vender robotten 180°.",
          "Skriv frem(); efter du har vendt.",
          "Tæl præcis to skridt efter du vender."
        ]
      },
      {
        title: "Zigzag",
        objective: "Bevæg dig mod nordøst i en zigzag for at nå målet.",
        learningFocus: "Skiftevis drej og frem.",
        board: boardConfig({
          start: { x: 0, y: 7, direction: "north" },
          goal: { x: 2, y: 5 }
        }),
        templates: createTemplates(
          ["// Skift mellem højre()/venstre() og frem()."],
          ["# Skift mellem drej og frem for at zigzagge"]
        ),
        tips: [
          "Planlæg hvert sving, før du skriver det.",
          "Hold øje med retningen efter hvert drej.",
          "Zigzag kræver korte sekvenser gentaget to gange."
        ]
      },
      {
        title: "Lang vandring",
        objective: "Gå hele vejen til øverste højre hjørne.",
        learningFocus: "Lange sekvenser uden fejl.",
        board: boardConfig({
          start: { x: 0, y: 7, direction: "east" },
          goal: { x: 7, y: 0 }
        }),
        templates: createTemplates(
          [
            "// Bevæg dig først mod øst.",
            "// Drej derefter mod nord og fortsæt."
          ],
          [
            "# Bevæg dig først mod øst",
            "# Drej derefter mod nord og fortsæt"
          ]
        ),
        tips: [
          "Del turen op i to stræk.",
          "Brug en drej midtvejs for at ændre retning.",
          "Tænk over hvor mange felter der er på hele brættet."
        ]
      },
      {
        title: "Midtpunktet",
        objective: "Gå til midten af brættet og stop på målet.",
        learningFocus: "Flere ændringer i retning.",
        board: boardConfig({
          start: { x: 7, y: 7, direction: "west" },
          goal: { x: 3, y: 3 }
        }),
        templates: createTemplates(
          ["// Naviger først mod vest, derefter mod nord."],
          ["# Naviger først mod vest, derefter mod nord"]
        ),
        tips: [
          "Brug samme mønster som en L-form.",
          "Start med at gå vandret, derefter lodret.",
          "Du kan samle frem(); kommandoer i blokke."
        ]
      },
      {
        title: "Lang diagonal",
        objective: "Følg en sti der skifter mellem øst og nord for at nå målet.",
        learningFocus: "Gentagne mønstre.",
        board: boardConfig({
          start: { x: 1, y: 6, direction: "east" },
          goal: { x: 5, y: 2 }
        }),
        templates: createTemplates(
          ["// Gentag et mønster der flytter dig en op og en til højre."],
          ["# Gentag et mønster der flytter dig en op og en til højre"]
        ),
        tips: [
          "Gentag sekvensen frem(); højre(); frem(); venstre().",
          "Hold styr på hvor mange gange du gentager mønsteret.",
          "Afslut uden ekstra drej når du er på målet."
        ]
      },
      {
        title: "Tilbage til startlinjen",
        objective: "Flyt robotten tilbage til nederste række og frem til målet.",
        learningFocus: "Vend tilbage og fortsæt.",
        board: boardConfig({
          start: { x: 4, y: 4, direction: "south" },
          goal: { x: 7, y: 7 }
        }),
        templates: createTemplates(
          ["// Gå mod syd og drej derefter mod øst."],
          ["# Gå mod syd og drej derefter mod øst"]
        ),
        tips: [
          "Tjek retningen inden du begynder at gå frem.",
          "Du skal skifte retning én gang.",
          "Målet er på samme række som startfeltet."
        ]
      },
      {
        title: "Fire hjørner",
        objective: "Besøg to hjørner på vej til målet.",
        learningFocus: "Lang planlagt rute.",
        board: boardConfig({
          start: { x: 0, y: 0, direction: "south" },
          goal: { x: 7, y: 7 }
        }),
        templates: createTemplates(
          [
            "// Besøg nederste venstre hjørne først.",
            "// Gå derefter til øverste højre."
          ],
          [
            "# Besøg nederste venstre hjørne først",
            "# Gå derefter til øverste højre"
          ]
        ),
        tips: [
          "Del turen i tre lange stræk.",
          "Husk at brættet er 8x8 felter.",
          "Sørg for at slutte med retningen mod øst før sidste stræk."
        ]
      }
    ],
    2: [
      {
        title: "Gentagelser frem",
        objective: "Brug en løkke til at gå fem felter frem.",
        learningFocus: "for-løkker og gentagne bevægelser.",
        board: boardConfig({
          start: { x: 0, y: 7, direction: "east" },
          goal: { x: 5, y: 7 }
        }),
        templates: createTemplates(
          [
            "for (int i = 0; i < 5; i++) {",
            "    // Kald frem(); her",
            "}"
          ],
          [
            "for ($i = 0; $i -lt 5; $i++) {",
            "    # Kald kommandoen frem her",
            "}"
          ]
        ),
        tips: [
          "Løkken skal køre fem gange.",
          "Hver iteration skal kalde frem(); én gang.",
          "Placer kommandoen inde i løkkens blok."
        ]
      },
      {
        title: "To sving med løkker",
        objective: "Brug løkker til at gå tre felter, dreje og gå tre felter igen.",
        learningFocus: "Gentagelser med retningsskift.",
        board: boardConfig({
          start: { x: 1, y: 7, direction: "north" },
          goal: { x: 4, y: 4 }
        }),
        templates: createTemplates(
          [
            "// Brug en løkke til den første strækning.",
            "// Drej, og brug derefter en ny løkke."
          ],
          [
            "# Brug en løkke til den første strækning",
            "# Drej og gentag med en ny løkke"
          ]
        ),
        tips: [
          "Du kan have mere end én løkke i funktionen.",
          "Drej mellem de to løkker.",
          "Begge løkker skal bruge samme antal gentagelser."
        ]
      },
      {
        title: "Trappestigning",
        objective: "Brug en løkke til at skabe et trappermønster.",
        learningFocus: "Gentagne sekvenser inde i løkker.",
        board: boardConfig({
          start: { x: 0, y: 7, direction: "east" },
          goal: { x: 4, y: 3 }
        }),
        templates: createTemplates(
          [
            "for (int i = 0; i < 3; i++) {",
            "    // Tilføj en sekvens der flytter dig et skridt op og et skridt mod øst",
            "}"
          ],
          [
            "for ($i = 0; $i -lt 3; $i++) {",
            "    # Tilføj en sekvens der flytter dig et skridt op og et skridt mod øst",
            "}"
          ]
        ),
        tips: [
          "Gentag en lille sekvens inde i løkken.",
          "Sørg for at du både bevæger dig op og til højre hver gang.",
          "Afslut med ekstra skridt hvis målet kræver det."
        ]
      },
      {
        title: "Tilbage og frem",
        objective: "Brug en løkke til at gå frem og tilbage tre gange og slut ved målet.",
        learningFocus: "Skifte retning i løkker.",
        board: boardConfig({
          start: { x: 4, y: 4, direction: "east" },
          goal: { x: 6, y: 4 }
        }),
        templates: createTemplates(
          [
            "for (int i = 0; i < 3; i++) {",
            "    // Gå et felt frem og et felt tilbage",
            "}",
            "// Slut på målet"
          ],
          [
            "for ($i = 0; $i -lt 3; $i++) {",
            "    # Gå et felt frem og et felt tilbage",
            "}",
            "# Slut på målet"
          ]
        ),
        tips: [
          "Inde i løkken skal du både gå frem og tilbage.",
          "Efter løkken skal du stå tæt på målet.",
          "Tilføj ekstra kommandoer efter løkken hvis du ikke står på målet."
        ]
      },
      {
        title: "Vendepunkt",
        objective: "Brug en løkke til at vende robotten hele vejen rundt.",
        learningFocus: "Gentag drej i løkker.",
        board: boardConfig({
          start: { x: 2, y: 2, direction: "north" },
          goal: { x: 2, y: 2 }
        }),
        templates: createTemplates(
          [
            "for (int i = 0; i < 4; i++) {",
            "    // Drej til højre",
            "}",
            "// Bevæger dig først efter at have drejet"
          ],
          [
            "for ($i = 0; $i -lt 4; $i++) {",
            "    # Drej til højre",
            "}",
            "# Bevæger dig først efter at have drejet"
          ]
        ),
        tips: [
          "Fire højre() bringer dig tilbage til startretningen.",
          "Når du har vendt dig, kan du gå mod målet.",
          "Målet er samme felt som start, så du skal kun rotere."
        ]
      },
      {
        title: "Repetition af mønster",
        objective: "Gentag et bevægelsesmønster fire gange og slut på målet.",
        learningFocus: "Mønster i løkke.",
        board: boardConfig({
          start: { x: 0, y: 7, direction: "north" },
          goal: { x: 4, y: 3 }
        }),
        templates: createTemplates(
          [
            "for (int i = 0; i < 4; i++) {",
            "    // Tilføj kommandoer der flytter dig et skridt nord og et skridt øst",
            "}"
          ],
          [
            "for ($i = 0; $i -lt 4; $i++) {",
            "    # Tilføj kommandoer der flytter dig et skridt nord og et skridt øst",
            "}"
          ]
        ),
        tips: [
          "Sørg for at løkken bevæger dig både op og mod højre.",
          "Efter fire gentagelser skal du stå på målet.",
          "Retningen efter hver iteration skal passe til næste skridt."
        ]
      },
      {
        title: "Korridor",
        objective: "Brug en løkke til at gå gennem en smal korridor uden drej.",
        learningFocus: "Simple løkker til lineære stræk.",
        board: boardConfig({
          start: { x: 2, y: 7, direction: "north" },
          goal: { x: 2, y: 1 }
        }),
        templates: createTemplates(
          [
            "int skridt = 6;",
            "for (int i = 0; i < skridt; i++) {",
            "    // Gå frem",
            "}"
          ],
          [
            "$skridt = 6",
            "for ($i = 0; $i -lt $skridt; $i++) {",
            "    # Gå frem",
            "}"
          ]
        ),
        tips: [
          "Brug en variabel til at styre længden hvis du vil.",
          "Husk at retningen allerede er nord.",
          "Målet ligger seks felter væk."
        ]
      },
      {
        title: "Rampe",
        objective: "Kombinér to løkker for at lave en rampe op ad brættet.",
        learningFocus: "Flere løkker i samme funktion.",
        board: boardConfig({
          start: { x: 7, y: 7, direction: "west" },
          goal: { x: 3, y: 3 }
        }),
        templates: createTemplates(
          [
            "for (int i = 0; i < 4; i++) {",
            "    // Bevæg dig et felt mod vest",
            "}",
            "// Drej og gentag mod nord"
          ],
          [
            "for ($i = 0; $i -lt 4; $i++) {",
            "    # Bevæg dig et felt mod vest",
            "}",
            "# Drej og gentag mod nord"
          ]
        ),
        tips: [
          "Du kan bruge en løkke per retning.",
          "Husk at dreje mellem løkkerne.",
          "Tjek at du ender på koordinat (3,3)."
        ]
      },
      {
        title: "Kvadrat",
        objective: "Lad robotten gå en hel kvadrat og slutte på målet.",
        learningFocus: "Løkker med flere kommandoer indeni.",
        board: boardConfig({
          start: { x: 3, y: 3, direction: "east" },
          goal: { x: 5, y: 5 }
        }),
        templates: createTemplates(
          [
            "for (int side = 0; side < 4; side++) {",
            "    // Gå tre skridt frem",
            "    // Drej til højre",
            "}"
          ],
          [
            "for ($side = 0; $side -lt 4; $side++) {",
            "    # Gå tre skridt frem",
            "    # Drej til højre",
            "}"
          ]
        ),
        tips: [
          "Gentag præcis det samme mønster fire gange.",
          "Efter kvadratet kan du gå mod målet hvis det er nødvendigt.",
          "Hold styr på retningen når du er færdig med løkken."
        ]
      },
      {
        title: "Afslutningsløkken",
        objective: "Brug en løkke til at afslutte de sidste skridt frem til målet.",
        learningFocus: "Kombination af sekvenser og løkker.",
        board: boardConfig({
          start: { x: 0, y: 6, direction: "east" },
          goal: { x: 6, y: 2 }
        }),
        templates: createTemplates(
          [
            "// Gå først mod øst.",
            "for (int i = 0; i < 4; i++) {",
            "    // Gentag en lille sekvens her",
            "}"
          ],
          [
            "# Gå først mod øst",
            "for ($i = 0; $i -lt 4; $i++) {",
            "    # Gentag en lille sekvens her",
            "}"
          ]
        ),
        tips: [
          "Kombinér en indledende sekvens med en løkke.",
          "Sekvensen i løkken bør flytte dig op og til højre.",
          "Afslut uden ekstra skridt når du når målet."
        ]
      }
    ],
    3: [
      {
        title: "Synlige blokke",
        objective: "Naviger rundt om den synlige blok for at nå målet.",
        learningFocus: "Planlægning med forhindringer.",
        board: boardConfig({
          start: { x: 0, y: 7, direction: "east" },
          goal: { x: 4, y: 7 },
          obstacles: [{ x: 2, y: 7 }],
          revealOnRun: false
        }),
        templates: createTemplates(
          ["// Planlæg ruten uden at ramme blokken."],
          ["# Planlæg ruten uden at ramme blokken"]
        ),
        tips: [
          "Du kan gå op og ned for at undgå blokken.",
          "Blokeringer vises på brættet fra start.",
          "Hold øje med hvor mange skridt der kræves på hver side af blokken."
        ]
      },
      {
        title: "Tæt passage",
        objective: "Gå gennem passagen uden at ramme forhindringerne.",
        learningFocus: "Præcis styring mellem blokke.",
        board: boardConfig({
          start: { x: 1, y: 7, direction: "north" },
          goal: { x: 1, y: 2 },
          obstacles: [
            { x: 0, y: 4 },
            { x: 2, y: 4 }
          ],
          revealOnRun: false
        }),
        templates: createTemplates(
          ["// Gå lige igennem passagen."],
          ["# Gå lige igennem passagen"]
        ),
        tips: [
          "Passagen er én celle bred.",
          "Du behøver ikke skifte retning.",
          "Tænk over hvor mange skridt der er fra start til mål."
        ]
      },
      {
        title: "L-form med blok",
        objective: "Undgå blokken og lav en L-form til målet.",
        learningFocus: "Kombinere plan og blokering.",
        board: boardConfig({
          start: { x: 3, y: 7, direction: "north" },
          goal: { x: 6, y: 4 },
          obstacles: [{ x: 3, y: 5 }],
          revealOnRun: false
        }),
        templates: createTemplates(
          ["// Find en vej uden om forhindringen."],
          ["# Find en vej uden om forhindringen"]
        ),
        tips: [
          "Du kan flytte dig til siden før du går op.",
          "Blokeringen dækker én celle, så planlæg udenom.",
          "Slut på præcis koordinat (6,4)."
        ]
      },
      {
        title: "To blokke",
        objective: "Naviger rundt om to blokke på stribe.",
        learningFocus: "Strategi med flere forhindringer.",
        board: boardConfig({
          start: { x: 0, y: 6, direction: "east" },
          goal: { x: 5, y: 6 },
          obstacles: [
            { x: 2, y: 6 },
            { x: 3, y: 6 }
          ],
          revealOnRun: false
        }),
        templates: createTemplates(
          ["// Lav en omvej omkring begge blokke."],
          ["# Lav en omvej omkring begge blokke"]
        ),
        tips: [
          "Det kan betale sig at gå op én række, forbi blokken og ned igen.",
          "Forhindringerne er ved siden af hinanden.",
          "Du skal tilbage på samme række som målet."
        ]
      },
      {
        title: "Snæver korridor",
        objective: "Find en rute gennem en korridor med sideblokke.",
        learningFocus: "Navigere i snævre omgivelser.",
        board: boardConfig({
          start: { x: 4, y: 7, direction: "north" },
          goal: { x: 4, y: 1 },
          obstacles: [
            { x: 3, y: 5 },
            { x: 5, y: 4 }
          ],
          revealOnRun: false
        }),
        templates: createTemplates(
          ["// Bliv i korridoren og undgå væggene."],
          ["# Bliv i korridoren og undgå væggene"]
        ),
        tips: [
          "Hold dig på samme kolonne hele vejen.",
          "Blokkene står på nabofelter, så du skal ikke dreje.",
          "Tæl præcis seks skridt frem."
        ]
      },
      {
        title: "Vinkel rundt blok",
        objective: "Lav et 90° sving rundt om en blok.",
        learningFocus: "Planlægge vinkelmanøvre.",
        board: boardConfig({
          start: { x: 5, y: 7, direction: "west" },
          goal: { x: 2, y: 4 },
          obstacles: [{ x: 3, y: 5 }],
          revealOnRun: false
        }),
        templates: createTemplates(
          ["// Lav et sving uden at ramme blokken."],
          ["# Lav et sving uden at ramme blokken"]
        ),
        tips: [
          "Gå uden om blokken ved at holde afstand på ét felt.",
          "Husk at dreje to gange for at komme rundt.",
          "Målet er diagonalt fra startpunktet."
        ]
      },
      {
        title: "Mur af blokke",
        objective: "Find den åbne passage i muren af blokke.",
        learningFocus: "Observation af brættet.",
        board: boardConfig({
          start: { x: 0, y: 7, direction: "east" },
          goal: { x: 7, y: 7 },
          obstacles: [
            { x: 3, y: 7 },
            { x: 3, y: 6 },
            { x: 3, y: 5 },
            { x: 4, y: 5 },
            { x: 5, y: 5 }
          ],
          revealOnRun: false
        }),
        templates: createTemplates(
          ["// Find passagen og gå igennem den."],
          ["# Find passagen og gå igennem den"]
        ),
        tips: [
          "Der er en åbning på række 4.",
          "Du skal op før du kan gå til højre.",
          "Når du er forbi muren, kan du gå direkte mod målet."
        ]
      },
      {
        title: "Checkpoint med blok",
        objective: "Besøg checkpointet på vejen uden at ramme blokken.",
        learningFocus: "Planlægning med checkpoints.",
        board: boardConfig({
          start: { x: 6, y: 6, direction: "west" },
          goal: { x: 1, y: 2 },
          obstacles: [{ x: 3, y: 3 }],
          checkpoints: [{ x: 4, y: 4 }],
          revealOnRun: false
        }),
        templates: createTemplates(
          ["// Sørg for at besøge checkpointet inden målet."],
          ["# Sørg for at besøge checkpointet inden målet"]
        ),
        tips: [
          "Checkpoints skal besøges, ellers låser målet ikke.",
          "Planlæg en rute der både rammer checkpoint og mål.",
          "Undgå feltet (3,3)."
        ]
      },
      {
        title: "Svævende zigzag",
        objective: "Zigzag gennem blokke der danner et mønster.",
        learningFocus: "Skifte retning med forhindringer.",
        board: boardConfig({
          start: { x: 2, y: 7, direction: "north" },
          goal: { x: 6, y: 3 },
          obstacles: [
            { x: 3, y: 6 },
            { x: 2, y: 5 },
            { x: 4, y: 4 },
            { x: 3, y: 3 }
          ],
          revealOnRun: false
        }),
        templates: createTemplates(
          ["// Brug både venstre() og højre() for at zigzagge."],
          ["# Brug både venstre og højre for at zigzagge"]
        ),
        tips: [
          "Hold dig én celle fra hver blok.",
          "Planlæg hver drej på forhånd.",
          "Afslut med at gå mod øst de sidste felter."
        ]
      },
      {
        title: "Blokeringstest",
        objective: "Brug blokering() til at teste om vejen er fri, selvom blokken er synlig.",
        learningFocus: "Introduktion til blokering().",
        board: boardConfig({
          start: { x: 1, y: 6, direction: "east" },
          goal: { x: 5, y: 6 },
          obstacles: [{ x: 3, y: 6 }],
          revealOnRun: false
        }),
        templates: createTemplates(
          [
            "if (!blokering(\"frem\")) {",
            "    // Gå frem hvis der ikke er blokering",
            "} else {",
            "    // Lav en omvej",
            "}"
          ],
          [
            "if (-not (blokering \"frem\")) {",
            "    # Gå frem hvis der ikke er blokering",
            "} else {",
            "    # Lav en omvej",
            "}"
          ]
        ),
        tips: [
          "Selvom blokken er synlig, kan du øve brugen af blokering().",
          "Planlæg en alternativ rute i else-grenen.",
          "Målet ligger to felter efter blokken."
        ]
      }
    ],
    4: [
      {
        title: "Skiftende blokering",
        objective: "Brug blokering() til at vælge mellem to veje.",
        learningFocus: "If/else og blokering().",
        board: boardConfig({
          start: { x: 0, y: 7, direction: "east" },
          goal: { x: 6, y: 7 },
          obstacles: [{ x: 2, y: 7 }]
        }),
        templates: createTemplates(
          [
            "if (blokering(\"frem\")) {",
            "    // Lav en omvej op og tilbage",
            "} else {",
            "    // Gå direkte frem",
            "}"
          ],
          [
            "if (blokering \"frem\") {",
            "    # Lav en omvej op og tilbage",
            "} else {",
            "    # Gå direkte frem",
            "}"
          ]
        ),
        tips: [
          "blokering() returnerer true hvis der står en blok i den retning.",
          "I else kan du beskrive den normale rute.",
          "Omvejen kan gå én række op og tilbage til målet."
        ]
      },
      {
        title: "To checkpoints",
        objective: "Besøg to checkpoints i valgfri rækkefølge før målet.",
        learningFocus: "Planlægning af komplekse ruter.",
        board: boardConfig({
          start: { x: 1, y: 6, direction: "east" },
          goal: { x: 6, y: 1 },
          checkpoints: [
            { x: 3, y: 5 },
            { x: 4, y: 2 }
          ]
        }),
        templates: createTemplates(
          ["// Planlæg en rute der rammer begge checkpoints."],
          ["# Planlæg en rute der rammer begge checkpoints"]
        ),
        tips: [
          "Checkpoints lyser grønt når de er besøgt.",
          "Du bestemmer selv rækkefølgen.",
          "Planlæg så du ikke skal tilbage ad samme vej."
        ]
      },
      {
        title: "Skift retning efter blok",
        objective: "Test blokering før du drejer til højre.",
        learningFocus: "Betingede drej.",
        board: boardConfig({
          start: { x: 5, y: 7, direction: "north" },
          goal: { x: 7, y: 5 },
          obstacles: [{ x: 5, y: 5 }]
        }),
        templates: createTemplates(
          [
            "while (!blokering(\"frem\")) {",
            "    frem();",
            "}",
            "højre();",
            "// Fortsæt mod målet"
          ],
          [
            "while (-not (blokering \"frem\")) {",
            "    frem",
            "}",
            "højre",
            "# Fortsæt mod målet"
          ]
        ),
        tips: [
          "Brug while til at gå frem indtil du rammer blokken.",
          "Efter løkken skal du dreje for at komme udenom.",
          "Afslut med at gå mod øst."
        ]
      },
      {
        title: "Kontrol af mål",
        objective: "Stop når du står på målet ved at tjekke blokering(\"mål\").",
        learningFocus: "Brug af blokering til målfeltet.",
        board: boardConfig({
          start: { x: 0, y: 3, direction: "east" },
          goal: { x: 6, y: 3 }
        }),
        templates: createTemplates(
          [
            "while (!blokering(\"mål\")) {",
            "    frem();",
            "}"
          ],
          [
            "while (-not (blokering \"mål\")) {",
            "    frem",
            "}"
          ]
        ),
        tips: [
          "blokering(\"mål\") er sand når du står på målet.",
          "Løkken stopper automatisk når du er fremme.",
          "Sørg for ikke at gå et skridt for langt efter løkken."
        ]
      },
      {
        title: "Lang korridor med blok",
        objective: "Brug betingelser til at håndtere blok midt i korridoren.",
        learningFocus: "If/else i længere sekvenser.",
        board: boardConfig({
          start: { x: 2, y: 7, direction: "north" },
          goal: { x: 2, y: 0 },
          obstacles: [{ x: 2, y: 4 }]
        }),
        templates: createTemplates(
          [
            "while (true) {",
            "    if (blokering(\"frem\")) {",
            "        // Lav en omvej",
            "        break;",
            "    }",
            "    frem();",
            "}"
          ],
          [
            "while ($true) {",
            "    if (blokering \"frem\") {",
            "        # Lav en omvej",
            "        break",
            "    }",
            "    frem",
            "}"
          ]
        ),
        tips: [
          "En uendelig løkke kan brydes med break.",
          "Omvejen kan være at gå rundt om blokken.",
          "Fortsæt mod målet efter du er forbi blokken."
        ]
      },
      {
        title: "Skiftevis kontrol",
        objective: "Skift mellem to retninger afhængig af blokering.",
        learningFocus: "if/else-if struktur.",
        board: boardConfig({
          start: { x: 4, y: 6, direction: "east" },
          goal: { x: 7, y: 3 },
          obstacles: [
            { x: 5, y: 6 },
            { x: 6, y: 5 }
          ]
        }),
        templates: createTemplates(
          [
            "for (int i = 0; i < 4; i++) {",
            "    if (blokering(\"frem\")) {",
            "        venstre();",
            "    } else if (blokering(\"højre\")) {",
            "        venstre();",
            "    } else {",
            "        frem();",
            "    }",
            "}"
          ],
          [
            "for ($i = 0; $i -lt 4; $i++) {",
            "    if (blokering \"frem\") {",
            "        venstre",
            "    } elseif (blokering \"højre\") {",
            "        venstre",
            "    } else {",
            "        frem",
            "    }",
            "}"
          ]
        ),
        tips: [
          "Brug elseif til at teste flere retninger.",
          "Planlæg hvordan du kommer forbi begge blokke.",
          "Tæl hvor mange iterationer du har brug for."
        ]
      },
      {
        title: "Checkpoint spiral",
        objective: "Besøg tre checkpoints i en spiral uden at ramme blokke.",
        learningFocus: "Komplekse ruter med checkpoints.",
        board: boardConfig({
          start: { x: 1, y: 1, direction: "east" },
          goal: { x: 6, y: 6 },
          checkpoints: [
            { x: 6, y: 1 },
            { x: 6, y: 6 },
            { x: 1, y: 6 }
          ],
          obstacles: [
            { x: 3, y: 3 },
            { x: 4, y: 4 }
          ]
        }),
        templates: createTemplates(
          ["// Lav en spiral der rammer alle checkpoints."],
          ["# Lav en spiral der rammer alle checkpoints"]
        ),
        tips: [
          "Checkpoints kan besøges i enhver rækkefølge, men en spiral er effektiv.",
          "Undgå blokkene i midten.",
          "Afslut når du står på målet."
        ]
      },
      {
        title: "Blokering i løkke",
        objective: "Brug blokering i en løkke til at undgå faste blokke.",
        learningFocus: "Kombinere løkker og betingelser.",
        board: boardConfig({
          start: { x: 0, y: 5, direction: "east" },
          goal: { x: 7, y: 5 },
          obstacles: [
            { x: 2, y: 5 },
            { x: 4, y: 5 },
            { x: 6, y: 5 }
          ]
        }),
        templates: createTemplates(
          [
            "while (!blokering(\"mål\")) {",
            "    if (blokering(\"frem\")) {",
            "        venstre();",
            "        frem();",
            "        højre();",
            "    } else {",
            "        frem();",
            "    }",
            "}"
          ],
          [
            "while (-not (blokering \"mål\")) {",
            "    if (blokering \"frem\") {",
            "        venstre",
            "        frem",
            "        højre",
            "    } else {",
            "        frem",
            "    }",
            "}"
          ]
        ),
        tips: [
          "Brug venstre og højre til hurtigt at gå udenom blokken.",
          "Løkken stopper når du når målet.",
          "Hold styr på retningen efter hver omvej."
        ]
      },
      {
        title: "To målvalg",
        objective: "Vælg mellem to mulige ruter afhængig af blokering.",
        learningFocus: "Betinget målvalg.",
        board: boardConfig({
          start: { x: 3, y: 7, direction: "north" },
          goal: { x: 3, y: 0 },
          checkpoints: [{ x: 5, y: 5 }],
          obstacles: [{ x: 3, y: 4 }]
        }),
        templates: createTemplates(
          [
            "if (blokering(\"frem\")) {",
            "    højre();",
            "    // Gå til alternativ rute via checkpoint",
            "} else {",
            "    // Gå direkte mod målet",
            "}"
          ],
          [
            "if (blokering \"frem\") {",
            "    højre",
            "    # Gå til alternativ rute via checkpoint",
            "} else {",
            "    # Gå direkte mod målet",
            "}"
          ]
        ),
        tips: [
          "Checkpointet kan bruges som mellemstation.",
          "Hvis der ikke er blok foran, er den direkte vej lettest.",
          "Hvis blokken stopper dig, må du dreje og gå udenom."
        ]
      },
      {
        title: "Fleksibel strategi",
        objective: "Brug både while og if til at håndtere flere blokke.",
        learningFocus: "Sammensat kontrolstruktur.",
        board: boardConfig({
          start: { x: 1, y: 6, direction: "east" },
          goal: { x: 6, y: 2 },
          obstacles: [
            { x: 2, y: 6 },
            { x: 4, y: 5 },
            { x: 5, y: 3 }
          ]
        }),
        templates: createTemplates(
          [
            "while (!blokering(\"mål\")) {",
            "    if (blokering(\"frem\")) {",
            "        venstre();",
            "    }",
            "    frem();",
            "}"
          ],
          [
            "while (-not (blokering \"mål\")) {",
            "    if (blokering \"frem\") {",
            "        venstre",
            "    }",
            "    frem",
            "}"
          ]
        ),
        tips: [
          "Tjek forhindringerne før hvert skridt.",
          "Skift tilbage til hovedretningen efter omveje.",
          "Hold øje med målets koordinater."
        ]
      }
    ],
    5: [
      {
        title: "Lang rute med checkpoints",
        objective: "Besøg tre checkpoints spredt over brættet.",
        learningFocus: "Stor planlægning.",
        board: boardConfig({
          start: { x: 0, y: 7, direction: "east" },
          goal: { x: 7, y: 0 },
          checkpoints: [
            { x: 2, y: 5 },
            { x: 4, y: 3 },
            { x: 6, y: 1 }
          ]
        }),
        templates: createTemplates(
          ["// Planlæg en rute der rammer alle checkpoints."],
          ["# Planlæg en rute der rammer alle checkpoints"]
        ),
        tips: [
          "Besøg checkpointene i den rækkefølge der giver mindst omvej.",
          "Sørg for at retningen passer til næste stræk.",
          "Brug tidligere mønstre fra lavere niveauer."
        ]
      },
      {
        title: "Loop omkring forhindringer",
        objective: "Gå rundt om et kvadrat af blokke og nå målet.",
        learningFocus: "Navigere rundt om områder.",
        board: boardConfig({
          start: { x: 1, y: 6, direction: "east" },
          goal: { x: 6, y: 6 },
          obstacles: [
            { x: 3, y: 5 },
            { x: 4, y: 5 },
            { x: 3, y: 4 },
            { x: 4, y: 4 }
          ]
        }),
        templates: createTemplates(
          ["// Gå rundt om blokområdet som et omvendt U."],
          ["# Gå rundt om blokområdet som et omvendt U"]
        ),
        tips: [
          "Hold afstand på mindst ét felt til blokkene.",
          "Vend tilbage til række 6 for at nå målet.",
          "Planlæg hvornår du drejer op og ned."
        ]
      },
      {
        title: "Tjek hver retning",
        objective: "Brug blokering til at vælge mellem tre retninger.",
        learningFocus: "if/else-if/else mønster.",
        board: boardConfig({
          start: { x: 4, y: 4, direction: "north" },
          goal: { x: 7, y: 1 },
          obstacles: [
            { x: 4, y: 2 },
            { x: 5, y: 3 },
            { x: 6, y: 4 }
          ]
        }),
        templates: createTemplates(
          [
            "if (!blokering(\"frem\")) {",
            "    // Gå frem",
            "} else if (!blokering(\"højre\")) {",
            "    // Drej og gå mod højre",
            "} else {",
            "    // Drej mod venstre som sidste mulighed",
            "}"
          ],
          [
            "if (-not (blokering \"frem\")) {",
            "    # Gå frem",
            "} elseif (-not (blokering \"højre\")) {",
            "    # Drej og gå mod højre",
            "} else {",
            "    # Drej mod venstre som sidste mulighed",
            "}"
          ]
        ),
        tips: [
          "Test retninger i prioriteret rækkefølge.",
          "Sørg for at opdatere retningen efter hver drej.",
          "Gentag mønsteret til du når målet."
        ]
      },
      {
        title: "Checkpoint labyrint",
        objective: "Besøg checkpoints i labyrinten og nå målet uden blokke.",
        learningFocus: "Avanceret ruteplan.",
        board: boardConfig({
          start: { x: 0, y: 4, direction: "east" },
          goal: { x: 7, y: 4 },
          checkpoints: [
            { x: 2, y: 4 },
            { x: 4, y: 4 },
            { x: 6, y: 4 }
          ],
          obstacles: [
            { x: 3, y: 3 },
            { x: 3, y: 5 },
            { x: 5, y: 3 },
            { x: 5, y: 5 }
          ]
        }),
        templates: createTemplates(
          ["// Brug checkpoints som vejvisere gennem midten."],
          ["# Brug checkpoints som vejvisere gennem midten"]
        ),
        tips: [
          "Hold dig på midterrækken når det er muligt.",
          "Undgå blokkene der danner vægge omkring checkpoints.",
          "Besøg checkpoints i rækkefølge fra venstre mod højre."
        ]
      },
      {
        title: "Adaptiv rute",
        objective: "Brug blokering i en løkke til at håndtere flere mulige blokke.",
        learningFocus: "Dynamiske beslutninger.",
        board: boardConfig({
          start: { x: 1, y: 7, direction: "north" },
          goal: { x: 6, y: 2 },
          obstacles: [
            { x: 1, y: 5 },
            { x: 3, y: 4 },
            { x: 5, y: 3 }
          ]
        }),
        templates: createTemplates(
          [
            "while (!blokering(\"mål\")) {",
            "    if (blokering(\"frem\")) {",
            "        højre();",
            "    }",
            "    frem();",
            "}"
          ],
          [
            "while (-not (blokering \"mål\")) {",
            "    if (blokering \"frem\") {",
            "        højre",
            "    }",
            "    frem",
            "}"
          ]
        ),
        tips: [
          "Brug blokering før hvert skridt.",
          "Drej tilbage mod nord efter omvejen.",
          "Målet ligger diagonalt fra start."
        ]
      },
      {
        title: "To mål og to blokke",
        objective: "Find vejen til målet på højre side uden at ramme blokkene.",
        learningFocus: "Lang omvej.",
        board: boardConfig({
          start: { x: 0, y: 0, direction: "south" },
          goal: { x: 7, y: 3 },
          obstacles: [
            { x: 3, y: 1 },
            { x: 4, y: 2 }
          ]
        }),
        templates: createTemplates(
          ["// Lav en omvej rundt om blokkene for at nå mål."],
          ["# Lav en omvej rundt om blokkene for at nå mål"]
        ),
        tips: [
          "Overvej at gå rundt om blokkene via bagsiden.",
          "Skift mellem venstre og højre drej for at navigere.",
          "Afslut på rækken y = 3."
        ]
      },
      {
        title: "Tre løkker",
        objective: "Brug tre løkker til tre forskellige stræk.",
        learningFocus: "Opdeling af koden i sektioner.",
        board: boardConfig({
          start: { x: 7, y: 7, direction: "west" },
          goal: { x: 0, y: 0 }
        }),
        templates: createTemplates(
          [
            "for (int i = 0; i < 7; i++) {",
            "    frem();",
            "}",
            "venstre();",
            "for (int i = 0; i < 7; i++) {",
            "    frem();",
            "}",
            "venstre();",
            "for (int i = 0; i < 7; i++) {",
            "    frem();",
            "}"
          ],
          [
            "for ($i = 0; $i -lt 7; $i++) {",
            "    frem",
            "}",
            "venstre",
            "for ($i = 0; $i -lt 7; $i++) {",
            "    frem",
            "}",
            "venstre",
            "for ($i = 0; $i -lt 7; $i++) {",
            "    frem",
            "}"
          ]
        ),
        tips: [
          "Hver løkke dækker en side af kvadratet.",
          "Husk at dreje mellem løkkerne.",
          "Efter tredje løkke står du på målet."
        ]
      },
      {
        title: "Faldgruber",
        objective: "Undgå blokke der danner en zigzag-faldgrube.",
        learningFocus: "Præcis placering.",
        board: boardConfig({
          start: { x: 1, y: 7, direction: "east" },
          goal: { x: 6, y: 2 },
          obstacles: [
            { x: 2, y: 6 },
            { x: 3, y: 5 },
            { x: 4, y: 4 },
            { x: 5, y: 3 }
          ]
        }),
        templates: createTemplates(
          ["// Flyt dig diagonalt opad uden at ramme blokkene."],
          ["# Flyt dig diagonalt opad uden at ramme blokkene"]
        ),
        tips: [
          "Skift retning efter hvert skridt.",
          "Hold afstand på ét felt til hver blok.",
          "Afslut med en kort strækning mod øst."
        ]
      },
      {
        title: "Tilbage gennem tunnelen",
        objective: "Gå gennem en tunnel, vend om og gå tilbage til målet.",
        learningFocus: "Kombination af løkker og drej.",
        board: boardConfig({
          start: { x: 2, y: 7, direction: "north" },
          goal: { x: 2, y: 7 },
          obstacles: [
            { x: 1, y: 4 },
            { x: 3, y: 4 }
          ]
        }),
        templates: createTemplates(
          [
            "for (int i = 0; i < 3; i++) {",
            "    frem();",
            "}",
            "// Vend om og gå tilbage",
            "for (int i = 0; i < 3; i++) {",
            "    frem();",
            "}"
          ],
          [
            "for ($i = 0; $i -lt 3; $i++) {",
            "    frem",
            "}",
            "# Vend om og gå tilbage",
            "for ($i = 0; $i -lt 3; $i++) {",
            "    frem",
            "}"
          ]
        ),
        tips: [
          "Brug to højre() eller to venstre() til at vende om i midten.",
          "Tunnelen er lige, så du behøver ikke omveje.",
          "Du skal ende på samme felt som start."
        ]
      },
      {
        title: "Mål med omvej",
        objective: "Find en alternativ rute når midten er blokeret.",
        learningFocus: "Strategisk planlægning.",
        board: boardConfig({
          start: { x: 7, y: 0, direction: "south" },
          goal: { x: 0, y: 7 },
          obstacles: [
            { x: 4, y: 3 },
            { x: 3, y: 4 },
            { x: 4, y: 4 },
            { x: 5, y: 4 }
          ]
        }),
        templates: createTemplates(
          ["// Planlæg en omvej udenom blokkene i midten."],
          ["# Planlæg en omvej udenom blokkene i midten"]
        ),
        tips: [
          "Du kan bevæge dig rundt om kanten af brættet.",
          "Hold styr på retningen undervejs.",
          "Målet er diagonalt modsat start."
        ]
      }
    ],
    6: [
      {
        title: "Dynamisk korridor",
        objective: "Brug blokering i en løkke til at håndtere flere blokke i korridoren.",
        learningFocus: "Avanceret løkkelogik.",
        board: boardConfig({
          start: { x: 3, y: 7, direction: "north" },
          goal: { x: 3, y: 0 },
          obstacles: [
            { x: 3, y: 5 },
            { x: 3, y: 3 }
          ]
        }),
        templates: createTemplates(
          [
            "while (!blokering(\"mål\")) {",
            "    if (blokering(\"frem\")) {",
            "        venstre();",
            "        frem();",
            "        højre();",
            "    } else {",
            "        frem();",
            "    }",
            "}"
          ],
          [
            "while (-not (blokering \"mål\")) {",
            "    if (blokering \"frem\") {",
            "        venstre",
            "        frem",
            "        højre",
            "    } else {",
            "        frem",
            "    }",
            "}"
          ]
        ),
        tips: [
          "Brug samme omvej for begge blokke.",
          "Husk at du stadig er i korridoren efter omvejen.",
          "Løkken stopper når målet er nået."
        ]
      },
      {
        title: "Checkpoint beslutning",
        objective: "Vælg rækkefølgen for tre checkpoints baseret på blokering.",
        learningFocus: "Dynamisk planlægning.",
        board: boardConfig({
          start: { x: 1, y: 1, direction: "east" },
          goal: { x: 6, y: 6 },
          checkpoints: [
            { x: 5, y: 1 },
            { x: 5, y: 6 },
            { x: 1, y: 6 }
          ],
          obstacles: [
            { x: 3, y: 3 },
            { x: 4, y: 4 }
          ]
        }),
        templates: createTemplates(
          ["// Vælg den korteste vej mellem checkpoints ved hjælp af if-sætninger."],
          ["# Vælg den korteste vej mellem checkpoints ved hjælp af if-sætninger"]
        ),
        tips: [
          "Overvej at skrive hjælpesektioner til hver del af ruten.",
          "Blokkene i midten kræver en omvej.",
          "Afslut på målet efter sidste checkpoint."
        ]
      },
      {
        title: "Parallelle korridorer",
        objective: "Vælg mellem to korridorer afhængig af om den første er blokeret.",
        learningFocus: "Betingede valg med loops.",
        board: boardConfig({
          start: { x: 2, y: 7, direction: "north" },
          goal: { x: 5, y: 0 },
          obstacles: [
            { x: 2, y: 5 },
            { x: 5, y: 2 }
          ]
        }),
        templates: createTemplates(
          [
            "if (!blokering(\"frem\")) {",
            "    while (!blokering(\"mål\")) {",
            "        frem();",
            "    }",
            "} else {",
            "    højre();",
            "    frem();",
            "    venstre();",
            "    // Fortsæt i den anden korridor",
            "}"
          ],
          [
            "if (-not (blokering \"frem\")) {",
            "    while (-not (blokering \"mål\")) {",
            "        frem",
            "    }",
            "} else {",
            "    højre",
            "    frem",
            "    venstre",
            "    # Fortsæt i den anden korridor",
            "}"
          ]
        ),
        tips: [
          "Tjek først om korridoren foran er fri.",
          "Hvis ikke, flyt dig til den anden korridor og fortsæt.",
          "Husk at målet er diagonalt fremme."
        ]
      },
      {
        title: "Labyrint med valg",
        objective: "Naviger en labyrint hvor nogle gange er blokerede.",
        learningFocus: "Avanceret if/else.",
        board: boardConfig({
          start: { x: 0, y: 6, direction: "east" },
          goal: { x: 7, y: 1 },
          obstacles: [
            { x: 2, y: 6 },
            { x: 2, y: 5 },
            { x: 4, y: 4 },
            { x: 5, y: 3 },
            { x: 6, y: 2 }
          ]
        }),
        templates: createTemplates(
          [
            "for (int i = 0; i < 5; i++) {",
            "    if (blokering(\"frem\")) {",
            "        venstre();",
            "    }",
            "    frem();",
            "    højre();",
            "}"
          ],
          [
            "for ($i = 0; $i -lt 5; $i++) {",
            "    if (blokering \"frem\") {",
            "        venstre",
            "    }",
            "    frem",
            "    højre",
            "}"
          ]
        ),
        tips: [
          "Gentag mønsteret for hvert afsnit af labyrinten.",
          "Du kan indsætte ekstra betingelser hvis du sidder fast.",
          "Afslut med at gå mod nordøst til målet."
        ]
      },
      {
        title: "Avanceret checkpoint",
        objective: "Besøg checkpoints i bestemt rækkefølge mens du undgår nye blokke.",
        learningFocus: "Kontrol af state.",
        board: boardConfig({
          start: { x: 7, y: 7, direction: "west" },
          goal: { x: 0, y: 0 },
          checkpoints: [
            { x: 5, y: 7 },
            { x: 5, y: 3 },
            { x: 2, y: 3 }
          ],
          obstacles: [
            { x: 3, y: 5 },
            { x: 4, y: 4 }
          ]
        }),
        templates: createTemplates(
          ["// Besøg checkpoints i rækkefølgen fra venstre mod højre."],
          ["# Besøg checkpoints i rækkefølgen fra venstre mod højre"]
        ),
        tips: [
          "Checkpoints skal besøges i rækkefølgen de er listet.",
          "Blokkene danner en diagonal du skal forbi.",
          "Målet er i øverste venstre hjørne."
        ]
      },
      {
        title: "Fleksibel navigation",
        objective: "Skift strategi hvis du møder en blok.",
        learningFocus: "Flerlagret beslutningslogik.",
        board: boardConfig({
          start: { x: 3, y: 6, direction: "east" },
          goal: { x: 6, y: 2 },
          obstacles: [
            { x: 4, y: 6 },
            { x: 5, y: 5 },
            { x: 5, y: 3 }
          ]
        }),
        templates: createTemplates(
          [
            "while (!blokering(\"mål\")) {",
            "    if (blokering(\"frem\")) {",
            "        if (!blokering(\"venstre\")) {",
            "            venstre();",
            "        } else {",
            "            højre();",
            "        }",
            "    }",
            "    frem();",
            "}"
          ],
          [
            "while (-not (blokering \"mål\")) {",
            "    if (blokering \"frem\") {",
            "        if (-not (blokering \"venstre\")) {",
            "            venstre",
            "        } else {",
            "            højre",
            "        }",
            "    }",
            "    frem",
            "}"
          ]
        ),
        tips: [
          "Tjek venstre side først før du vælger højre.",
          "Sørg for at vende tilbage mod målet efter omveje.",
          "Løkken stopper når blokering(\"mål\") er sand."
        ]
      },
      {
        title: "Tilfældig blok",
        objective: "Håndter flere blokke ved at vælge mellem tre retninger.",
        learningFocus: "Komplekse if/else kombinationer.",
        board: boardConfig({
          start: { x: 1, y: 5, direction: "east" },
          goal: { x: 7, y: 1 },
          obstacles: [
            { x: 2, y: 5 },
            { x: 4, y: 4 },
            { x: 5, y: 2 },
            { x: 6, y: 1 }
          ]
        }),
        templates: createTemplates(
          [
            "while (!blokering(\"mål\")) {",
            "    if (blokering(\"frem\")) {",
            "        if (!blokering(\"venstre\")) {",
            "            venstre();",
            "        } else if (!blokering(\"højre\")) {",
            "            højre();",
            "        } else {",
            "            venstre();",
            "            venstre();",
            "        }",
            "    } else {",
            "        frem();",
            "    }",
            "}"
          ],
          [
            "while (-not (blokering \"mål\")) {",
            "    if (blokering \"frem\") {",
            "        if (-not (blokering \"venstre\")) {",
            "            venstre",
            "        } elseif (-not (blokering \"højre\")) {",
            "            højre",
            "        } else {",
            "            venstre",
            "            venstre",
            "        }",
            "    } else {",
            "        frem",
            "    }",
            "}"
          ]
        ),
        tips: [
          "Test venstre og højre før du vender om.",
          "Husk at to venstre() vender robotten om.",
          "Ret dig ind mod nordøst når du har valgt en omvej."
        ]
      },
      {
        title: "Checkpoint sløjfe",
        objective: "Besøg checkpointet midt på banen og fortsæt mod målet.",
        learningFocus: "While-løkker med intern tilstand.",
        board: boardConfig({
          start: { x: 0, y: 0, direction: "south" },
          goal: { x: 7, y: 7 },
          checkpoints: [{ x: 3, y: 3 }],
          obstacles: [
            { x: 3, y: 2 },
            { x: 4, y: 3 }
          ]
        }),
        templates: createTemplates(
          [
            "int besogt = 0;",
            "while (!blokering(\"mål\")) {",
            "    if (!besogt) {",
            "        // Naviger mod checkpointet og sæt besogt = 1 når du rammer det",
            "    } else if (!blokering(\"frem\")) {",
            "        frem();",
            "    } else {",
            "        højre();",
            "    }",
            "}"
          ],
          [
            "$besogt = $false;",
            "while (-not (blokering \"mål\")) {",
            "    if (-not $besogt) {",
            "        # Naviger mod checkpointet og sæt $besogt = $true når du rammer det",
            "    } elseif (-not (blokering \"frem\")) {",
            "        frem",
            "    } else {",
            "        højre",
            "    }",
            "}"
          ]
        ),
        tips: [
          "Brug en variabel til at huske om checkpointet er besøgt.",
          "Checkpoints lyser grønt når du rammer dem.",
          "Efter checkpointet skal du fortsætte mod sydøst."
        ]
      },
      {
        title: "Krydskontrol",
        objective: "Tjek fire retninger og vælg den bedste vej hver gang.",
        learningFocus: "if/else-if med flere retninger.",
        board: boardConfig({
          start: { x: 4, y: 7, direction: "north" },
          goal: { x: 0, y: 3 },
          obstacles: [
            { x: 4, y: 5 },
            { x: 3, y: 4 },
            { x: 2, y: 3 }
          ]
        }),
        templates: createTemplates(
          [
            "while (!blokering(\"mål\")) {",
            "    if (!blokering(\"frem\")) {",
            "        frem();",
            "    } else if (!blokering(\"venstre\")) {",
            "        venstre();",
            "    } else if (!blokering(\"højre\")) {",
            "        højre();",
            "    } else {",
            "        venstre();",
            "        venstre();",
            "    }",
            "}"
          ],
          [
            "while (-not (blokering \"mål\")) {",
            "    if (-not (blokering \"frem\")) {",
            "        frem",
            "    } elseif (-not (blokering \"venstre\")) {",
            "        venstre",
            "    } elseif (-not (blokering \"højre\")) {",
            "        højre",
            "    } else {",
            "        venstre",
            "        venstre",
            "    }",
            "}"
          ]
        ),
        tips: [
          "Start med at teste retningen du allerede står i.",
          "Hvis du må vende om, så husk at fortsætte fremad bagefter.",
          "Retningen mod målet ændres, når du går rundt om blokkene."
        ]
      },
      {
        title: "Retur til base",
        objective: "Patruljer et område og vend tilbage til startfeltet.",
        learningFocus: "Kombination af løkker og drej.",
        board: boardConfig({
          start: { x: 2, y: 6, direction: "east" },
          goal: { x: 2, y: 6 },
          obstacles: [
            { x: 4, y: 5 },
            { x: 4, y: 6 }
          ],
          checkpoints: [{ x: 5, y: 4 }]
        }),
        templates: createTemplates(
          [
            "for (int runde = 0; runde < 2; runde++) {",
            "    // Bevæg dig rundt om området og besøg checkpointet",
            "}",
            "// Vend tilbage til startfeltet"
          ],
          [
            "for ($runde = 0; $runde -lt 2; $runde++) {",
            "    # Bevæg dig rundt om området og besøg checkpointet",
            "}",
            "# Vend tilbage til startfeltet"
          ]
        ),
        tips: [
          "Sørg for at stå på startfeltet igen når løkken er færdig.",
          "Checkpointet skal besøges under patruljen.",
          "Planlæg en firkantet rute omkring forhindringerne."
        ]
      }
    ]
  };

  window.FALLBACK_TASKS = Object.entries(LEVELS).flatMap(([level, tasks]) =>
    tasks.map((task, index) => ({
      id: `${level}-${index + 1}`,
      level: Number(level),
      ...task
    }))
  );
})();
