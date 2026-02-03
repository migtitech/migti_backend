import sgMail from '@sendgrid/mail'
import process from 'node:process'
import { EMAIL_CONFIG, Message } from '../common/constant.js'
import logger from '../config/logger.js'

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export const sendMail = async (mail, html) => {
  try {
    // Check if email sending is enabled
    if (!EMAIL_CONFIG.enabled) {
      logger.info(`Email sending is disabled. Would have sent email to: ${mail}`)
      return
    }

    const msg = {
      from: EMAIL_CONFIG.from,
      to: mail,
      subject: 'Global Culinary Alliance',
      html,
    }

    await sgMail.send(msg)
    logger.info(`Email sent successfully to: ${mail}`)
  } catch (error) {
    logger.error('Error sending email via SendGrid:', error.response?.body || error)
  }
}
