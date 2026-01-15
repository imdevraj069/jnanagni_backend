import nodemailer from 'nodemailer';
import { getVerificationTemplate } from '../templates/verificationEmail.js';
import { getWelcomeTemplate } from '../templates/welcomeEmail.js';
import { getOtpTemplate } from '../templates/otpEmail.js';
import { getRoleAssignmentTemplate } from '../templates/roleAssignmentEmail.js';
import { getTeamInviteTemplate } from '../templates/teamInviteEmail.js';
import { getPaymentVerificationTemplate } from '../templates/paymentVerificationEmail.js';

// ==========================================
// 1. CONFIGURE TRANSPORTERS
// ==========================================

// Helper to create a transporter instance
const createTransporter = (user, pass) => {
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
};

// Initialize the 4 dedicated email channels
const emailChannels = {
  security: {
    transporter: createTransporter(process.env.SECURITY_EMAIL_USER, process.env.SECURITY_EMAIL_PASS),
    email: process.env.SECURITY_EMAIL_USER,
    label: "Jnanagni Security"
  },
  info: {
    transporter: createTransporter(process.env.INFO_EMAIL_USER, process.env.INFO_EMAIL_PASS),
    email: process.env.INFO_EMAIL_USER,
    label: "Jnanagni Team"
  },
  noreply: {
    transporter: createTransporter(process.env.NOREPLY_EMAIL_USER, process.env.NOREPLY_EMAIL_PASS),
    email: process.env.NOREPLY_EMAIL_USER,
    label: "Jnanagni Notifications"
  },
  help: {
    transporter: createTransporter(process.env.HELP_EMAIL_USER, process.env.HELP_EMAIL_PASS),
    email: process.env.HELP_EMAIL_USER,
    label: "Jnanagni Support"
  }
};

// ==========================================
// 2. INTELLIGENT SENDING HELPER
// ==========================================

/**
 * Sends an email using the specified primary channel (security, info, or noreply).
 * If the primary fails, it automatically falls back to the 'help' email.
 */
const sendDistributedMail = async (channelKey, { to, subject, html, fromOverride }) => {
  const primary = emailChannels[channelKey];
  const backup = emailChannels.help;

  // 1. Validate Primary Configuration
  if (!primary || !primary.transporter) {
    console.warn(`⚠️  Email Channel '${channelKey}' is missing credentials. Attempting backup...`);
    return sendViaBackup(backup, { to, subject, html, fromOverride });
  }

  try {
    // 2. Attempt Primary Send
    console.log(`📧 Sending via [${channelKey.toUpperCase()}] to: ${to}`);
    await primary.transporter.sendMail({
      from: `"${fromOverride || primary.label}" <${primary.email}>`,
      to: to,
      subject: subject,
      html: html
    });

  } catch (error) {
    // 3. Handle Failure & Retry with Backup
    console.error(`❌ [${channelKey.toUpperCase()}] Failed: ${error.message}`);
    console.log(`🔄 Retrying via [HELP] channel...`);
    
    await sendViaBackup(backup, { to, subject, html, fromOverride });
  }
};

// Helper for the backup attempt
const sendViaBackup = async (backup, { to, subject, html, fromOverride }) => {
  if (!backup || !backup.transporter) {
    throw new Error("🔥 CRITICAL: Both primary and backup email channels are unconfigured or failing.");
  }
  
  await backup.transporter.sendMail({
    from: `"${fromOverride || 'Jnanagni Support'}" <${backup.email}>`,
    to: to,
    subject: subject,
    html: html
  });
  console.log(`✅ Sent via backup [HELP] channel.`);
};

// ==========================================
// 3. EXPORTED FUNCTIONS
// ==========================================

// --- SECURITY EMAILS (Uses: SECURITY_EMAIL_USER) ---
export const sendVerificationEmail = async (email, name, jnanagniId, token) => {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify/${jnanagniId}/${token}`;
    await sendDistributedMail('security', {
      to: email,
      subject: `Action Required: Verify Your Email: ${jnanagniId}`,
      html: getVerificationTemplate(name, verifyUrl),
      fromOverride: "Jnanagni Security"
    });
};

export const sendOtpEmail = async (email, otp) => {
    await sendDistributedMail('security', {
      to: email,
      subject: `Your Password Reset Code: ${otp}`,
      html: getOtpTemplate(otp),
      fromOverride: "Jnanagni Security"
    });
};

export const sendPaymentVerificationEmail = async (email, name, jnanagniId) => {
    await sendDistributedMail('security', {
      to: email,
      subject: `Payment Verified - Ready to Onboard! [ID: ${jnanagniId}]`,
      html: getPaymentVerificationTemplate(name, jnanagniId),
      fromOverride: "Jnanagni Finance"
    });
};

// --- INFO EMAILS (Uses: INFO_EMAIL_USER) ---
export const sendWelcomeEmail = async (email, name, jnanagniId) => {
    await sendDistributedMail('info', {
      to: email,
      subject: `Welcome to Jnanagni 2025! [ID: ${jnanagniId}]`,
      html: getWelcomeTemplate(name, jnanagniId),
      fromOverride: "Jnanagni Team"
    });
};

// --- AUTOMATED NOTIFICATIONS (Uses: NOREPLY_EMAIL_USER) ---
export const sendRoleAssignmentEmail = async (user, role, contextName, contextType) => {
    const roleTitle = role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    await sendDistributedMail('noreply', {
      to: user.email,
      subject: `Role Update: You are now a ${roleTitle}`,
      html: getRoleAssignmentTemplate(user.name, role, contextName, contextType),
      fromOverride: "Jnanagni Admin"
    });
};

export const sendTeamInviteEmail = async (email, inviterName, teamName, eventName) => {
    await sendDistributedMail('noreply', {
      to: email,
      subject: `Team Invitation: Join "${teamName}" for ${eventName}`,
      html: getTeamInviteTemplate(inviterName, teamName, eventName),
      fromOverride: "Jnanagni Events"
    });
};

export const sendRegistrationConfirmation = async (user, eventName, teamName = null) => {
    const subject = teamName 
      ? `Team Registered: ${teamName} for ${eventName}`
      : `Registration Confirmed: ${eventName}`;
  
    const message = teamName
      ? `You have successfully created the team <strong>${teamName}</strong> for <strong>${eventName}</strong>. You can now invite members from your dashboard.`
      : `You have successfully registered for <strong>${eventName}</strong>.`;
  
    const html = `
      <h2>Registration Successful!</h2>
      <p>Namaste ${user.name},</p>
      <p>${message}</p>
      <p>Visit your dashboard to view details.</p>
    `;

    await sendDistributedMail('noreply', {
      to: user.email,
      subject: subject,
      html: html,
      fromOverride: "Jnanagni Events"
    });
};