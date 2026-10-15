import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { connectDatabase, disconnectDatabase } from '../lib/db.js';
import { hashPassword } from '../lib/auth.js';
import { Session } from '../models/Session.js';
import { User } from '../models/User.js';
import { promptHidden } from './prompt.js';

async function main() {
  const readline = createInterface({ input: stdin, output: stdout });
  const email = (await readline.question('Account email: ')).trim().toLowerCase();
  readline.close();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address.');
  }

  const password = await promptHidden('New password (minimum 12 characters): ');
  if (password.length < 12) {
    throw new Error('Use a password with at least 12 characters.');
  }
  const confirmation = await promptHidden('Repeat the new password: ');
  if (confirmation !== password) {
    throw new Error('The passwords do not match; no changes were made.');
  }

  await connectDatabase();
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('No account uses that email; no changes were made.');
  }

  await User.updateOne({ _id: user._id }, { $set: { passwordHash: await hashPassword(password), isActive: true } });
  // Sign the account out everywhere so the old password cannot keep a session alive.
  const { deletedCount } = await Session.deleteMany({ userId: user._id });
  stdout.write(`Password updated for ${email} (${user.role}). Signed out of ${deletedCount} active session(s).\n`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Password reset failed.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
