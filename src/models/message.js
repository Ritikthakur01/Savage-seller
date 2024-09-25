import { Timestamp } from 'bson';
import mongoose from 'mongoose';
import User from './user';
import Chat from './chat';

const messageSchema = mongoose.Schema({
    sender:{
        type: mongoose.Schema.Types.ObjectId,
        ref:User
    },
    messageType: {
        type: String,
        required: true
    },
    content:{
        type:String,
        trim:true
    },
    fileName:{
        type:String,
        trim:true
    },
    chat:{
        type:mongoose.Schema.Types.ObjectId,
        ref:Chat
    },
    readBy:[
        {type:mongoose.Schema.Types.ObjectId,ref:User}
    ],
    createdAt:{
        type:Date,
        default:Date.now

    }

}
)

const Message = mongoose.model('Message',messageSchema)
export default Message;