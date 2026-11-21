# Security Policy

## 🛡️ Supported versions

AMYR-Agent is in beta and is developed on the `main` branch.

| Version | Supported |
| ------- | --------- |
| `main` (latest) | ✅ |
| older snapshots | ❌ |

Self-hosted operators should track `main` and update their deployment.

---

## 📨 Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues,
discussions, or pull requests.**

Use one of these private channels instead:

1. **GitHub Private Vulnerability Reporting** (preferred):
   *Repo → Security → "Report a vulnerability"*
2. **GitHub:** contact the repository owner privately through GitHub.

Please include as much of the following as possible:

* The type of issue (e.g. auth bypass, injection, secret leak, DoS)
* Full paths / URLs of the affected source files
* Step-by-step reproduction instructions or a proof of concept
* Impact assessment, including how an attacker might exploit it
* Possible mitigation suggestions (optional)

---

## ⏱️ Response expectations

* Acknowledgement: best effort within **72 hours**
* Assessment + fix timeline: communicated after triage, based on severity
* Coordinated disclosure: we kindly ask for a **90-day** window before public
  disclosure, and we will credit reporters (unless you prefer to stay
  anonymous)

---

## 🔒 Operator security checklist

If you self-host AMYR-Agent, please review the security notes in the
[README](README.md#-security):

* Set `WEBHOOK_SECRET` and validate Telegram webhook deliveries
* Keep all credentials in **Worker Secrets** — never in `wrangler.toml`
* Rotate any credential that may have been exposed
* Restrict `/eval` and admin features in public deployments
* Watch your third-party API quotas (Gemini, Cloudflare AI, Google Search)

