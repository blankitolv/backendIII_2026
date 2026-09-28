import mongoose from 'mongoose';
import { ROLES } from '../../constants/roles.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(ROLES), required: true },
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }]
  },
  { timestamps: true }
);

export const UserModel = mongoose.model('User', userSchema);
