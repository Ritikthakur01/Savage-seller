import crypto from "crypto";

const key = Buffer.from("12341234123412344321432143214321", "utf8");
const staticIV = Buffer.from("1234567887654321", "utf8");

export function encryptText(text) {
  const cipher = crypto.createCipheriv("aes-256-cbc", key, staticIV);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

// Function to decrypt encrypted text
export function decryptText(encryptedData) {
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, staticIV);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export const comparePasswords = (password, hashedPassword) => {
  const dPassword = decryptText(hashedPassword);
  return password === dPassword;
};