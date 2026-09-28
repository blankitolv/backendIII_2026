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
