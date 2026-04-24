const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendContactEmail({ to, from, name, email, message }) {
  await resend.emails.send({
    from: from || 'noreply@blogtool.app',
    to,
    subject: `New contact message from ${name}`,
    html: `<p><strong>Name:</strong> ${name}</p>
           <p><strong>Email:</strong> ${email}</p>
           <p><strong>Message:</strong></p>
           <p>${message}</p>`,
  });
}

module.exports = { sendContactEmail };
