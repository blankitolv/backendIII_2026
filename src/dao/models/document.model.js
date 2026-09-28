import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
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

// El par (modelo, id) es el filtro de los listados anidados; type solo o en
// combinacion es el de listByType. Ninguna query real busca por uno solo.
documentSchema.index({ parentModel: 1, parentId: 1 });
documentSchema.index({ type: 1 });

documentSchema.plugin(mongoosePaginate);

export const DocumentModel = mongoose.model('Document', documentSchema);