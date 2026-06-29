# NIER BIA-RA — Business Continuity Platform

Piattaforma BCM per FIS – Fareva Italia Srl, conforme ISO 22301:2019.
Digitalizza la metodologia NIER oggi su Excel (BIA, Risk Assessment, Criticità, Recovery).

## Stack

| Layer     | Tecnologia                          |
|-----------|-------------------------------------|
| Frontend  | React 18 + Vite 5 (JSX, no TS)     |
| Backend   | FastAPI (da implementare)           |
| Database  | PostgreSQL (da implementare)        |
| Deploy    | GitHub Pages (frontend statico)     |

## Struttura repository

```
src/
  engines/
    InputDrawer.jsx          # Drawer input tipizzati (7 categorie)
    BIAEngine.jsx            # Matrice impatti + calcolo MTPD
    CriticalityEngine.jsx    # VxL + Criticality §6.5
  views/
    ProcessView.jsx          # Vista consolidata 3 tab
backend/                     # FastAPI (da creare)
db/                          # Schema PostgreSQL (da creare)
.github/workflows/
  deploy.yml                 # CI/CD → GitHub Pages
```

## Formule metodologiche

### BIA (§6.3)
- 8 finestre temporali: 1h, 4h, 8h, 1g, 3g, 7g, 14g, 30g
- 3 dimensioni: Reputazione, Legale/Normativo, Finanziario
- Scala impatti: 0=nessuno … 4=critico
- **MTPD** = prima finestra con almeno una dimensione a livello 4
- **RTO finale** = max(RTO_owner, RTO_IT)
- Alert se RTO finale > MTPD

### Criticità (§6.5)
Matrice VxL (Vulnerabilità × Likelihood):

|            | Lk bassa | Lk media | Lk alta |
|------------|----------|----------|---------|
| Vuln basso | 1        | 2        | 3       |
| Vuln medio | 2        | 4        | 6       |
| Vuln alto  | 3        | 6        | 9       |

- Criticality(MTPD) = (MTPD_h / 720) / VxL
- Criticality(RTO)  = (RTO_h  / 720) / VxL
- **Criticità finale** = min(C_MTPD, C_RTO)  ← principio conservativo

Soglie classificazione:
- ≤ 0.05            → molto alta
- 0.05 < C ≤ 0.14  → alta
- 0.14 < C ≤ 0.24  → media
- 0.24 < C ≤ 0.35  → bassa
- > 0.35            → molto bassa

## Palette colori (design system NIER)

```js
const T = {
  blue50:"#E6F1FB",  blue600:"#185FA5",  blue800:"#0C447C",
  teal50:"#E1F5EE",  teal600:"#0F6E56",
  amber50:"#FAEEDA", amber600:"#854F0B",
  red50:"#FCEBEB",   red100:"#F7C1C1",   red600:"#A32D2D",  red800:"#7C1D1D",
  green50:"#EAF3DE", green600:"#3B6D11",
  gray50:"#F1EFE8",  gray100:"#D3D1C7",  gray400:"#888780", gray800:"#444441",
};
```

## Convenzioni di codice

- JSX con inline styles (no CSS modules, no Tailwind)
- Ogni file esporta sia il componente React che le engine functions pure
  (es. `computeMTPD`, `computeCriticality`) per riuso server-side via FastAPI
- Stato condiviso tra tab gestito nel componente padre (ProcessView)
- Input non controllati (useRef) per i campi testo nei drawer — evita il bug
  di reset del cursore causato da re-render su ogni keystroke
- Nessuna dipendenza esterna per ora (solo React)

## Moduli da sviluppare

1. **RecoveryActions.jsx** — piano trattamento, prioritizzazione per criticità
2. **InterdependencyEngine.jsx** — matrice dipendenze A/M/B, RTO derivato
3. **SiteRiskAssessment.jsx** — RA per sito, calcolo likelihood per categoria
4. **Dashboard.jsx** — summary multi-processo, KPI direzionali, export
5. **backend/routers/** — endpoint FastAPI per BIA, RA, Criticality, Recovery
6. **db/schema.sql** — tabelle, vincoli, indici, viste, audit trail PostgreSQL

## Comandi utili

```bash
npm run dev      # avvia dev server su http://localhost:5173
npm run build    # build produzione in dist/
npm run preview  # preview della build in dist/
```

## Deploy

Ogni push su `main` triggera automaticamente il workflow `.github/workflows/deploy.yml`
che fa build e pubblica su GitHub Pages.

URL dell'app: `https://<github-username>.github.io/nier-bia-ra/`

Per cambiare il base path (es. dominio personalizzato), modificare `vite.config.js`:
```js
base: "/"  // invece di "/nier-bia-ra/"
```
