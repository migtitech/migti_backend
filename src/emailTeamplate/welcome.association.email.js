export const associationWelcomeEmail = (associationName, contactPersonName, email) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Welcome to GCA</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: #ff6b35; padding: 30px; text-align: center; color: white; }
    .content { padding: 40px 30px; }
    .footer { background: #1e293b; color: #cbd5e1; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to GCA!</h1>
    </div>
    <div class="content">
      <h2>Hello ${contactPersonName || 'Partner'},</h2>
      <p>Welcome to the Global Culinary Alliance! We are thrilled to have <strong>${associationName}</strong> join our network.</p>
      <p>You can now access your dashboard to manage your association profile, connect with members, and explore our resources.</p>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <br>
      <p>Best regards,<br>The GCA Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 Global Culinary Alliance. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
}
