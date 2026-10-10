# Workflow: from this folder to novel.global

Two branches:

- **`staging`** is where every change goes first. Each push builds a preview with its own address. The preview shows a PREVIEW tag in the top-left corner, and nobody finds it unless you give them the link.
- **`main`** is the live site. A merge into `main` updates novel.global.

Cloudflare does the building. Nothing in `dist/` is committed.

## One-time setup

### Cloudflare dashboard

Go to **Workers & Pages → front → Settings → Build**:

| Setting | Value |
|---|---|
| Git branch (production) | `main` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Builds for non-production branches | Enabled |
| Version command (non-production branches) | `npx wrangler preview --name staging` |
| Root directory | leave empty |

The `workers.dev` address and preview URLs are switched on by `wrangler.jsonc`, so there is nothing to set under Domains & Routes.

This Worker predates Cloudflare's Worker Previews, so the dashboard calls the field Version command. The command in it uses Worker Previews anyway, which also work once the print queue (a Durable Object) arrives in roadmap stage 3. If a staging build fails because Previews are not enabled, follow the "Set up Worker Previews" banner under **Settings → Build**. Or use `npx wrangler versions upload --preview-alias staging`, which gives the same address but stops working once the Worker has a Durable Object.

Then:

1. **novel.global → SSL/TLS → Edge Certificates:** turn on **Always Use HTTPS**, so `http://novel.global` always moves to `https://`.
2. *Optional:* **Zero Trust → Access → Applications:** protect `staging-front.<your-subdomain>.workers.dev` so that only your email can open the preview.

### GitHub

**github.com/novelglobal/front → Settings → Pages:** set the source to **None**, so GitHub stops publishing its own copy. Do this before the first merge into `main`.

### This PC

GitHub Desktop commits as `novelglobal` with GitHub's private `noreply` address, so no personal email goes into the history. Check **File → Options → Git** if anything changes.

## Every change

1. **Make the change.** Edit the files in `front` on the `staging` branch, then build the site and run the checks (`npm test`) on this PC.
2. **Look at it locally (optional):** run `npm run dev` and open <http://localhost:8787>.
3. **Commit in GitHub Desktop.**
   - Check that **Current branch** says `staging`.
   - Read the list of changed files. A few private working files never appear there, by design.
   - Write a short summary, such as `Wider radar shows at once`, with no names in it.
   - Click **Commit to staging**, then **Push origin**.
4. **Check the preview.**
   - Cloudflare builds in a minute or two. The address is always `https://staging-front.<your-subdomain>.workers.dev`. Find it in **Workers & Pages → front → Deployments**, or near the end of the build's log.
   - The top-left tag reads `PREVIEW · STAGING · <code>`. The code matches the commit in GitHub Desktop's **History** tab.
   - Try the change on a laptop and a phone.
5. **Go live.**
   - In GitHub Desktop, switch **Current branch** to `main`.
   - Choose **Branch → Merge into current branch… → `staging`**, then click **Push origin**.
   - Switch back to `staging` for the next change.
6. **Check novel.global.** After a minute or two, **STORIES → Settings** shows `BUILD <code>`, the same code as the preview, with no PREVIEW tag.

## If something goes wrong

- **The preview build fails:** the live site is untouched. Open the failed build's log in Cloudflare. The error is near the end.
- **The live site has a problem:** go to **Workers & Pages → front → Deployments** and roll back to the previous version. It takes seconds. Then fix it on `staging`.
- **Returning visitors see an old version:** the service worker cache name in `repo-static/sw.js` was not bumped. Bump it (`da-v11` → `da-v12`) and push again.

## Hygiene, every time

- Changes go to `staging` first, never straight to `main`.
- `npm test` passes before pushing. Its `static` checks fail if a name or authorship trace appears in the site or in any file a commit would carry.
- Secrets, such as printer tokens later, go in **Cloudflare → Settings → Variables and Secrets**, never in the repo.
- The repository is public. Anything committed can be read by anyone.
