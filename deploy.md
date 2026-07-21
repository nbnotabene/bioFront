# Deploy-plan — bioFront

bioFront er en statisk genereret Nuxt-site (`npx nuxi generate` → `.output/public`). Al filmdata/infosider hentes client-side fra `nbapi` ved runtime, så det statiske build indeholder ingen bagt-ind data — samme build-artefakt kan bruges til begge deploy-mål nedenfor.

Der deployes til **2 sites**, uafhængigt af hinanden:

| Site | Formål | Hosting | Trigger |
|---|---|---|---|
| `local.svanekebio.dk` | Dev/staging | Nginx på denne server | Manuel build + rsync/symlink |
| `svanekebio.dk` | Produktion | [statichost.eu](https://builder.statichost.eu/) | Automatisk ved push til GitHub |

Repo: `git@github.com:nbnotabene/bioFront.git` (branch `develop` i brug nu, `main` er prod-branch).

---

## 1. local.svanekebio.dk (dev-site via nginx)

### Status
Nginx-config findes allerede og peger direkte på build-output:

```
# /etc/nginx/sites-available/bio
server {
    listen 443 ssl;
    server_name local.svanekebio.dk;
    ssl_certificate /etc/letsencrypt/live/local.svanekebio.dk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/local.svanekebio.dk/privkey.pem;

    root /home/nb/www/bioFront/.output/public;
    index index.html;

    # Service Worker skal ALDRIG meges/caches af browser HTTP-cache
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires max;
        log_not_found off;
    }
}
```

`dist` er desuden symlinket til `.output/public` i repo-roden. Da nginx serverer direkte fra `.output/public`, kræver et deploy blot at der bygges lokalt på serveren — ingen kopiering/rsync nødvendig.

### Deploy-trin

```bash
cd /home/nb/www/bioFront

# 1. Hent seneste kode (hvis der deployes fra en anden branch/commit end den der ligger)
git pull origin develop

# 2. Installer evt. nye/ændrede dependencies
npm install

# 3. Byg statisk
npx nuxi generate     # output i .output/public

# 4. Verificér
curl -sI https://local.svanekebio.dk | head -1
```

Intet reload af nginx er nødvendigt — filerne serveres direkte fra disk, så et nyt build slår igennem med det samme.

### Rollback
`.output/public` er ikke versioneret. Ved fejl: `git checkout <forrige-commit>` og kør `npx nuxi generate` igen.

### Fremtidig automatisering (valgfrit)
Hvis dev-deploy skal ske automatisk ved push til `develop`, kan der oprettes et git-hook eller webhook-script (efter mønster fra `/home/nb/www/webhook-scripts/restart/`) der kører trin 1–3 automatisk. Ikke sat op endnu — gøres manuelt i dag.

---

## 2. svanekebio.dk (produktion via statichost.eu)

### Setup
statichost.eu (https://builder.statichost.eu/) bygger og hoster sitet ud fra GitHub-repoet. Deploy sker ved push/merge til produktions-branchen (`main`) — statichost.eu har en GitHub-integration/webhook der trigger automatisk build ved push.

**Byg-kommando statichost.eu skal bruge:** `npx nuxi generate`
**Output-mappe:** `.output/public`

### Forudsætninger (tjek i statichost.eu dashboard)
- [ ] GitHub-repo `nbnotabene/bioFront` er koblet til statichost.eu-projektet for `svanekebio.dk`
- [ ] Build-branch sat til `main`
- [ ] Build command: `npm install && npx nuxi generate`
- [ ] Publish/output directory: `.output/public`
- [ ] Node-version matcher lokalt (se `package.json`/`.nvmrc` hvis relevant)
- [ ] Miljøvariabel `NUXT_PUBLIC_NBAPI_API_BASE=https://nbapi.nbinfo.eu` sat (ellers falder den tilbage på default i `nuxt.config.ts`, som allerede peger korrekt)
- [ ] Custom domain `svanekebio.dk` peger på statichost.eu (DNS)

### Deploy-trin (release til produktion)

```bash
# 1. Sikr at develop er testet og grøn
npm test

# 2. Merge til main
git checkout main
git pull origin main
git merge develop
git push origin main
```

Pushet til `main` trigger automatisk build+deploy på statichost.eu. Følg build-status i statichost.eu dashboard.

### Verificér efter deploy
```bash
curl -sI https://svanekebio.dk | head -1
```
Tjek visuelt at forside (filmgrid), en arrangementsside (`/arr/{arr_nr}`) og en infoside (`/pages/{slug}`) loader data korrekt fra `nbapi`.

### Rollback
Revert/reset `main` til forrige commit og push — statichost.eu bygger automatisk igen ud fra den nye HEAD:

```bash
git checkout main
git revert <bad-commit>   # eller: git reset --hard <forrige-commit> (kun hvis main ikke er delt bredere)
git push origin main
```

---

## Fælles forudsætning: nbapi

Begge sites henter data fra `https://nbapi.nbinfo.eu` ved runtime. Før release skal det sikres at:

- `nbapi` kører og svarer på `/filmakt` og `/pages`
- CORS på `nbapi` tillader både `https://local.svanekebio.dk` og `https://svanekebio.dk` (allerede konfigureret, jf. README.md)
- Hvis `ainfo_nr`-gruppering er en del af releasen: migration `/home/nb/www/nbapi/migrations/2026-07-09_filmakt_add_ainfo_nr.sql` skal være kørt mod databasen, og `nbapi`-servicen genstartet — **inden** frontend-releasen, ellers fejler gruppering af visninger på begge sites.

---

## Opsummering af flow

```
                git push
                   │
      ┌────────────┴─────────────┐
      ▼                          ▼
  push til develop          push/merge til main
      │                          │
      ▼                          ▼
manuel: git pull            statichost.eu builder
  + npm install              (auto-trigger via
  + npx nuxi generate         GitHub webhook)
      │                          │
      ▼                          ▼
nginx serverer              statichost.eu CDN
.output/public direkte      serverer svanekebio.dk
      │                          │
      ▼                          ▼
local.svanekebio.dk          svanekebio.dk
```
