import { emailStyles } from "./styles.js";

export const getVerificationTemplate = (name, verifyUrl) => {
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
            <h2 style="margin-top: 0;">Verify Your Email</h2>
            <p>Namaste <strong>${name}</strong>,</p>
            <p>Thank you for registering for Jnanagni 2025. To activate your account and generate your official ID, please verify your email address.</p>
            
            <p style="text-align: center; margin: 35px 0;">
              <a href="${verifyUrl}" class="button">VERIFY ACCOUNT</a>
            </p>

            <p>This verification link is valid for <strong>30 minutes</strong>.</p>
            
            <div class="link-text">
              If the button doesn't work, copy this link:<br/>
              ${verifyUrl}
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