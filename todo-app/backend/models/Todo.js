const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Todo title is required'],
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    category: {
      type: String,
      enum: ['Work', 'Personal', 'Urgent', 'General'],
      default: 'General',
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    user: {
      // Every todo belongs to exactly one user
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Todo', todoSchema);
