import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    default: '',
    maxlength: 20000
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

schema.index({ owner: 1, createdAt: -1, _id: -1 }); // a user's notes (equality, sort, tiebreak); admin owner filter


schema.index({ createdAt: -1, _id: -1 }); // admin all-notes listing


export default mongoose.model('Note', schema);
