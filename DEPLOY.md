# Deploy this portfolio to Azure

Two solid paths on Azure. Pick one:

- **Option A — Azure Static Web Apps** (recommended). Free tier, automatic HTTPS, custom domains included, CI/CD from GitHub out of the box. Best DX.
- **Option B — Azure Storage static website**. The closest 1:1 to S3 static hosting. Great learning exercise for the DevOps journey because you'll layer Azure CDN + Front Door + a custom domain yourself, the same way you would with CloudFront on AWS.

You'll need:
- An Azure account (free tier is enough)
- The Azure CLI: `brew install azure-cli` then `az login`
- The files in this folder: `index.html`, `error.html`, `styles.css`, `script.js`

---

## Option A — Azure Static Web Apps (recommended)

This is the modern Azure pattern. HTTPS is automatic, the free tier covers personal portfolios, and every push to GitHub redeploys for you.

### A1. Get the code on GitHub

```bash
cd /Users/Barakat/Desktop/LockIn
git init
git add index.html error.html styles.css script.js DEPLOY.md
git commit -m "Initial portfolio"
gh repo create barakat-portfolio --public --source=. --push
```

(If you don't have `gh`, create the repo on github.com and push manually.)

### A2. Create the Static Web App

Portal route (easiest first time):

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

Azure adds a GitHub Actions workflow to your repo automatically. The first run takes ~2 minutes. When it's green, your site is live at something like `https://<random-name>.azurestaticapps.net`.

### A3. CLI version (same thing, scriptable)

```bash
RG=rg-portfolio
NAME=barakat-portfolio
LOCATION=westeurope     # or eastus, etc.
GH_REPO=https://github.com/<your-username>/barakat-portfolio

az group create --name $RG --location $LOCATION

az staticwebapp create \
  --name $NAME \
  --resource-group $RG \
  --source $GH_REPO \
  --location $LOCATION \
  --branch main \
  --app-location "/" \
  --login-with-github
```

### A4. Custom domain later

When you have a domain:

```bash
az staticwebapp hostname set \
  --name $NAME --resource-group $RG \
  --hostname www.barakat.cloud
```

Azure tells you the DNS record to add — TXT for validation, then CNAME for the hostname. HTTPS is provisioned automatically once DNS resolves.

---

## Option B — Azure Storage static website (the S3 analogue)

This is the most direct equivalent to S3 static hosting. You'll add Azure Front Door (or Azure CDN) on top for HTTPS + custom domain.

### B1. Create the storage account and enable static hosting

```bash
RG=rg-portfolio
LOCATION=westeurope
# storage account names: 3-24 chars, lowercase letters and numbers only, globally unique
STORAGE=barakatportfolio$RANDOM

az group create --name $RG --location $LOCATION

az storage account create \
  --name $STORAGE \
  --resource-group $RG \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2 \
  --allow-blob-public-access true

# Enable the static website feature — creates a special $web container
az storage blob service-properties update \
  --account-name $STORAGE \
  --static-website \
  --index-document index.html \
  --404-document error.html
```

### B2. Upload the site

```bash
az storage blob upload-batch \
  --account-name $STORAGE \
  --source . \
  --destination '$web' \
  --pattern '*.html' \
  --overwrite

az storage blob upload-batch \
  --account-name $STORAGE \
  --source . \
  --destination '$web' \
  --pattern '*.css' \
  --overwrite

az storage blob upload-batch \
  --account-name $STORAGE \
  --source . \
  --destination '$web' \
  --pattern '*.js' \
  --overwrite
```

### B3. Get the URL

```bash
az storage account show \
  --name $STORAGE \
  --resource-group $RG \
  --query "primaryEndpoints.web" \
  --output tsv
```

That prints something like `https://barakatportfolio12345.z6.web.core.windows.net/` — open it.

### B4. Updates later

Just re-run the three `upload-batch` commands. Easy to wrap in a `deploy.sh`.

### B5. Adding a custom domain + HTTPS

Storage accounts alone don't give you HTTPS on a custom domain — that's why you put **Azure Front Door** (or **Azure CDN**) in front:

1. Buy a domain (Azure App Service Domains, Namecheap, Cloudflare, etc.)
2. Create an Azure Front Door profile (Standard tier) → origin = your storage `web` endpoint
3. Add your custom domain in Front Door → it auto-issues a managed TLS cert
4. Point your domain's CNAME at the Front Door endpoint
5. Done — `https://barakat.cloud` cached at the edge

This Front Door step is *the perfect blog post* for your 90-day build-in-public series. Document it.

---

## AWS ↔ Azure mental map (handy for the journey)

| AWS                 | Azure                                          |
| ------------------- | ---------------------------------------------- |
| S3 (static website) | Storage Account `$web` container               |
| S3 + CloudFront     | Storage Account + Azure Front Door / CDN       |
| Route 53            | Azure DNS                                      |
| ACM (cert)          | Front Door managed cert / App Service Managed  |
| Amplify Hosting     | Azure Static Web Apps                          |
| IAM                 | Microsoft Entra ID + RBAC                      |
| CloudWatch          | Azure Monitor / Log Analytics                  |

---

## Troubleshooting

- **404 on the storage endpoint** — files weren't uploaded to the `$web` container; re-run the `upload-batch` commands and confirm names match `index.html` / `error.html` exactly.
- **CSS/JS not loading** — content-type is wrong. `upload-batch` infers it from the extension, so make sure you uploaded with the right `--pattern` and the file extensions are correct.
- **Static Web App build fails** — open the GitHub Actions tab in your repo; the workflow file Azure generated under `.github/workflows/` shows the failing step.
- **Custom domain stuck "Validating"** — DNS hasn't propagated yet; `dig` or `nslookup` your record and wait. Usually 5–30 min.
