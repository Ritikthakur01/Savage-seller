import { Router } from "express";
import { authenticateUser } from "../middlewares/jwt";
import { createPosts , getPosts, getPost, getCommunityPosts, likePost, savePostImages, commentPost, replyComment,getPostCreatedBy, deleteComment, deletePost, updatePost, editComment, getDraftPosts} from '../controllers/postController';

const postRouter = Router();

postRouter.post("/create-post", authenticateUser, createPosts);
postRouter.post("/save-post-images", authenticateUser, savePostImages);
postRouter.get("/get-posts", authenticateUser, getPosts);
postRouter.get("/get-post", authenticateUser, getPost);
postRouter.get("/:community_handle/posts", getCommunityPosts);
postRouter.post("/:postId/like", authenticateUser, likePost);
postRouter.post("/:postId/comment", authenticateUser, commentPost);
postRouter.delete("/:postId/delete-comment/:commentId", authenticateUser, deleteComment);

postRouter.post("/:postId/comment/:commentId/reply", authenticateUser, replyComment);
postRouter.get("/get-posts/:userId", authenticateUser, getPostCreatedBy);
postRouter.get("/get-draft-posts/:authorId", authenticateUser, getDraftPosts);

postRouter.delete("/delete-post/:postId", authenticateUser, deletePost);
postRouter.put("/update-post/:postId", authenticateUser, updatePost);
postRouter.put("/:postId/edit-comment/:commentId", authenticateUser, editComment);




export default postRouter;
