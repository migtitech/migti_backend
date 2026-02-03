/**
 * Test script to verify email control functionality
 * This script tests both enabled and disabled email states
 */

import { EMAIL_CONFIG } from './src/core/common/constant.js'
import { sendMail } from './src/core/helpers/sendMail.js'
import { sendOTPEmail, sendEmailVerification } from './src/core/queue/emailQueue.js'

console.log('=== Email Control Test ===')
console.log('Current EMAIL_CONFIG:', EMAIL_CONFIG)
console.log('EMAIL_ENABLED environment variable:', process.env.EMAIL_ENABLED)
console.log('')

// Test 1: Check configuration
console.log('Test 1: Email Configuration')
console.log(`Email sending is ${EMAIL_CONFIG.enabled ? 'ENABLED' : 'DISABLED'}`)
console.log(`Email from address: ${EMAIL_CONFIG.from}`)
console.log('')

// Test 2: Test sendMail function
console.log('Test 2: Testing sendMail function')
const sendMailResult = await sendMail('test@example.com', '<h1>Test Email</h1>')
console.log('sendMail result:', sendMailResult)
console.log('')

// Test 3: Test sendOTPEmail function
console.log('Test 3: Testing sendOTPEmail function')
const otpResult = await sendOTPEmail('test@example.com', '123456', 'Test User', 'individual')
console.log('sendOTPEmail result:', otpResult)
console.log('')

// Test 4: Test sendEmailVerification function
console.log('Test 4: Testing sendEmailVerification function')
const verificationResult = await sendEmailVerification('Test User', 'test@example.com', 'test-token-123')
console.log('sendEmailVerification result:', verificationResult)
console.log('')

console.log('=== Test Complete ===')
console.log('')
console.log('To test with emails disabled, set EMAIL_ENABLED=false in your environment')
console.log('To test with emails enabled, set EMAIL_ENABLED=true or remove the variable (defaults to true)')
