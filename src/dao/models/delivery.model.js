import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { DELIVERY_STATUS } from '../../constants/deliveryStatus.js';

const deliverySchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    courier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: Object.values(DELIVERY_STATUS), default: DELIVERY_STATUS.CREATED },
    deliveredAt: { type: Date, default: null },
    proofs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }]
  },
  { timestamps: true }
);

deliverySchema.index({ status: 1 });
deliverySchema.index({ order: 1 });

deliverySchema.plugin(mongoosePaginate);

export const DeliveryModel = mongoose.model('Delivery', deliverySchema);