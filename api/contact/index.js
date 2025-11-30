/**
 * Azure Function - Contact Form to GitHub Issues
 * Deployed via Azure Static Web Apps (free tier)
 */

module.exports = async function (context, req) {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = 'alexwaters/elm';

    // Only allow POST
    if (req.method !== 'POST') {
        context.res = { status: 405, body: 'Method not allowed' };
        return;
    }

    try {
        const data = req.body;

        // Validate required fields
        if (!data.name || !data.email || !data.message) {
            context.res = {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Missing required fields' })
            };
            return;
        }

        // Honeypot check - if filled, silently succeed (bot)
        if (data.website) {
            context.res = {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: true })
            };
            return;
        }

        // Create GitHub Issue
        const issueBody = `## New Contact Form Submission

**From:** ${data.name}
**Email:** ${data.email}
**Subject:** ${data.subject || 'No subject'}

---

### Message

${data.message}

---

*Submitted via elm.nyc contact form at ${new Date().toISOString()}*`;

        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'elm-contact-form'
            },
            body: JSON.stringify({
                title: `[Contact] ${data.subject || 'New message from ' + data.name}`,
                body: issueBody,
                labels: ['contact-form']
            })
        });

        if (!response.ok) {
            const error = await response.text();
            context.log.error('GitHub API error:', error);
            context.res = {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Failed to submit' })
            };
            return;
        }

        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true })
        };

    } catch (error) {
        context.log.error('Function error:', error);
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Server error' })
        };
    }
};

