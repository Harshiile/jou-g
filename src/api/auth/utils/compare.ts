import { hash, compare } from "bcrypt";

const SaltRounds = 5;

export const encryptPass = (pass: string) => hash(pass, SaltRounds);

export const comparePass = (hashedPass: string, textPass: string) =>
  compare(textPass, hashedPass);
