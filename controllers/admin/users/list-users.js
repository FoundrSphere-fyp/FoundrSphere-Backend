const asyncWrapper = require("../../../middleware/async");
const User = require("../../../models/User");
const {
  parsePagination,
  paginatedResponse,
  sanitizeUser,
  escapeRegex,
} = require("../../../utils/adminHelpers");

const listUsers = asyncWrapper(async (req, res) => {
  const { page, limit, skip } = parsePagination(req);
  const filter = {};

  if (req.query.userType) {
    filter.userType = req.query.userType;
  }

  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === "true";
  }

  if (req.query.search) {
    const term = escapeRegex(req.query.search.trim());
    const regex = new RegExp(term, "i");
    filter.$or = [{ username: regex }, { email: regex }, { fullName: regex }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password -resetOtp -resetOtpExpires -resetSessionToken -resetSessionExpires -embedding")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return res.status(200).json({
    type: "success",
    ...paginatedResponse(users.map(sanitizeUser), total, page, limit),
  });
});

module.exports = listUsers;
