import { useEffect, useState } from 'react';
import { AuthPage, Dashboard, NotFound } from './components';
import { apiRequest, clearToken, getToken, setToken } from './api';

const defaultFilters = { category: 'All', status: 'All', search: '' };

export default function App() {
  const [screen, setScreen] = useState(() => {
    const path = window.location.pathname;
    if (path !== '/' && path !== '/signup' && path !== '/signup.html') return 'notFound';
    return getToken() ? 'dashboard' : path.includes('signup') ? 'signup' : 'login';
  });
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || 'there');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [todos, setTodos] = useState([]);
  const [todosLoading, setTodosLoading] = useState(false);
  const [weeklyCompleted, setWeeklyCompleted] = useState(0);
  const [shareMessage, setShareMessage] = useState('');
  const [filters, setFilters] = useState(defaultFilters);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('todoDarkMode') === 'true');

  useEffect(() => {
    document.title = screen === 'dashboard' ? 'My Todos | Focus' : screen === 'signup' ? 'Create account | Focus' : screen === 'notFound' ? 'Page not found | Focus' : 'Sign in | Focus';
  }, [screen]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('todoDarkMode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    if (screen !== 'dashboard') return;
    const refreshData = (showLoading = false) => {
      if (showLoading) setTodosLoading(true);
      Promise.all([apiRequest('/todos'), apiRequest('/todos/stats')])
        .then(([todoData, statsData]) => {
          setTodos(todoData);
          setWeeklyCompleted(statsData.completedThisWeek);
        })
        .catch((requestError) => setError(requestError.message))
        .finally(() => setTodosLoading(false));
    };

    refreshData(true);
    const channel = 'BroadcastChannel' in window ? new BroadcastChannel('todo-app-sync') : null;
    if (channel) channel.onmessage = () => refreshData();
    const interval = window.setInterval(() => refreshData(), 10000);
    return () => {
      channel?.close();
      window.clearInterval(interval);
    };
  }, [screen]);

  function notifySync() {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('todo-app-sync');
      channel.postMessage({ updatedAt: Date.now() });
      channel.close();
    }
  }

  function switchScreen(nextScreen) {
    setError('');
    setScreen(nextScreen);
    window.history.pushState({}, '', nextScreen === 'signup' ? '/signup' : '/');
  }

  async function submitAuth(event) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form.entries());
    if (screen === 'signup' && values.password !== values.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const endpoint = screen === 'signup' ? '/auth/signup' : '/auth/login';
      const data = await apiRequest(endpoint, { method: 'POST', body: JSON.stringify(screen === 'signup' ? { name: values.name, email: values.email, password: values.password } : { email: values.email, password: values.password }) });
      setToken(data.token);
      localStorage.setItem('userName', data.user.name);
      setUserName(data.user.name);
      setScreen('dashboard');
      window.history.pushState({}, '', '/');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitGoogleCredential(credential) {
    setError('');
    setLoading(true);
    try {
      const data = await apiRequest('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) });
      setToken(data.token);
      localStorage.setItem('userName', data.user.name);
      setUserName(data.user.name);
      setScreen('dashboard');
      window.history.pushState({}, '', '/');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function addTodo(form) {
    const temporaryTodo = { _id: `temporary-${Date.now()}`, title: form.title.trim(), completed: false, dueDate: form.dueDate || null, category: form.category, order: todos.length };
    setTodos((current) => [temporaryTodo, ...current]);
    notifySync();
    try {
      const created = await apiRequest('/todos', { method: 'POST', body: JSON.stringify({ title: temporaryTodo.title, dueDate: temporaryTodo.dueDate, category: temporaryTodo.category }) });
      setTodos((current) => current.map((todo) => todo._id === temporaryTodo._id ? created : todo));
      notifySync();
    } catch (requestError) {
      setTodos((current) => current.filter((todo) => todo._id !== temporaryTodo._id));
      setError(requestError.message);
    }
  }

  async function toggleTodo(id) {
    const existing = todos.find((todo) => todo._id === id);
    if (!existing) return;
    const completed = !existing.completed;
    setTodos((current) => current.map((todo) => todo._id === id ? { ...todo, completed } : todo));
    notifySync();
    try { await apiRequest(`/todos/${id}`, { method: 'PUT', body: JSON.stringify({ completed }) }); notifySync(); } catch (requestError) { setTodos((current) => current.map((todo) => todo._id === id ? { ...todo, completed: existing.completed } : todo)); setError(requestError.message); }
  }

  async function editTodo(id, title) {
    const cleanTitle = title.trim();
    if (!cleanTitle) return setError('Todo title cannot be empty');
    const existing = todos.find((todo) => todo._id === id);
    setTodos((current) => current.map((todo) => todo._id === id ? { ...todo, title: cleanTitle } : todo));
    try { await apiRequest(`/todos/${id}`, { method: 'PUT', body: JSON.stringify({ title: cleanTitle }) }); notifySync(); } catch (requestError) { setTodos((current) => current.map((todo) => todo._id === id ? existing : todo)); setError(requestError.message); }
  }

  async function deleteTodo(id) {
    const existing = todos.find((todo) => todo._id === id);
    setTodos((current) => current.filter((todo) => todo._id !== id));
    notifySync();
    try { await apiRequest(`/todos/${id}`, { method: 'DELETE' }); notifySync(); } catch (requestError) { setTodos((current) => [...current, existing]); setError(requestError.message); }
  }

  async function reorderTodos(fromId, toId) {
    if (!fromId || fromId === toId) return;
    const reordered = [...todos];
    const fromIndex = reordered.findIndex((todo) => todo._id === fromId);
    const toIndex = reordered.findIndex((todo) => todo._id === toId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const withOrder = reordered.map((todo, index) => ({ ...todo, order: index }));
    setTodos(withOrder);
    notifySync();
    try { await Promise.all(withOrder.map((todo, index) => apiRequest(`/todos/${todo._id}`, { method: 'PUT', body: JSON.stringify({ order: index }) }))); notifySync(); } catch (requestError) { setError(requestError.message); }
  }

  async function shareList(email) {
    setShareMessage('');
    try {
      const data = await apiRequest('/todos/share', { method: 'POST', body: JSON.stringify({ email }) });
      setShareMessage(data.message);
    } catch (requestError) {
      setShareMessage(requestError.message);
    }
  }

  function logout() { clearToken(); setTodos([]); setScreen('login'); window.history.pushState({}, '', '/'); }

  if (screen === 'notFound') return <NotFound />;
  if (screen !== 'dashboard') return <AuthPage mode={screen} onSubmit={submitAuth} onGoogleLogin={submitGoogleCredential} onSwitch={() => switchScreen(screen === 'signup' ? 'login' : 'signup')} error={error} loading={loading} />;
  return <Dashboard userName={userName} todos={todos} loading={todosLoading} weeklyCompleted={weeklyCompleted} shareMessage={shareMessage} onShare={shareList} filters={filters} setFilters={setFilters} onAdd={addTodo} onToggle={toggleTodo} onDelete={deleteTodo} onEdit={editTodo} onReorder={reorderTodos} darkMode={darkMode} onToggleDarkMode={() => setDarkMode((current) => !current)} onLogout={logout} />;
}
