import express from "express";
import bodyParser from 'body-parser';
import cookieParser from "cookie-parser";
import cors from 'cors';
import connectDb from './src/utils/db/connection.js';
import router from './src/routes/index.js';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { checkAuth } from "./src/middlewares/checkAuth.js";
import sessionRouter from './src/routes/auth.js'
// import webhookRouter from './src/routes/webhook.js';
import { config } from "./src/utils/config/index.js";
import Community from "./src/models/community.js";
import User from "./src/models/user.js";
import Post from "./src/models/post.js";

dotenv.config()
connectDb()

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser())
app.use(cors())
app.use(morgan('dev'));

app.use('/auth', sessionRouter)
// app.use('/webhooks',webhookRouter)

app.get("/search", async (req, res) => {
  try {
    const searchQuery = req.query.by;
    if (!searchQuery) {
      return res.status(400).json({ success: false, error: "Search query is missing" });
    }

    const communityResults = await Community.find({
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { community_handle: { $regex: searchQuery, $options: 'i' } },
        { 'author.name': { $regex: searchQuery, $options: 'i' } },
      ]
    });

    const postResults = await Post.find({
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { post_handle: { $regex: searchQuery, $options: 'i' } },
        { content: { $regex: searchQuery, $options: 'i' } },
      ]
    });

    const userResults = await User.find({
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { 'shop.shopName' : { $regex: searchQuery, $options: 'i' } },
        { firstname: { $regex: searchQuery, $options: 'i' } },
        { lastname: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { phone: isNaN(searchQuery) ? 0 : parseInt(searchQuery) },
        { designation: { $regex: searchQuery, $options: 'i' } },
        { organization: { $regex: searchQuery, $options: 'i' } },
        { userHandle: { $regex: searchQuery, $options: 'i' } },
      ]
      
    });

    const results = {
      communities: communityResults,
      posts: postResults,
      users: userResults
    };

    res.status(200).json({
      success: true,
      message: "Search completed successfully",
      data: results
    });
  } catch (error) {
    console.error("Error in universal search:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

app.use('/',checkAuth ,router);

app.get("/server", (req, res) => {
  res.sendFile(__dirname + '/javascript/script.js');
});

const appPort = config.port || 3000;
app.listen(appPort, () => {
  console.log(`server is running on http://localhost:${appPort}`);
});