import friendModels from '../models/follow';
import User from '../models/user';
const { Friend, FriendRequest } = friendModels;


export const sendFollowRequest = async (req, res) => {

    try {
        const { senderId, receiverId } = req.body;

        if (!senderId || !receiverId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide sender and receiver id'
            });
        }

        const isUserReceiverExist = await User.findOne({
            _id : receiverId
        })
        
        if(!isUserReceiverExist){
            return res.status(400).json({
                success: false,
                message: 'Receiver not found'
            });
        }

        const isRequestExist = await FriendRequest.findOne({
            senderId,
            receiverId,
            status : 'pending'
        })

        if(isRequestExist){
            return res.status(400).json({
                success: false,
                message: 'Request already sent'
            });
        }

        const followRequest = await FriendRequest.create({
            senderId,
            receiverId
        })

        if (!followRequest) {
            return res.json(400).status({
                success: false,
                message: "Friend Request not sent."
            })
        }

        return res.status(200).json({
            success: true,
            message: "Friend Request sent successfully.",
            followRequest
        })
    }catch (err) {
        console.log("Error on sending follow request", err)
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: err.message
        })
    }
}

export const getFriendRequest = async (req, res) => {
    try {
        const { receiverId } = req.params;
        const friendRequests = await FriendRequest.find({ receiverId, status: "pending" });

        if (!friendRequests || friendRequests.length === 0) {
            return res.status(201).json({
                success: true,
                message: "Friend requests not found",
            });
        }

        const friendRequestsData = await Promise.all(
            friendRequests.map(async (request) => {
                const sender = await User.findById(request.senderId);
                console.log(">>>>44", sender)
                return {
                    senderId: sender._id,
                    senderUsername: sender.name,
                    senderEmail: sender.email,
                    status: request.status,
                    createdAt: request.createdAt,
                    profileimage: sender.hero_img
                };
            })
        );

        res.json({
            success: true,
            message: "Pending friend requests retrieved successfully",
            response: friendRequestsData,
        });
    } catch (error) {
        console.error("Error getting friend request:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


export const acceptFollowRequest = async (req, res) => {

    try {
        const { senderId, receiverId } = req.body

        const followRequest = await FriendRequest.findOne({
            senderId,
            receiverId,
            status: 'pending'
        })

        if (!followRequest) {
            return res.status(400).json({
                success: false,
                message: "Follow Request not found.",
            })
        }

        followRequest.status = "accepted";

        await followRequest.save();

        const findFriend = await User.findOne({
            _id: senderId
        }).lean();

        if (!findFriend) {
            return res.status(201).json({
              success: false,
              message: "Sender not found",
            });
          }

        const createFriend = await Friend.create({
            userId: receiverId,
            friendId: senderId,
            username: findFriend.userHandle,
            email: findFriend.email,
            hero_img: findFriend.hero_img
        })

        if (!createFriend) {
            return res.status(400).json({
                success: false,
                message: "Error on creating friend."
            })
        }

        await FriendRequest.findOneAndDelete({
            senderId,
            receiverId,
            status: 'accepted'
        })

        return res.status(200).json({
            success: true,
            message: "Follow Request accepted successfully.",
            followRequest
        })

    } catch (err) {
        console.log("Error on accepting follow request", err)
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: err.message
        })
    }
}


export const declineFriendRequest = async (req, res) => {
    try {
      const { senderId, receiverId } = req.body;
      const friendRequest = await FriendRequest.findOne({ senderId, receiverId, status : "pending" });
      if (!friendRequest) {
        return res.status(201).json({
          success: false,
          message: "Friend request not found",
        });
      }
      friendRequest.status = "declined";
      await friendRequest.save();
  
      await FriendRequest.deleteOne({ senderId, receiverId });
  
      res.status(200).json({
        success: true,
        message: "Friend request declined successfully",
      });
    } catch (error) {
      console.error("Error declining friend request:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  export const getFollowing = async (req, res) => {
    try {
      const { userId } = req.params;
      const following = await Friend.find({ friendId: userId, status: "Active" });
  
      if (!following || following.length === 0) {
        return res.status(201).json({
          success: true,
          message: "No following found",
        });
      }
  
      const followingData = await Promise.all(
        following.map(async (follow) => {
          const user = await User.findById(follow.userId);
          return {
            userId: user._id,
            username: user.name,
            email: user.email,
            hero_img: user.hero_img,
            status: follow.status,
            createdAt: follow.createdAt,
          };
        })
      );
  
      res.json({
        success: true,
        message: "Following retrieved successfully",
        following: followingData,
      });
    } catch (error) {
      console.error("Error getting following:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  export const getFollowers = async (req, res) => {
    try {
      const { userId } = req.params;
      const follower = await Friend.find({ userId: userId, status: "Active" });
  
      if (!follower || follower.length === 0) {
        return res.status(201).json({
          success: true,
          message: "User does not follow anyone",
        });
      }
  
      const followerData = await Promise.all(
        follower.map(async (follower) => {
          const user = await User.findById(follower.friendId);
          return {
            userId: user._id,
            username: user.name,
            email: user.email,
            hero_img: user.hero_img,
            status: follower.status,
            createdAt: follower.createdAt,
          };
        })
      );
  
      res.json({
        success: true,
        message: "Follower retrieved successfully",
        follower: followerData,
      });
    } catch (error) {
      console.error("Error getting follower:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  export const blockFriend = async (req, res)=>{
    try{

      const { friendId, userId } = req.body;

      const setBlockFriend = await Friend.findOneAndUpdate({
        userId,
        friendId,
        status : "Active"
        },
        {
        status: "Blocked"
        },
        {
          new: true
        }
      )

      if(!setBlockFriend){
        return res.status(404).json({
          success: false,
          message: "Friend not found to Block",
          });
      }

      return res.status(200).json({
        success: true,
        message: "Friend blocked successfully",
        friend : setBlockFriend
      })
      
    }catch(err){
      console.error("Block Friend :", err);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  export const unblockFriend = async (req, res)=>{
    try{

      const { friendId, userId } = req.body;

      const setUnblockFriend = await Friend.findOneAndUpdate({
        userId,
        friendId,
        status: "Blocked"
        },
        {
        status: "Active"
        },
        {
          new: true
        }
      )

      if(!setUnblockFriend){
        return res.status(404).json({
          success: false,
          message: "Friend not found to unblock",
          });
      }

      return res.status(200).json({
        success: true,
        message: "Friend unblocked successfully",
        friend : setUnblockFriend
      })
      
    }catch(err){
      console.error("Block Friend :", err);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  export const getBlackList = async (req, res)=>{
    try{  
      const userId = req.params.userId;
      const blacklist = await Friend.find({userId, status: "Blocked"}).populate("friendId");

      return res.status(200).json({
        success: true,
        message: "Blacklist retrieved successfully",
        blacklist
        })
        
    }catch(err){
      console.error("Get Black List", err)
      return res.status(500).json({
        success : false,
        message : "Internal server error."
      })
    }
  }

  export const unFriend = async (req, res) => {
    try {
      const { userId, friendId } = req.body;
      const friend = await Friend.findOne({ userId, friendId, status : "Active" });
      if (!friend) {
        return res.status(201).json({
          success: false,
          message: "Friend not found",
        });
      }
      await friend.deleteOne();
      res.status(200).json({
        success: true,
        message: "Friend removed successfully",
      });
    } catch (error) {
      console.error("Error removing friend:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };