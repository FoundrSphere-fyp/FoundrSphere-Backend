const asyncWrapper = require("../../middleware/async");
const Project = require("../../models/Project");
const Investment = require("../../models/Investment");

const deleteProject = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const project = await Project.findById(id);

  if (!project) {
    return res.status(404).json({ type: "error", message: "Project not found." });
  }

  if (String(project.ownerId) !== String(req.userId)) {
    return res.status(403).json({ type: "error", message: "Unauthorized access." });
  }

  await Investment.deleteMany({ projectId: project._id });
  await Project.deleteOne({ _id: project._id });

  return res.status(200).json({
    type: "success",
    message: "Project deleted successfully.",
  });
});

module.exports = deleteProject;
