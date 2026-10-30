# Rebuild: the site, the Pi and the touch screen, from nothing

Everything needed is in two files from the approval page's **DATA → BACKUP AND REBUILD**:

- **EVERYTHING KEPT (.ZIP)**: the data file (`novel-global.json`: stories, places, posts, makers, the talk, settings, counts) and every photograph (`photos/`) and full-size picture (`full/`).
- **THE CODE (.ZIP)**: this repository, holding the site (`src/`, `repo-static/`, `build.mjs`), the Pi's bridge (`receiver/`) and the touch screen's sketch (`src/touch/novel-touch/novel-touch.ino`).

Keep both somewhere other than Cloudflare and GitHub, and take a new one every moon or so.

What is never in a backup, on purpose: passwords and tokens. You set them again by hand (steps below), and every printer and touch screen is paired again.

## 1. The site (Cloudflare)

1. **The code.** If the GitHub repository is gone, make a new one named `front`, unzip THE CODE into it and push it with GitHub Desktop (a `main` branch and a `staging` branch).
2. **The Worker.** In Cloudflare, go to **Workers & Pages → Create → Import a repository**, and choose `front`. Set the build as in [workflow.md](workflow.md) (build command `npm run build`, deploy command `npx wrangler deploy`).
3. **The databases.** Go to **Storage & Databases → D1 → Create**, and make `front-db` and `front-db-preview`. Copy each one's **Database ID** into `wrangler.jsonc` in place of the old ones. Their tables are made by themselves on first use.
4. **The approval password.** Go to **Workers & Pages → front → Settings → Variables and Secrets → Add**, choose **Secret**, name it `ADMIN_KEY`, and give it a long passphrase.
5. **The full-size pictures (R2, optional).** Go to **R2 Object Storage** and switch it on (it is free up to 10 GB). Then the `r2_buckets` lines in `wrangler.jsonc` make the `front-media` bucket by themselves on the next deploy. Under that bucket's **Settings → Object lifecycle rules**, add a rule to delete objects after 365 days, so photographs go after a year as the stories do.
6. **The bot check (Turnstile, optional).** Go to **Turnstile → Add widget**. Name it `novel.global`, add the hostnames `novel.global` and your `workers.dev` address, and choose **Managed**. Then add two secrets as in step 4: `TURNSTILE_SITE` (the **Site Key**) and `TURNSTILE_SECRET` (the **Secret Key**). Until both are there, nobody is asked.
7. **The domain.** Under **Workers & Pages → front → Settings → Domains & Routes → Add → Custom domain**, give it `novel.global`.
8. **The data.** Open `/admin`, then **DATA → BRING A BACKUP BACK**, and choose `novel-global.json` from the zip. Settings come back as they were. Stories, places, posts, makers and the talk are put back wherever they are missing. Photographs stay in the zip.

## 2. The Pi (the bridge to the printer)

1. Put **Raspberry Pi OS Lite** on a card with **Raspberry Pi Imager**. Set the name `da-novelglobal`, the user `novel`, your Wi-Fi, and switch on SSH.
2. From the PC: `ssh novel@da-novelglobal.local`, then run the one line that installs and updates everything:

   ```bash
   curl -fsSL https://raw.githubusercontent.com/novelglobal/front/staging/receiver/setup/install.sh | sh
   ```

3. On the approval page, go to **PRINTERS → PAIR A PRINTER**, and put its three lines in `/etc/da-pull.env` as [receiver/README.md](../receiver/README.md) shows.
4. The printer card on the approval page shows the bridge's version once it is listening (`BRIDGE 31 OCT` or newer).

Without GitHub, copy `receiver/` from THE CODE onto the Pi and follow [receiver/README.md](../receiver/README.md).

## 3. The touch screen (LilyGO T-Display-S3)

1. Open `src/touch/novel-touch/novel-touch.ino` from THE CODE in the Arduino IDE. The board settings and libraries are in [devices.md](devices.md).
2. Fill in `WIFI_SSID`, `WIFI_PASS` and `NG_PRINTER`. For `NG_TOKEN`, go to **PRINTERS → TOUCH SCREEN** on the approval page, which shows a new one once.
3. Upload. The printer card shows the sketch's version (`31 OCT 13` or newer) once the screen has checked in.

## What each setting is, and where it lives

| What | Where |
|---|---|
| Words, gates, tracks, cities, the start page | Approval page settings, in the data file |
| Printers and touch screens | Approval page (paired again by hand; their tokens are never kept in a backup) |
| `ADMIN_KEY`, `TURNSTILE_SITE`, `TURNSTILE_SECRET` | Cloudflare secrets |
| Database IDs, R2 bucket | `wrangler.jsonc` |
| Pi: server, printer id, token | `/etc/da-pull.env` on the Pi |
| Touch screen: Wi-Fi, printer id, token | The top of the sketch |
