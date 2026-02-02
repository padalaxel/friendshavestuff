import { Resend } from 'resend';

// Helper to get Resend instance safely
function getResendClient() {
    // Fallback to dummy key to prevent build-time crash if env var is missing
    const key = process.env.RESEND_API_KEY || 're_123';
    return new Resend(key);
}

export async function sendRequestNotification(toEmail: string, itemName: string, requesterName: string) {
    const resend = getResendClient();
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey || apiKey === 're_123') {
        console.warn('RESEND_API_KEY is missing. Falling back to console log.');
        console.log(`[MOCK EMAIL] To: ${toEmail}, Item: ${itemName}, Requester: ${requesterName}`);
        return { success: true };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'FriendsHaveStuff <onboarding@resend.dev>', // Default for testing
            to: [toEmail],
            subject: `New Borrow Request: ${itemName}`,
            html: `
                <div>
                    <h2>New Request!</h2>
                    <p><strong>${requesterName}</strong> wants to borrow your <strong>${itemName}</strong>.</p>
                    <p>
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            View Request
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

export async function sendStatusUpdateEmail(toEmail: string, itemName: string, status: string, message?: string) {
    const resend = getResendClient();
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey || apiKey === 're_123') {
        console.log(`[MOCK EMAIL] To: ${toEmail}, Item: ${itemName}, Status: ${status}, Message: ${message}`);
        return { success: true };
    }

    const subject = `Request ${status.charAt(0).toUpperCase() + status.slice(1)}: ${itemName}`;
    const color = status === 'approved' ? '#16a34a' : '#dc2626'; // Green or Red

    try {
        const { data, error } = await resend.emails.send({
            from: 'FriendsHaveStuff <onboarding@resend.dev>',
            to: [toEmail],
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
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
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
            from: 'FriendsHaveStuff <onboarding@resend.dev>',
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
