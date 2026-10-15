import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { connectDatabase, disconnectDatabase } from '../lib/db.js';
import { hashPassword } from '../lib/auth.js';
import { promptHidden } from './prompt.js';
import { User } from '../models/User.js';

async function main() {
  const readline = createInterface({ input: stdin, output: stdout });
  const email = (await readline.question('Admin email: ')).trim().toLowerCase();
  readline.close();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address.');
  }

  const password = await promptHidden('Admin password (minimum 12 characters): ');
  if (password.length < 12) {
    throw new Error('Use a password with at least 12 characters.');
  }

  await connectDatabase();
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('An account with that email already exists; no changes were made.');
  }

  await User.create({ email, passwordHash: await hashPassword(password), role: 'admin', isActive: true });
  stdout.write(`Admin account created for ${email}.\n`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Admin account creation failed.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
