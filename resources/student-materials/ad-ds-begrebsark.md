# AD-DS Begrebsark

| Begreb | Forklaring | Eksempel |
| --- | --- | --- |
| Domæne | Logisk grænse for brugere og ressourcer i Active Directory. | `skolens-lab.local`
| Domain Controller | Server med AD-DS rollen installeret som autentificerer brugere og enheder. | `DC01`
| Forest | Samling af et eller flere domæner med fælles skema. | Standard er ét forest per installation.
| OU (Organisationsenhed) | Beholder der grupperer objekter for nem administration og GPO-linking. | `OU=GF2 Students,DC=skolens-lab,DC=local`
| GPO | Politik der styrer indstillinger for brugere eller computere. | Password-politik for hele skolen.

## Hurtig guide
1. Log på domain controller med de udleverede credentials.
2. Åbn **Active Directory Users and Computers**.
3. Højreklik på domænet for at oprette nye OUs.
4. Brug søgning til at finde brugere eller grupper.

> Tip: Har du brug for hjælp, marker teksten eller klik på `?`-knapperne i modulet.
