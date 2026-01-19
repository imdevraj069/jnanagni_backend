import { emailStyles } from "./styles.js";

export const getIncompleteTeamTemplate = (leaderName, teamName, eventName, currentSize, minSize) => {
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
            <h2 style="margin-top: 0; color: #dc2626;">Action Required: Team Ineligible ⚠️</h2>
            <p>Namaste <strong>${leaderName}</strong>,</p>
            <p>This is an urgent notification regarding your participation in <strong>${eventName}</strong>.</p>
            
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #991b1b;">Current Status</p>
              <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #7f1d1d;">
                Team: ${teamName}<br/>
                Members: ${currentSize} / ${minSize} (Minimum Required)
              </p>
            </div>

            <p>Your team <strong>does not meet the minimum size requirement</strong>. If you do not add more members before the event starts, your team may be <strong>disqualified</strong>.</p>

            <p><strong>Please take immediate action:</strong></p>
            <ol>
               <li>Login to your dashboard.</li>
               <li>Open the team management for ${eventName}.</li>
               <li>Invite members immediately and ensure they accept the invite.</li>
            </ol>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">MANAGE TEAM</a>
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