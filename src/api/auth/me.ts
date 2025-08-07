import { Request, Response } from "express";
import { APIResponse } from "../../types/res";

export const loginAPI = async (req: Request, res: Response<APIResponse>) => {
  return res.json({ message: "User Details", data: { user: req.user } });
};
