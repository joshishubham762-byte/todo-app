import React from 'react';
import { Check, GripVertical, LogOut, Moon, Pencil, Plus, Search, Sun, Trash2, X } from 'lucide-react';

export function AuthPage({ mode, onSubmit, onGoogleLogin, onSwitch, error, loading }) {
  const signup = mode === 'signup';
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,#c7d2fe,transparent_35%),linear-gradient(135deg,#f8fafc,#ecfeff)] px-5 py-10 text-slate-900 dark:bg-[radial-gradient(circle_at_15%_10%,#1e1b4b,transparent_38%),linear-gradient(135deg,#0f172a,#164e63)] dark:text-slate-100">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <div className="w-full rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-soft backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/80 sm:p-10">
          <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white shadow-lg shadow-indigo-600/25"><Check /></div>
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Productivity hub</p>
          <h1 className="font-display text-center text-3xl font-bold tracking-tight">{signup ? 'Create your account' : 'Welcome back'}</h1>
          <p className="mb-8 mt-2 text-center text-sm text-slate-500 dark:text-slate-400">{signup ? 'Start organizing your tasks.' : 'Log in to see your todos.'}</p>
          <form className="space-y-4" onSubmit={onSubmit}>
            {signup && <Field id="name" label="Name" type="text" required />}
            <Field id="email" label="Email" type="email" required />
            <Field id="password" label="Password" type="password" minLength={6} required />
            {signup && <Field id="confirmPassword" label="Confirm password" type="password" minLength={6} required />}
            {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 active:translate-y-0 disabled:cursor-wait disabled:opacity-60">{loading ? 'Please wait...' : signup ? 'Sign up' : 'Log in'}</button>
          </form>
          {!signup && <GoogleSignIn onCredential={onGoogleLogin} />}
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">{signup ? 'Already have an account?' : "Don't have an account?"}{' '}<button type="button" onClick={onSwitch} className="font-semibold text-indigo-600 hover:underline dark:text-indigo-300">{signup ? 'Log in' : 'Sign up'}</button></p>
        </div>
      </section>
    </main>
  );
}

