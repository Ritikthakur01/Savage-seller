import mongoose from 'mongoose';
import User from './user';

const verificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
    required: true
  },
  token: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '1h'
  }
});

const emailVerification = mongoose.model('emailVerification', verificationSchema);

export default emailVerification;