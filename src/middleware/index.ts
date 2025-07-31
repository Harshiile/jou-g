import { Request, Response, NextFunction } from "express";
import { JOUError, JwtValidate } from "../api/utils";
import { User } from "../types";

export const AuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken = req.cookies.get("acsTkn")?.value;
  const errMsg = "Please Login Again";
  const EXPIRED_CODE = Number(process.env.EXPIRED_CODE);

  if (!accessToken) {
    console.log("Access Token Undefined");
    throw new JOUError(EXPIRED_CODE, "Seesion Expired");
  } else {
    try {
      const userData = JwtValidate<User>(accessToken);
      // User Validated
      if (typeof userData == "string") throw new JOUError(401, errMsg);
      const user = {
        id: userData.id,
        name: userData.name,
        role: userData.role,
      };
      req.user = user;
      next();
    } catch (err) {
      if (err instanceof Error) {
        if (err.message == "JWTExpired") {
          // Access Token Expires
          console.log("Access Token Expires");
          throw new JOUError(EXPIRED_CODE, "Seesion Expired");
        } else {
          // Token Corrupted
          console.log("Access Token Corrupted");
          throw new JOUError(401, errMsg);
        }
      }
    }
  }
};
