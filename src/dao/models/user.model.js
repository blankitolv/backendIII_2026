import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { ROLES } from '../../constants/roles.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // select false: ninguna proyeccion por defecto trae el hash. Quien lo necesita
    // (login) lo pide con .select('+password'). El DTO ya lo oculta, esto lo
    // vuelve un error de base si alguien olvida el DTO.
    password: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), required: true },
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }]
  },
  { timestamps: true }
);

userSchema.plugin(mongoosePaginate);

export const UserModel = mongoose.model('User', userSchema);