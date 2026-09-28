import { ROLES } from '../constants/roles.js';

export const registerValidator = {
  body: {
    name: { required: true },
    email: { required: true },
    password: { required: true },
    role: { required: true, enum: Object.values(ROLES) }
  }
};

export const loginValidator = {
  body: {
    email: { required: true },
    password: { required: true }
  }
};
