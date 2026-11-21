import "server-only";

export type MailMessage = { to: string; subject: string; text: string };

/**
 * Mail transport. Plug a provider (Resend, Postmark, SES, SMTP…) into `deliver` for production.
 * Without one configured, messages are written to the server log so flows like password reset
 * remain testable in development.
 */
async function deliver(message: MailMessage) {
  console.info(`\n[mail] To: ${message.to}\n[mail] Subject: ${message.subject}\n${message.text}\n`);
}

export async function sendMail(message: MailMessage) {
  try {
    await deliver(message);
  } catch (error) {
    console.error("[mail] delivery failed", error);
  }
}
