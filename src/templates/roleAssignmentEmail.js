import { emailStyles } from './styles.js';

export const getRoleAssignmentTemplate = (userName, roleKey, contextName, contextType) => {
  // Map internal role keys to display names
  const roleDisplayNames = {
    'category_lead': 'Category Lead',
    'event_coordinator': 'Event Coordinator',
    'volunteer': 'Volunteer'
  };

  // Define specific messages based on role
  const roleMessages = {
    'category_lead': `You have been appointed as the <strong>Category Lead</strong> for <strong>${contextName}</strong>. You now have the authority to create events and manage coordinators within this category.`,
    'event_coordinator': `You have been assigned as an <strong>Event Coordinator</strong> for <strong>${contextName}</strong>. You are now responsible for managing registrations and operations for this event.`,
    'volunteer': `Welcome to the team! You are now a verified <strong>Volunteer</strong> for <strong>${contextName}</strong>. Your help is crucial to making Jnanagni 2025 a success.`
  };

  const displayName = roleDisplayNames[roleKey] || roleKey;
  const message = roleMessages[roleKey] || `You have been assigned the role of <strong>${displayName}</strong> for <strong>${contextName}</strong>.`;

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
            <h2 style="margin-top: 0;">New Responsibility Assigned</h2>
            <p>Namaste <strong>${userName}</strong>,</p>
            
            <p>${message}</p>
            
            <div style="background: #f3f0ff; border-left: 4px solid #7c3aed; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase; font-weight: bold;">Assignment Details</p>
              <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #0a0118;">
                Role: ${displayName}<br/>
                ${contextType}: ${contextName}
              </p>
            </div>

            <p>Please login to your dashboard to view your new permissions and access specific management tools.</p>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">ACCESS DASHBOARD</a>
            </p>
            
            <div class="link-text">
              Best regards,<br/>
              The Jnanagni Team
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