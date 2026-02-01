export async function sendRequestNotification(toEmail: string, itemName: string, requesterName: string) {
    // In a real app, we would use Resend, Nodemailer, or AWS SES here.
    // For now, we log to the console as a mock service.
    console.log(`
    ==================================================
    [MOCK EMAIL SERVICE]
    To: ${toEmail}
    Subject: New Borrow Request for ${itemName}
    
    Hello!
    
    ${requesterName} wants to borrow your ${itemName}.
    
    Log in to the app to approve or decline:
    http://localhost:3000
    ==================================================
    `);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
}
