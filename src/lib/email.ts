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

export async function sendRequestNotification(toEmail: string, itemName: string, requesterName: string, itemId: string, replyToEmail?: string, startDate?: string, endDate?: string) {
    const resend = getResendClient();
    const apiKey = process.env.RESEND_API_KEY;
    const appUrl = getAppUrl();
    const itemUrl = `${appUrl}/items/${itemId}`;
    const requestsUrl = `${appUrl}/requests`;

    // Date formatting
    let dateRange = '';
    if (startDate) {
        const start = new Date(startDate).toLocaleDateString();
        const end = endDate ? new Date(endDate).toLocaleDateString() : start;
        dateRange = `${start} - ${end}`;
    }

    if (!apiKey || apiKey === 're_123') {
        console.warn('RESEND_API_KEY is missing. Falling back to console log.');
        console.log(`[MOCK EMAIL] To: ${toEmail}, Item: ${itemName}, Requester: ${requesterName}, Dates: ${dateRange}, ReplyTo: ${replyToEmail}, URL: ${itemUrl}`);
        return { success: true };
    }

    const requestSubject = startDate ? `Request for ${itemName} on ${dateRange}` : `Request for ${itemName}`;
    const requestMessage = startDate
        ? `<p><strong>${requesterName}</strong> wants to borrow your <strong><a href="${itemUrl}">${itemName}</a></strong> on <strong>${dateRange}</strong>.</p>`
        : `<p><strong>${requesterName}</strong> wants to borrow your <strong><a href="${itemUrl}">${itemName}</a></strong>.</p>`;

    try {
        const { data, error } = await resend.emails.send({
            from: 'FriendsHaveStuff <hello@friendshavestuff.com>',
            to: [toEmail],
            replyTo: replyToEmail,
            subject: `Action Required: ${requestSubject}`,
            html: `
                <div>
                    <h2>New Borrow Request</h2>
                    ${requestMessage}
                    
                    <p>Replying to this message will e-mail <strong>${requesterName}</strong> directly. To approve or deny the request, click the button below.</p>

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

export async function sendStatusUpdateEmail(toEmail: string, itemName: string, status: string, message?: string, replyToEmail?: string, ownerName?: string, startDate?: string, endDate?: string, itemId?: string) {
    const resend = getResendClient();
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey || apiKey === 're_123') {
        console.log(`[MOCK EMAIL] To: ${toEmail}, Item: ${itemName}, Status: ${status}, Message: ${message}, ReplyTo: ${replyToEmail}`);
        return { success: true };
    }

    const subject = `Request ${status.charAt(0).toUpperCase() + status.slice(1)}: ${itemName}`;
    const color = status === 'approved' ? '#16a34a' : '#dc2626'; // Green or Red

    // Date formatting
    let dateRange = '';
    if (startDate) {
        const start = new Date(startDate).toLocaleDateString();
        const end = endDate ? new Date(endDate).toLocaleDateString() : start;
        dateRange = `${start} - ${end}`;
    }

    // Default message vs Custom message
    let statusMessage = `<p>Your request to borrow <strong>${itemName}</strong> has been <strong style="color: ${color}">${status}</strong>.</p>`;

    if (status === 'approved' && ownerName && dateRange) {
        statusMessage = `<p>Your request to borrow <strong>${itemName}</strong> on <strong>${dateRange}</strong> from <strong>${ownerName}</strong> has been <strong style="color: ${color}">${status}</strong>.</p>`;
    }

    // Link destination: If Item ID is provided, go to Item page, otherwise Requests page fallback
    const linkUrl = itemId ? `${getAppUrl()}/items/${itemId}` : `${getAppUrl()}/requests`;
    const linkText = itemId ? 'View Item' : 'View Requests';

    try {
        const { data, error } = await resend.emails.send({
            from: 'FriendsHaveStuff <hello@friendshavestuff.com>',
            to: [toEmail],
            replyTo: replyToEmail,
            subject: subject,
            html: `
                <div>
                    <h2>Request ${status.toUpperCase()}</h2>
                    ${statusMessage}
                    
                    ${message ? `
                        <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid ${color}; margin: 20px 0;">
                            <strong>Message from ${ownerName || 'Owner'}:</strong><br/>
                            ${message}
                        </div>
                    ` : ''}

                    <p>Replying to this message will e-mail <strong>${ownerName || 'the owner'}</strong> directly.</p>

                    <p>
                        <a href="${linkUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            ${linkText}
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

export async function sendCommentNotification(toEmail: string, itemName: string, commentText: string, commenterName: string, itemId: string, replyToEmail?: string) {
    const resend = getResendClient();
    const apiKey = process.env.RESEND_API_KEY;
    const appUrl = getAppUrl();
    const itemUrl = `${appUrl}/items/${itemId}`;

    if (!apiKey || apiKey === 're_123') {
        console.log(`[MOCK EMAIL] Comment Notification - To: ${toEmail}, Item: ${itemName}, Commenter: ${commenterName}, Text: "${commentText}"`);
        return { success: true };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'FriendsHaveStuff <hello@friendshavestuff.com>',
            to: [toEmail],
            replyTo: replyToEmail,
            subject: `New Comment on: ${itemName}`,
            html: `
                <div>
                    <h2>New Comment</h2>
                    <p><strong>${commenterName}</strong> commented on your item <strong><a href="${itemUrl}">${itemName}</a></strong>:</p>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
                        "${commentText}"
                    </div>

                    <p>Replying to this message will email <strong>${commenterName}</strong> directly.</p>

                    <p>
                        <a href="${itemUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            View Comment
                        </a>
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('Error sending comment email:', error);
            return { success: false, error };
        }
        return { success: true, data };
    } catch (err) {
        return { success: false, error: err };
    }
}

export async function sendReplyNotification(toEmail: string, itemName: string, replyText: string, replierName: string, itemId: string) {
    const resend = getResendClient();
    const apiKey = process.env.RESEND_API_KEY;
    const appUrl = getAppUrl();
    const itemUrl = `${appUrl}/items/${itemId}`;

    if (!apiKey || apiKey === 're_123') {
        console.log(`[MOCK EMAIL] Reply Notification - To: ${toEmail}, Item: ${itemName}, Replier: ${replierName}, Text: "${replyText}"`);
        return { success: true };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'FriendsHaveStuff <hello@friendshavestuff.com>',
            to: [toEmail],
            subject: `New Reply on: ${itemName}`,
            html: `
                <div>
                    <h2>New Reply</h2>
                    <p><strong>${replierName}</strong> replied to your comment on <strong><a href="${itemUrl}">${itemName}</a></strong>:</p>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
                        "${replyText}"
                    </div>

                    <p>Replying to this message will email <strong>${replierName}</strong> directly.</p>

                    <p>
                        <a href="${itemUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            View Conversation
                        </a>
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('Error sending reply email:', error);
            return { success: false, error };
        }
        return { success: true, data };
    } catch (err) {
        console.error('Exception sending reply notification:', err);
        return { success: false, error: err };
    }
}
