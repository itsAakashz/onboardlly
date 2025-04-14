// File: src/app/api/sendTaskEmail/route.js

import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, title, description, dueDate, taskLink } = body;

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
      subject: `New Task Assigned: ${title}`,
      html: `
        <h2>You've been assigned a new task</h2>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Description:</strong> ${description}</p>
        <p><strong>Due Date:</strong> ${dueDate}</p>
        <p>Access the task dashboard: <a href="${taskLink}">${taskLink}</a></p>
        <p>Best of luck! ✅</p>
      `
    };

    await transporter.sendMail(mailOptions);

    return new Response(JSON.stringify({ message: 'Task email sent' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Email send error:', error);
    return new Response(JSON.stringify({ message: 'Failed to send email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
