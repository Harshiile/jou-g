import { comparePass, generateTokens, userExist } from "./utils";
import { Request, Response } from "express";
import { APIResponse } from "../../types/res";
import { cookieOptions, JOUError } from "../utils";

type reqBody = {
  email: string;
  password: string;
};

export const loginAPI = async (
  req: Request<{}, {}, reqBody>,
  res: Response<APIResponse>
) => {
  const { email, password } = req.body;

  try {
    const user = await userExist(email);
    if (user) {
      if (await comparePass(user.password, password)) {
        const userData = {
          id: user.id,
          name: user.name,
          role: user.role,
        };
        const { refreshToken, accessToken } = generateTokens(userData);

        return res
          .cookie("auth", refreshToken, cookieOptions)
          .cookie("acsTkn", accessToken, cookieOptions)
          .json({
            message: "User Logged In",
            data: userData,
          });
      } else throw new JOUError(401, "Incorrect Password");
    }
    throw new JOUError(404, "User not Found");
  } catch {
    throw new JOUError(400, `${process.env.SERVER_ERROR_MESSAGE} - 1001`);
  }
};
