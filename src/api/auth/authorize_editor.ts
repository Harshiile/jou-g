import { Request, Response } from "express";
import { APIResponse } from "../../types/res";
import { JOUError, JwtGenerate, JwtValidate } from "../utils";

export interface AuthorizeEditor {
  editor: {
    id: string;
    mail: string;
    name: string;
  };
  workspace: {
    id: string;
    name: string;
    avatar: string;
    username: string;
  };
}

export const authorizeEditorLinkAPI = async (
  req: Request<{}, {}, AuthorizeEditor>,
  res: Response<APIResponse>
) => {
  const data = req.body;

  return res.json({
    message: "Editor Authorization Link",
    data: {
      url: `${process.env.PRODUCT_URL}/authorize-editor/${JwtGenerate(data)}`,
    },
  });
};

export const authorizeEditorValidateAPI = async (
  req: Request,
  res: Response<APIResponse>
) => {
  const { searchParams } = new URL(req.url);
  const link = searchParams.get("link");

  if (!link) throw new JOUError(404, "Link not found");
  try {
    const decryptData = await JwtValidate<AuthorizeEditor>(link);
    return res.json({ message: "Validate Data", data: decryptData });
  } catch (err) {
    if (err instanceof Error) {
      if (err.name == "TokenExpiredError")
        throw new JOUError(401, "Link is expires");
    } else throw new JOUError(400, "Link is not valid");
  }
};
