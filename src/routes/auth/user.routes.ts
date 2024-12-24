import Router from "express";
import { verifyJWT } from "@/middlewares/auth.middleware";
import { upload } from "@/middlewares/multer.middleware";
import {
  assignRole,
  changeCurrentPassword,
  forgotPasswordRequest,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendEmailVerification,
  resetForgottenPassword,
  updateUserAvatar,
  verifyEmail,
} from "@/controllers/auth/user.controllers";

const userRouter = Router();

// Unsecured routes
userRouter.route("/register").post(registerUser);
userRouter.route("/login").post(loginUser);
userRouter.route("/refresh-token").post(refreshAccessToken);
userRouter.route("/verify-email/:verificationToken").get(verifyEmail);
userRouter.route("/forgot-password").post(forgotPasswordRequest);
userRouter.route("/reset-password/:resetToken").post(resetForgottenPassword);

// secured routes
userRouter.route("/current-user").get(verifyJWT, getCurrentUser);
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/change-password").post(verifyJWT, changeCurrentPassword);
userRouter
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
userRouter
  .route("/resend-email-verification")
  .post(verifyJWT, resendEmailVerification);
userRouter.route("/assign-role/:userId").post(verifyJWT, assignRole);

export { userRouter };
