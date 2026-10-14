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
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

schema.index({ author: 1, createdAt: -1, _id: -1 }); // $match author + $sort in posts-by-user aggregation


schema.index({ createdAt: -1, _id: -1 }); // public feed


export default mongoose.model('Post', schema);
