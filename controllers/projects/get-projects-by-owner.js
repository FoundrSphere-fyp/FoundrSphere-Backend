const asyncWrapper = require("../../middleware/async");
const Project = require("../../models/Project");

const getProjectsByOwner = asyncWrapper(async (req, res) => {
  const { userId } = req.params;

  const projects = await Project.find({
    ownerId: userId,
    visibility: "public",
  }).sort({ createdAt: -1 });

  return res.status(200).json({
    type: "success",
    projects,
  });
});

module.exports = getProjectsByOwner;
