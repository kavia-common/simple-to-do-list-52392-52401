import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const STORAGE_KEY = "kavia.todo.items.v1";

/**
 * Creates a reasonably unique id without adding a dependency.
 * @returns {string}
 */
function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Safely load todos from localStorage.
 * @returns {Array<{id: string, text: string, createdAt: number, updatedAt: number}>}
 */
function loadTodos() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Basic validation and normalization
    return parsed
      .filter((t) => t && typeof t === "object" && typeof t.id === "string")
      .map((t) => ({
        id: t.id,
        text: typeof t.text === "string" ? t.text : "",
        createdAt: typeof t.createdAt === "number" ? t.createdAt : Date.now(),
        updatedAt: typeof t.updatedAt === "number" ? t.updatedAt : Date.now(),
      }))
      .filter((t) => t.text.trim().length > 0);
  } catch {
    return [];
  }
}

/**
 * Safely persist todos to localStorage.
 * @param {Array} todos
 */
function saveTodos(todos) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // If storage is blocked/disabled, fail silently (app still works for the session).
  }
}

// PUBLIC_INTERFACE
function App() {
  const [todos, setTodos] = useState(() => loadTodos());
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const inputRef = useRef(null);
  const editInputRef = useRef(null);

  const totalCount = todos.length;

  const sortedTodos = useMemo(() => {
    // Newest first for a snappy feel
    return [...todos].sort((a, b) => b.createdAt - a.createdAt);
  }, [todos]);

  // Persist changes
  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  // Focus new item input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Focus edit input when entering edit mode
  useEffect(() => {
    if (editingId) {
      // Defer to next tick to ensure the input is rendered
      window.requestAnimationFrame(() => editInputRef.current?.focus());
    }
  }, [editingId]);

  // PUBLIC_INTERFACE
  const addTodo = () => {
    const text = newText.trim();
    if (!text) return;

    const now = Date.now();
    const todo = {
      id: createId(),
      text,
      createdAt: now,
      updatedAt: now,
    };

    setTodos((prev) => [todo, ...prev]);
    setNewText("");
    inputRef.current?.focus();
  };

  // PUBLIC_INTERFACE
  const deleteTodo = (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEditingText("");
    }
  };

  // PUBLIC_INTERFACE
  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditingText(todo.text);
  };

  // PUBLIC_INTERFACE
  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  // PUBLIC_INTERFACE
  const saveEdit = () => {
    const text = editingText.trim();
    if (!editingId) return;

    if (!text) {
      // If user clears the task, interpret as delete to avoid empty items.
      deleteTodo(editingId);
      return;
    }

    const now = Date.now();
    setTodos((prev) =>
      prev.map((t) => (t.id === editingId ? { ...t, text, updatedAt: now } : t))
    );
    setEditingId(null);
    setEditingText("");
  };

  const onNewKeyDown = (e) => {
    if (e.key === "Enter") addTodo();
  };

  const onEditKeyDown = (e) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") cancelEdit();
  };

  return (
    <div className="App">
      <div className="page">
        <header className="header">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">
              ✓
            </div>
            <div>
              <h1 className="title">Todo List</h1>
              <p className="subtitle">
                Add, edit, and delete tasks. Saved automatically in your browser.
              </p>
            </div>
          </div>

          <div className="meta" aria-label="Todo summary">
            <span className="pill">
              <span className="pill-dot" aria-hidden="true" />
              {totalCount} {totalCount === 1 ? "task" : "tasks"}
            </span>
          </div>
        </header>

        <main className="card" aria-label="Todo app">
          <section className="composer" aria-label="Add a task">
            <label className="sr-only" htmlFor="newTodo">
              New task
            </label>
            <input
              id="newTodo"
              ref={inputRef}
              className="input"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={onNewKeyDown}
              placeholder="What do you need to do?"
              autoComplete="off"
              inputMode="text"
            />
            <button
              className="btn btn-primary"
              onClick={addTodo}
              disabled={newText.trim().length === 0}
              type="button"
            >
              Add
            </button>
          </section>

          <section className="list" aria-label="Todo items">
            {sortedTodos.length === 0 ? (
              <div className="empty">
                <div className="empty-title">No tasks yet</div>
                <div className="empty-desc">Add your first task above.</div>
              </div>
            ) : (
              <ul className="items" aria-label="Todo list">
                {sortedTodos.map((todo) => {
                  const isEditing = editingId === todo.id;

                  return (
                    <li key={todo.id} className={`item ${isEditing ? "is-editing" : ""}`}>
                      <div className="item-main">
                        {isEditing ? (
                          <>
                            <label className="sr-only" htmlFor={`edit-${todo.id}`}>
                              Edit task
                            </label>
                            <input
                              id={`edit-${todo.id}`}
                              ref={editInputRef}
                              className="input input-edit"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyDown={onEditKeyDown}
                              autoComplete="off"
                            />
                            <div className="item-actions">
                              <button
                                className="btn btn-success"
                                type="button"
                                onClick={saveEdit}
                              >
                                Save
                              </button>
                              <button className="btn btn-ghost" type="button" onClick={cancelEdit}>
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="item-text">{todo.text}</div>
                            <div className="item-actions">
                              <button
                                className="btn btn-secondary"
                                type="button"
                                onClick={() => startEdit(todo)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-danger"
                                type="button"
                                onClick={() => deleteTodo(todo.id)}
                                aria-label={`Delete task: ${todo.text}`}
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <footer className="footer">
            <span className="footer-hint">
              Tip: Press <kbd>Enter</kbd> to add/save, <kbd>Esc</kbd> to cancel editing.
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
