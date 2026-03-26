const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

const createProject = require("../controllers/projects/create-project");
const getMyProjects = require("../controllers/projects/get-my-projects");
const updateProject = require("../controllers/projects/update-project");
const deleteProject = require("../controllers/projects/delete-project");
const getProjectsByOwner = require("../controllers/projects/get-projects-by-owner");
const getInvestmentsByInvestor = require("../controllers/projects/get-investments-by-investor");

router.route("/my").get(authMiddleware, getMyProjects);
router.route("/create").post(authMiddleware, createProject);
router.route("/update/:id").put(authMiddleware, updateProject);
router.route("/delete/:id").delete(authMiddleware, deleteProject);

router.route("/owner/:userId").get(getProjectsByOwner);
router.route("/investor/:investorId/investments").get(getInvestmentsByInvestor);

module.exports = router;
