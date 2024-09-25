import { Router } from "express";
import { userRegister, emailVerify, resendVerification, userLogin, verifyUser, forgotPasswordOTP, verifyOTP, resetPassword, checkUserByHandle, updateUser, userGet, getAllCommunityUser, getUserProfile, getStoreProducts} from "../controllers/userController";
import { authenticateUser } from "../middlewares/jwt";

const userRouter = Router();

userRouter.post('/register',userRegister)
userRouter.post("/email-verify", emailVerify);
userRouter.post("/resend-verification-token", resendVerification);
userRouter.post("/login", userLogin);
userRouter.post("/forgot-password", forgotPasswordOTP);
userRouter.post("/verifyotp", verifyOTP);
userRouter.post("/reset-password", resetPassword);
userRouter.post("/verifyUser", authenticateUser , verifyUser);
userRouter.get("/checkhandle", checkUserByHandle);

userRouter.post("/updateUser/:userId",authenticateUser, updateUser);
userRouter.get("/getUserById",authenticateUser, userGet );
userRouter.get("/communities-user/:communityId", authenticateUser, getAllCommunityUser);
userRouter.get("/profile/:userId", authenticateUser, getUserProfile);
userRouter.post("/get-store-products", authenticateUser, getStoreProducts)

export default userRouter;