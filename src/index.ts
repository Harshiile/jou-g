import express from "express";
import dotenv from "dotenv";
import { User } from "./types";
import { router } from "./routes/route";

declare global {
  namespace Express {
    export interface Request {
      user: User;
    }
  }
}
const app = express();
dotenv.config();
const PORT = process.env.PORT;

app.use(router);
app.listen(PORT, () => console.log(`Server runs on ${PORT}`));
