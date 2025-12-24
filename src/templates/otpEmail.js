import { emailStyles } from "./styles.js";

export const getOtpTemplate = (otp) => {
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
            <h2 style="margin-top: 0;">Password Reset</h2>
            <p>We received a request to reset the password for your Jnanagni account. Use the code below to proceed:</p>
            
            <div class="otp-code">${otp}</div>

            <p>This code is valid for <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            &copy; 2025 Jnanagni Tech Fest.
          </div>
        </div>
      </body>
    </html>
  `;
};