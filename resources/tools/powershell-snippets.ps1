# PowerShell snippets til AD-DS forløbet

# Opret OU struktur
New-ADOrganizationalUnit -Name "GF2 Students" -Path "DC=skolens-lab,DC=local"
New-ADOrganizationalUnit -Name "Support" -Path "OU=GF2 Students,DC=skolens-lab,DC=local"

# Importer brugere fra CSV
Import-Csv -Path .\elever.csv | ForEach-Object {
    New-ADUser -Name $_.DisplayName -GivenName $_.Fornavn -Surname $_.Efternavn -SamAccountName $_.Brugernavn -UserPrincipalName "$($_.Brugernavn)@skolens-lab.local" -Path "OU=GF2 Students,DC=skolens-lab,DC=local" -AccountPassword (ConvertTo-SecureString 'Velkommen!123' -AsPlainText -Force) -Enabled $true
}

# Tilføj bruger til gruppe
Add-ADGroupMember -Identity "GF2-Elever" -Members "elev01"

# Eksempel på hurtig rapport
Get-ADUser -Filter * -SearchBase "OU=Support,OU=GF2 Students,DC=skolens-lab,DC=local" | Select-Object Name,Enabled | Export-Csv -Path .\support-brugere.csv -NoTypeInformation
