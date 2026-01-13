import { emailStyles } from "./styles.js";

export const getPaymentVerificationTemplate = (name, jnanagniId) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">JNANAGNI</div>
          </div>
          <div class="content">
            <h2 style="margin-top: 0;">Payment Verified! ✓</h2>
            <p>Hello <strong>${name}</strong>,</p>
            <p>Great news! Your payment has been successfully verified by our finance team.</p>
            
            <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 12px; color: #065f46; text-transform: uppercase; font-weight: bold;">✓ Payment Status</p>
              <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #10b981;">VERIFIED</p>
            </div>

            <p>You can now proceed to register for events and workshops. Visit your dashboard to explore and register for events that interest you.</p>
            
            <p><strong>Next Steps:</strong></p>
            <ul style="margin: 10px 0;">
              <li>Login to your dashboard</li>
              <li>Browse available events</li>
              <li>Register for workshops and competitions</li>
              <li>Invite team members (if applicable)</li>
            </ul>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">GO TO DASHBOARD</a>
            </p>
          </div>
          <div class="footer">
            &copy; 2025 Jnanagni Tech Fest.
          </div>
        </div>
      </body>
    </html>
  `;
};
