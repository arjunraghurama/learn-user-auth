import { useState, useEffect, useRef } from 'react';
import keycloak from './Keycloak';
import './index.css';

function App() {
    const [authenticated, setAuthenticated] = useState(false);
    const [todos, setTodos] = useState([]);
    const [newTodoTitle, setNewTodoTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editingTitle, setEditingTitle] = useState('');
    const isRun = useRef(false);

    useEffect(() => {
        if (isRun.current) return;
        isRun.current = true;

        keycloak.init({ onLoad: 'check-sso', checkLoginIframe: false }).then(auth => {
            setAuthenticated(auth);
            if (auth) {
                fetchTodos();
            }
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    const fetchTodos = async () => {
        try {
            const response = await fetch('https://localhost/api/todos', {
                headers: {
                    Authorization: `Bearer ${keycloak.token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setTodos(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const createTodo = async (e) => {
        e.preventDefault();
        if (!newTodoTitle.trim()) return;

        try {
            const response = await fetch('https://localhost/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${keycloak.token}`
                },
                body: JSON.stringify({ title: newTodoTitle, completed: false })
            });

            if (response.ok) {
                const newTodo = await response.json();
                setTodos([...todos, newTodo]);
                setNewTodoTitle('');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const toggleTodo = async (id, currentStatus) => {
        try {
            const response = await fetch(`https://localhost/api/todos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${keycloak.token}`
                },
                body: JSON.stringify({ completed: !currentStatus })
            });
            if (response.ok) {
                const updated = await response.json();
                setTodos(todos.map(t => t._id === id ? updated : t));
            }
        } catch (e) { console.error(e); }
    };

    const deleteTodo = async (id) => {
        try {
            const response = await fetch(`https://localhost/api/todos/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${keycloak.token}`
                }
            });
            if (response.ok) {
                setTodos(todos.filter(t => t._id !== id));
            }
        } catch (e) { console.error(e); }
    };

    const startEdit = (todo) => {
        setEditingId(todo._id);
        setEditingTitle(todo.title);
    };

    const saveEdit = async (id) => {
        if (!editingTitle.trim()) {
            setEditingId(null);
            return;
        }
        try {
            const response = await fetch(`https://localhost/api/todos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${keycloak.token}`
                },
                body: JSON.stringify({ title: editingTitle })
            });
            if (response.ok) {
                const updated = await response.json();
                setTodos(todos.map(t => t._id === id ? updated : t));
                setEditingId(null);
            }
        } catch (e) { console.error(e); }
    };

    const handleEditKeyDown = (e, id) => {
        if (e.key === 'Enter') saveEdit(id);
        if (e.key === 'Escape') setEditingId(null);
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Initializing Secure Context...</p>
            </div>
        );
    }

    if (!authenticated) {
        return (
            <div className="splash-container">
                <div className="splash-card">
                    <h2>A Todos App</h2>
                    <p>Fast, unified task management.</p>
                    <div className="auth-buttons">
                        <button onClick={() => keycloak.login()} className="btn btn-primary">
                            Sign In
                        </button>
                        <button onClick={() => keycloak.register()} className="btn btn-secondary">
                            Create Account
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <header className="app-header">
                <h1>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    My Todos
                </h1>
                <div className="user-info">
                    <div className="user-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>Logged in as <strong>{keycloak.tokenParsed?.preferred_username}</strong></span>
                    </div>
                    <button onClick={() => keycloak.logout()} className="btn btn-outline">
                        Logout
                    </button>
                </div>
            </header>

            <main>
                <form onSubmit={createTodo} className="todo-form">
                    <input
                        type="text"
                        className="todo-input"
                        value={newTodoTitle}
                        onChange={(e) => setNewTodoTitle(e.target.value)}
                        placeholder="What needs to be done?"
                        autoFocus
                    />
                    <button type="submit" className="btn btn-primary">
                        Add Task
                    </button>
                </form>

                <ul className="todo-list">
                    {todos.length === 0 ? (
                        <div className="empty-state">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            <p>You have no pending tasks. Enjoy your day!</p>
                        </div>
                    ) : (
                        todos.map((todo, index) => (
                            <li key={todo._id} className={`todo-item ${todo.completed ? 'completed' : ''}`} style={{ animationDelay: `${index * 0.05}s` }}>
                                <div className="todo-item-content">
                                    <input
                                        type="checkbox"
                                        className="todo-checkbox"
                                        checked={todo.completed}
                                        onChange={() => toggleTodo(todo._id, todo.completed)}
                                    />
                                    {editingId === todo._id ? (
                                        <input
                                            type="text"
                                            className="todo-edit-input"
                                            value={editingTitle}
                                            onChange={(e) => setEditingTitle(e.target.value)}
                                            onKeyDown={(e) => handleEditKeyDown(e, todo._id)}
                                            onBlur={() => saveEdit(todo._id)}
                                            autoFocus
                                        />
                                    ) : (
                                        <span className="todo-item-title" onClick={() => toggleTodo(todo._id, todo.completed)} style={{ cursor: 'pointer' }}>
                                            {todo.title}
                                        </span>
                                    )}
                                </div>
                                <div className="todo-actions">
                                    {editingId === todo._id ? (
                                        <button className="action-btn" onClick={() => saveEdit(todo._id)} title="Save">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </button>
                                    ) : (
                                        <button className="action-btn" onClick={() => startEdit(todo)} title="Edit">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        </button>
                                    )}
                                    <button className="action-btn delete" onClick={() => deleteTodo(todo._id)} title="Delete">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </main>
        </div>
    );
}

export default App;
