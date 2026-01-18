import { emailStyles } from "./styles.js";

export const getPassRejectionTemplate = (name, passName, reason) => {
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
            <h2 style="margin-top: 0; color: #dc2626;">Action Required</h2>
            <p>Namaste <strong>${name}</strong>,</p>
            <p>We reviewed your purchase request for the <strong>${passName}</strong>, but we could not verify your payment at this time.</p>
            
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 12px; color: #991b1b; text-transform: uppercase; font-weight: bold;">Reason for Rejection</p>
              <p style="margin: 5px 0 0 0; font-size: 16px; color: #7f1d1d;">"${reason}"</p>
            </div>

            <p><strong>Common Reasons:</strong></p>
            <ul style="color: #444; font-size: 14px;">
              <li>UTR/Transaction ID does not match our bank records.</li>
              <li>Screenshot uploaded was blurry or incorrect.</li>
              <li>Duplicate transaction ID used.</li>
            </ul>

            <p>Please check your details and try requesting again, or contact our finance support if you believe this is an error.</p>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/dashboard/passes" class="button">TRY AGAIN</a>
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