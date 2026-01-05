import { emailStyles } from "./styles.js";

export const getTeamInviteTemplate = (inviterName, teamName, eventName) => {
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
            <h2 style="margin-top: 0;">You've Been Recruited!</h2>
            <p>Namaste,</p>
            <p><strong>${inviterName}</strong> has invited you to join their team <strong>"${teamName}"</strong> for the event <strong>${eventName}</strong>.</p>
            
            <div style="background: #f3f0ff; border-left: 4px solid #7c3aed; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #666;">Event Details</p>
              <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #0a0118;">${eventName}</p>
            </div>

            <p>To accept or reject this invitation, please visit your dashboard.</p>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/dashboard/invites" class="button">VIEW INVITATION</a>
            </p>
            
            <div class="link-text">
              If the button doesn't work, login to your dashboard manually.<br/>
              This invite will remain pending until you respond.
            </div>
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