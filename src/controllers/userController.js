import User from "../models/user";
import axios from "axios";
import { generateRandomToken } from "../utils/constants/generateRandomToken";
import emailVerification from "../models/emailVerification";
import transporter from "../config/nodemailer";
import bcrypt from 'bcrypt';
import { generateToken } from "../middlewares/jwt";
import { getSavageAppBaseURL } from "../utils/constants/filterBaseURL";
import Community from "../models/community";
import Post from "../models/post";
import friendModels from '../models/follow';
const { Friend, FriendRequest } = friendModels;
import shopModel from "../models/shopDetail";


const sendVerificationEmail = async (name, email, userId, token, url) => {
    try {

      await transporter.sendMail({
        from: "ritik.bhadauria@ens.enterprises",
        to: email,
        subject: "Verify Your Account",
        html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>              
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 2;
                        margin: 0;
                        padding: 0;
                        background-color: #f8f8f8;
                    }
                    .container {
                        max-width: 600px;
                        padding: 20px;
                    }
                    h1, p {
                        margin: 0;
                        padding: 0;
                    }
                    a {
                        color: #007bff;
                        text-decoration: none;
                        border-radius: 5px;
                        display: inline-block;
                    }
                    a:hover {
                        color: #37b7f1;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h3>Hi, ${name}</h3>
  
                    <p>Welcome to savageseller.com! To get started,</p>
  
                    <p>please verify your email address by clicking the link below:</p><br/>
  
                    <p><a href="${url}/verifyemail/${userId}/${token}" style="color: #fff; background-color: #007bff; padding: 5px 16px;">Verify Now</a></p><br/>
  
                    <p>This link will expire when you used it. If you didn’t create an account with us, you can safely ignore this email.</p>
  
                    <p>Thank you for joining us!</p><br>
                    
                    <p>Best Regards,<br>- The Savage Seller Team</p>
  
                </div>
            </body>
            </html>`,
      });
  
      console.log("Verification email sent successfully");
    } catch (error) {
      console.error("Failed to send verification email:", error);
    }
  };

export const userRegister = async (req, res) => {
    try {
      const {
        shop,
        dob,
        firstname,
        lastname,
        organization,
        email,
        phone,
        designation,
        location,
        userHandle,
        password,
        accountType,
        hero_img,
        cover_img,
      } = req.body;

      const modifiedName = `${firstname} ${lastname}`;
      const existingUser = await User.findOne({ email });
  
      if (existingUser) {
        return res.status(201).json({
          success: false,
          message: "Email is already registered.",
        });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const token = generateRandomToken();
  
      const shopifyExistingCustomerResponse = await axios.get(
        `https://${shop}/admin/api/2024-04/customers/search.json?query=email:${email}`,
        {
          headers: {
            "X-Shopify-Access-Token": req.shopifyAccessToken,
          },
        }
      );
  
      const shopifyCustomersWithEmail = shopifyExistingCustomerResponse.data.customers;
      const shopifyExistingEmailCustomer = shopifyCustomersWithEmail.find(
        (customer) => customer.email === email
      );
  
      if (shopifyExistingEmailCustomer) {
        return res.status(200).json({
          success: false,
          message: "Customer already exists with this email.",
        });
      }
  
      const shopifyExistingCustomerResponseByPhone = await axios.get(
        `https://${shop}/admin/api/2024-04/customers.json?query=phone:${phone}`,
        {
          headers: {
            "X-Shopify-Access-Token": req.shopifyAccessToken,
          },
        }
      );
  
      const shopifyCustomersWithPhone = shopifyExistingCustomerResponseByPhone.data.customers;
      const existingCustomerByPhone = shopifyCustomersWithPhone.find(
        (customer) => customer.phone === phone
      );
  
      if (existingCustomerByPhone) {
        console.log(
          "Existing customer(s) with the provided phone number:",
          existingCustomerByPhone
        );
  
        return res.status(200).json({
          success: false,
          message: "Customer already exists with this phone number. Please login.",
        });
      }

      try {
        const response = await axios.post(
          `https://${shop}/admin/api/2024-04/customers.json`,
          {
            customer: {
              first_name: firstname,
              last_name: lastname,
              email: email,
              verified_email: true,
              send_email_welcome: true,
              accepts_marketing: true,
              phone: phone,
              // Note: omitting the 'note', 'password', 'password_confirmation', 'tags' fields if they are empty
              addresses: [
                {
                  first_name: firstname,
                  last_name: lastname, 
                  country: "United States"
                },
              ],
            },
          },
          {
            headers: {
              "X-Shopify-Access-Token": req.shopifyAccessToken,
            },
          }
        );
        console.log(response.data);
      } catch (error) {
        if (error.response) {
          console.log(error.response.data); // Detailed error information from Shopify
        } else {
          console.log(error.message);
        }
      }
  
      const newUser = new User({
        shop: {
          _id : req.shopId,
          shopName : shop
        },
        name: modifiedName,
        dob,
        firstname,
        lastname,
        organization,
        email,
        phone,
        designation,
        location,
        userHandle,
        hero_img,
        cover_img,
        password: hashedPassword,
        accountType,
        verifyToken: token,
      });
  
      await newUser.save();

      const baseUrl = getSavageAppBaseURL(shop);

      await sendVerificationEmail(newUser.name, newUser.email, newUser._id, token, baseUrl);
  
      const verification = new emailVerification({
        userId: newUser._id,
        token,
      });

      await verification.save();
  
      res.status(201).json({
        success: true,
        message: "User registered successfully!",
      });
    } catch (error) {
        console.log("Eroror", error)
      res.status(500).json({
        success: false,
        message: "Failed to register user.",
        error: error.message,
      });
    }
  };

  export const emailVerify = async (req, res) => {
    try {
      const { userId, token } = req.body;
      const verification = await emailVerification.findOne({ userId, token });
  
      if (!verification) {
        return res.status(201).json({
          success: false,
          message: "Verification record not found or invalid token",
        });
      }
      const user = await User.findById(userId);
      if (!user) {
        return res.status(201).json({
          success: false,
          message: "User not found",
        });
      }

      user.verifyEmail = true;
      await user.save();
  
      await verification.deleteOne();
  
      res.status(200).json({
        success: true,
        message: "User verified successfully",
      });
    } catch (error) {
      res.status(201).json({
        success: false,
        message: "Failed to verify user.",
        error: error.message,
      });
    }
  };
  
export const resendVerification = async (req, res) => {
  try {
    const { email, shop } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(201).json({
        success: false,
        message: "User not found.",
      });
    }
    const newToken = generateRandomToken();
    user.verifyToken = newToken;
    await user.save();

    const baseUrl = getSavageAppBaseURL(shop)

    const verificationEntry = new emailVerification({
      userId: user._id,
      token: newToken,
    });
    await verificationEntry.save();
    await sendVerificationEmail(user.name, user.email, user._id, newToken, baseUrl);

    return res.status(200).json({
      success: true,
      message: "Verification token resent successfully.",
    });
  } catch (error) {
    console.error("Failed to resend verification token:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to resend verification token.",
      error: error.message,
    });
  }
};

