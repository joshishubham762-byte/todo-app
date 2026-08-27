// Redirect to login if there's no token
if (!getToken()) {
  window.location.href = 'index.html';
}

const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const addTodoForm = document.getElementById('addTodoForm');
const todoInput = document.getElementById('todoInput');
const todoDueDate = document.getElementById('todoDueDate');
const todoCategory = document.getElementById('todoCategory');
const todoSearch = document.getElementById('todoSearch');
const filterButtons = document.querySelectorAll('.filter-btn');
const statusButtons = document.querySelectorAll('.status-btn');
const logoutBtn = document.getElementById('logoutBtn');
const darkModeToggle = document.getElementById('darkModeToggle');
const userNameSpan = document.getElementById('userName');
const errorBox = document.getElementById('errorMessage');

let activeCategoryFilter = 'All';
let activeStatusFilter = 'All';
let currentTodos = [];
let draggedTodoId = null;

const storedName = localStorage.getItem('userName');
if (storedName) userNameSpan.textContent = storedName;

function showError(message) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  if (errorBox) {
    errorBox.textContent = message;
    errorBox.style.display = 'block';
    setTimeout(() => (errorBox.style.display = 'none'), 4000);
  }
}

function formatDueDate(dateString) {
  if (!dateString) return '';

  const parsedDate = new Date(dateString);
  if (Number.isNaN(parsedDate.getTime())) return '';

  return parsedDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isPastDue(dateString, completed) {
  if (!dateString || completed) return false;

  const dueDate = new Date(dateString);
  if (Number.isNaN(dueDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
}

function sortTodos(todos) {
  return [...todos].sort((a, b) => {
    if (typeof a.order === 'number' && typeof b.order === 'number' && a.order !== b.order) {
      return a.order - b.order;
    }

    const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });
}

function updateSummary(todos) {
  const todoCount = document.getElementById('todoCount');
  const doneCount = document.getElementById('doneCount');
  const activeCount = document.getElementById('activeCount');

  const allTodos = todos || currentTodos || [];

  if (todoCount) todoCount.textContent = allTodos.length;
  if (doneCount) doneCount.textContent = allTodos.filter((todo) => todo.completed).length;
  if (activeCount) activeCount.textContent = allTodos.filter((todo) => !todo.completed).length;
}

function applyDarkMode() {
  const enabled = localStorage.getItem('todoDarkMode') === 'true';
  document.body.classList.toggle('dark-mode', enabled);

  if (darkModeToggle) {
    darkModeToggle.textContent = enabled ? '☀️ Light' : '🌙 Dark';
  }
}

function toggleDarkMode() {
  const enabled = !document.body.classList.contains('dark-mode');
  localStorage.setItem('todoDarkMode', String(enabled));
  document.body.classList.toggle('dark-mode', enabled);

  if (darkModeToggle) {
    darkModeToggle.textContent = enabled ? '☀️ Light' : '🌙 Dark';
  }
}

function startEditTodo(todo) {
  const listItem = todoList.querySelector(`li[data-id="${todo._id}"]`);
  if (!listItem) return;

  const titleEl = listItem.querySelector('.todo-title');
  if (!titleEl) return;

  const currentTitle = todo.title;
  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.value = currentTitle;
  editInput.className = 'todo-edit-input';
  editInput.maxLength = 200;

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'save-btn';
  saveBtn.textContent = 'Save';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'cancel-btn';
  cancelBtn.textContent = 'Cancel';

  const actionGroup = document.createElement('div');
  actionGroup.className = 'todo-edit-actions';
  actionGroup.appendChild(saveBtn);
  actionGroup.appendChild(cancelBtn);

  titleEl.replaceWith(editInput);
  const deleteBtn = listItem.querySelector('.delete-btn');
  const editBtn = listItem.querySelector('.edit-btn');
  const checkbox = listItem.querySelector('input[type="checkbox"]');

  if (checkbox) checkbox.disabled = true;
  if (deleteBtn) deleteBtn.disabled = true;
  if (editBtn) editBtn.disabled = true;

  listItem.appendChild(actionGroup);

  saveBtn.addEventListener('click', async () => {
    const updatedTitle = editInput.value.trim();

    if (!updatedTitle) {
      showError('Todo title cannot be empty');
      return;
    }

    try {
      await apiRequest(`/todos/${todo._id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: updatedTitle }),
      });
      loadTodos();
    } catch (error) {
      showError(error.message);
    }
  });

  cancelBtn.addEventListener('click', () => {
    loadTodos();
  });

  editInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveBtn.click();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelBtn.click();
    }
  });

  editInput.focus();
  editInput.select();
}

function persistOrder(updatedTodos) {
  return Promise.all(
    updatedTodos.map((todo, index) =>
      apiRequest(`/todos/${todo._id}`, {
        method: 'PUT',
        body: JSON.stringify({ order: index }),
      })
    )
  );
}

function renderSkeletons() {
  if (!todoList) return;

  todoList.innerHTML = `
    <li class="todo-skeleton"><span class="skeleton skeleton-check"></span><div class="skeleton-stack"><span class="skeleton skeleton-title"></span><span class="skeleton skeleton-subtitle"></span></div><span class="skeleton skeleton-tag"></span></li>
    <li class="todo-skeleton"><span class="skeleton skeleton-check"></span><div class="skeleton-stack"><span class="skeleton skeleton-title short"></span><span class="skeleton skeleton-subtitle"></span></div><span class="skeleton skeleton-tag"></span></li>
    <li class="todo-skeleton"><span class="skeleton skeleton-check"></span><div class="skeleton-stack"><span class="skeleton skeleton-title"></span><span class="skeleton skeleton-subtitle short"></span></div><span class="skeleton skeleton-tag"></span></li>
  `;

  if (emptyState) emptyState.style.display = 'none';
}

function renderTodos(todos) {
  const searchTerm = todoSearch && todoSearch.value ? todoSearch.value.trim().toLowerCase() : '';

  const categoryFilteredTodos = activeCategoryFilter === 'All'
    ? todos
    : todos.filter((todo) => (todo.category || 'General') === activeCategoryFilter);

  const statusFilteredTodos = activeStatusFilter === 'All'
    ? categoryFilteredTodos
    : activeStatusFilter === 'Active'
      ? categoryFilteredTodos.filter((todo) => !todo.completed)
      : categoryFilteredTodos.filter((todo) => todo.completed);

  const searchedTodos = searchTerm
    ? statusFilteredTodos.filter((todo) => todo.title.toLowerCase().includes(searchTerm))
    : statusFilteredTodos;

  const sortedTodos = sortTodos(searchedTodos);
  todoList.innerHTML = '';
  updateSummary(currentTodos);

  if (sortedTodos.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  sortedTodos.forEach((todo) => {
    const li = document.createElement('li');
    const overdue = isPastDue(todo.dueDate, todo.completed);
    li.className = `todo-item ${todo.completed ? 'completed' : ''} ${overdue ? 'overdue' : ''}`;
    li.dataset.id = todo._id;
    li.draggable = true;

    const categoryLabel = todo.category || 'General';
    const dueDateText = todo.dueDate ? formatDueDate(todo.dueDate) : 'No due date';

    li.innerHTML = `
      <input type="checkbox" ${todo.completed ? 'checked' : ''} />
      <div class="todo-content">
        <div class="todo-main-row">
          <span class="todo-title"></span>
          <span class="todo-category">${categoryLabel}</span>
        </div>
        <span class="todo-date ${overdue ? 'overdue' : ''}"></span>
      </div>
      <button class="edit-btn" type="button">Edit</button>
      <button class="delete-btn" type="button">Delete</button>
    `;

    li.querySelector('.todo-title').textContent = todo.title;
    li.querySelector('.todo-date').textContent = dueDateText === 'No due date' ? 'No due date' : `Due: ${dueDateText}`;

    li.addEventListener('dragstart', (event) => {
      draggedTodoId = todo._id;
      event.dataTransfer.effectAllowed = 'move';
      li.classList.add('dragging');
    });

    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      draggedTodoId = null;
    });

    li.addEventListener('dragover', (event) => {
      event.preventDefault();
      li.classList.add('drag-over');
    });

    li.addEventListener('dragleave', () => {
      li.classList.remove('drag-over');
    });

    li.addEventListener('drop', async (event) => {
      event.preventDefault();
      li.classList.remove('drag-over');

      if (!draggedTodoId || draggedTodoId === todo._id) return;

      const updated = [...currentTodos];
      const fromIndex = updated.findIndex((item) => item._id === draggedTodoId);
      const toIndex = updated.findIndex((item) => item._id === todo._id);

      if (fromIndex === -1 || toIndex === -1) return;

      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedItem);
      updated.forEach((item, index) => {
        item.order = index;
      });

      currentTodos = updated;
      renderTodos(updated);

      try {
        await persistOrder(updated);
      } catch (error) {
        showError(error.message || 'Unable to save new order');
      }
    });

    li.querySelector('input[type="checkbox"]').addEventListener('change', () =>
      toggleTodo(todo._id, !todo.completed)
    );
    li.querySelector('.edit-btn').addEventListener('click', () => startEditTodo(todo));
    li.querySelector('.delete-btn').addEventListener('click', () => deleteTodo(todo._id));

    todoList.appendChild(li);
  });
}

function renderCurrentTodos() {
  renderTodos(currentTodos);
}

async function loadTodos() {
  renderSkeletons();

  try {
    const todos = await apiRequest('/todos');
    currentTodos = todos;
    renderTodos(todos);
  } catch (error) {
    showError(error.message);
    todoList.innerHTML = '';
    if (emptyState) {
      emptyState.style.display = 'block';
    }
  }
}

addTodoForm.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target === todoInput) {
    event.preventDefault();
    addTodoForm.requestSubmit();
  }
});

addTodoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = todoInput.value.trim();
  if (!title) return;

  const temporaryTodo = {
    _id: `temporary-${Date.now()}`,
    title,
    completed: false,
    dueDate: todoDueDate.value || null,
    category: todoCategory.value || 'General',
    order: currentTodos.length,
  };

  currentTodos = [temporaryTodo, ...currentTodos];
  todoInput.value = '';
  todoDueDate.value = '';
  todoCategory.value = 'General';
  renderCurrentTodos();

  try {
    const createdTodo = await apiRequest('/todos', {
      method: 'POST',
      body: JSON.stringify({
        title,
        dueDate: temporaryTodo.dueDate,
        category: temporaryTodo.category,
      }),
    });

    const temporaryIndex = currentTodos.findIndex((todo) => todo._id === temporaryTodo._id);
    if (temporaryIndex !== -1) {
      currentTodos.splice(temporaryIndex, 1, createdTodo);
      renderCurrentTodos();
    }
  } catch (error) {
    currentTodos = currentTodos.filter((todo) => todo._id !== temporaryTodo._id);
    renderCurrentTodos();
    showError(error.message);
  }
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeCategoryFilter = button.dataset.filter;

    filterButtons.forEach((btn) => {
      btn.classList.toggle('active', btn === button);
    });

    renderTodos(currentTodos);
  });
});

statusButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeStatusFilter = button.dataset.status;

    statusButtons.forEach((btn) => {
      btn.classList.toggle('active', btn === button);
    });

    renderTodos(currentTodos);
  });
});

if (todoSearch) {
  todoSearch.addEventListener('input', () => {
    renderTodos(currentTodos);
  });
}

async function toggleTodo(id, completed) {
  const todo = currentTodos.find((item) => item._id === id);
  if (!todo) return;

  const previousCompleted = todo.completed;
  todo.completed = completed;
  renderCurrentTodos();

  try {
    await apiRequest(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ completed }),
    });
  } catch (error) {
    todo.completed = previousCompleted;
    renderCurrentTodos();
    showError(error.message);
  }
}

async function deleteTodo(id) {
  const deletedTodo = currentTodos.find((todo) => todo._id === id);
  if (!deletedTodo) return;

  const item = todoList.querySelector(`li[data-id="${id}"]`);
  if (item) item.classList.add('removing');
  currentTodos = currentTodos.filter((todo) => todo._id !== id);
  setTimeout(renderCurrentTodos, 180);

  try {
    await apiRequest(`/todos/${id}`, { method: 'DELETE' });
  } catch (error) {
    currentTodos.push(deletedTodo);
    currentTodos = sortTodos(currentTodos);
    renderCurrentTodos();
    showError(error.message);
  }
}

logoutBtn.addEventListener('click', () => {
  clearToken();
  window.location.href = 'index.html';
});

if (darkModeToggle) {
  darkModeToggle.addEventListener('click', toggleDarkMode);
}

applyDarkMode();
loadTodos();
