import mongoose from 'mongoose';
import { ORDER_STATUS } from '../../constants/orderStatus.js';
import { DELIVERY_PRIORITY } from '../../constants/priorities.js';

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    trackingNumber: { type: String, required: true, unique: true },
    status: { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.CREATED },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    weightKg: { type: Number, required: true },
    deliveryAddress: { type: String, required: true },
    priority: { type: String, enum: Object.values(DELIVERY_PRIORITY), default: DELIVERY_PRIORITY.NORMAL },
    proofs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }]
  },
  { timestamps: true }
);

export const OrderModel = mongoose.model('Order', orderSchema);
