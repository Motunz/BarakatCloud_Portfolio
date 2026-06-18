# Deploy this portfolio to Azure

You'll need:
- An Azure account (free tier is enough)
- The files in this folder: `index.html`, `error.html`, `styles.css`, `script.js`

---

##  Azure Static Web Apps

This is the modern Azure pattern. HTTPS is automatic, the free tier covers personal portfolios, and every push to GitHub redeploys for you.

### A1. Get the code on GitHub

```bash
git init
git add index.html error.html styles.css script.js DEPLOY.md
git commit -m "Initial portfolio"
gh repo create barakat-portfolio --public --source=. --push
```

(If you don't have `gh`, create the repo on github.com and push manually.)

### A2. Create the Static Web App

1. Azure Portal → **Create a resource** → search **Static Web App** → Create
2. Subscription / Resource group: create new, e.g. `rg-portfolio`
3. Name: `barakat-portfolio`
4. Plan type: **Free**
5. Region: pick one close to you
6. Deployment source: **GitHub** → authorize → pick the repo and `main` branch
7. Build presets: **Custom**
   - App location: `/`
   - Api location: *(leave blank)*
   - Output location: *(leave blank)*
8. Review + Create

Azure adds a GitHub Actions workflow to your repo automatically. The first run takes ~2 minutes. When it's green, your site is live at  `https://agreeable-stone-04dd2c503.7.azurestaticapps.net`.


- **Custom domain stuck "Validating"** — DNS hasn't propagated yet; `dig` or `nslookup` your record and wait. Usually 5–30 min.
