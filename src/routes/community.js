import { Router } from "express";
import { authenticateUser } from "../middlewares/jwt.js";
import {
  getCommunities,
  createCommunity,
  getPublicCommunities,
  searchCommunity,
  sendJoinRequest,
  saveCommunityImages,
  getCommunityById,
  getCommunityByHandle,
  sendInvite,
  acceptInvite,
  acceptJoinRequest,
  removeCommunityMember,
  updateCommunity,
  getUserCommunity
} from "../controllers/communityController.js";

const communityRouter = Router();

communityRouter.post("/create-community", authenticateUser, createCommunity);
communityRouter.post("/save-community-image",authenticateUser, saveCommunityImages);

communityRouter.get("/getPublicCommunities", getPublicCommunities);
communityRouter.get("/getAllCommunities",authenticateUser, getCommunities);
communityRouter.get("/getCommunityById", authenticateUser, getCommunityById);
communityRouter.post("/getCommunityByHandle", authenticateUser, getCommunityByHandle);

communityRouter.post("/send-invite", authenticateUser, sendInvite);
communityRouter.post("/accept-invite", acceptInvite);
communityRouter.get("/searchCommunity",authenticateUser, searchCommunity);
communityRouter.post("/send-join-request",authenticateUser, sendJoinRequest);
communityRouter.post("/accept-join-request", acceptJoinRequest);

communityRouter.delete("/remove-community-member", authenticateUser, removeCommunityMember);
communityRouter.put("/update-community", authenticateUser, updateCommunity);

communityRouter.get("/user-communities/:userId", authenticateUser, getUserCommunity);


export default communityRouter;