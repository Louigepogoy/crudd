const { z } = require("zod");
const mongoose = require("mongoose");

const Note = require("../models/Note");

const createNoteSchema = z.object({
  title: z.string().min(1).max(120),
  content: z.string().max(5000).optional().default(""),
  completed: z.boolean().optional().default(false),
});

const updateNoteSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  content: z.string().max(5000).optional(),
  completed: z.boolean().optional(),
});

const createNote = async (req, res, next) => {
  try {
    const payload = createNoteSchema.parse(req.body);
    const note = await Note.create({
      ...payload,
      userId: req.user.userId,
    });

    res.status(201).json(note);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.issues });
    }
    next(error);
  }
};

const getMyNotes = async (req, res, next) => {
  try {
    const notes = await Note.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json(notes);
  } catch (error) {
    next(error);
  }
};

const getMyNoteById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid note ID." });
    }

    const note = await Note.findOne({ _id: id, userId: req.user.userId });

    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }

    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

const updateMyNote = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid note ID." });
    }

    const payload = updateNoteSchema.parse(req.body);
    const note = await Note.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      payload,
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }

    res.status(200).json(note);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.issues });
    }
    next(error);
  }
};

const deleteMyNote = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid note ID." });
    }

    const deletedNote = await Note.findOneAndDelete({ _id: id, userId: req.user.userId });

    if (!deletedNote) {
      return res.status(404).json({ message: "Note not found." });
    }

    res.status(200).json({ message: "Note deleted successfully." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNote,
  getMyNotes,
  getMyNoteById,
  updateMyNote,
  deleteMyNote,
};
