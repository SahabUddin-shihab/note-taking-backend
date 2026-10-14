import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    maxlength: 254
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  interests: { type: [String], default: [] },
  tokenVersion: {
    type: Number,
    default: 0,
    select: false
  }
}, { timestamps: true });

schema.index({ email: 1 }, { unique: true }); // login lookup + uniqueness


schema.index({ createdAt: -1, _id: -1 }); // admin user listing, stable sort


schema.index({ role: 1 }); // last-admin guard


schema.index({ interests: 1 }); // multikey; supports interests aggregation $match


schema.set('toJSON', {
  transform: (_d, r) => {
    delete r.password;
    delete r.tokenVersion;
    delete r.__v;
    return r;
  }
});

export default mongoose.model('User', schema);
