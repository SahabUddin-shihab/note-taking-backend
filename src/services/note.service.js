import Note from '../models/Note.js';
import { AppError, pageMeta, skipOf } from '../utils/index.js';

const found = (n) => {
  if (!n) throw new AppError(404, 'Note not found');
  return n;
};


const page = async (filter, q, populate) => {
  let query = Note.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skipOf(q)).limit(q.limit).select('-__v');
  if (populate)
    query = query.populate('owner', 'name email');
  const [data, total] = await Promise.all([query.lean(), Note.countDocuments(filter)]);
  return {
    data,
    pagination: pageMeta(q.page, q.limit, total)
  };
};

export const create = (ownerId, data) => Note.create({ ...data, owner: ownerId }); // owner always from identity


export const listOwn = (ownerId, q) => page({ owner: ownerId }, q);
export const getOwn = async (ownerId, id) => found(await Note.findOne({ _id: id, owner: ownerId }).select('-__v').lean());
export const updateOwn = async (ownerId, id, data) => found(await Note.findOneAndUpdate({ _id: id, owner: ownerId }, { $set: data }, { new: true, runValidators: true }));

export const removeOwn = async (ownerId, id) => {
  found(await Note.findOneAndDelete({ _id: id, owner: ownerId }));
};

export const listAll = ({ owner, ...q }) => page(owner ? { owner } : {}, q, true);
export const getAny = async (id) => found(await Note.findById(id).populate('owner', 'name email').lean());
