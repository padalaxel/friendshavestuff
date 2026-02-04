import { Resend } from 'resend';

// Helper to get Resend instance safely
function getResendClient() {
    // Fallback to dummy key to prevent build-time crash if env var is missing
    const key = process.env.RESEND_API_KEY || 're_123';
    return new Resend(key);
}

function getAppUrl() {
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    // Prioritize main Vercel domain over deployment specific URLs if not hitting localhost
    if (process.env.NODE_ENV === 'production') return 'https://friendshavestuff.vercel.app';

    // Fallback logic
    return 'http://localhost:3000';
}

export async function sendRequestNotification(toEmail: string, itemName: string, requesterName: string, itemId: string, replyToEmail?: string) {
    const resend = getResendClient();
    const apiKey = process.env.RESEND_API_KEY;
    const appUrl = getAppUrl();
    const itemUrl = `${appUrl}/items/${itemId}`;
    const requestsUrl = `${appUrl}/requests`;

    if (!apiKey || apiKey === 're_123') {
        console.warn('RESEND_API_KEY is missing. Falling back to console log.');
        console.log(`[MOCK EMAIL] To: ${toEmail}, Item: ${itemName}, Requester: ${requesterName}, ReplyTo: ${replyToEmail}, URL: ${itemUrl}`);
        return { success: true };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'FriendsHaveStuff <hello@friendshavestuff.com>',
            to: [toEmail],
            replyTo: replyToEmail,
            subject: `Action Required: Request for ${itemName}`,
            html: `
                <div>
                    <h2>New Borrow Request</h2>
                    <p><strong>${requesterName}</strong> wants to borrow your <strong><a href="${itemUrl}">${itemName}</a></strong>.</p>
                    
                    <p>Reply to this e-mail to send a message to <strong>${requesterName}</strong> or approve their request by clicking the button below!</p>

                    <div style="margin: 24px 0;">
                        <a href="${requestsUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            View & Manage Request
                        </a>
                    </div>

                    <p style="color: #666; font-size: 14px;">
                        Or view the item here: <a href="${itemUrl}">${itemUrl}</a>
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('Error sending email:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (err) {
        console.error('Exception sending email:', err);
        return { success: false, error: err };
    }
}

export async function sendStatusUpdateEmail(toEmail: string, itemName: string, status: string, message?: string, replyToEmail?: string) {
    const resend = getResendClient();
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey || apiKey === 're_123') {
        console.log(`[MOCK EMAIL] To: ${toEmail}, Item: ${itemName}, Status: ${status}, Message: ${message}, ReplyTo: ${replyToEmail}`);
        return { success: true };
    }

    const subject = `Request ${status.charAt(0).toUpperCase() + status.slice(1)}: ${itemName}`;
    const color = status === 'approved' ? '#16a34a' : '#dc2626'; // Green or Red

    try {
        const { data, error } = await resend.emails.send({
            from: 'FriendsHaveStuff <hello@friendshavestuff.com>',
            to: [toEmail],
            replyTo: replyToEmail,
            subject: subject,
            html: `
                <div>
                    <h2>Request ${status.toUpperCase()}</h2>
                    <p>Your request to borrow <strong>${itemName}</strong> has been <strong style="color: ${color}">${status}</strong>.</p>
                    
                    ${message ? `
                        <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid ${color}; margin: 20px 0;">
                            <strong>Message from Owner:</strong><br/>
                            ${message}
                        </div>
                    ` : ''}

                    <p>
                        <a href="${getAppUrl()}/requests" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            View Requests
                        </a>
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('Error sending email:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (err) {
        console.error('Exception sending email:', err);
        return { success: false, error: err };
    }
}

export async function sendTestEmail(toEmail: string) {
    const resend = getResendClient();
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey || apiKey === 're_123') {
        return { success: false, error: 'Missing RESEND_API_KEY env var' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'FriendsHaveStuff <hello@friendshavestuff.com>',
            to: [toEmail],
            subject: 'Test Email from FriendsHaveStuff',
            html: '<p>If you are reading this, the email integration is working!</p>'
        });

        if (error) {
            console.error('Error sending test email:', error);
            return { success: false, error };
        }
        return { success: true, data };
    } catch (err) {
        console.error('Exception sending test email:', err);
        return { success: false, error: err };
    }
}
