const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

const adminAuth = [authMiddleware, requireAdmin];

const getAdminStats = require("../controllers/admin/get-stats");

const listUsers = require("../controllers/admin/users/list-users");
const getUser = require("../controllers/admin/users/get-user");
const updateUser = require("../controllers/admin/users/update-user");
const updateUserStatus = require("../controllers/admin/users/update-user-status");
const deleteUser = require("../controllers/admin/users/delete-user");

const listProjects = require("../controllers/admin/projects/list-projects");
const getProject = require("../controllers/admin/projects/get-project");
const updateProject = require("../controllers/admin/projects/update-project");
const deleteProject = require("../controllers/admin/projects/delete-project");

const listGroups = require("../controllers/admin/groups/list-groups");
const getGroup = require("../controllers/admin/groups/get-group");
const updateGroup = require("../controllers/admin/groups/update-group");
const deleteGroup = require("../controllers/admin/groups/delete-group");

const listPosts = require("../controllers/admin/posts/list-posts");
const getPost = require("../controllers/admin/posts/get-post");
const updatePost = require("../controllers/admin/posts/update-post");
const deletePost = require("../controllers/admin/posts/delete-post");

const listConversations = require("../controllers/admin/chatbot/list-conversations");
const getConversation = require("../controllers/admin/chatbot/get-conversation");
const deleteConversation = require("../controllers/admin/chatbot/delete-conversation");

router.get("/stats", adminAuth, getAdminStats);

router.get("/users", adminAuth, listUsers);
router.get("/users/:id", adminAuth, getUser);
router.patch("/users/:id/status", adminAuth, updateUserStatus);
router.put("/users/:id", adminAuth, updateUser);
router.delete("/users/:id", adminAuth, deleteUser);

router.get("/projects", adminAuth, listProjects);
router.get("/projects/:id", adminAuth, getProject);
router.put("/projects/:id", adminAuth, updateProject);
router.delete("/projects/:id", adminAuth, deleteProject);

router.get("/groups", adminAuth, listGroups);
router.get("/groups/:id", adminAuth, getGroup);
router.put("/groups/:id", adminAuth, updateGroup);
router.delete("/groups/:id", adminAuth, deleteGroup);

router.get("/posts", adminAuth, listPosts);
router.get("/posts/:id", adminAuth, getPost);
router.put("/posts/:id", adminAuth, updatePost);
router.delete("/posts/:id", adminAuth, deletePost);

router.get("/chatbot/conversations", adminAuth, listConversations);
router.get("/chatbot/conversations/:id", adminAuth, getConversation);
router.delete("/chatbot/conversations/:id", adminAuth, deleteConversation);

module.exports = router;
