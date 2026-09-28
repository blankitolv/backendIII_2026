import { ROLES } from '../constants/roles.js';

export const userIdValidator = {
  params: {
    id: { required: true, type: 'string' }
  }
};

export const userCreateValidator = {
  body: {
    name: { required: true, type: 'string' },
    email: { required: true, type: 'string' },
    password: { required: true, type: 'string' },
    role: { required: true, enum: Object.values(ROLES) }
  }
};

export const userUpdateValidator = {
  params: {
    id: { required: true, type: 'string' }
  },
  body: {
    name: { required: false, type: 'string' },
    role: { required: false, enum: Object.values(ROLES) }
  }
};
