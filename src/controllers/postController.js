import User from '../models/user';
import Community from '../models/community';
import Post from '../models/post';
import multer from 'multer';
import path from "path";
import uploadToCloudinary from '../utils/constants/uploadToCloudinary';
import { text } from 'body-parser';


const storage = multer.diskStorage({
  filename:(req,file,callback)=>{
      callback(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname))
  }
});

let upload = multer({
  storage: storage
})

export const savePostImages = async (req, res)=>{
  try{

    const { postId } = req.query

    const existingRecord = await Post.findOne({ _id: postId }).lean();

    upload.fields([
      { name: 'post_img', maxCount: 5 }
    ])(req, res, async (err) => {
      if (err) {
        console.error("Error uploading files:", err);
        return res.status(500).json({ message: "Error while uploading files" });
      }

      let post_imgURLs;

      if (req.files.post_img) {
        post_imgURLs = await Promise.all(req.files.post_img.map(async(file) => {
          const result = await uploadToCloudinary(file.path);
          return result.url;
        }));
      }

      let saveActualImages = post_imgURLs.map((url)=>{
        return {
          url: url
        }
      })

      if (existingRecord) {

        if(saveActualImages.length > 0){
          await Post.findOneAndUpdate({ _id: postId }, {
            images : saveActualImages
          },{
            new: true
          });
        }

      } else {
        await Post.create({
          images : saveActualImages
        });
      }
      
      return res.status(200).json({
        success: true,
        message: "Post Images uploaded successfully."
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

export const createPosts = async (req, res) => {
    const {title, content, communityId, buyNowUrl, userId } = req.body;
  
    if (!title || !content || !communityId || !userId) {
      return res.status(400).json({
        success: false,
        error: "Title, content, communityId, and userId are required",
      });
    }
  
    try {
      const user = await User.findOne({
        _id : userId
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }
  
      const community = await Community.findOne({
        _id: communityId,
      });
      if (!community) {
        return res.status(404).json({
          success: false,
          error:
            "Community not found or user is not authorized to create a post in this community",
        });
      }
  
      if (community._id.toString() !== communityId) {
        return res.status(400).json({
          success: false,
          error: "Invalid community ID",
        });
      }
  
      const baseHandle = title.toLowerCase().replace(/[^a-z0-9]/g, "-");
      let handle = baseHandle;
      let i = 1;
  
      while (true) {
        const existingPost = await Post.findOne({
          post_handle: handle,
        });
  
        if (!existingPost) {
          break;
        }
  
        handle = `${baseHandle}-${i}`;
        i++;
      }
  
      const newPost = new Post({
        title,
        post_handle: handle,
        content,
        buyNowUrl,
        community: {
          _id: community._id,
          title: community.title,
          community_handle: community.community_handle,
        },
        userId,
        createdby: { _id: user._id, username: user.name },
        author: { _id: user._id, username: user.name }
      });
  
      const savedPost = await newPost.save();
      return res.status(200).json({
        success: true,
        message: "Post created successfully",
        response: savedPost,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        error: "Internal Server Error",
      });
    }
  };

  export const getPosts = async (req, res) => {
    try {
      const posts = await Post.find();
      res.status(200).json({
        success : true,
        message : "All posts fetched successfully!",
        data : posts
    });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  export const getPost = async (req, res) => {
    try {
      const { postId } = req.query;
      if (!postId) {
        return res.status(400).json({ 
          success: false,
          message: "Post Id is required", 
        });
      }
      const post = await Post.findById(postId);
  
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
  
      const community = await Community.findById(post.community);
  
      if (!community) {
        return res.status(404).json({ error: "Community not found" });
      }
      const author = community.author;
      const postWithAuthor = {
        ...post.toObject(),
        author: {
          id: author._id,
          username: author.username,
          email: author.useremail,
        },
      };
  
      return res.status(200).json({
        success : true,
        message : "Post fetched successfully!",
        data : postWithAuthor
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  export const getCommunityPosts = async (req, res) => {
    try {
      const { community_handle } = req.params;
      if (!community_handle) {
        return res.status(201).json({
          success: false,
          message: "Community Handle is required",
        });
      }
      const community = await Community.findOne({ community_handle });
  
      if (!community) {
        return res.status(201).json({
          success: false,
          message: "Community not found",
        });
      }
  
      const posts = await Post.find({
        "community._id": community._id,
        status: 1,
      });
  
      return res.status(200).json({
        success: true,
        message: "Posts retrieved successfully",
        posts,
        creator: community.author._id
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  export const likePost = async (req, res) => {
    try {
      const { postId } = req.params;
      const { userId , username } = req.body;

      if (!postId) {
        return res.status(201).json({
          success: false,
          message: "PostId is required",
        });
      }

      if(!userId || !username){
        return res.status(201).json({
          success: false,
          message: "User ID and username are required",
        });
      }
  
      const post = await Post.findOne({
        _id : postId
      });

      if(!post){
        return res.status(201).json({
          success: false,
          message: "Posts does not exists.",
        });
      }

      const likedIndex = post.likes.likedBy.findIndex((like)=>{
        return like._id.equals(userId)
      });

      let liked;

      if(likedIndex != -1){
        post.likes.likedBy.splice(likedIndex, 1);
        post.likes.count > 0 ? post.likes.count-- : post.likes.count;
        liked = false;
      }else{
        post.likes.likedBy.push({
            _id : userId,
            username
          });
        post.likes.count++;
        liked = true;
      }

      await post.save();
  
      return res.status(200).json({
        success: true,
        liked,
        message: liked ? "Post liked successfully!" : "Post unlike successfully!" 
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  export const commentPost = async (req, res) => {
    try {
      const { postId } = req.params;
      const { userId , username, comment } = req.body;

      if (!postId) {
        return res.status(201).json({
          success: false,
          message: "PostId is required",
        });
      }

      if(!userId || !username || !comment){
        return res.status(201).json({
          success: false,
          message: "User ID and username are required",
        });
      }
  
      const post = await Post.findOne({
        _id : postId
      });

      if(!post){
        return res.status(201).json({
          success: false,
          message: "Posts does not exists.",
        });
      }

      post.comments.commentsAndReplies.push({
        text : comment,
        commentAuthor : {
          _id : userId,
          username 
        }
      })

      post.comments.commentCount++;

      await post.save();
  
      return res.status(200).json({
        success: true,
        message: "Comment added successfully!!!"
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  export const replyComment = async (req, res) => {
    try {
      const { postId, commentId } = req.params;
      const { userId , username, reply } = req.body;

      if (!postId || !commentId) {
        return res.status(201).json({
          success: false,
          message: "Post ID and comment ID are required",
        });
      }

      if(!userId || !username || !reply){
        return res.status(201).json({
          success: false,
          message: "User ID, username and Reply text are required",
        });
      }
  
      const post = await Post.findOneAndUpdate({
        _id : postId,
        "comments.commentsAndReplies._id" : commentId
      },{
        $push : {
          "comments.commentsAndReplies.$.replies" : {
            text : reply,
            replyAuthor: {
              _id : userId,
              username
            }
          }
        }
      },{
        new: true,
      });

      if(!post){
        return res.status(201).json({
          success: false,
          message: "Post or Comment does not exists.",
        });
      }
  
      return res.status(200).json({
        success: true,
        message: "Comment reply added successfully!!!"
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  export const getPostCreatedBy = async (req, res) => {
    try {
      const { userId } = req.params;

      if (!userId ) {
        return res.status(201).json({
          success: false,
          message: "User Id are required",
        });
      }
  
      const posts = await Post.find({
        "createdby._id": userId,
        status: 1,
      });

      if(!posts || posts.length == 0){
        return res.status(201).json({
          success: false,
          message: "Posts does not exists.",
        });
      }
  
      return res.status(200).json({
        success: true,
        message: "Post fetched successfully!!!",
        data : posts
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  export const deleteComment = async (req, res) => {
    try {
      const { postId, commentId } = req.params;
      const { userId } = req.body;

      if(!postId || !commentId || !userId){
        return res.status(401).json({
          success: false,
          message: "Post Id, User Id and Comment Id are required",
        });
      }
  
      const post = await Post.findOne({
        "_id": postId
      });

      if(!post){
        return res.status(401).json({
          success: false,
          message: "Post does not exists.",
        });
      }

      const commentIndex = post.comments.commentsAndReplies.findIndex((comment)=>{
        return comment._id.equals(commentId);
      });

      if(commentIndex == -1){
        return res.status(401).json({
          success: false,
          message: "Comment does not exists."
        })
      }

      if(userId == post.comments.commentsAndReplies[commentIndex].commentAuthor._id
        || userId == post.createdby._id){
        
        post.comments.commentsAndReplies.splice(commentIndex, 1);
        post.comments.commentCount > 0 ? post.comments.commentCount-- : post.comments.commentCount;
        await post.save()

      }else{
        return res.status(400).json({
          success: false,
          message: "You are not authorized to delete this comment."
        })
      }

      return res.status(200).json({
        success: true,
        message: "Comment delete successfully!!!"
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  export const deletePost = async (req, res) => {
    try {
      const { postId } = req.params;
      const { userId } = req.body;

      if(!postId || !userId){
        return res.status(401).json({
          success: false,
          message: "Post Id and User Id are required",
        });
      }
  
      const post = await Post.findOne({
        "_id": postId
      }).populate('community._id');

      if(userId != post.community._id.author._id && userId != post.createdby._id){
        return res.status(401).json({
          success: false,
          message: "You are not authorized to delete this post."
        });
      }

      await Post.findOneAndDelete({
        "_id": postId
      })

      return res.status(200).json({
        success: true,
        message: "Post delete successfully!!!"
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  
export const updatePost = async (req, res) => {
  try {
    const postId = req.params.postId;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: "Post Id is required",
      });
    }

    const post = await Post.findOne({
      "_id": postId
    }).populate('community._id');

    const { title, description, status, userId } = req.body;

    console.log("postttttt", post)

    if(userId != post.createdby._id && userId != post.community._id.author._id ){
      return res.status(401).json({
        success: false,
        message: "You are not authorized to update this post."
        });
    }

    let handle;
    if (title) {
      const baseHandle = title.toLowerCase().replace(/[^a-z0-9]/g, "-");
      let i = 1;

      handle = `${baseHandle}-${i}`;
      i++;
    }
    const updatedFields = {
      content: description,
      status,
      updatedAt: Date.now(),
    };

    if (title) {
      updatedFields.title = title;
      updatedFields.post_handle = handle;
    }

    const updatedPost = await Post.findByIdAndUpdate(postId, updatedFields, {
      new: true,
    });

    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post successfully updated",
      response: updatedPost,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const editComment = async (req, res) => {
  try {
    const {postId, commentId} = req.params;

    const { userId, text } = req.body;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: "Post Id is required",
      });
    }

    const post = await Post.findOne({
      "_id": postId,
      "comments.commentsAndReplies._id" : commentId
    })

    if(!post || post == null){
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const thatComment = post.comments.commentsAndReplies.find((comment)=>{
      return commentId == comment._id
    })

    if(userId != thatComment.commentAuthor._id){
      return res.status(403).json({
        success: false,
        message: "You are not authorized to edit this comment",
      });
    }

    thatComment.text = text

    await post.save();

    return res.status(200).json({
      success: true,
      message: "Comment successfully updated",
      response: post
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const getDraftPosts = async (req, res) => {
  try {
    const authorId = req.params.authorId;
    if (!authorId) {
      return res.status(400).json({
        success: false,
        message: "Author ID is required",
      });
    }
    const draftPosts = await Post.find({
      "createdby._id": authorId,
      status: 0,
    }).populate("createdby");

    if (!draftPosts || draftPosts.length === 0) {
      return res.status(201).json({
        success: false,
        message: "No draft posts found for this author",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Draft posts retrieved successfully",
      draftPosts: draftPosts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