function GoogleSignIn({ onCredential }) {
  const buttonRef = React.useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  React.useEffect(() => {
    if (!clientId) return undefined;
    const renderButton = () => {
      if (!buttonRef.current || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({ client_id: clientId, callback: (response) => onCredential(response.credential) });
      window.google.accounts.id.renderButton(buttonRef.current, { theme: 'outline', size: 'large', width: 360, text: 'signin_with' });
    };
    if (window.google?.accounts?.id) {
      renderButton();
      return undefined;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderButton;
    document.head.appendChild(script);
    return () => { script.onload = null; };
  }, [clientId, onCredential]);

  return <div className="mt-5 border-t border-slate-200 pt-5 text-center dark:border-slate-700"><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Or continue with</p>{clientId ? <div ref={buttonRef} className="flex justify-center" /> : <button type="button" disabled className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-400 dark:border-slate-700">Google sign-in needs configuration</button>}</div>;
}

function Field({ id, label, ...props }) {
  return <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor={id}>{label}<input id={id} name={id} className="mt-2 w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-3 font-normal outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100" {...props} /></label>;
}

export function ErrorScreen({ onRetry }) {
  return <main className="grid min-h-screen place-items-center bg-slate-50 px-5 text-center text-slate-900 dark:bg-slate-950 dark:text-slate-100"><div className="max-w-md"><div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-red-100 text-2xl font-bold text-red-600 dark:bg-red-950/60">!</div><h1 className="font-display text-3xl font-bold">Something went wrong</h1><p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">The app hit an unexpected error. Your data is still safe. Try loading the page again.</p><button onClick={onRetry} className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700">Reload app</button></div></main>;
}

export function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-slate-50 px-5 text-center text-slate-900 dark:bg-slate-950 dark:text-slate-100"><div><p className="font-display text-7xl font-bold text-indigo-600">404</p><h1 className="mt-3 font-display text-3xl font-bold">Page not found</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">That page does not exist.</p><a href="/" className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700">Back to login</a></div></main>;
}

export function Dashboard({ userName, todos, loading, weeklyCompleted, shareMessage, onShare, filters, setFilters, onAdd, onToggle, onDelete, onEdit, onReorder, darkMode, onToggleDarkMode, onLogout }) {
  const { category, status, search } = filters;
  const visible = todos.filter((todo) => (category === 'All' || (todo.category || 'General') === category)).filter((todo) => status === 'All' || (status === 'Active' ? !todo.completed : todo.completed)).filter((todo) => todo.title.toLowerCase().includes(search.toLowerCase()));
  const done = todos.filter((todo) => todo.completed).length;
  const active = todos.length - done;

  return <main className="min-h-screen bg-[radial-gradient(circle_at_90%_5%,#dbeafe,transparent_30%),linear-gradient(135deg,#f8fafc,#ecfeff)] px-4 py-6 text-slate-900 dark:bg-[radial-gradient(circle_at_90%_5%,#172554,transparent_35%),linear-gradient(135deg,#0f172a,#164e63)] dark:text-slate-100 sm:px-6 sm:py-10">
    <section className="mx-auto max-w-5xl rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/80 sm:p-8">
      <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Productivity hub</p><h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Hi, {userName}</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">A calmer place to get things done.</p></div><div className="flex gap-2"><button onClick={onToggleDarkMode} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-800/70">{darkMode ? <Sun size={16} /> : <Moon size={16} />}{darkMode ? 'Light' : 'Dark'}</button><button onClick={onLogout} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-800/70"><LogOut size={16} /> Log out</button></div></header>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Tasks', todos.length], ['Done', done], ['Active', active], ['This week', weeklyCompleted]].map(([label, value]) => <div key={label} className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900/70 dark:bg-indigo-950/40"><p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p><strong className="mt-2 block text-3xl">{value}</strong>{label === 'This week' && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">completed</p>}</div>)}</div>
      <TodoForm onAdd={onAdd} />
      <ShareList onShare={onShare} message={shareMessage} />
      <div className="mb-4 flex flex-col gap-3"><div className="flex flex-wrap gap-2">{['All', 'Work', 'Personal', 'Urgent', 'General'].map((item) => <FilterButton key={item} active={category === item} onClick={() => setFilters((current) => ({ ...current, category: item }))}>{item}</FilterButton>)}</div><div className="flex flex-col gap-3 md:flex-row"><label className="relative flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input value={search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search todos..." className="w-full rounded-xl border border-slate-200 bg-white/70 py-2.5 pl-10 pr-3 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800/70" /></label><div className="flex gap-2">{['All', 'Active', 'Completed'].map((item) => <FilterButton key={item} active={status === item} onClick={() => setFilters((current) => ({ ...current, status: item }))}>{item}</FilterButton>)}</div></div></div>
      <section className="rounded-2xl border border-slate-200/80 bg-white/45 p-3 dark:border-slate-700/80 dark:bg-slate-950/20"><h2 className="px-2 pb-3 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Today's tasks</h2>{loading ? <Skeletons /> : visible.length ? <ul className="space-y-2">{visible.map((todo) => <TodoItem key={todo._id} todo={todo} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onReorder={onReorder} />)}</ul> : <div className="rounded-xl border border-dashed border-slate-300 px-5 py-12 text-center dark:border-slate-700"><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300"><Check /></div><h3 className="font-display text-lg font-bold">All caught up</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add a task above and make today count.</p></div>}</section>
    </section>
  </main>;
}

function ShareList({ onShare, message }) {
  const [email, setEmail] = React.useState('');
  return <form onSubmit={(event) => { event.preventDefault(); if (!email.trim()) return; onShare(email.trim()); setEmail(''); }} className="mb-5 flex flex-col gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900/70 dark:bg-emerald-950/20 sm:flex-row sm:items-center"><div className="flex-1"><p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Share this list</p><p className="text-xs text-emerald-800/70 dark:text-emerald-300/70">Invite a registered user to view and edit your todos.</p></div><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teammate@email.com" className="rounded-xl border border-emerald-200 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-emerald-800 dark:bg-slate-900" /><button className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700">Share</button>{message && <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 sm:max-w-48">{message}</p>}</form>;
}

function FilterButton({ active, children, onClick }) { return <button onClick={onClick} className={`rounded-full border px-3.5 py-2 text-xs font-bold transition hover:-translate-y-0.5 ${active ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'border-slate-200 bg-white/60 text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300'}`}>{children}</button>; }

function TodoForm({ onAdd }) { const [form, setForm] = React.useState({ title: '', dueDate: '', category: 'General' }); return <form onSubmit={(event) => { event.preventDefault(); if (!form.title.trim()) return; onAdd(form); setForm({ title: '', dueDate: '', category: 'General' }); }} className="mb-5 grid gap-2 rounded-2xl border border-slate-200 bg-white/55 p-3 dark:border-slate-700 dark:bg-slate-950/30 sm:grid-cols-[1fr_auto_auto_auto]"><input autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="What do you need to do?" className="rounded-xl border border-slate-200 bg-white/80 px-3.5 py-3 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800/70" /><input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} className="rounded-xl border border-slate-200 bg-white/80 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/70" /><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="rounded-xl border border-slate-200 bg-white/80 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/70"><option>General</option><option>Work</option><option>Personal</option><option>Urgent</option></select><button className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-indigo-700"><Plus size={18} /> Add</button></form>; }

function Skeletons() { return <ul className="space-y-2">{[1, 2, 3].map((item) => <li key={item} className="flex animate-pulse items-center gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700"><span className="h-5 w-5 rounded-md bg-slate-200 dark:bg-slate-700" /><span className="h-3 w-2/5 rounded bg-slate-200 dark:bg-slate-700" /></li>)}</ul>; }

function TodoItem({ todo, onToggle, onDelete, onEdit, onReorder }) { const [editing, setEditing] = React.useState(false); const [title, setTitle] = React.useState(todo.title); const overdue = todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)); return <li draggable={!editing} onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', todo._id); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); onReorder(event.dataTransfer.getData('text/plain'), todo._id); }} className={`group flex items-center gap-3 rounded-xl border bg-white/80 p-3 transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80 ${todo.completed ? 'border-emerald-200 dark:border-emerald-900' : 'border-slate-200'}`}><GripVertical className="hidden shrink-0 text-slate-300 sm:block" size={18} /><input type="checkbox" checked={todo.completed} onChange={() => onToggle(todo._id)} className="h-5 w-5 accent-emerald-500" />{editing ? <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); onEdit(todo._id, title); setEditing(false); } if (event.key === 'Escape') { setTitle(todo.title); setEditing(false); } }} className="min-w-0 flex-1 rounded-lg border border-indigo-300 bg-white px-3 py-2 dark:bg-slate-900" /> : <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`break-words ${todo.completed ? 'text-slate-400 line-through' : ''}`}>{todo.title}</span><span className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-300">{todo.category || 'General'}</span></div><p className={`mt-1 text-xs ${overdue ? 'font-semibold text-red-600' : 'text-slate-400'}`}>{todo.dueDate ? `Due: ${new Date(todo.dueDate).toLocaleDateString()}` : 'No due date'}</p></div>}{editing ? <><button onClick={() => { onEdit(todo._id, title); setEditing(false); }} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50" aria-label="Save"><Check size={17} /></button><button onClick={() => { setTitle(todo.title); setEditing(false); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Cancel"><X size={17} /></button></> : <><button onClick={() => setEditing(true)} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50" aria-label="Edit"><Pencil size={17} /></button><button onClick={() => onDelete(todo._id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50" aria-label="Delete"><Trash2 size={17} /></button></>}</li>; }

