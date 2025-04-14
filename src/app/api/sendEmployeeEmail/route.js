import nodemailer from 'nodemailer';

export async function POST(req) {
  const { name, email, password, role, department, dashboardLink } = await req.json();

  if (!name || !email || !password || !role || !dashboardLink) {
    return new Response(JSON.stringify({ message: 'Missing required fields' }), { status: 400 });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to the Team!',
      html: `
        <h3>Hi ${name},</h3>
        <p>Welcome to the team! Here are your login details:</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Password:</strong> ${password}</li>
          <li><strong>Role:</strong> ${role}</li>
          ${department ? `<li><strong>Department:</strong> ${department}</li>` : ''}
        </ul>
        <p>You can log in to your dashboard here: <a href="${dashboardLink}" target="_blank">${dashboardLink}</a></p>
        <p>Regards,<br/>HR Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
    return new Response(JSON.stringify({ message: 'Email sent successfully!' }), { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ message: 'Failed to send email', error }), { status: 500 });
  }
}
