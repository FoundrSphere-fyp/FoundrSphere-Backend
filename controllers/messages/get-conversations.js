const Conversation = require("../../models/Conversation");
const User = require("../../models/User");
const jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");

const getConversations = asyncWrapper(async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided', type: 'error' });
    }

    const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const conversations = await Conversation.find({
      participants: verification.userId
    })
      .populate('participants', 'fullName username userType')
      .sort({ lastMessageAt: -1 })
      .lean();

    const participantIds = [...new Set(
      conversations
        .flatMap((conversation) => conversation.participants || [])
        .map((participant) => participant?._id?.toString?.() || participant?._id)
        .filter(Boolean)
    )];

    const users = await User.find({ _id: { $in: participantIds } })
      .select('fullName username userType')
      .lean();

    const usersById = new Map(
      users.map((user) => [user._id.toString(), user])
    );

    const normalizedConversations = conversations.map((conversation) => ({
      ...conversation,
      participants: (conversation.participants || []).map((participant) => {
        const participantId = participant?._id?.toString?.() || participant?._id;
        const dbUser = usersById.get(String(participantId));

        return {
          _id: participantId,
          fullName: dbUser?.fullName || participant?.fullName || '',
          username: dbUser?.username || participant?.username || '',
          userType: dbUser?.userType || participant?.userType || null,
        };
      }),
    }));

    return res.status(200).json({
      type: 'success',
      conversations: normalizedConversations
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    return res.status(500).json({
      message: 'Failed to fetch conversations',
      type: 'error'
    });
  }
});

module.exports = getConversations;