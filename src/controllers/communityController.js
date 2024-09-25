import Community from "../models/community";
import User from "../models/user";
import transporter from "../config/nodemailer";
import { getSavageAppBaseURL } from "../utils/constants/filterBaseURL";
import uploadToCloudinary from "../utils/constants/uploadToCloudinary";
import multer from 'multer';
import path from 'path';
import { encryptText, decryptText, comparePasswords } from "../utils/constants/encrypt&decrypt";


const storage = multer.diskStorage({
  filename:(req,file,callback)=>{
      callback(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname))
  }
});

let upload = multer({
  storage: storage
})




export const saveCommunityImages = async (req, res)=>{
  try{

    const { shop, communityId } = req.query

    const existingRecord = await Community.findOne({ 'shop.shopName': shop , _id: communityId }).lean();

    upload.fields([
      { name: 'hero_img', maxCount: 1 },
      { name: 'cover_img', maxCount: 1 }
    ])(req, res, async (err) => {
      if (err) {
        console.error("Error uploading files:", err);
        return res.status(500).json({ message: "Error uploading files" });
      }

      let hero_imgURL;
      let cover_imgURL;
 
      if (req.files.hero_img) {
        const result = await uploadToCloudinary(req.files.hero_img[0].path);
        hero_imgURL = result.url;
      }

      if (req.files.cover_img) {
        const result = await uploadToCloudinary(req.files.cover_img[0].path);
        cover_imgURL = result.url;
      }

      if (existingRecord) {
        if (hero_imgURL) {
          await Community.findOneAndUpdate({ 'shop.shopName': shop , _id: communityId }, {
            hero_img : hero_imgURL
          },{
            new: true
          });
        }

        if (cover_imgURL) {
          await Community.findOneAndUpdate({ 'shop.shopName': shop , _id: communityId }, {
            cover_img : cover_imgURL
          }, {
            new: true
          });
        }
      } else {
        await Community.create({
          shop:{
            _id : req.shopId,
            shopName : shop
          },
          hero_img : hero_imgURL,
          cover_img : cover_imgURL
        });
      }

      return res.status(200).json({
        success: true,
        message: "Community Images uploaded successfully."
      });

    });

  }catch(err){
    console.log("Error to save Community Images :- ",err);
    return res.status(500).json({ 
      success: false,
      error: "Internal Server Error" 
    });
  }
}

