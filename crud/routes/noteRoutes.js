const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const {
  createNote,
  getMyNotes,
  getMyNoteById,
  updateMyNote,
  deleteMyNote,
} = require("../controllers/noteController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createNote);
router.get("/", getMyNotes);
router.get("/:id", getMyNoteById);
router.patch("/:id", updateMyNote);
router.delete("/:id", deleteMyNote);

module.exports = router;
