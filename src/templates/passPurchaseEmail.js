import { emailStyles } from "./styles.js";

export const getPassPurchaseTemplate = (name, passName, transactionId) => {
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
            <h2 style="margin-top: 0;">Access Granted! 🎟️</h2>
            <p>Namaste <strong>${name}</strong>,</p>
            <p>Your purchase request has been verified by our finance team. Your pass is now active!</p>
            
            <div style="background: #f3f0ff; border-left: 4px solid #7c3aed; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase; font-weight: bold;">Pass Details</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #0a0118;">${passName}</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #444;">Ref: ${transactionId}</p>
            </div>

            <p>You can now register for exclusive events, workshops, or competitions covered by this pass.</p>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">REGISTER FOR EVENTS</a>
            </p>
          </div>
          <div class="footer">
            &copy; 2025 Jnanagni Tech Fest.<br/>
            Gurukula Kangri (Deemed to be University)
          </div>
        </div>
      </body>
    </html>
  `;
};