export const createCommunity = async (req, res) => {
    const {
      shop,
      title,
      about,
      authorId,
      members,
      communityType,
      password, 
    } = req.body;
  
    if (!title || !about || !authorId || !members) {
      return res.status(200).json({
        error: "Title, about, community, authorId, and members are required",
      });
    }
  
    try {
      let hashedPassword = null;
  
      if (communityType === 'protected') {
        if (!password) {
          return res.status(200).json({ error: "Password is required for protected communities" });
        }
  
        hashedPassword = password ? encryptText(password) : null;
      }
  
      const baseHandle = title.toLowerCase().replace(/[^a-z0-9]/g, "-");
      let handle = baseHandle;
      let i = 1;
  
      while (true) {
        const existingCommunity = await Community.findOne({
          community_handle: handle,
        });
  
        if (!existingCommunity) {
          break;
        }
  
        handle = `${baseHandle}-${i}`;
        i++;
      }
  
      const authorUser = await User.findById(authorId).lean();
      if (!authorUser) {
        return res.status(200).json({ error: "Author not found" });
      }
      const authorUsername = authorUser.name;
      const authorUseremail = authorUser.email;
  
      const newCommunity = new Community({
        shop: {
          _id : req.shopId,
          shopName : shop
        },
        title,
        about,
        author: {
          _id: authorUser._id,
          username: authorUsername,
          useremail: authorUseremail,
        },
        members,
        communityType,
        community_handle: handle,
        passwords: hashedPassword,
      });
  
      const filteredMembers = members.filter(member => member._id !== authorUser._id);
      newCommunity.members = filteredMembers;
  
      const savedCommunity = await newCommunity.save();
      res.status(200).json({
        success: true,
        message: "Community created successfully",
        community: savedCommunity,
      });
    } catch (error) {
      console.error("Error creating community:", error);
      res.status(500).json({ 
        success: false,
        error: "Internal Server Error" 
      });
    }
  };

  export const getCommunities = async (req, res) => {
    try {
      const { limit = 12, pageNo = 1, by = "" } = req.query;
  
      const pageLimit = parseInt(limit, 10);
      const page = parseInt(pageNo, 10);
      const offset = pageLimit * (page - 1);
  
      let communities;
      let totalCount;
  
      if (by) {
        const searchQuery = {
          $or: [
            { 'shop.shopName': { $regex: by, $options: "i" } },
            { title: { $regex: by, $options: "i" } },
            { community_handle: { $regex: by, $options: "i" } },
            { communityType: { $regex: by, $options: "i" } },
            { 'author.username': { $regex: by, $options: "i" } },
          ],
        };
  
        communities = await Community.find(searchQuery)
          .skip(offset)
          .limit(pageLimit)
          .sort({ createdAt: -1 });
  
        totalCount = await Community.countDocuments(searchQuery);
      } else {
        communities = await Community.find()
          .skip(offset)
          .limit(pageLimit)
          .sort({ createdAt: -1 });
  
        totalCount = await Community.countDocuments();
      }
  
      res.status(200).json({
        success: true,
        message: "All communities fetched successfully.",
        totalCommunities: totalCount,
        totalCommunitiesInAPage: communities.length,
        communities,
      });
    } catch (error) {
      console.error("Error fetching communities:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  
  
  export const getPublicCommunities = async (req, res) => {
    try {
      const communities = await Community.find({
        communityType : 'public'
      }).sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        message: "All public communities fetched successfully.",
        communities
    });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  export const searchCommunity = async (req, res) => {
    try {

      const { limit , pageNo , by} = req.query;

      let pageLimit =  limit || 12;

      let page = pageNo || 1; 

      let offset = pageLimit * (page - 1);

      const response = await Community.find({
        $or: [
          { 'shop.shopName': { $regex: by, $options: "i" } },
          { title: { $regex: by, $options: "i" } },
          { community_handle: { $regex: by, $options: "i" } },
          { communityType: { $regex: by, $options: "i" } },
          { 'author.username': { $regex: by, $options: "i" } },
        ],
      }).skip(offset).limit(pageLimit).sort({ createdAt: -1 }); 

      if (response.length === 0) {
        return res.status(200).send({
          success: true,
          message: "Data Not Found",
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Searched Data Successfully",
        totalCommunities : totalCount,
        totalCommunitiesInAPage : response.length,
        communities : response
      });
    } catch (error) {

      console.log("errror",error)

      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  };


  // ========Join Community Request ========//
const generateJoinLink = (shop, community_handle, userIds, communityIds) => {

  const baseUrl = getSavageAppBaseURL(shop)

  let joinLink = `${baseUrl}/community/${community_handle}/actions/join/${userIds}/${communityIds}`

  return joinLink;
};  

async function sendJoinEmailToAuthor(authorEmail, username, email, joinLink, communityTitle) {
  try {

    let mailOptions = {
      from: email,
      to: authorEmail,
      subject: `${username} wants to join ${communityTitle}!`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>              
          <style>
          </style>
        </head>
        <body>
          <div class="container">
            <p>${username} (${email}) wants to join ${communityTitle}!</p>
            <p><a href="${joinLink}">Click here</a> to approve or deny the request.</p>
          </div>
        </body>
        </html>`,
    };

    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent to author: %s', info.messageId);
  } catch (error) {
    console.error('Error sending join email to author:', error);
    throw error;
  }
}

export const getCommunityById = async (req, res) => {
  const { communityId , shop } = req.query;

  try {
    const community = await Community.findOne({_id : communityId, 'shop.shopName': shop});

    if (!community) {
      return res.status(201).json({ error: "Community not found" });
    }

    const membersCount = community.members.length;
    res.status(200).json({
      success: true,
      community: community,
      members: membersCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getCommunityByHandle = async (req, res) => {
  const { community_handle, password } = req.body;

  try {
    const community = await Community.findOne({
      community_handle: community_handle
    });

    if (!community) {
      return res.status(200).json({ success: false, message: "Community Not Found" });
    }

    if (community.communityType === 'protected') {
      if (!password) {
        return res.status(200).json({ success: false, message: "Password is required for accessing Protected community" });
      }

      const passwordMatch = comparePasswords(password, community.passwords)

      if (!passwordMatch) {
        return res.status(200).json({ success: false, message: "Invalid password" });
      }
    }

    res.json({
      success: true,
      message: "Community retrieved successfully",
      community,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

async function sendInvitationEmail(username,email,inviteLink,communityTitle) {
  try {
    let mailOptions = {
      from: "ritik.bhadauria@ens.enterprises",
      to: email,
      subject: `You're Invited to ${communityTitle}!`,
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
                  <h3>Hi, ${username}</h3>

                  <p>You've been invited to join <b>${communityTitle}!</b></p>

                  <p>Click below to accept your invitation:</p><br/>

                  <p><a href="${inviteLink}" style="color: #fff; background-color: #007bff; padding: 5px 16px;">Join Now</a></p><br/>

                  <p>Questions? Email us at: <a href="mailto:support@savageseller.com">support@savageseller.com</a></p><br/>

                  <p>Welcome aboard!<br>- The Savage Seller Team</p>
              </div>
          </body>
          </html>`,
    };

    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);

  } catch (error) {
    console.error("Error sending invitation email:", error);
    throw error;
  }
}

export const sendInvite = async (req, res) => {
  try {
    const { email, communityId, shop } = req.body;
    const existingUser = await User.findOne({
      email: email,
    });
    const name = existingUser?.name;
    let userIds = existingUser?._id.toString();

    if (!existingUser) {
      return res.status(201).json({
        success: false,
        message: "User not found.",
      });
    }

    const community = await Community.findOne({
      _id : communityId,
      'shop.shopName' : shop
    }
    );
    let communityIds = community?._id.toString();
    let community_handle = community?.community_handle;
    const communityTitle = community?.title;

    if (!community) {
      return res.status(201).json({
        success: false,
        message: "Community not found.",
      });
    }

    const isMember = community.members.some(
      (member) => member._id.toString() === existingUser._id.toString() && member.status.toString() == "approved"
    );
    if (isMember) {
      return res.status(201).json({
        success: false,
        message: "User is already a member of the community.",
      });
    }

    let baseURL = getSavageAppBaseURL(existingUser.shop.shopName)

    const inviteLink = `${baseURL}/community/${community_handle}/actions/invite/${userIds}/${communityIds}`

    await sendInvitationEmail(name, email, inviteLink, communityTitle);

    community.members.push({
      _id: existingUser?._id,
      username: existingUser?.name,
      email: existingUser?.email,
      hero_image : existingUser?.hero_img,
      status: "pending"
    });
    await community.save();

    return res.status(200).json({
      success: true,
      message: "Invitation sent successfully.",
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const acceptInvite = async (req, res) => {
  try {
    const { userId, communityId , shop } = req.body;

    const user = await User.findOne({
      _id: userId,
      'shop.shopName': shop
    });

    if (!user) {
      return res.status(201).json({
        success: false,
        message: "User not found.",
      });
    }

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(201).json({
        success: false,
        message: "Community not found.",
      });
    }

    const invitedUser = community.members.find(
      (member) => member._id.toString() === user._id.toString() 
      && member.status.toString() == "pending"
    );

    if (!invitedUser) {
      return res.status(201).json({
        success: false,
        message: "Invitation not found",
      });
    }
    
    invitedUser.status = "approved";

    await community.save();

    const pendingRequestIndex = community.members.findIndex((member)=>{
      return member.status == "pending" && member._id.toString() === user._id.toString();
    });

    if(pendingRequestIndex !== -1){
      community.members.splice(pendingRequestIndex, 1);
      await community.save();
    }
    
    if (community.communityType == "protected") {
      const communityPassword = community.passwords;
      
      const password = decryptText(communityPassword);

      let mailOptions = {
        from: 'ritik.bhadauria@ens.enterprises',
        to: user.email,
        subject: 'Your Community Password',
        text: `You have been approved to join the community. Here is the password: ${password}`
      };

      let info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info.messageId);
    }



    return res.status(200).json({
      success: true,
      message: "Community invite approved successfully.",
    });
  } catch (error) {
    console.error("Error accepting community invite:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const sendJoinRequest = async (req, res) => {
  try {
    const { userId, communityId , shop} = req.body;

    const user = await User.findOne({_id : userId, 'shop.shopName' : shop});
    if (!user) {
      return res.status(200).json({
        success: false,
        message: 'User not found.',
      });
    }
    
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(200).json({
        success: false,
        message: 'Community not found.',
      });
    }

    const isMember = community.members.some(
      (member) => member._id.toString() === user._id.toString() && member.status.toString() == "approved"
    );

    if (isMember) {
      return res.status(200).json({
        success: false,
        message: 'User is already a member of the community.',
      });
    }

    // const isPending = community.members.some(
    //   (member) =>
    //     member._id.toString() === user._id.toString() &&
    //     member.status === 'pending'
    // );

    // if (isPending) {
    //   return res.status(200).json({
    //     success: false,
    //     message: 'User already has a pending request for this community.',
    //   });
    // }

    if (community.communityType === 'public') {
      community.members.push({
        _id: user._id,
        username: user.name,
        email: user.email,
        hero_image : user.hero_img,
        status: 'approved',
      });

      await community.save();

      return res.status(200).json({
        success: true,
        message: 'User joined the community successfully.',
      });
    }

    const authorId = community.author._id;
    const author = await User.findById(authorId);
    if (!author) {
      return res.status(202).json({
        success: false,
        message: 'Author not found.',
      });
    }

    const authorEmail = author.email;
    const joinLink = generateJoinLink(community.shop.shopName,community.community_handle, user._id, community._id);
    sendJoinEmailToAuthor(authorEmail, user.name, user.email, joinLink, community.title);

    community.members.push({
      _id: user._id,
      username: user.name,
      email: user.email,
      hero_image : user.hero_img,
      status: 'pending',
    });

    await community.save();

    return res.status(200).json({
      success: true,
      message: 'Join request sent successfully.',
    });
  } catch (error) {
    console.error('Error sending join request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

export const acceptJoinRequest = async (req, res) => {
  try {
    const { requestId, communityId, shop } = req.body;

    const community = await Community.findOne({_id : communityId , 'shop.shopName':shop});
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found.',
      });
    }

    const requestedUser = community.members.find(
      (member) => member._id.toString() === requestId && member.status == "pending"
    );

    if (!requestedUser) {
      return res.status(404).json({
        success: false,
        message: 'Requested user not found.',
      });
    }

    requestedUser.status = "approved";

    await community.save();

    const pendingRequestIndex = community.members.findIndex((member)=>{
      return member.status == "pending" && member._id.toString() === requestId;
    });

    if(pendingRequestIndex !== -1){
      community.members.splice(pendingRequestIndex, 1);
      await community.save(); 
    }

    return res.status(200).json({
      success: true,
      message: 'Join request approved successfully.',
    });
  } catch (error) {
    console.error('Error accepting join request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

export const removeCommunityMember = async (req, res) => {
  try {

    const { shop, communityId, userId } = req.body;

    const community = await Community.findOne({_id : communityId, 'shop.shopName' : shop});
    if (!community) {
      return res.status(201).json({ 
        success: false,
        message: "Community not found" 
      });
    }

    const memberIndex = community.members.findIndex(member => member._id.toString() === userId);
    if (memberIndex === -1) {
      return res.status(201).json({ 
        success: false,
        message: "User is not a member of this community" 
      });
    }
  
    community.members.splice(memberIndex, 1);
  
    await community.save();
  
    res.status(200).json({ 
      success: true,
      message: "Member removed from the community successfully" 
    });
  } catch (error) {
    console.error("Error removing member from community:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal Server Error" 
    });
  }
};

export const updateCommunity = async (req, res) => {
  try {
    const {
      shop,
      communityId,
      title,
      about,
      authorId,
      members,
      communityType,
      password,
    } = req.body;

    if (!title || !about || !authorId) {
      return res.status(400).json({
        error: "Title, about, author, and members are required",
      });
    }

    let hashedPassword = null;
    if (communityType === 'protected') {
      if (!password) {
        return res.status(400).json({ error: "Password is required for protected communities" });
      }
      hashedPassword = password ? encryptText(password, key) : null;
    }

    const baseHandle = title.toLowerCase().replace(/[^a-z0-9]/g, "-");
    let handle = baseHandle;
    let i = 1;

    while (true) {
      const existingCommunity = await Community.findOne({
        community_handle: handle,
        _id: { $ne: communityId },
        'shop.shopName' : shop
      });

      if (!existingCommunity) {
        break;
      }

      handle = `${baseHandle}-${i}`;
      i++;
    }

    const authorUser = await User.findById(authorId);
    if (!authorUser) {
      return res.status(400).json({ error: "Author not found" });
    }

    const update = {
      title,
      about,
      author: {
        _id: authorUser._id,
        username: authorUser.name,
        useremail: authorUser.email,
      },
      members: members.filter(member => member !== authorUser._id),
      communityType,
      community_handle: handle,
    };

    if (communityType === 'protected') {
      update.passwords = hashedPassword;
    }

    const updatedCommunity = await Community.findByIdAndUpdate(
      communityId,
      update,
      { new: true }
    );

    if (!updatedCommunity) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Community updated successfully",
      response: updatedCommunity,
    });
  } catch (error) {
    console.error("Error updating community:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


export const getUserCommunity = async (req, res) => {
  try {
    const userId = req.params.userId;
    const userCommunities = await Community.find({ 'members._id': userId });

    if (userCommunities.length === 0) {
      return res.status(201).json({
        success: true,
        message: 'User is not a member of any community',
      });
    }

    // Iterate through each community to count members
    const communitiesWithMemberCount = userCommunities.map(community => ({
      _id: community._id,
      title: community.title,
      community_handle: community.community_handle,
      about: community.about,
      hero_img: community.hero_img,
      cover_img: community.cover_img,
      community: community.community,
      communityType: community.communityType,
      author: community.author,
      membersCount: community.members.length
    }));

    res.status(200).json({
      success: true,
      message: 'User communities fetched successfully',
      communities: communitiesWithMemberCount
    });
  } catch (error) {
    console.error('Error fetching user communities:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error'
    });
  }
};


