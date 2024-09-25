import crypto from 'crypto';

export const generateRandomToken = () => {
    return crypto.randomBytes(20).toString("hex");
  };