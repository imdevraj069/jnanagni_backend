import { emailStyles } from "./styles.js";

export const getWelcomeTemplate = (name, jnanagniId) => {
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
            <h2 style="margin-top: 0;">Welcome, Cadet!</h2>
            <p>Congratulations <strong>${name}</strong>,</p>
            <p>Your account has been successfully verified. You are now officially part of the Jnanagni 2025 cohort.</p>
            
            <div style="background: #f3f0ff; border-left: 4px solid #7c3aed; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase; font-weight: bold;">Your Official ID</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #0a0118;">${jnanagniId}</p>
            </div>

            <p>You can now login to the portal to view events, workshops, and manage your participation.</p>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">LOGIN TO DASHBOARD</a>
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