const comparePasswords = async (candidatePassword, userPassword) => {
  return await bcrypt.compare(candidatePassword, userPassword);
};

export const userLogin = async (req, res) => {
  try {
    const { email, password } = await req.body;
    const user = await User.findOne({ email: email });
    if (user) {
      const isPasswordValid = await comparePasswords(password, user.password);
      if (isPasswordValid) {
        if (user.verifyEmail) {
          
          const token = generateToken(user._id, email, user.userHandle);
          
          return res.status(201).send({
            success: true,
            emailVerify: true,
            token: token,
          });

        } else {
          res.status(201).send({
            success: false,
            emailVerify: false,
            message: "User email is not verified.",
          });
        }
      } else {
        res.status(201).send({
          success: false,
          message: "Invalid password.",
        });
      }
    } else {
      res.status(201).send({
        success: false,
        message: "User not found.",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to login.",
      error: error.message,
    });
  }
};

export const verifyUser = async (req, res) => {
  try {
    const requser = await req.user;
    const { email, password } = requser;
    
    const user = await User.findOne({
      email: email,
      password: password,
    }).select("-password -__v");

    if (user !== null) {
      res.status(200).json({
        success: true,
        message: "User login successful",
        user: user,
      });
    } else {
      res.status(201).json({
        success: false,
        message: "User not found",
        user: {},
      });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

const generateOTP = function () {
  return Math.floor(100000 + Math.random() * 900000);
};


export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).lean();

    const getOtpTime = user.forgetPasswordOTPTimeStampAt;

    if(user.forgetPasswordOTP!==otp){
      return res.status(404).json({
        success: false,
        message: "Invaild OTP...!"
      })
    }

    if (new Date().getTime() > new Date(new Date(getOtpTime).getTime() +  5 * 60 * 1000).getTime()){
      return res.status(401).json({
        success: false,
        message: "Time expired for OTP verification...!"
      });
    }

    return res.json({
      success: true,
      message: "OTP verified successfully",
      verified: true,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP.",
      error: error.message,
    });
  }
};

export const forgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(201).json({
        success: false,
        message: "User not found",
      });
    }

    const c_Date = new Date()

    console.log(c_Date)

    const otp = generateOTP();

    const updatedUser = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          forgetPasswordOTPTimeStampAt: c_Date,
          forgetPasswordOTP: otp
        }
      },
      { new: true }
    );

    const mailOptions = {
      from: "ritik.bhadauria@ens.enterprises",
      to: email,
      subject: "OTP Verification for Password Reset",
      html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <style>
                  body {
                      font-family: Arial, sans-serif;
                      line-height: 2;
                      margin: 0;
                      padding: 0;
                      background-color: #f8f8f8;
                  }
                  .container {
                      max-width: 600px;
                      padding: 20px;
                  }
                  h1, p {
                      margin: 0;
                      padding: 0;
                  }
                  a {
                      color: #007bff;
                      text-decoration: none;
                      border-radius: 5px;
                      display: inline-block;
                  }
                  a:hover {
                      color: #37b7f1;
                  }
                  .otp-box {
                    width: fit-content;
                    border: 1px solid #ccc;
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 10px;
                    font-weight: bold;
                    font-size: 24px;
                }
              </style>
          </head>
          <body>
              <div class="container">
                  <h3>Hi, ${updatedUser.name}</h3>

                  <p>We've received a request to reset your password.</p>
                  <p>If you initiated this request, please use the following OTP within 5 minutes:</p><br/>

                  <div class="otp-box">${updatedUser.forgetPasswordOTP}</div><br/>

                  <p>If you didn't request this, kindly ignore this message.</p>
                  <p>For assistance, reach us at support@savageseller.com.</p><br>
                  <p>Best,</p>
                  <p>The Savage Seller Team</p>

              </div>
          </body>
          </html>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("OTP sent successfully");
    res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP.",
      error: error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(201).json({
        success: false,
        message: "User not found",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password.",
      error: error.message,
    });
  }
};

