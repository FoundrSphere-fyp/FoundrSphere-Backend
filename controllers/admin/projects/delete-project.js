const asyncWrapper = require("../../../middleware/async");
const Project = require("../../../models/Project");
const Investment = require("../../../models/Investment");

const deleteProject = asyncWrapper(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({ type: "error", message: "Project not found." });
  }

  await Investment.deleteMany({ projectId: project._id });
  await Project.deleteOne({ _id: project._id });

  return res.status(200).json({
    type: "success",
    message: "Project deleted successfully.",
  });
});

module.exports = deleteProject;
