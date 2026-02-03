export const individualWelcomeEmail = (name, email) => {
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
      <h2>Hello ${name || 'User'},</h2>
      <p>Welcome to the Global Culinary Alliance!</p>
      <p>We are delighted to have you as a member. Explore courses, competitions, and connect with fellow culinary enthusiasts. </p>
      <br>
      <p>Happy Cooking!<br>The GCA Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 Global Culinary Alliance. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
}
