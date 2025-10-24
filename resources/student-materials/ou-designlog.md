# OU Designlog

## Case
- Virksomhed: NordTech
- Lokationer: København, Aarhus, Odense
- Teams: Support, Udvikling, Salg, HR
- Særlige krav: Support skal kunne nulstille passwords, Udvikling arbejder med testdomæner.

## Designbeslutninger
1. **Overordnet struktur:**
   - Root OU: `OU=NordTech`
   - Lokations-OUs under root for onsite support.
2. **Sikkerhedsgrupper:**
   - `GG_Support_Reset`
   - `GG_Dev_TestLab`

## Delegation
| OU | Rettighed | Gruppe |
| --- | --- | --- |
| Support | Reset user passwords | GG_Support_Reset |
| Udvikling | Create/delete computers | GG_Dev_TestLab |

## GPO-plan
- `GPO_Login_Banner` linkes til root.
- `GPO_Dev_PowerShell` linkes til Udvikling.

## Risikovurdering
- Hvis Udvikling delegeres for bredt kan der opstå sikkerhedsbrud.
- Overvej ekstra review hver måned.
