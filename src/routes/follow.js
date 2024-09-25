import { Router } from "express";
import { authenticateUser } from "../middlewares/jwt.js";

import { sendFollowRequest, acceptFollowRequest, getFriendRequest, declineFriendRequest, getFollowing, getFollowers, blockFriend, unblockFriend, getBlackList, unFriend } from "../controllers/followController.js";

const followRouter = Router();

followRouter.post("/send-follow-request", authenticateUser, sendFollowRequest);
followRouter.delete('/unfriend', authenticateUser, unFriend);
followRouter.get("/get-follow-requests/:receiverId",authenticateUser,getFriendRequest);
followRouter.post("/accept-follow-request", authenticateUser, acceptFollowRequest);
followRouter.post("/decline-follow-request", authenticateUser, declineFriendRequest);
followRouter.get('/following/:userId', authenticateUser, getFollowing);
followRouter.get('/followers/:userId', authenticateUser, getFollowers);
followRouter.get('/block-friend', authenticateUser, blockFriend);
followRouter.get('/unblock-friend', authenticateUser, unblockFriend);
followRouter.get('/getBlackList/:userId', authenticateUser, getBlackList);




export default followRouter;