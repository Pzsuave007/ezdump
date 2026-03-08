import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

export function generateToken() {
  return uuidv4();
}

export function verifyToken(token, storedToken) {
  return token === storedToken;
}
