# Deploy-plan — bioFront

bioFront er en statisk genereret Nuxt-site (`npx nuxi generate` → `.output/public`). Al filmdata/infosider hentes client-side fra toolsapi's `biofilm` (`https://tools.nbinfo.eu/biofilm`) ved runtime, så det statiske build indeholder ingen bagt-ind data — samme build-artefakt kan bruges til begge deploy-mål nedenfor.

Der deployes til **2 sites**, uafhængigt af hinanden:

| Site | Formål | Hosting | Trigger |
|---|---|---|---|
| `local.svanekebio.dk` | Dev/staging | Nginx på denne server | Manuel build + rsync/symlink |
| `svanekebio.dk` | Produktion | [statichost.eu](https://builder.statichost.eu/) | GitHub Action ved push til `main` + dagligt cron-build |

Repo: `git@github.com:nbnotabene/bioFront.git` (branch `develop` i brug nu, `main` er prod-branch).

---

## 1. local.svanekebio.dk (dev-site via nginx)

### Status
Nginx-config (`/etc/nginx/sites-available/local.svanekebio.dk`, symlinket i `sites-enabled`) peger direkte på build-output. Kort version:

```
# /etc/nginx/sites-available/local.svanekebio.dk
server {                                  # :80 -> ACME-challenge + redirect til https
    listen 80;
    server_name local.svanekebio.dk;
    location /.well-known/acme-challenge/ { root /home/nb/www/bioFront/.output/public; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl;
    server_name local.svanekebio.dk;
    ssl_certificate     /etc/letsencrypt/live/local.svanekebio.dk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/local.svanekebio.dk/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;   # SKAL med, se nedenfor
    include snippets/cloudflare-realip.conf;           # rigtig klient-IP bag Cloudflare

    root /home/nb/www/bioFront/.output/public;
    index index.html;

    limit_req zone=req_per_ip burst=200 nodelay;       # zoner defineret i nginx.conf
    limit_conn conn_per_ip 20;

    location /biofilm/ {                               # biofilm samme origin, kun læsning
        limit_except GET { deny all; }
        proxy_pass http://127.0.0.1:8081;              # toolsapi's Traefik
        proxy_set_header Host tools.nbinfo.eu;
        proxy_set_header X-Forwarded-Proto https;
    }

    location / { try_files $uri $uri/ /200.html /index.html; }
    location = /sw.js { add_header Cache-Control "no-cache, no-store, must-revalidate"; expires 0; }
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ { expires max; log_not_found off; }
}
```

- **Certifikat:** `certbot --cert-name local.svanekebio.dk`, webroot-authenticator (`/home/nb/www/bioFront/.output/public`), fornyes automatisk. Test med `sudo certbot renew --dry-run --cert-name local.svanekebio.dk`.
- **`options-ssl-nginx.conf` skal inkluderes** (gælder alle :443-vhosts på serveren). Uden den arver vhosten `ssl_prefer_server_ciphers on` fra `nginx.conf`, mens default-serveren bruger certbots `off`. Cloudflare tvinger et TLS HelloRetryRequest (det sender kun en X25519MLKEM768 key share), cipher-valget skifter mellem de to runder, og OpenSSL afbryder med `illegal_parameter` → Cloudflare **525**.
- **`location /biofilm/`**: local.svanekebio.dk henter biofilm-data via sin egen origin (`https://local.svanekebio.dk/biofilm/…` → toolsapi's Traefik på `127.0.0.1:8081`). Det undgår NAT-hairpin fra LAN'et (`tools.nbinfo.eu` er ikke bag Cloudflare, `local.svanekebio.dk` er), og `limit_except GET` betyder at sitet aldrig kan skrive til biofilm/databasen. Derfor bygges local med `NUXT_PUBLIC_BIOFILM_API_BASE=https://local.svanekebio.dk/biofilm` (se deploy-trin).
- **`try_files … /200.html`** betyder at ukendte ruter (fx nye `/arr/{arr_nr}` der ikke fandtes ved build) serveres som SPA med status 200.

`dist` er desuden symlinket til `.output/public` i repo-roden. Da nginx serverer direkte fra `.output/public`, kræver et deploy blot at der bygges lokalt på serveren — ingen kopiering/rsync nødvendig.

### Deploy-trin

```bash
cd /home/nb/www/bioFront

# 1. Hent seneste kode (hvis der deployes fra en anden branch/commit end den der ligger)
git pull origin develop

# 2. Installer evt. nye/ændrede dependencies
npm install

# 3. Test og byg statisk (data via sitets egen /biofilm/-proxy, se ovenfor)
npm test
NUXT_PUBLIC_BIOFILM_API_BASE=https://local.svanekebio.dk/biofilm npx nuxi generate     # output i .output/public

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
statichost.eu (https://builder.statichost.eu/) bygger og hoster sitet ud fra GitHub-repoet. Deploy sker ved push/merge til produktions-branchen (`main`). Push til `develop` trigger **ikke** et build.

**Byg-kommando statichost.eu skal bruge:** `npx nuxi generate`
**Output-mappe:** `.output/public`

### Konfiguration
- Statichost-site: `biofront` (`https://biofront.statichost.page`), koblet til GitHub-repo `nbnotabene/bioFront`, branch `main`.
- Build er defineret i `statichost.yml` i repo-roden (image `node:24.x`, command `npm install && npx nuxi generate`, public `.output/public`).
- `NUXT_PUBLIC_BIOFILM_API_BASE` behøver ikke sættes — default i `nuxt.config.ts` peger på `https://tools.nbinfo.eu/biofilm`.
- Custom domains `svanekebio.dk` og `www.svanekebio.dk` er tilføjet i statichost. Statichost udsteder selv Let's Encrypt-certifikater og redirecter `www` → `https://svanekebio.dk` (301).

### Build-triggere
Et build startes med et `POST` til `https://builder.statichost.eu/biofront` (statichost bygger altid den konfigurerede branch, `main`). Det sker fra:

1. **GitHub Action** `.github/workflows/statichost.yml` — kører kun ved push til `main` (kan også startes manuelt under *Actions → Deploy to statichost → Run workflow*). Der bruges bevidst **ikke** en GitHub-webhook: webhooks kan ikke filtreres på branch, så push til `develop` ville også trigge et build.
2. **Dagligt cron-job** på serveren (crontab for `nb`), kl. 06:15 — lige efter kultunaut-syncen kl. 06:00, så nye film får prerenderede `/arr/{arr_nr}`-sider (se nedenfor):
   ```
   15 6 * * * echo "$(date -Is) $(/usr/bin/curl -fsS -X POST -m60 https://builder.statichost.eu/biofront 2>&1)" >> /home/nb/statichost_biofront.log
   ```
3. **Manuelt:** `curl -fsS -X POST https://builder.statichost.eu/biofront` eller fra statichost-dashboardet.

Build-URL'en er uautentificeret (alle der kender sitenavnet kan starte et build). Auth kan slås til under *Source & build* i statichost; så skal Action og cron sende `Authorization: Bearer <API_TOKEN>`.

Om et nyt build er live kan ses i `https://svanekebio.dk/_nuxt/builds/latest.json` (`timestamp` = build-tidspunkt i ms).

### Ruter der ikke fandtes ved build
Build-tiden henter `/filmakt` og `/pages` fra biofilm og prerenderer en fil pr. `/arr/{arr_nr}` og `/pages/{slug}`. En film oprettet *efter* seneste build har ingen fil: statichost serverer `404.html` (som er Nuxt-appen), så siden vises korrekt for brugeren, men med HTTP-status **404** — relevant for søgemaskiner og link-previews (fx Facebook). Data er aldrig forældet, da alt hentes client-side; det daglige cron-build sørger for at nye film-URL'er får status 200.

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
Tjek visuelt at forside (filmgrid), en arrangementsside (`/arr/{arr_nr}`) og en infoside (`/pages/{slug}`) loader data korrekt fra biofilm.

### Rollback
Revert/reset `main` til forrige commit og push — statichost.eu bygger automatisk igen ud fra den nye HEAD:

```bash
git checkout main
git revert <bad-commit>   # eller: git reset --hard <forrige-commit> (kun hvis main ikke er delt bredere)
git push origin main
```

---

## DNS (Cloudflare)

`svanekebio.dk` bruger Cloudflare som DNS (nameservers `kayden`/`stephane.ns.cloudflare.com`):

| Record | Type | Target | Proxy |
|---|---|---|---|
| `svanekebio.dk` | CNAME (flattened på apex) | `biofront.statichost.page` | DNS only (grå) |
| `www.svanekebio.dk` | CNAME | `biofront.statichost.page` | DNS only (grå) |
| `local.svanekebio.dk` | A | serverens offentlige IP | Proxied (orange) |
| `docs.svanekebio.dk` m.fl. | A | serverens offentlige IP | Proxied (orange) |

- Statichost-records skal være **grå** (ingen Cloudflare-proxy): statichost har egne certifikater og skal selv kunne forny dem, og et ekstra TLS-/cache-lag giver kun fejlkilder (525/526, forældet `index.html`/`sw.js`).
- Selvhostede records er **orange**: skjuler hjemme-IP'en og tager scanning/DDoS. Med `cloudflare-realip.conf` ser nginx stadig den rigtige klient-IP.
- MX (one.com) og TXT-records på apex påvirkes ikke af CNAME-flattening.
- Et nyt subdomæne bag Cloudflare-proxy til denne server kræver sin egen nginx-vhost + certifikat, ellers falder nginx tilbage på default-certifikatet (`local.nbinfo.dk`) → Cloudflare **526**.

---

## Fælles forudsætning: biofilm (toolsapi)

Alle sites henter data fra `https://tools.nbinfo.eu/biofilm` ved runtime. Før release skal det sikres at:

- biofilm kører og svarer på `/filmakt` og `/pages`
- CORS (`CORS_ORIGINS` i `/home/nb/www/toolsapi/.env`) tillader sitets origin (svanekebio.dk, local.svanekebio.dk og biofront.statichost.page er konfigureret)
- biofilms kultunaut-sync-cron kører (og nbapi's er slået fra), så `/filmakt` er opdateret — se `/home/nb/www/toolsapi/services/biofilm/README.md`. Crontab for `nb`:
  ```
  0 6-21/3 * * * cd /home/nb/www/toolsapi && docker compose exec -T biofilm python scripts/run_kult_sync.py >> /var/log/biofilm_kult_sync.log 2>&1
  ```
  `docker compose exec` kører scriptet i den kørende container (ingen genstart). Bemærk: en **genstart** af biofilm-containeren kører `create_all` + `CREATE OR REPLACE VIEW filmakt` mod databasen `mytools` — tag et dump (`mysqldump --single-transaction mytools | gzip`, i `/home/nb/backups/mytools/`) før.

**Redigering** (film-`extra`, `is_locked`, infosider) sker sjældent og foregår i biofilm, ikke nbapi: Swagger på `https://tools.nbinfo.eu/biofilm/docs` med et SSO-superadmin-token (`cd /home/nb/www/toolsapi && docker compose exec sso python scripts/users.py token <email>`). Læsning er åben.

**Rollback til nbapi:** revert biofilm-skiftet på `main` og push (Action'en bygger igen), og byt sync-cron'en tilbage til nbapi's (`0 6-21/3 * * * /home/nb/www/nbapi/scripts/sync_kult.sh >> /var/log/nbapi_kult_sync.log 2>&1`). nbapi kører stadig (dens blog-del bruges af andre), kun dens film-sync er slået fra.

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
manuel: git pull            GitHub Action (kun main)
  + npm install              + cron 06:15 dagligt
  + npx nuxi generate          → statichost.eu builder
      │                          │
      ▼                          ▼
nginx serverer              statichost.eu
.output/public direkte      serverer svanekebio.dk
      │                          │
      ▼                          ▼
local.svanekebio.dk          svanekebio.dk
```
