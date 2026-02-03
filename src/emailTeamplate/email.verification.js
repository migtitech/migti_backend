export const emailVerificationTemplate = (name, verificationToken) => {
  const verificationLink = `https://dev.gca.user.infosparkles.net/verifyemail?verifytoken=${encodeURIComponent(verificationToken)}`

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Verify Your Email - GCA</title>
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
    .logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      display: block;
      max-width: 100%;
      height: auto;
    }
    .content {
      padding: 40px 30px;
    }
    .verification-title {
      font-size: 24px;
      color: #1e293b;
      margin: 0 0 20px 0;
      font-weight: 600;
      text-align: center;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: #64748b;
      margin: 0 0 25px 0;
      text-align: center;
    }
    .verification-box {
      background-color: #fff7f0;
      border-radius: 12px;
      padding: 30px;
      margin: 30px 0;
      text-align: center;
      border: 2px solid #ffebdc;
    }
    .verification-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
      color: #ffffff !important;
      padding: 16px 40px;
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
    .security-note {
      background-color: #fff7ed;
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
    .alternate-link {
      background-color: #f1f5f9;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      word-break: break-all;
    }
    .alternate-link p {
      margin: 0 0 10px 0;
      font-size: 13px;
      color: #64748b;
    }
    .alternate-link a {
      color: #ff6b35;
      font-size: 12px;
      word-break: break-all;
    }
    .expiry-note {
      text-align: center;
      font-size: 14px;
      color: #94a3b8;
      margin: 20px 0;
    }
    
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
      .header, .content, .footer {
        padding: 20px !important;
      }
      .verification-title {
        font-size: 20px !important;
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
      <h1>Email Verification</h1>
      <p>Confirm your email address to get started</p>
    </div>
    
    <!-- Main Content -->
    <div class="content">
      <h2 class="verification-title">Welcome, ${name}!</h2>
      <p class="message">
        Thank you for registering with the Global Culinary Alliance. 
        We're excited to have you join our community!
      </p>
      
      <p class="message">
        To complete your registration and start exploring all the features, 
        please verify your email address by clicking the button below.
      </p>
      
      <!-- Verification Box -->
      <div class="verification-box">
        <div class="verification-icon">✉️</div>
        <p class="message" style="margin-bottom: 20px;">
          <strong>One more step to get started!</strong>
        </p>
        <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto;">
          <tr>
            <td align="center" bgcolor="#ff6b35" style="border-radius:8px;">
              <a href="${verificationLink}" target="_blank"
                style="font-size:16px; font-weight:600; color:#ffffff; text-decoration:none; 
                padding:16px 40px; display:inline-block; border-radius:8px; 
                background:linear-gradient(135deg,#ff6b35 0%,#ff8c42 100%);
                box-shadow:0 4px 14px rgba(255,107,53,0.3);">
                Verify My Email
              </a>
            </td>
          </tr>
        </table>
        <p class="expiry-note">This link will expire in 24 hours</p>
      </div>
      
      <!-- Alternate Link -->
      <div class="alternate-link">
        <p><strong>Button not working?</strong></p>
        <p>Copy and paste this link into your browser:</p>
        <a href="${verificationLink}" target="_blank">${verificationLink}</a>
      </div>
      
      <!-- Security Note -->
      <div class="security-note">
        <p><strong>Security Notice:</strong> If you didn't create an account with GCA, please ignore this email. Your email address will not be used without verification.</p>
      </div>
      
      <p class="message">
        Once verified, you'll have full access to:
      </p>
      <ul style="color: #64748b; font-size: 14px; line-height: 1.8;">
        <li>Exclusive culinary learning materials</li>
        <li>Global competitions and events</li>
        <li>Professional networking opportunities</li>
        <li>Team collaboration features</li>
        <li>And much more!</li>
      </ul>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p><strong>Global Culinary Alliance</strong></p>
      <p>Building connections across the culinary world</p>
      <div style="margin: 20px 0;">
        <a href="mailto:support@gca.com">support@gca.com</a> | 
        <a href="#">Privacy Policy</a> | 
        <a href="#">Terms of Service</a>
      </div>
      <p style="margin-top: 20px; font-size: 12px; opacity: 0.7;">
        © 2024 Global Culinary Alliance. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`
}
