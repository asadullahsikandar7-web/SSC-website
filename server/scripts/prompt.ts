import { stdin, stdout } from 'node:process';

// Reads a password from the terminal without echoing it.
export async function promptHidden(label: string) {
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
