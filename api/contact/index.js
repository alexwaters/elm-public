/**
 * Azure Function - Contact Form to GitHub Issues
 * Deployed via Azure Static Web Apps (free tier)
 */

/**
 * Sanitize user input to prevent markdown injection
 * Removes markdown special characters and limits length
 */
function sanitize(str, maxLength = 500) {
    if (!str) return '';
    return String(str)
        .slice(0, maxLength)
        .replace(/[[\]()#*`_~<>\\]/g, '') // Remove markdown special chars
        .replace(/\r?\n/g, ' ') // Replace newlines with spaces for single-line fields
        .trim();
}

/**
 * Sanitize message content (preserves newlines for readability)
 */
function sanitizeMessage(str, maxLength = 5000) {
    if (!str) return '';
    return String(str)
        .slice(0, maxLength)
        .replace(/[[\]()#*`_~<>\\]/g, '') // Remove markdown special chars
        .trim();
}

/**
 * Basic email format validation
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

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

        // Check for oversized payload (basic DoS protection)
        const payloadSize = JSON.stringify(data).length;
        if (payloadSize > 50000) { // 50KB limit
            context.res = {
                status: 413,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Payload too large' })
            };
            return;
        }

        // Validate required fields
        if (!data.name || !data.email || !data.message) {
            context.res = {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Missing required fields' })
            };
            return;
        }

        // Email format validation
        if (!isValidEmail(data.email)) {
            context.res = {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Invalid email format' })
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

        // Sanitize all user inputs
        const safeName = sanitize(data.name, 100);
        const safeEmail = sanitize(data.email, 100);
        const safeSubject = sanitize(data.subject, 200) || 'No subject';
        const safeMessage = sanitizeMessage(data.message, 5000);

        // Validate sanitized inputs aren't empty
        if (!safeName || !safeEmail || !safeMessage) {
            context.res = {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Invalid input' })
            };
            return;
        }

        // Create GitHub Issue with sanitized content
        const issueBody = `## New Contact Form Submission

**From:** ${safeName}
**Email:** ${safeEmail}
**Subject:** ${safeSubject}

---

### Message

${safeMessage}

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
                title: `[Contact] ${safeSubject !== 'No subject' ? safeSubject : 'New message from ' + safeName}`,
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

