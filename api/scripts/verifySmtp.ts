import 'dotenv/config';
import { verifySmtpConnection } from '../lib/membershipEmail';

verifySmtpConnection()
  .then(() => {
    console.log('SMTP connection verified. No email was sent.');
  })
  .catch((error: unknown) => {
    const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code
      : 'UNKNOWN';
    const message = code === 'EAUTH'
      ? 'SMTP server rejected authentication; check credentials and security mode.'
      : code === 'ECONNECTION' || code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ESOCKET'
        ? 'SMTP host or port could not be reached; check host, port, network access, and TLS mode.'
        : `SMTP verification failed (${code}). Check local SMTP settings.`;
    console.error(message);
    process.exitCode = 1;
  });