import { Types } from 'mongoose';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { AppError, pageMeta, skipOf } from '../utils/index.js';

const found = (p) => {
  if (!p) throw new AppError(404, 'Post not found');
  return p;
};

const scope = (actor, id) => (actor.role === 'admin' ? { _id: id } : { _id: id, author: actor.id });

export async function list(q) {
  const [data, total] = await Promise.all([
    Post.find().sort({ createdAt: -1, _id: -1 }).skip(skipOf(q)).limit(q.limit).populate('author', 'name').select('-__v').lean(), Post.estimatedDocumentCount()
  ]);
  return {
    data,
    pagination: pageMeta(q.page, q.limit, total)
  };
}

export const get = async (id) => found(await Post.findById(id).populate('author', 'name').lean());
export const create = (authorId, data) => Post.create({ ...data, author: authorId });
export const update = async (actor, id, data) => found(await Post.findOneAndUpdate(scope(actor, id), { $set: data }, { new: true, runValidators: true }));

export const remove = async (actor, id) => {
  found(await Post.findOneAndDelete(scope(actor, id)));
};

// Scenario 2: ONE Post.aggregate() with $lookup. Unknown user or no posts => empty list (documented contract).
export async function listByAuthor(userId, q) {
  const [out] = await Post.aggregate([
    {
      $match: { author: new Types.ObjectId(userId) }
    },
    {
      $facet: {
        data: [
          {
            $sort: { createdAt: -1, _id: -1 }
          },
          { $skip: skipOf(q) },
          { $limit: q.limit },
          {
            $lookup: {
              from: User.collection.name,
              localField: 'author',
              foreignField: '_id',
              pipeline: [{ $project: { name: 1 } }],
              as: 'author'
            }
          },
          {
            $set: { author: { $first: '$author' } }
          },
          {
            $project: {
              title: 1,
              content: 1,
              createdAt: 1,
              updatedAt: 1,
              author: 1
            }
          }
        ],
        meta: [{ $count: 'total' }]
      }
    }
  ]);
  return {
    data: out.data,
    pagination: pageMeta(q.page, q.limit, out.meta[0]?.total ?? 0)
  };
}