export const checkUserByHandle = async (req, res) => {
  try {
    const { userHandle } = req.query;

    const existingUser = await User.findOne({ userHandle });

    if (existingUser) {
      return res.status(200).json({
        success: true,
        userfound: true,
        userHandle: "Not Available",
        message: "User found.",
      });
    }
    return res.status(200).json({
      success: true,
      userfound: false,
      userHandle: "Available.",
      message: "User!",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to check user.",
      error: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { shop , ...rest } = req.body;

    const user = await User.findOne({
      _id: userId,
      'shop.shopName': shop
    })

    if (!user) {
      return res.status(201).json({
        success: false,
        message: "User not found",
      });
    }

    Object.keys(rest).forEach((key) => {
      user[key] = rest[key];
    });

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      response: updatedUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

export const userGet = async (req, res) => {
  try {
    const { userId,shop } = req.query;

    const user = await User.findOne({ _id : userId , 'shop.shopName' : shop });

    if (!user) {
      return res.status(201).json({
        success: false,
        message: "User not found.",
      });
    } 
    res.status(200).json({
      success: true,
      message: "User Get Successfully",
      response: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};


export const getAllCommunityUser = async (req, res) => {
  try {
    const communityId = req.params.communityId;
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(200).json({
        success: false,
        message: "Community not found",
      });
    }

    const approvedUserIds = community.members
      .filter((user) => user.status === 'approved')
      .map((user) => user._id);

    if (!approvedUserIds || approvedUserIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No approved users found in this community",
      });
    }

    const usersWithDetails = await User.find(
      { _id: { $in: approvedUserIds } },
      {
        name: 1,
        dob: 1,
        email: 1,
        phone: 1,
        userHandle: 1,
        hero_img: 1,
        cover_img: 1,
        designation: 1,
        location: 1,
      }
    );

    if (!usersWithDetails || usersWithDetails.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No approved users found in this community",
      });
    }

    res.status(200).json({
      success: true,
      data: usersWithDetails,
    });
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId;

    const userPromise = User.findById(userId, {
      name: 1,
      dob: 1,
      firstname: 1,
      lastname: 1,
      email: 1,
      location: 1,
      userHandle: 1,
      verifyUser: 1,
      verifyEmail: 1,
      status: 1,
      hero_img: 1,
      cover_img: 1,
      accountType: 1,
      _id: 1,
    });

    const postsPromise = Post.find({ "createdby._id": userId });

    const followingPromise = Friend.countDocuments({ friendId: userId, status: "Active" });
    const followersPromise = Friend.countDocuments({ userId: userId, status: "Active" });
    const followingRequest = FriendRequest.countDocuments({ receiverId: userId, status: "pending" });
    const followersRequest = FriendRequest.countDocuments({ senderId: userId, status: "pending" });

    const [user, posts, followingCount, followersCount] = await Promise.all([
      userPromise,
      postsPromise,
      followingPromise,
      followersPromise,
      followingRequest,
      followersRequest,
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: user,
      posts: posts,
      postCount: posts.length,
      followingCount: followingCount,
      followersCount: followersCount
    });
  } catch (error) {
    console.error("Error retrieving user profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getStoreProducts = async (req, res) => {
  try{

    const { userId , shop } = req.body;

    const shopDetails = await shopModel.findOne({
      shop: shop
    })

    if(!shopDetails){
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      }) 
    }

    const isUserExist = await User.findOne({
      _id: userId,
      "shop.shopName" : shop
    });

    if(!isUserExist){
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    const getStoreProducts = await axios.get(`https://${isUserExist.shop.shopName}/admin/api/2024-04/products.json`,{
      headers: {
        "X-Shopify-Access-Token": shopDetails.accessToken
      }
  })

  if(!getStoreProducts){
    return res.status(400).json({
      success: false,
      message: "Failed to retrieve products",
    })
  }

    return res.status(200).json({
      success : true,
      message : 'Store Products fetched successfully.',
      data : getStoreProducts
    })

  }catch(err){
    console.error("Error retrieving Store product:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}


