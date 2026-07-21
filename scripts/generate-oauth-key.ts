import { generateKeyPairSync } from 'crypto';

const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
const escaped = pem.replace(/\n/g, '\\n');

console.log('Add this to your environment:');
console.log('');
console.log(`OAUTH_SIGNING_KEY="${escaped}"`);
console.log(`OAUTH_SIGNING_KID=fortmont_key`);
