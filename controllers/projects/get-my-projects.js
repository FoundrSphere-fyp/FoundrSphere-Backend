const asyncWrapper = require("../../middleware/async");
const Project = require("../../models/Project");

const getMyProjects = asyncWrapper(async (req, res) => {
  const projects = await Project.find({ ownerId: req.userId }).sort({ createdAt: -1 });

  return res.status(200).json({
    type: "success",
    projects,
  });
});

module.exports = getMyProjects;
