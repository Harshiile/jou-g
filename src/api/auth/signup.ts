import { JOUError, cookieOptions } from "../utils";
import { userExist, encryptPass, generateTokens } from "./utils";
import { Request, Response } from "express";
import { User, APIResponse } from "../../types";
import { v4 } from "uuid";
import { db } from "../../db";
import { UserTable } from "../../db/schema";

type reqBody = {
  email: string;
  password: string;
} & User;

export const signUpAPI = async (
  req: Request<{}, {}, reqBody>,
  res: Response<APIResponse>
) => {
  const { email, password, name, role } = req.body;

  try {
    const user = await userExist(email);
    if (!user) {
      const hashPassword = await encryptPass(password);
      const id = v4();
      const userData = {
        id,
        name,
        role,
      };
      const { refreshToken, accessToken } = generateTokens(userData);

      await db
        .insert(UserTable)
        .values({
          id,
          name,
          email,
          password: hashPassword,
          role,
        })
        .catch((_) => {
          throw new JOUError(400, `${process.env.SERVER_ERROR_MESSAGE} - 1002`);
        });

      return res
        .cookie("auth", refreshToken, cookieOptions)
        .cookie("acsTkn", accessToken, cookieOptions)
        .json({
          message: "User Logged In",
          data: userData,
        });
    } else throw new JOUError(409, "User Already Exist");
  } catch {
    throw new JOUError(400, `${process.env.SERVER_ERROR_MESSAGE} - 1001`);
  }
};
