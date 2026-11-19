GYMPILOT LEONARDO 3.0 — PWA

NOVITÀ
- Calendario allenamenti nella sezione Allenamento: tocca il giorno (lunedì–domenica)
  per segnarlo come eseguito. Puoi navigare tra settimane passate e future.
  Le spunte sono associate a date vere (es. 2026-11-18), non si ripetono ogni settimana.
- Diario alimentare libero: in Piano > «Cosa hai mangiato davvero?» scegli
  colazione / spuntino scuola / pranzo / merenda / cena, cerca e registra.
- Suggerimenti immediati dal catalogo offline (150 alimenti/varianti iniziali),
  incluse pietanze comuni e bar: cornetto ischitano, cappuccino, etc.
- «Cerca online» usa Open Food Facts per prodotti confezionati con dati nutrizionali
  sufficientemente completi. È una ricerca su richiesta, non a ogni tasto, a causa
  dei limiti del servizio. Disponibilità e accesso dipendono dalla connessione
  e dai permessi del browser/servizio.
- Se un alimento non è in elenco, puoi creare una voce personalizzata con
  quantità, kcal, proteine, carboidrati e grassi. Si aggiunge ai preferiti locali.
- Calorie e macro giornalieri sommano spunte del piano + alimenti liberi registrati.
  Se hai mangiato altro al posto del menu, NON selezionare il menu proposto; puoi
  premere «Non ho mangiato il menu proposto» dentro il pasto.
- Registro riferito a date reali: dati della settimana scorsa distinti dalla nuova.
- Restano presenti piano settimanale e alternative, spesa, scheda in 4 giorni,
  esportazione di backup, domanda al Coach, immagine della giornata e note.

ESEMPIO CORNETTO + CAPPUCCINO
1. Piano > Diario libero > Colazione.
2. Digita «cornetto ischitano», scegli il risultato, inserisci il peso stimato.
3. Ripeti per «cappuccino», inserendo il volume in ml.
4. Calorie e macro vengono aggiornati. Sono valori di stima: per prodotti del bar
   il dato può essere molto diverso in base a impasto, farcitura, latte, zucchero.

INSTALLAZIONE / AGGIORNAMENTO SU GITHUB PAGES
1. Fai prima Esporta backup dall'app attuale e conserva il file JSON.
2. Estrai questo ZIP.
3. Carica TUTTI i file e la cartella assets nella directory radice del repository.
   index.html, app.js, data.js, catalog.js, style.css, sw.js, manifest.webmanifest
   devono stare sullo stesso livello.
4. In GitHub Settings > Pages imposta main / (root) e usa la stessa URL di prima.
5. Riapri la PWA dal collegamento iPhone. La cache della PWA viene aggiornata alla
   nuova versione, a volte dopo una seconda apertura.

PRIVACY E LIMITI
- Scelte, pasti e allenamenti sono salvati in localStorage, senza account,
  server personale o database remoto creato dalla PWA.
- Quando premi «Cerca online», la ricerca viene inviata a Open Food Facts.
  Vedi https://world.openfoodfacts.org/terms-of-use. Dati Open Food Facts: ODbL.
- Catalogo offline e valori per alimenti artigianali sono orientativi; verificare
  peso, ingredienti e dati sull'etichetta. Non è possibile coprire ogni ricetta.
- La funzione online può non funzionare in tutte le condizioni di rete o browser;
  la ricerca locale e l'aggiunta manuale restano utilizzabili.
- Tutti i dati sono sul dispositivo, quindi Esporta backup è essenziale prima di
  cancellare browser, cambiare indirizzo del sito o cambiare iPhone.
- App per organizzazione generale; non sostituisce nutrizionista o medico.
