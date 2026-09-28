export const orderValidator = {
  body: {
    user: { required: true, type: 'string' },
    trackingNumber: { required: true, type: 'string' },
    origin: { required: true, type: 'string' },
    destination: { required: true, type: 'string' },
    weightKg: { required: true, type: 'number' },
    deliveryAddress: { required: true, type: 'string' }
  }
};

export const orderIdValidator = {
  params: {
    id: { required: true, type: 'string' }
  }
};
