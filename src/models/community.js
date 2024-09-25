import mongoose from "mongoose";

const communitySchema = new mongoose.Schema({
  shop: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'shopModel' },
    shopName: String
  },
  title: String,
  community_handle: String,
  about: String,
  hero_img: String,
  cover_img: String,
  communityType:{
    type: String,
    enum: ["public", "private", "protected"],
    default: "public",
  },
  passwords:{
    type: String,
    default: null,
  },
  author: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    useremail: String,
  },
  members: [{
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    email: String,
    accountType: {
      type: String,
      enum: ["user", "admin", "subadmin"],
      default: "user",
    },
    hero_image: String,
    status:{
      type: String,
      enum: ["pending", "approved", "rejected"],
    },
    createdAt: { type: Date, default: Date.now },
  }],
},
{
  timestamps: true,
}
);

const Community = mongoose.model("Community", communitySchema);

export default Community;