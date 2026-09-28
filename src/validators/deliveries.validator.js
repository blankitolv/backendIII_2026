import { DELIVERY_STATUS } from '../constants/deliveryStatus.js';

export const deliveryValidator = {
  body: {
    order: { required: true, type: 'string' },
    courier: { required: true, type: 'string' }
  }
};

export const deliveryIdValidator = {
  params: {
    id: { required: true, type: 'string' }
  }
};

export const deliveryStatusValidator = {
  params: {
    id: { required: true, type: 'string' }
  },
  body: {
    status: { required: true, enum: Object.values(DELIVERY_STATUS) }
  }
};
