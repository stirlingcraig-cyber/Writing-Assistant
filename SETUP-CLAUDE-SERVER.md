# Set up your private Claude server

Your Anthropic API key lives only on a small private server (a free Cloudflare Worker).
The app on GitHub Pages talks to that server using a passcode you choose, so the key is
never in the website, the code, or anyone's browser.

```
Your phone ──passcode──▶ Private server (Cloudflare) ──your key──▶ Anthropic (Claude)
```

You'll set four secrets in GitHub once; GitHub then deploys the server for you.

## 1. Get your Anthropic API key
1. Go to **console.anthropic.com** and sign in (this is separate from a Claude subscription).
2. **Plans & Billing** → add some credit.
3. **Settings → Limits** → set a monthly spend limit you're comfortable with (recommended).
4. **API keys** → **Create key** → copy it (starts with `sk-ant-`). Keep it private.

## 2. Get your Cloudflare details (free account)
1. Sign up / sign in at **dash.cloudflare.com**.
2. Open **Workers & Pages** once. If asked, choose your `workers.dev` subdomain (e.g. `craig`).
3. Copy your **Account ID** (shown on the Workers & Pages overview, right-hand side).
4. **My Profile → API Tokens → Create Token** → use the **Edit Cloudflare Workers** template → **Continue to summary** → **Create Token** → copy it.

## 3. Choose a passcode
Pick something long and unguessable, e.g. four random words: `harbour-velvet-lantern-47`.
You'll type it into the app once on each device.

## 4. Add the secrets to this GitHub repository
Repository → **Settings → Secrets and variables → Actions**.

On the **Secrets** tab, click **New repository secret** four times:

| Name | Value |
| --- | --- |
| `ANTHROPIC_API_KEY` | your `sk-ant-…` key |
| `APP_PASSCODE` | the passcode you chose |
| `CLOUDFLARE_API_TOKEN` | the Cloudflare token |
| `CLOUDFLARE_ACCOUNT_ID` | the Cloudflare Account ID |

On the **Variables** tab, click **New repository variable**:

| Name | Value |
| --- | --- |
| `ALLOWED_ORIGINS` | your site's address without a path, e.g. `https://yourname.github.io` |

## 5. Deploy the server
Repository → **Actions** → **Deploy Claude server** → **Run workflow**.
When it finishes (about a minute), open the run's log: the **Deploy to Cloudflare** step shows your server's address,
e.g. `https://exec-writer-claude.yourname.workers.dev`.

It redeploys automatically whenever files in `worker/` change. To change the key or passcode later,
update the GitHub secret and run the workflow again.

## 6. Connect the app
Open your app → **Settings & writing profile → Claude connection → Private server**:
1. **Server address** — paste the `workers.dev` address.
2. **Passcode** — the one you chose.
3. **Test connection** → you should see "✓ Connected".
4. Tick **Remember these details on this device**.

Repeat step 6 on each device you use.

## Troubleshooting
| Message in the app | Fix |
| --- | --- |
| Couldn't reach that address | Check the full `https://…workers.dev` address and that the workflow succeeded. |
| The server rejected the passcode | It must match `APP_PASSCODE` exactly (case-sensitive). |
| The server doesn't allow this website | Set `ALLOWED_ORIGINS` to the address shown in the message and re-run the workflow. |
| The server's Anthropic key was rejected | Update the `ANTHROPIC_API_KEY` secret and re-run the workflow. |
| Hit a rate or credit limit | Add credit or raise the limit in the Anthropic console. |

## What the server allows
- Only the app's own request shape, only the three Claude models the app uses, at most 8,000 output tokens per request.
- At most 30 requests per minute from each device.
- Nothing is logged or stored by the server.

## No GitHub Actions? Set it up by hand instead
Cloudflare dashboard → **Workers & Pages → Create → Create Worker** → name it `exec-writer-claude` → **Deploy** →
**Edit code** → replace everything with the contents of `worker/index.js` → **Deploy**.
Then **Settings → Variables and Secrets**: add secrets `ANTHROPIC_API_KEY` and `APP_PASSCODE`, and a text variable `ALLOWED_ORIGINS`.
