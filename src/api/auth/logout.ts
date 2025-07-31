import { APIResponse } from "../../types";
import { Request, Response } from "express";

export const logoutAPI = async (req: Request, res: Response<APIResponse>) => {
  return res.clearCookie("acsTkn").clearCookie("auth").json({
    message: "Logout !!",
  });
};
