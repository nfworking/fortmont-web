import crypto from "crypto";

function getKey(): Buffer {
  const rawKey = process.env.MAILBOX_ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error("MAILBOX_ENCRYPTION_KEY is required for mailbox encryption");
  }

  const key = Buffer.from(rawKey, "hex");
  if (key.length !== 32) {
    throw new Error("MAILBOX_ENCRYPTION_KEY must be a 32-byte hex key");
  }

  return key;
}

export function encrypt(text: string) {
  const key = getKey();
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decrypt(data: string) {
  const key = getKey();
  const buffer = Buffer.from(data, "base64");

  const iv = buffer.subarray(0, 12);
  const authTag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);

  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}