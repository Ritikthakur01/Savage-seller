import { Router } from "express";
import userRouter from './user.js';
import communityRouter from "./community.js";
import postRouter from "./post.js";
import followRouter from './follow.js'

const router = Router();

router.use('/user',userRouter)
router.use('/community',communityRouter)
router.use('/post',postRouter)
router.use('/follow',followRouter)


export default router;