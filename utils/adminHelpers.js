const parsePagination = (req) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const paginatedResponse = (items, total, page, limit) => ({
  items,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  },
});

const sanitizeUser = (user) => {
  if (!user) return null;
  const doc = user.toObject ? user.toObject() : { ...user };
  delete doc.password;
  delete doc.resetOtp;
  delete doc.resetOtpExpires;
  delete doc.resetSessionToken;
  delete doc.resetSessionExpires;
  delete doc.embedding;
  return doc;
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = {
  parsePagination,
  paginatedResponse,
  sanitizeUser,
  escapeRegex,
};
