import { z } from 'zod';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
});

const interests = z.array(z.string().trim().toLowerCase().min(1).max(40)).max(30).transform((a) => [...new Set(a)]);
const password = z.string().min(8).max(72);
const name = z.string().trim().min(1).max(100);
const email = z.string().trim().toLowerCase().email().max(254);
const title = z.string().trim().min(1).max(200);
const content = z.string().max(20000);

// .strict() rejects unknown keys => mass-assignment / role injection returns 422.
export const S = {
  register: z.object({
    name,
    email,
    password,
    interests: interests.optional()
  }).strict(),
  login: z.object({
    email,
    password: z.string().min(1).max(72)
  }).strict(),
  profile: z.object({
    name: name.optional(),
    interests: interests.optional()
  }).strict(),
  adminCreate: z.object({
    name,
    email,
    password,
    role: z.enum(['user', 'admin']).default('user'),
    interests: interests.optional()
  }).strict(),
  adminPatch: z.object({
    name: name.optional(),
    email: email.optional(),
    password: password.optional(),
    role: z.enum(['user', 'admin']).optional(),
    interests: interests.optional()
  }).strict(),
  note: z.object({ title, content: content.optional() }).strict(),
  notePatch: z.object({
    title: title.optional(),
    content: content.optional()
  }).strict(),
  post: z.object({ title, content: content.optional() }).strict(),
  postPatch: z.object({
    title: title.optional(),
    content: content.optional()
  }).strict(),
  adminNotesQuery: pageQuery.extend({ owner: objectId.optional() }),
  idParam: z.object({ id: objectId }),
  userIdParam: z.object({ userId: objectId })
};
