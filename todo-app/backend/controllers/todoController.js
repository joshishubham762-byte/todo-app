const Todo = require('../models/Todo');
const User = require('../models/User');

async function getListOwnerIds(userId) {
  const owners = await User.find({ sharedWith: userId }).select('_id');
  return [userId, ...owners.map((owner) => owner._id)];
}

async function canAccessTodo(todo, userId) {
  const ownerIds = await getListOwnerIds(userId);
  return ownerIds.some((ownerId) => ownerId.toString() === todo.user.toString());
}

// GET /api/todos - get all todos belonging to the logged-in user
async function getTodos(req, res) {
  try {
    const ownerIds = await getListOwnerIds(req.user.id);
    const todos = await Todo.find({ user: { $in: ownerIds } }).sort({ order: 1, createdAt: -1 });
    res.status(200).json(todos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching todos', error: error.message });
  }
}

// POST /api/todos - create a new todo for the logged-in user
async function createTodo(req, res) {
  try {
    const { title, dueDate, category } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Todo title is required' });
    }

    const todoData = {
      title: title.trim(),
      user: req.user.id,
      order: await Todo.countDocuments({ user: req.user.id }),
    };

    if (category !== undefined && category !== null && category !== '') {
      const validCategories = ['Work', 'Personal', 'Urgent', 'General'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ message: 'Category is invalid' });
      }
      todoData.category = category;
    }

    if (dueDate !== undefined && dueDate !== null && dueDate !== '') {
      const parsedDate = new Date(dueDate);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Due date is invalid' });
      }
      todoData.dueDate = parsedDate;
    }

    const todo = await Todo.create(todoData);

    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ message: 'Error creating todo', error: error.message });
  }
}

// PUT /api/todos/:id - update a todo (title and/or completed status)
async function updateTodo(req, res) {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    // Security check: make sure this todo belongs to the logged-in user
    if (!(await canAccessTodo(todo, req.user.id))) {
      return res.status(403).json({ message: 'Not authorized to update this todo' });
    }

    if (req.body.title !== undefined) todo.title = req.body.title.trim();
    if (req.body.completed !== undefined) {
      todo.completed = req.body.completed;
      todo.completedAt = req.body.completed ? (todo.completedAt || new Date()) : null;
    }
    if (req.body.category !== undefined) {
      const validCategories = ['Work', 'Personal', 'Urgent', 'General'];
      if (req.body.category === null || req.body.category === '') {
        todo.category = 'General';
      } else if (!validCategories.includes(req.body.category)) {
        return res.status(400).json({ message: 'Category is invalid' });
      } else {
        todo.category = req.body.category;
      }
    }
    if (req.body.order !== undefined) {
      const orderValue = Number(req.body.order);
      if (Number.isNaN(orderValue)) {
        return res.status(400).json({ message: 'Order is invalid' });
      }
      todo.order = orderValue;
    }
    if (req.body.dueDate !== undefined) {
      if (req.body.dueDate === null || req.body.dueDate === '') {
        todo.dueDate = null;
      } else {
        const parsedDate = new Date(req.body.dueDate);
        if (Number.isNaN(parsedDate.getTime())) {
          return res.status(400).json({ message: 'Due date is invalid' });
        }
        todo.dueDate = parsedDate;
      }
    }

    const updatedTodo = await todo.save();
    res.status(200).json(updatedTodo);
  } catch (error) {
    res.status(500).json({ message: 'Error updating todo', error: error.message });
  }
}

// DELETE /api/todos/:id - delete a todo
async function deleteTodo(req, res) {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    if (!(await canAccessTodo(todo, req.user.id))) {
      return res.status(403).json({ message: 'Not authorized to delete this todo' });
    }

    await todo.deleteOne();
    res.status(200).json({ message: 'Todo deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting todo', error: error.message });
  }
}

// GET /api/todos/stats - weekly completion count for visible lists
async function getStats(req, res) {
  try {
    const ownerIds = await getListOwnerIds(req.user.id);
    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const completedThisWeek = await Todo.countDocuments({
      user: { $in: ownerIds },
      completed: true,
      completedAt: { $gte: startOfWeek },
    });

    res.status(200).json({ completedThisWeek });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching todo stats', error: error.message });
  }
}

// POST /api/todos/share - share the current user's list with another user
async function shareTodoList(req, res) {
  try {
    const email = req.body.email && req.body.email.trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const targetUser = await User.findOne({ email });
    if (!targetUser) return res.status(404).json({ message: 'No registered user found with that email' });
    if (targetUser._id.toString() === req.user.id) return res.status(400).json({ message: 'You cannot share a list with yourself' });

    await User.findByIdAndUpdate(req.user.id, { $addToSet: { sharedWith: targetUser._id } });
    res.status(200).json({ message: `List shared with ${targetUser.name}`, user: { name: targetUser.name, email: targetUser.email } });
  } catch (error) {
    res.status(500).json({ message: 'Error sharing todo list', error: error.message });
  }
}

module.exports = { getTodos, createTodo, updateTodo, deleteTodo, getStats, shareTodoList };
