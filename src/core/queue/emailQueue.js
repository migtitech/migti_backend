import sgMail from '@sendgrid/mail'
import { forgotPasswordEmail } from '../../emailTeamplate/forgot.password.email.js'
import { associationWelcomeEmail } from '../../emailTeamplate/welcome.association.email.js'
import { enterpriseWelcomeEmail } from '../../emailTeamplate/welcome.enterprise.email.js'
import { individualWelcomeEmail } from '../../emailTeamplate/welcome.individual.email.js'
import { emailVerificationTemplate } from '../../emailTeamplate/email.verification.js'
import { EMAIL_CONFIG, Message } from '../common/constant.js'
import logger from '../config/logger.js'

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// Email queue to store pending emails
const emailQueue = []
let isProcessingQueue = false

const sendEmail = async (mailOptions) => {
  try {
    // Check if email sending is enabled
    if (!EMAIL_CONFIG.enabled) {
      logger.info(`Email sending is disabled. Would have sent email to: ${mailOptions.to} with subject: ${mailOptions.subject}`)
      return
    }

    if (!mailOptions.from) {
      mailOptions.from = EMAIL_CONFIG.from
    }
    
    logger.info('Sending email via SendGrid:', mailOptions.to, mailOptions.subject)
    
    // SendGrid message format
    const msg = {
      to: mailOptions.to,
      from: mailOptions.from,
      subject: mailOptions.subject,
      html: mailOptions.html,
    }
    
    const response = await sgMail.send(msg)
    logger.info('Email sent successfully via SendGrid:', response[0].statusCode)
  } catch (error) {
    logger.error('Error sending email via SendGrid:', error.response?.body || error.message)
  }
}

const processEmailQueue = async () => {
  if (isProcessingQueue || emailQueue.length === 0) {
    return
  }
  
  isProcessingQueue = true
  
  // If email sending is disabled, clear the queue and log the action
  if (!EMAIL_CONFIG.enabled) {
    const queueLength = emailQueue.length
    emailQueue.length = 0 // Clear the queue
    logger.info(`Email sending is disabled. Cleared ${queueLength} emails from queue.`)
    isProcessingQueue = false
    return
  }
  
  logger.info(`Processing ${emailQueue.length} emails from queue...`)
  
  while (emailQueue.length > 0) {
    const mailOptions = emailQueue.shift()
    try {
      await sendEmail(mailOptions)
    } catch (error) {
      logger.error('Failed to process email from queue:', error)
    }
  }
  
  isProcessingQueue = false
  logger.info('Email queue processing completed')
}

const sendOTPEmail = async (email, otp, userName = null, userType = 'user') => {
  try {
    // Check if email sending is enabled
    if (!EMAIL_CONFIG.enabled) {
      logger.info(`Email sending is disabled. Would have sent OTP email to: ${email}`)
      return { status: false, message: Message.emailDisabled, disabled: true }
    }

    const mailOptions = {
      from: EMAIL_CONFIG.from,
      to: email,
      subject: 'Password Reset OTP - GCA',
      html: forgotPasswordEmail(email, otp, userName, userType)
    }
    
    emailQueue.push(mailOptions)
    logger.info(`OTP email added to queue for ${email}. Queue length: ${emailQueue.length}`)
    
    setImmediate(() => {
      processEmailQueue().catch(error => {
        logger.error('Error in queue processing:', error)
      })
    })
    
    return { status: true, queued: true, queueLength: emailQueue.length, message: Message.emailQueuedSuccessfully }
  } catch (error) {
    logger.error('Error adding OTP email to queue:', error)
    return { status: false, error: error.message }
  }
}

