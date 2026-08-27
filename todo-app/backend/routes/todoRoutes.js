const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getTodos, createTodo, updateTodo, deleteTodo, getStats, shareTodoList } = require('../controllers/todoController');

// Every route below requires a valid JWT token
router.use(protect);

router.get('/stats', getStats);
router.post('/share', shareTodoList);
router.get('/', getTodos);
router.post('/', createTodo);
router.put('/:id', updateTodo);
router.delete('/:id', deleteTodo);

module.exports = router;
