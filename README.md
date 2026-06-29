# NIER BIA-RA

Piattaforma web per **Business Continuity Management** conforme a ISO 22301:2019,
sviluppata per FIS – Fareva Italia Srl.

Digitalizza la metodologia NIER oggi distribuita su file Excel, fornendo
un ambiente integrato per BIA, Risk Assessment, analisi della criticità degli
input e pianificazione della recovery.

## Demo

🔗 **[Apri l'applicazione](https://YOUR-USERNAME.github.io/nier-bia-ra/)**
_(sostituire `YOUR-USERNAME` con il proprio username GitHub)_

## Funzionalità implementate

| Modulo | Descrizione |
|--------|-------------|
| **Input Drawer** | Inserimento input di processo su 7 categorie tipizzate (HR, Materie prime, Impianti, Software, Utilities, Servizi, Location) con validazione inline |
| **BIA Engine** | Matrice impatti su 8 finestre temporali × 3 dimensioni; calcolo automatico MTPD e RTO finale; alert incoerenza RTO > MTPD |
| **Criticality Engine** | Matrice VxL, indici Criticality(MTPD) e Criticality(RTO), classificazione su 5 livelli con calcolo passo per passo |
| **Process View** | Vista consolidata per processo con 3 tab integrate (Input / BIA / Criticità); stato condiviso e propagazione automatica MTPD/RTO |

## Metodologia

Le formule sono implementate secondo la procedura **PGE-M-DG-011_1** NIER:

```
MTPD = prima finestra temporale con almeno una dimensione a livello 4 (Critico)
RTO finale = max(RTO_owner, RTO_IT)

Criticality(MTPD) = (MTPD_h / 720) / VxL
Criticality(RTO)  = (RTO_h  / 720) / VxL
Criticità finale  = min(C_MTPD, C_RTO)   ← principio conservativo §6.5
```

## Stack tecnico

- **Frontend**: React 18 + Vite 5
- **Deploy**: GitHub Pages (CI/CD automatico via GitHub Actions)
- **Backend** _(in sviluppo)_: FastAPI + PostgreSQL

## Sviluppo locale

```bash
# Prerequisiti: Node.js 18+
npm install
npm run dev
# App disponibile su http://localhost:5173
```

## Deploy

Il deploy su GitHub Pages è automatico ad ogni push su `main`
tramite il workflow `.github/workflows/deploy.yml`.

Per abilitarlo la prima volta:
1. Vai su **Settings → Pages** nel repository
2. In **Source** seleziona **GitHub Actions**
3. Fai un push su `main` — il workflow si avvia automaticamente

## Struttura del progetto

```
src/
  engines/
    InputDrawer.jsx          # Drawer input tipizzati
    BIAEngine.jsx            # Engine BIA + componente BIAMatrix
    CriticalityEngine.jsx    # Engine criticità + componente ranking
  views/
    ProcessView.jsx          # Vista consolidata 3 tab
.github/
  workflows/
    deploy.yml               # CI/CD → GitHub Pages
CLAUDE.md                    # Contesto progetto per Claude Code
```

## Prossimi sviluppi

- [ ] Modulo Recovery Actions con prioritizzazione
- [ ] Interdependency Engine (matrice dipendenze A/M/B)
- [ ] Site Risk Assessment e calcolo likelihood
- [ ] Dashboard multi-processo con KPI direzionali
- [ ] Backend FastAPI con endpoint REST
- [ ] Schema PostgreSQL con audit trail

---

Progetto sviluppato con [Claude Code](https://claude.ai/code) · Anthropic
