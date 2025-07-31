import { JwtGenerate } from "../../utils/jwt";
import { User } from "../../../types/user";

export const generateTokens = (userData: User) => {
  const accessToken = JwtGenerate(userData, process.env.ACCESS_TOKEN_EXPIRY!);
  const refreshToken = JwtGenerate(
    { id: userData.id },
    process.env.REFRESH_TOKEN_EXPIRY!
  );
  return { accessToken, refreshToken };
};
