import nodemailer from 'nodemailer';
import { getVerificationTemplate } from '../templates/verificationEmail.js';
import { getWelcomeTemplate } from '../templates/welcomeEmail.js';
import { getOtpTemplate } from '../templates/otpEmail.js';
// We will use one flexible template for all role assignments
import { getRoleAssignmentTemplate } from '../templates/roleAssignmentEmail.js';
import { getTeamInviteTemplate } from '../templates/teamInviteEmail.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ... (keep verification, welcome, otp emails as is) ...
export const sendVerificationEmail = async (email, name, jnanagniId, token) => {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify/${jnanagniId}/${token}`;
    const html = getVerificationTemplate(name, verifyUrl);
  
    await transporter.sendMail({
      from: `"Jnanagni Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Action Required: Verify Your Jnanagni Account ID: ${process.env.jnanagniId}`,
      html: html
    });
  };
  
  export const sendWelcomeEmail = async (email, name, jnanagniId) => {
    const html = getWelcomeTemplate(name, jnanagniId);
  
    await transporter.sendMail({
      from: `"Jnanagni Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Welcome to Jnanagni 2025! [ID: ${jnanagniId}]`,
      html: html
    });
  };
  
  export const sendOtpEmail = async (email, otp) => {
    const html = getOtpTemplate(otp);
  
    await transporter.sendMail({
      from: `"Jnanagni Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your Password Reset Code: ${otp}`,
      html: html
    });
  };

// --- NEW: GENERIC ROLE ASSIGNMENT EMAIL ---
// contextType is either "Category" (for Leads) or "Event" (for Coords/Volunteers)
export const sendRoleAssignmentEmail = async (user, role, contextName, contextType) => {
  const html = getRoleAssignmentTemplate(user.name, role, contextName, contextType);

  // Format subject line nicely
  const roleTitle = role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  await transporter.sendMail({
    from: `"Jnanagni Admin" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `Role Update: You are now a ${roleTitle}`,
    html: html
  });
}
// --- NEW FUNCTION: Send Team Invitation ---
export const sendTeamInviteEmail = async (email, inviterName, teamName, eventName) => {
  const html = getTeamInviteTemplate(inviterName, teamName, eventName);

  await transporter.sendMail({
    from: `"Jnanagni Events" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Team Invitation: Join "${teamName}" for ${eventName}`,
    html: html
  });
};

// --- UPDATE: Registration Confirmation (Enhanced) ---
export const sendRegistrationConfirmation = async (user, eventName, teamName = null) => {
  const subject = teamName 
    ? `Team Registered: ${teamName} for ${eventName}`
    : `Registration Confirmed: ${eventName}`;

  const message = teamName
    ? `You have successfully created the team <strong>${teamName}</strong> for <strong>${eventName}</strong>. You can now invite members from your dashboard.`
    : `You have successfully registered for <strong>${eventName}</strong>.`;

  await transporter.sendMail({
    from: `"Jnanagni Events" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: subject,
    html: `
      <h2>Registration Successful!</h2>
      <p>Namaste ${user.name},</p>
      <p>${message}</p>
      <p>Visit your dashboard to view details.</p>
    `
  });
};