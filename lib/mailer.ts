import nodemailer from "nodemailer";

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  // DEV: log to console
  if (process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY && !process.env.SMTP_HOST) {
    console.log("\n--- DEV EMAIL ---");
    console.log("To:", opts.to);
    console.log("Subject:", opts.subject);
    console.log("HTML:\n", opts.html);
    console.log("-----------------\n");
    return;
  }

  // Option A: Resend
  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY!);
    await resend.emails.send({
      from: "Landhunt <no-reply@landhunt.app>",
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return;
  }

  // Option B: SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
  });
  await transporter.sendMail({
    from: "Landhunt <no-reply@landhunt.app>",
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}
