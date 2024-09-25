import mongoose from "mongoose";
import shopModel from "./shopDetail";

const userSchema = new mongoose.Schema({
  shop: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'shopModel' },
    shopName: String
  },
  name: String,
  dob: String,
  firstname: String,
  lastname: String,
  organization: String,
  email: { 
    type: String, 
    unique: true 
  },
  phone: String,
  bio: String,
  designation: String,
  location: String,
  userHandle: {
    type: String, 
    unique: true 
  },
  password: String,
  verifyUser:{
    type:Boolean,
    default:false
  },
  verifyEmail:{
     type:Boolean,
     default:false
  },
  forgetPasswordOTP:{
    type:String
  },
  forgetPasswordOTPTimeStampAt:{
    type: Date
  },
  hero_img: {
    type: String,
    default: "http://res.cloudinary.com/dfb3mk0bc/image/upload/v1721387270/uploads/jyrho11iadbqq9oxvqmk.png",
  },
  cover_img: {
    type: String,
    default: "https://community.savageseller.com/assets/communityBanner.png",
  },
  communities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Community' }],
  products:{
    type: Array,
    default: []
  },
  wishlists:{
    type: Array,
    default: []
  },
},
{
  timestamps: true,
});

const User = mongoose.model("user", userSchema);

export default User;
