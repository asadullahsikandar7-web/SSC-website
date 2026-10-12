import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { connectDatabase, disconnectDatabase } from '../lib/db.js';
import { hashPassword } from '../lib/auth.js';
import { User } from '../models/User.js';

async function promptHidden(label: string) {
  if (!stdin.isTTY || !stdin.setRawMode) {
    throw new Error('Run this command in an interactive terminal so the password can be entered securely.');
  }

  stdout.write(label);
  stdin.setRawMode(true);
  stdin.resume();

  return new Promise<string>((resolve, reject) => {
    let value = '';
    const onData = (input: Buffer) => {
      const key = input.toString();
      if (key === '\u0003') {
        stdin.setRawMode(false);
        stdin.off('data', onData);
        reject(new Error('Admin creation cancelled.'));
        return;
      }
      if (key === '\r' || key === '\n') {
        stdin.setRawMode(false);
        stdin.off('data', onData);
        stdout.write('\n');
        resolve(value);
        return;
      }
      if (key === '\u007f' || key === '\b') {
        value = value.slice(0, -1);
        stdout.write('\b \b');
        return;
      }
      if (key >= ' ') {
        value += key;
        stdout.write('*');
      }
    };

    stdin.on('data', onData);
  });
}

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