const sendPasswordResetSuccessEmail = async (email, userName = null, userType = 'user') => {
  try {
    // Check if email sending is enabled
    if (!EMAIL_CONFIG.enabled) {
      logger.info(`Email sending is disabled. Would have sent password reset success email to: ${email}`)
      return { status: false, message: Message.emailDisabled, disabled: true }
    }

    const mailOptions = {
      from: EMAIL_CONFIG.from,
      to: email,
      subject: 'Password Reset Successful - GCA',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h2 style="color: #28a745; margin-bottom: 20px;">Password Reset Successful</h2>
            <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
              Hello ${userName || 'User'},
            </p>
            <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
              Your password has been successfully reset for your ${userType} account. You can now log in with your new password.
            </p>
          </div>
        </div>
      `
    }
    
    // Add email to queue instead of sending immediately
    emailQueue.push(mailOptions)
    logger.info(`Password reset success email added to queue for ${email}. Queue length: ${emailQueue.length}`)
    
    // Process queue asynchronously (non-blocking)
    setImmediate(() => {
      processEmailQueue().catch(error => {
        logger.error('Error in queue processing:', error)
      })
    })
    
    return { status: true, queued: true, queueLength: emailQueue.length, message: Message.emailQueuedSuccessfully }
  } catch (error) {
    logger.error('Error adding password reset success email to queue:', error)
    return { status: false, error: error.message }
  }
}

const sendAssociationWelcomeEmail = async (associationName, contactPersonName, email) => {
  try {
    // Check if email sending is enabled
    if (!EMAIL_CONFIG.enabled) {
      logger.info(`Email sending is disabled. Would have sent association welcome email to: ${email}`)
      return { status: false, message: Message.emailDisabled, disabled: true }
    }

    const mailOptions = {
      from: EMAIL_CONFIG.from,
      to: email,
      subject: `Welcome to GCA - ${associationName}`,
      html: associationWelcomeEmail(associationName, contactPersonName, email)
    }
    
    // Add email to queue instead of sending immediately
    emailQueue.push(mailOptions)
    logger.info(`Association welcome email added to queue for ${email}. Queue length: ${emailQueue.length}`)
    
    // Process queue asynchronously (non-blocking)
    setImmediate(() => {
      processEmailQueue().catch(error => {
        logger.error('Error in queue processing:', error)
      })
    })
    
    return { status: true, queued: true, queueLength: emailQueue.length, message: Message.emailQueuedSuccessfully }
  } catch (error) {
    logger.error('Error adding association welcome email to queue:', error)
    return { status: false, error: error.message }
  }
}

const sendEnterpriseWelcomeEmail = async (enterpriseName, contactPersonName, email) => {
  try {
    // Check if email sending is enabled
    if (!EMAIL_CONFIG.enabled) {
      logger.info(`Email sending is disabled. Would have sent enterprise welcome email to: ${email}`)
      return { status: false, message: Message.emailDisabled, disabled: true }
    }

    const mailOptions = {
      from: EMAIL_CONFIG.from,
      to: email,
      subject: `Welcome to GCA - ${enterpriseName}`,
      html: enterpriseWelcomeEmail(enterpriseName, contactPersonName, email)
    }
    
    // Add email to queue instead of sending immediately
    emailQueue.push(mailOptions)
    logger.info(`Enterprise welcome email added to queue for ${email}. Queue length: ${emailQueue.length}`)
    
    // Process queue asynchronously (non-blocking)
    setImmediate(() => {
      processEmailQueue().catch(error => {
        logger.error('Error in queue processing:', error)
      })
    })
    
    return { status: true, queued: true, queueLength: emailQueue.length, message: Message.emailQueuedSuccessfully }
  } catch (error) {
    logger.error('Error adding enterprise welcome email to queue:', error)
    return { status: false, error: error.message }
  }
}

const sendIndividualWelcomeEmail = async (name, email) => {
  try {
    // Check if email sending is enabled
    if (!EMAIL_CONFIG.enabled) {
      logger.info(`Email sending is disabled. Would have sent individual welcome email to: ${email}`)
      return { status: false, message: Message.emailDisabled, disabled: true }
    }

    const mailOptions = {
      from: EMAIL_CONFIG.from,
      to: email,
      subject: `Welcome to GCA - ${name}`,
      html: individualWelcomeEmail(name, email)
    }
    
    // Add email to queue instead of sending immediately
    emailQueue.push(mailOptions)
    logger.info(`Individual welcome email added to queue for ${email}. Queue length: ${emailQueue.length}`)
    
    // Process queue asynchronously (non-blocking)
    setImmediate(() => {
      processEmailQueue().catch(error => {
        logger.error('Error in queue processing:', error)
      })
    })
    
    return { status: true, queued: true, queueLength: emailQueue.length, message: Message.emailQueuedSuccessfully }
  } catch (error) {
    logger.error('Error adding individual welcome email to queue:', error)
    return { status: false, error: error.message }
  }
}

const sendEmailVerification = async (name, email, verificationToken) => {
  try {
    // Check if email sending is enabled
    if (!EMAIL_CONFIG.enabled) {
      logger.info(`Email sending is disabled. Would have sent email verification to: ${email}`)
      return { status: false, message: Message.emailDisabled, disabled: true }
    }

    const mailOptions = {
      from: EMAIL_CONFIG.from,
      to: email,
      subject: 'Verify Your Email - GCA',
      html: emailVerificationTemplate(name, verificationToken)
    }
    
    // Add email to queue instead of sending immediately
    emailQueue.push(mailOptions)
    logger.info(`Email verification added to queue for ${email}. Queue length: ${emailQueue.length}`)
    
    // Process queue asynchronously (non-blocking)
    setImmediate(() => {
      processEmailQueue().catch(error => {
        logger.error('Error in queue processing:', error)
      })
    })
    
    return { status: true, queued: true, queueLength: emailQueue.length, message: Message.emailQueuedSuccessfully }
  } catch (error) {
    logger.error('Error adding email verification to queue:', error)
    return { status: false, error: error.message }
  }
}

const sendMailToUser = async (mailOptions) => {
  try {
    // Check if email sending is enabled
    if (!EMAIL_CONFIG.enabled) {
      logger.info(`Email sending is disabled. Would have sent email to: ${mailOptions.to || 'unknown'}`)
      return { status: false, message: Message.emailDisabled, disabled: true }
    }

    // Add email to queue instead of sending immediately
    emailQueue.push(mailOptions)
    logger.info(`Email added to queue. Queue length: ${emailQueue.length}`)
    
    // Process queue asynchronously (non-blocking)
    setImmediate(() => {
      processEmailQueue().catch(error => {
        logger.error('Error in queue processing:', error)
      })
    })
    
    // Return immediately - don't wait for email to be sent
    return { status: true, queued: true, queueLength: emailQueue.length, message: Message.emailQueuedSuccessfully }
  } catch (error) {
    logger.error('Error adding email to queue:', error)
    return { status: false, error: error.message }
  }
}

// Helper function for sending emails with simple parameters
const sendEmailSimple = async (to, subject, html) => {
  const mailOptions = {
    from: EMAIL_CONFIG.from,
    to,
    subject,
    html
  }
  return sendMailToUser(mailOptions)
}

const startEmailQueue = async () => {
  const status = EMAIL_CONFIG.enabled ? 'enabled' : 'disabled'
  logger.info(`Email queue started successfully. Email sending is ${status}.`)
  return true
}

const stopEmailQueue = async () => {
  logger.info('Email sender stopped')
  return true
}

export { 
  startEmailQueue, 
  stopEmailQueue, 
  sendMailToUser, 
  sendOTPEmail, 
  sendPasswordResetSuccessEmail,
  sendAssociationWelcomeEmail,
  sendEnterpriseWelcomeEmail,
  sendIndividualWelcomeEmail,
  sendEmailVerification,
  sendEmailSimple as sendEmail
}