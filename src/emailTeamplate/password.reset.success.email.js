/**
 * Password Reset Success Email Template
 */
export const passwordResetSuccessEmail = (email, userName = null, userType = 'user') => ({
  to: email,
  subject: 'Password Reset Successful - GCA',
  html: `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
    xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <title>Password Reset Successful - GCA</title>
    <style>
        html,
        body {
            margin: 0;
            padding: 0;
            background-color: #f5f7fa;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
        }

        .header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            padding: 45px 30px;
            text-align: center;
        }

        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.3px;
        }

        .header p {
            color: #f0fff4;
            margin: 10px 0 0;
            font-size: 15px;
            font-weight: 400;
            opacity: 0.95;
        }

        .content {
            padding: 40px 35px;
            line-height: 1.7;
            text-align: center;
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

        .success-icon {
            margin-bottom: 30px;
        }

        .success-icon svg {
            width: 80px;
            height: 80px;
            display: block;
            margin: 0 auto;
        }

        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: #ffffff;
            padding: 16px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 14px rgba(40, 167, 69, 0.3);
        }

        .cta-button:hover {
            background: linear-gradient(135deg, #20c997 0%, #17a2b8 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
        }

        .security-note {
            background-color: #f0fff4;
            border-left: 4px solid #28a745;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }

        .security-note p {
            margin: 0;
            font-size: 14px;
            color: #155724;
        }

        .footer {
            background-color: #1e293b;
            color: #cbd5e1;
            padding: 35px 20px;
            text-align: center;
            border-top: 5px solid #28a745;
        }

        .footer p {
            font-size: 14px;
            margin: 6px 0;
        }

        .footer a {
            color: #20c997;
            text-decoration: none;
            font-weight: 500;
        }

        .footer a:hover {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
            }

            .header,
            .content,
            .footer {
                padding: 20px !important;
            }

            .welcome-title {
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
            <h1>Password Reset Successful</h1>
            <p>Your account is now secure</p>
        </div>

        <!-- Main Content -->
        <div class="content">
            <div class="success-icon">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="40" cy="40" r="40" fill="#28a745"/>
                    <path d="M25 40L35 50L55 30" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
            
            <h2 class="welcome-title">Hello ${userName || 'User'}!</h2>
            <p class="message">
                Great news! Your password has been successfully reset for your <strong>${userType}</strong> account.
                You can now log in with your new password and access all your account features.
            </p>

            <!-- CTA Button -->
            <div style="text-align: center;">
                <a href="https://dev.gca.user.infosparkles.net/login" target="_blank" class="cta-button">Login to Your Account</a>
            </div>

            <!-- Security Note -->
            <div class="security-note">
                <p><strong>Security Tip:</strong> For your account security, please keep your password confidential and consider using a password manager to generate and store strong, unique passwords.</p>
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
            <p style="margin-top: 20px; font-size: 12px; opacity: 0.7;">
                © 2024 Global Culinary Alliance. All rights reserved.
            </p>
        </div>
    </div>
</body>

</html>`
})

