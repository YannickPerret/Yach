Business value : 

- Mutli sourcing data (format et fournisseur) [fichier, excel, ical, dav]
- Ajouter des catégories aux sources (metadata)
- Synchroniser les calendriers
- Gestion des rappels via trigger
- Ajouter des events réguliers
- Gestion des jours des congés Suisse
- Ajouter des contraintes au calendrier
- Ajouter une API pour le système d'information
- Merger les calendriers choisis
- Stocker les url généré

|Source|  ->  |Transformation Json|  -> |Filtre / addition|   ->  |Export URL / cal|

Source : 
xls(x), txt, json, .ical, .ics, .ifb, .icalendar

-> Comment fournir son calendrier ?
-> comment dire quel calendrier je souhaite obtenir ?
(Stocké calendrier partagé ?)
-> Fournir les liens de calendrier partagés dans la config
-> stocke les events dans la base de donnée ou garder au format .ics ? Est-ce que les events vont être réutilisé prochainement ?

step 1 : Fournir deux sources de calendrier et obtenir un lien url d'addition



Todo : 
- Ajouter un input web
- Ajouter une tache cron pour update (update time by calendar)


Format de données : 
Format VCS


Ical/ICS format data : 
iCalendar File Format

BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ZContent.net//Zap Calendar 1.0//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
SUMMARY:Abraham Lincoln
UID:c7614cff-3549-4a00-9152-d25cc1fe077d
SEQUENCE:0
STATUS:CONFIRMED
TRANSP:TRANSPARENT
RRULE:FREQ=YEARLY;INTERVAL=1;BYMONTH=2;BYMONTHDAY=12
DTSTART:20080212
DTEND:20080213
DTSTAMP:20150421T141403
CATEGORIES:U.S. Presidents,Civil War People
LOCATION:Hodgenville\, Kentucky
GEO:37.5739497;-85.7399606
DESCRIPTION:Born February 12\, 1809\nSixteenth President (1861-1865)\n\n\n\nhttp://AmericanHistoryCalendar.com
URL:http://americanhistorycalendar.com/peoplecalendar/1,328-abraham-lincoln
END:VEVENT
END:VCALENDAR