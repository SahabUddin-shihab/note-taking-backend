import User from '../models/User.js';
import Note from '../models/Note.js';
import Post from '../models/Post.js';
import { AppError, pageMeta, skipOf } from '../utils/index.js';
import { hashPassword } from './auth.service.js';

const guardLastAdmin = async (target) => {
  if (target.role === 'admin' && (await User.countDocuments({ role: 'admin' })) <= 1) throw new AppError(409, 'Cannot remove the last administrator');
};

export const getProfile = (id) => User.findById(id);
export const updateProfile = (id, data) => User.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });

export async function list(q) {
  const [data, total] = await Promise.all([
    User.find().sort({ createdAt: -1, _id: -1 }).skip(skipOf(q)).limit(q.limit).select('-__v').lean(), User.estimatedDocumentCount()
  ]);
  return {
    data,
    pagination: pageMeta(q.page, q.limit, total)
  };
}

// Scenario 1: exactly ONE User.aggregate(); grouping, counting, paging and total all computed inside via $facet.
export async function groupByInterest(q) {
  const [out] = await User.aggregate([
    {
      $match: { 'interests.0': { $exists: true } }
    },
    { $unwind: '$interests' },
    {
      $group: {
        _id: '$interests',
        userCount: { $sum: 1 },
        users: {
          $push: {
            _id: '$_id',
            name: '$name',
            email: '$email'
          }
        }
      }
    },
    { $sort: { _id: 1 } },
    {
      $facet: {
        data: [
          { $skip: skipOf(q) },
          { $limit: q.limit },
          {
            $project: {
              _id: 0,
              interest: '$_id',
              userCount: 1,
              users: 1
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

export async function getById(id) {
  const u = await User.findById(id).lean();
  if (!u) throw new AppError(404, 'User not found');
  return u;
}

export async function create({ password, ...rest }) {
  return User.create({
    ...rest,
    password: await hashPassword(password)
  });
}

export async function update(id, { password, ...rest }) {
  const u = await User.findById(id).select('+tokenVersion');
  if (!u) throw new AppError(404, 'User not found');
  const demoting = rest.role && rest.role !== 'admin';
  if (demoting)
    await guardLastAdmin(u);
  Object.assign(u, rest);
  if (password)
    u.password = await hashPassword(password);
  if (password || demoting)
    u.tokenVersion += 1; // force re-login after credential/role downgrade
  return u.save();
}

export async function remove(id) {
  const u = await User.findById(id).lean();
  if (!u) throw new AppError(404, 'User not found');
  await guardLastAdmin(u);
  await Promise.all([User.deleteOne({ _id: u._id }), Note.deleteMany({ owner: u._id }), Post.deleteMany({ author: u._id })]);
}
