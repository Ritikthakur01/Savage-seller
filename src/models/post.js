import mongoose from 'mongoose';
import Community from './community';
import User from './user';

const postSchema = new mongoose.Schema(
    {
        title : String,
        post_handle : String,
        content : String,
        buyNowUrl : String,
        community : {
            _id: { type: mongoose.Schema.Types.ObjectId, ref: Community },
            title: String,
            community_handle: String
        },
        createdby: {
            _id: { type: mongoose.Schema.Types.ObjectId, ref: User },
            username: String,
        },
        likes: {
          count: { type: Number, default: 0 },
          likedBy: [
            {
              _id: { type: mongoose.Schema.Types.ObjectId, ref: User },
              username: String,
              createdAt: { type: Date, default: Date.now },
            },
          ],
        },
        comments : {
          commentCount: { type: Number, default: 0 },
          commentsAndReplies : [
            {
              text: String,
              commentAuthor: {
                _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                username: String,
              },
              createdAt: { type: Date, default: Date.now },
              replies: [
                {
                  text: String,
                  replyAuthor: {
                    _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                    username: String,
                  },
                  createdAt: { type: Date, default: Date.now },
                },
              ],
            },
          ]
        },
        shares: {
          count: { type: Number, default: 0 },
          sharedBy: [
            {
              _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
              username: String,
              createdAt: { type: Date, default: Date.now },
            },
          ],
        },
        images: [
          {
            url: {
              type: String,
              default: null,
            }
          }
        ],
        status: {
          type: Number,
          enum: [ 1, 0 ],
          default: 1,
        },
      },
    {
    timestamps: true,
    }
)

const Post = mongoose.model("Post", postSchema);

export default Post;