import { Router } from "express";
import { addSession , removeSession } from "../controllers/sessionController";
// import { checkFacebookFollow } from "../controllers/customers";

const router = Router();

router.post('/addSession', addSession);
router.post('/removeSession', removeSession);
// router.post('/checkFacebookFollow',checkFacebookFollow)

export default router;