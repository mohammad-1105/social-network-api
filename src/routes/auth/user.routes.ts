import Router from "express";
import { registerUser } from "@/controllers/auth/user.controllers";

const userRouter = Router();

userRouter.route("/register").post(registerUser)


export { userRouter }