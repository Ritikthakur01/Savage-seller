import mongoose from "mongoose";
import User from "./user";

const friendSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
      required: true,
    },
    friendId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    hero_img:{
        type: String,
        required: true,
        default: "https://i.ibb.co/z4z4z4z/default-avatar.png"
    },
    status: {
      type: String,
      enum: ["Active","Block"],
      default: "Active"
    }
  },
  {
    timestamps: true,
  }
);

const friendRequestSchema = new mongoose.Schema(
    {
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "accepted", "declined"],
        default: "pending",
      },
    },
    {
      timestamps: true,
    }
  );

const Friend = mongoose.model("Friend", friendSchema);
const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);

export default { Friend, FriendRequest };
