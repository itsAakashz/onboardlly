import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, name, role, department } = body;

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
      subject: `Notice of Removal from Your Role at Onboardlly`,
      html: `
        <h2>Hi ${name},</h2>
        <p>We wanted to inform you that your role at <strong>Onboardlly</strong> has been discontinued.</p>
        <p><strong>Role:</strong> ${role}</p>
        ${department ? `<p><strong>Department:</strong> ${department}</p>` : ''}
        <p>If you have any questions or need clarification, please reach out to your manager or HR.</p>
        <p>Thank you for your contributions.</p>
        <br/>
        <p>Best regards,</p>
        <p>The Onboardlly Team</p>
      `
    };

    await transporter.sendMail(mailOptions);

    return new Response(JSON.stringify({ message: 'Employee removal email sent' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Email send error:', error);
    return new Response(JSON.stringify({ message: 'Failed to send removal email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
