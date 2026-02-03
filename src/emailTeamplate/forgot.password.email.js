export const forgotPasswordEmail = (email, otp, userName = null, userType = 'user') => {
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Password Reset OTP - GCA</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8fafc;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    .header p {
      color: #ffffff;
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .welcome-title {
      font-size: 24px;
      color: #1e293b;
      margin: 0 0 20px 0;
      font-weight: 600;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: #64748b;
      margin: 0 0 25px 0;
    }
    .otp-container {
      background: linear-gradient(135deg, #fff7f0 0%, #ffebdc 100%);
      border: 2px solid #ff6b35;
      border-radius: 12px;
      padding: 30px;
      margin: 30px 0;
      text-align: center;
    }
    .otp-label {
      font-size: 14px;
      color: #64748b;
      margin: 0 0 15px 0;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .otp-code {
      font-size: 32px;
      font-weight: 700;
      color: #ff6b35;
      background: #ffffff;
      padding: 20px 30px;
      border-radius: 12px;
      border: 3px dashed #ff6b35;
      display: inline-block;
      letter-spacing: 8px;
      margin: 10px 0;
      box-shadow: 0 4px 20px rgba(255, 107, 53, 0.1);
    }
    .otp-instructions {
      margin: 20px 0 0 0;
      font-size: 14px;
      color: #64748b;
      line-height: 1.5;
    }
    .security-note {
      background-color: #fff7f0;
      border-left: 4px solid #ff6b35;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .security-note p {
      margin: 0;
      font-size: 14px;
      color: #d97316;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
      color: #ffffff;
      padding: 16px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      transition: all 0.3s ease;
      box-shadow: 0 4px 14px rgba(255, 107, 53, 0.3);
    }
    .cta-button:hover {
      background: linear-gradient(135deg, #ff8c42 0%, #ffa366 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
    }
    .expiry-info {
      background-color: #fff7f0;
      border-radius: 12px;
      padding: 25px;
      margin: 30px 0;
      border: 1px solid #ffebdc;
      text-align: center;
    }
    .expiry-info h3 {
      color: #1e293b;
      margin: 0 0 15px 0;
      font-size: 18px;
      font-weight: 600;
    }
    .expiry-info p {
      margin: 0;
      font-size: 14px;
      color: #64748b;
      line-height: 1.5;
    }
    .features {
      background-color: #fff7f0;
      border-radius: 12px;
      padding: 30px;
      margin: 30px 0;
      border: 1px solid #ffebdc;
    }
    .features h3 {
      color: #1e293b;
      margin: 0 0 20px 0;
      font-size: 20px;
      font-weight: 600;
    }
    .feature-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .feature-list li {
      display: flex;
      align-items: center;
      margin: 12px 0;
      font-size: 14px;
      color: #64748b;
    }
    .feature-list li::before {
      content: "✓";
      color: #ff6b35;
      font-weight: bold;
      margin-right: 12px;
      font-size: 16px;
    }
    .footer {
      background-color: #1e293b;
      color: #cbd5e1;
      padding: 30px;
      text-align: center;
    }
    .footer p {
      margin: 0 0 10px 0;
      font-size: 14px;
    }
    .footer a {
      color: #ff6b35;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .social-links {
      margin-top: 20px;
    }
    .social-links a {
      display: inline-block;
      width: 40px;
      height: 40px;
      background-color: #374151;
      color: #ffffff;
      border-radius: 50%;
      text-align: center;
      line-height: 40px;
      margin: 0 8px;
      text-decoration: none;
      font-size: 16px;
    }
    .social-links a:hover {
      background-color: #ff6b35;
    }
    .logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      display: block;
      max-width: 100%;
      height: auto;
    }
    
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
      .header, .content, .footer {
        padding: 20px !important;
      }
      .welcome-title {
        font-size: 20px !important;
      }
      .otp-code {
        font-size: 24px !important;
        letter-spacing: 4px !important;
        padding: 15px 20px !important;
      }
      .cta-button {
        width: 100%;
        text-align: center;
        box-sizing: border-box;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <img src="https://dev.gca.user.infosparkles.net/assets/logo-D2f_FqRI.png" alt="GCA Logo" class="logo">
      <h1>Password Reset Request</h1>
      <p>Secure OTP for your account recovery</p>
    </div>
    
    <!-- Main Content -->
    <div class="content">
      <h2 class="welcome-title">Hello ${userName || 'User'}!</h2>
      <p class="message">
        We received a request to reset your password for your <strong>${userType}</strong> account. 
        To verify your identity and proceed with the password reset, please use the OTP (One-Time Password) below.
      </p>
      
      <!-- OTP Code Section -->
      <div class="otp-container">
        <p class="otp-label">Your Security Code</p>
        <div class="otp-code">${otp}</div>
        <p class="otp-instructions">
          Enter this 6-digit verification code in the password reset form to continue.
        </p>
      </div>
      
      <!-- Expiry Information -->
      <div class="expiry-info">
        <h3>⏰ OTP Expiry Notice</h3>
        <p><strong>This code will expire in 15 minutes</strong> for your security. If you didn't request this password reset, please ignore this email.</p>
      </div>
      
      <!-- Security Features -->
      <div class="features">
        <h3>Security Features:</h3>
        <ul class="feature-list">
          <li>One-time password for secure verification</li>
          <li>Time-limited access (15-minute expiry)</li>
          <li>Secure encryption transmission</li>
          <li>Account activity logging</li>
          <li>Automatic deactivation after use</li>
          <li>Protected personal information</li>
        </ul>
      </div>
      
      <!-- Security Note -->
      <div class="security-note">
        <p><strong>Security Alert:</strong> If you didn't initiate this password reset, please contact our support team immediately. Do not share this OTP with anyone, including GCA staff.</p>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p><strong>Global Culinary Alliance</strong></p>
      <p>Secure account management for culinary professionals</p>
      <div style="margin: 20px 0;">
        <a href="mailto:support@gca.com">support@gca.com</a> | 
        <a href="#">Security Center</a> | 
        <a href="#">Contact Us</a>
      </div>
      <div class="social-links">
        <a href="#">📧</a>
        <a href="#">🌐</a>
        <a href="#">🔒</a>
      </div>
      <p style="margin-top: 20px; font-size: 12px; opacity: 0.7;">
        © 2024 Global Culinary Alliance. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`
}
