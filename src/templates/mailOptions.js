/**
 * Email Configuration and Templates
 * Centralized mail options configuration for the GCA backend application
 */

import { otpEmail } from '../emailTeamplate/otp.email.js'
import { passwordResetSuccessEmail } from '../emailTeamplate/password.reset.success.email.js'
import { joinRequestEmail } from '../emailTeamplate/join.request.email.js'
import { memberInvitationEmail } from '../emailTeamplate/member.invitation.email.js'
import { customEmail } from '../emailTeamplate/custom.email.js'

export const MAIL_CONFIG = {
  sendgrid: {
    service: 'sendgrid',
    apiKey: process.env.SENDGRID_API_KEY
  },
  
  smtp: {
    service: process.env.EMAIL_SERVICE || 'sendgrid',
    host: process.env.EMAIL_HOST || 'smtp.sendgrid.net',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    tls: {
      rejectUnauthorized: false
    }
  }
}

export const AUTH_CONFIG = {
  user: process.env.EMAIL_FROM || 'info@globalculinaryalliance.com',
  pass: process.env.EMAIL_APP_PASSWORD || ''
}


export const getMailOptions = (options = {}) => {
  const defaultOptions = {
    from: process.env.EMAIL_FROM || 'info@globalculinaryalliance.com',
    encoding: 'utf-8'
  }
  
  return { ...defaultOptions, ...options }
}

/**
 * Email templates for different use cases
 * Imported from individual template files in emailTeamplate folder
 */
export const EMAIL_TEMPLATES = {
  /**
   * OTP Email Template
   */
  sendOTP: otpEmail,

  /**
   * Password Reset Success Email Template
   */
  passwordResetSuccess: passwordResetSuccessEmail,

  /**
   * Join Request Email Template
   */
  joinRequest: joinRequestEmail,

  /**
   * Member Invitation Email Template
   */
  memberInvitation: memberInvitationEmail,

  /**
   * Custom Email Template with subject and content
   */
  custom: customEmail
}


export const getTransporterConfig = () => {
  const emailService = process.env.EMAIL_SERVICE || 'sendgrid'
  
  if (emailService === 'sendgrid') {
    return {
      ...MAIL_CONFIG.sendgrid
    }
  }
  
  return {
    ...MAIL_CONFIG.smtp,
    auth: AUTH_CONFIG
  }
}


export const EMAIL_SUBJECTS = {
  OTP_RESET: 'Password Reset OTP - GCA',
  PASSWORD_RESET_SUCCESS: 'Password Reset Successful - GCA',
  JOIN_REQUEST: 'Join Request - Global Culinary Alliance',
  NOTIFICATION: 'Notification - Global Culinary Alliance',
  TEAM_INVITATION: 'Team Invitation - GCA',
  WELCOME: 'Welcome to Global Culinary Alliance',
  MEMBER_INVITATION: 'Invitation to Join Association - Member Portal'
}

export const EMAIL_FIELDS = {
  USER_NAME: 'userName',
  USER_TYPE: 'userType', 
  EMAIL: 'email',
  OTP: 'otp',
  TEAM_NAME: 'teamName',
  EVENT_NAME: 'eventName',
  FULL_NAME: 'fullName',
  LANGUAGE: 'language',
  USER_TYPE_SELECT: 'type'
}
