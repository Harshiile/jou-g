import { sign, SignOptions, verify } from "jsonwebtoken";
import { JOUError } from "./error";

export const JwtValidate = <T>(token: string): T => {
  if (!process.env.JWT_SECRET) throw new JOUError(400, "Secret key not found");
  return verify(token, process.env.JWT_SECRET) as T;
};

export const JwtGenerate = (payload: object, expiry?: string) => {
  if (!process.env.JWT_SECRET) throw new JOUError(400, "Secret key not found");
  return sign(payload, process.env.JWT_SECRET, {
    expiresIn: expiry || "30d",
  } as SignOptions);
};
