import { createServer } from 'http'
import express from 'express'
import { Server } from 'socket.io'
import cors from 'cors'
import Message from '../models/message.js'
import User from '../models/user.js'
import Chat from '../models/chat.js'
import { createError } from './backend.functions.js'


const chatModule = express();
const httpServer = createServer(chatModule)
chatModule.use(cors());

const io = new Server(httpServer, {
  cors: true,
});

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();
let roomId;
io.on('connect', (socket) => {

  socket.on('setup', (userData) => {
    socket.join(userData);
    console.log('userData',userData)
    socket.emit('connected')
  })

  socket.on('join chat', (room) => {
    socket.join(room)
    // console.log("user joined")
    const numUsers = io.sockets.adapter.rooms.get(room)?.size || 0;
    // console.log(`Number of users in room ${room}: ${numUsers}`);

  })

  socket.on('message send', async (chatData) => {
    try {
      console.log("chatData",chatData)
      if(chatData.chat){
        chatData.freshChat = false;
      }
      if(chatData.chat == null){
        chatData.freshChat = true;
        const chatMembers = [
          { userId: chatData.sender },
          { userId: chatData.receiver }
        ];
  
        const newChat = new Chat({
          members: chatMembers
        });

        const savedChat = await newChat.save();
        chatData.chat = savedChat._id;
      }
     
      // console.log("after daving chatData",chatData)
      const newMessage = new Message(chatData);
      const savedMessage = await newMessage.save();

      const userExist = await User.find({_id:savedMessage.sender},{firstName:1,lastName:1})
      if(!userExist){
        throw new Error("user Not exists in - initSocket")
      }
      console.log(userExist)

    //   const updatedChat = await Chat.findOneAndUpdate(
    //     { _id: chatData.chat },
    //     { $set: { latestMessage: savedMessage._id, pendingMessage: true } },
    //     { new: true }  // Return the updated document
    // );
     // Increment unseen message count for all members except the sender
     const senderId = chatData.sender;
     const chatId = chatData.chat;
     const updateResult = await Chat.updateMany(
      { _id: chatId },
      { $inc: { "members.$[elem].unseenMessage": 1 } },
      { arrayFilters: [{ "elem.userId": { $ne: senderId } }] }
    );

    // Logging update result for debugging
    // console.log("Update Result: ", updateResult);

    // Retrieve the updated chat document to get the latest unseenMessage counts
    const updatedChat = await Chat.findById(chatId);

    // Logging updated chat for debugging
    // console.log("Updated Chat: ", updatedChat);

      
      
      const formatDate = (dateString) => {
        // Create a date object from the provided date string
        const date = new Date(dateString);
    
        // Get the local hours and minutes
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
    
        // Determine AM/PM and adjust hours
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // Adjust for 0 hour (midnight)
    
        // Format hours with leading zero if needed
        const formattedHours = String(hours).padStart(2, '0');
    
        // Return the formatted time string
        return `${formattedHours}:${minutes} ${ampm}`;
    };
      
      const selectedMessage = {
        sender: savedMessage.sender,
        messageType: savedMessage.messageType,
        fileName: savedMessage.fileName,
        chat: savedMessage.chat.toString(),
        content: savedMessage.content,
        // unseenMsge : updatedChat.
        senderName : `${userExist[0].firstName} ${userExist[0].lastName}`,
        isFreshChat : chatData.freshChat,
        messageDate : formatDate(savedMessage.createdAt)
      };
   
      
      const room = chatData.chat;
      // console.log('room',room)
      
      console.log('selectedMessage',selectedMessage)

     chatData.members.forEach((id)=>{
      socket.in(id).emit('message received', selectedMessage);

    })
      // io.to(room).emit('message received',()=>{console.log('event is fire')}, selectedMessage);

    } catch (error) {
      console.error('Error saving message:', error);
      // createError(next(400,"Error saving message:"))
      throw new Error("Error in saving message");
      
    }
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });

  // --------------- video call ---------------------

  socket.on("room:join", (data) => {
    console.log(data, "room: join now");
    const { chatId, room } = data;
    emailToSocketIdMap.set(chatId, socket.id);
    socketidToEmailMap.set(socket.id, chatId);
    io.emit("go:call", {chatId, room});
    io.to(room).emit("user:joined", { chatId, id: socket.id });
    socket.join(room);
    io.to(socket.id).emit("room:join", data);
    console.log("room:join")
  });

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
    console.log("user:call")
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
    console.log("call:accepted")
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
    console.log("peer:nego:needed")
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
    console.log("peer:nego:done")
  });

  socket.on("user: disconnected", ({ chatId, socket_id}) => {
    io.to(socket_id).emit("disconnect: accepected", { chatId, socket_id});
    console.log("user: disconnected---------------------", chatId, socket_id)
  })

  // --------------- video call ---------------------
})

export { chatModule, httpServer };
