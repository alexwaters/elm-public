# Contact Form → GitHub Issues (Free Solution)

This document explains how to handle contact form submissions by creating GitHub Issues - completely free using GitHub's built-in features.

## Architecture Overview

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  Contact     │     │  GitHub Actions │     │  GitHub Issues   │
│  Form Submit │ ──▶ │  Workflow       │ ──▶ │  (Notification)  │
└──────────────┘     └─────────────────┘     └──────────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  Email via      │
                     │  GitHub Notifs  │
                     └─────────────────┘
```

## Solution: GitHub Actions `repository_dispatch` + Issues API

### How It Works

1. **User submits form** on the contact page
2. **JavaScript sends POST** to GitHub's repository dispatch API
3. **GitHub Actions workflow** triggers and creates an Issue
4. **You receive notification** via GitHub (email, mobile, etc.)

### Why This Approach?

- ✅ **100% Free** - Uses GitHub's free tier
- ✅ **No external services** - Everything stays in GitHub
- ✅ **Email notifications** - GitHub notifies you of new issues
- ✅ **Organized inbox** - Issues are searchable and manageable
- ✅ **No server required** - Static site + GitHub Actions

---

## Setup Instructions

### Step 1: Create a Personal Access Token (PAT)

1. Go to **GitHub Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
2. Click **"Generate new token"**
3. Configure:
   - **Name**: `elm-contact-form`
   - **Expiration**: 1 year (or custom)
   - **Repository access**: Only select repositories → `alexwaters/elm`
   - **Permissions**:
     - **Issues**: Read and Write
     - **Actions**: Read and Write (for repository_dispatch)
4. Click **Generate token** and **copy it immediately**

### Step 2: Add Token as Repository Secret

1. Go to your repo: `https://github.com/alexwaters/elm/settings/secrets/actions`
2. Click **"New repository secret"**
3. Name: `CONTACT_FORM_TOKEN`
4. Value: Paste your PAT from Step 1
5. Click **"Add secret"**

### Step 3: Enable GitHub Actions

The workflow file is already created at `.github/workflows/contact-form.yml`.

GitHub Actions will automatically:
- Listen for `repository_dispatch` events with type `contact-form`
- Create a new Issue with the form data
- Label it as `contact-form`

### Step 4: Update the Contact Form JavaScript

Update `assets/js/main.js` to POST to GitHub's API:

```javascript
// In the form submission handler, replace the fetch URL with:
const response = await fetch('https://api.github.com/repos/alexwaters/elm/dispatches', {
  method: 'POST',
  headers: {
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': 'token YOUR_PUBLIC_TOKEN', // See note below
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    event_type: 'contact-form',
    client_payload: {
      name: formData.name,
      email: formData.email,
      subject: formData.subject,
      message: formData.message
    }
  })
});
```

### ⚠️ Security Note: Public Token

Since this is a static site, the token will be visible in the JavaScript. To minimize risk:

1. Create a **separate token** with **minimal permissions** (only Issues + Actions for this repo)
2. The token can only create issues - it cannot access code, delete anything, or modify settings
3. Consider using a **GitHub App** instead for production (more secure but more complex)

**Alternative: Use a free serverless function** (Cloudflare Workers, Vercel Edge Functions) to hide the token. See "Advanced Setup" below.

---

## Advanced Setup: Hidden Token with Cloudflare Workers (Free)

For better security, use a free Cloudflare Worker as a proxy:

1. **Create Cloudflare account** (free)
2. **Create a Worker** that:
   - Receives form POST from your site
   - Adds the GitHub token (stored as environment variable)
   - Forwards to GitHub API
3. **Update form** to POST to your Worker URL

This keeps your token completely hidden while remaining free.

---

## Testing

1. Submit a test form on your contact page
2. Check the **Actions** tab in your GitHub repo for workflow runs
3. Check the **Issues** tab for the created issue
4. Verify you received a notification (check GitHub notification settings)

---

## Troubleshooting

### Form submission fails
- Check browser console for errors
- Verify the PAT has correct permissions
- Check GitHub Actions tab for workflow errors

### No issue created
- Check Actions tab for failed workflows
- Verify the `CONTACT_FORM_TOKEN` secret is set
- Check workflow logs for specific error messages

### No email notification
- Go to GitHub Settings → Notifications
- Enable "Issues" notifications for the elm repository
- Check spam folder

---

## Files Reference

- `.github/workflows/contact-form.yml` - GitHub Actions workflow
- `assets/js/main.js` - Form submission JavaScript
- `contact.html` - Contact form HTML

