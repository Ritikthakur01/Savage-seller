import mongoose from 'mongoose';
import User from "./user.js"
import Message from './message.js';

const chatSchema = mongoose.Schema({
    chatName: {
        type: String,
    },
    isGroupChat: {
        type: Boolean,
        default: false
    },
    chatPic: {
        type: String,
    },
    members: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId, // Assuming userId is a reference to another model
            ref: User, // Name of the referenced model
            required: true
        },
        isAdmin: {
            type: Boolean,
            default: false // Default value for isAdmin
        },
        unseenMessage : {
            type : Number,
            default : 0
        }
    }],
    latestMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: Message
    },
    chatDescription: {
        type: String,
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
   
}, {
    timestamps: true
}
)
const Chat = mongoose.model('Chat', chatSchema)

export default Chat;
