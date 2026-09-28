import mongoose from 'mongoose';
import { DOCUMENT_TYPES } from '../../constants/documentTypes.js';

const documentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parentModel: { type: String, required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: { type: String, enum: Object.values(DOCUMENT_TYPES), required: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const DocumentModel = mongoose.model('Document', documentSchema);
