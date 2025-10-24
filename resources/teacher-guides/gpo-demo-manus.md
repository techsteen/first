# Demo-manus · GPO grundlæggende politikker

1. Vis hvor Group Policy Management Console åbnes.
2. Opret OU "Demo" og link en ny GPO.
3. Konfigurer logon-banner (Computer Configuration → Policies → Windows Settings → Security Settings → Local Policies → Security Options → Interactive logon: Message text).
4. Tving opdatering med `gpupdate /force`.
5. Vis `gpresult /r` for at se den anvendte politik.
6. Diskutér sikkerhedskonsekvenser og hvornår man skal lave rollback.
