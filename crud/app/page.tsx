"use client";

import { FormEvent, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
};

type Note = {
  _id: string;
  title: string;
  content: string;
  completed: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function Home() {
  const [message, setMessage] = useState("");
  const [accessToken, setAccessToken] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("accessToken") || "" : ""
  );
  const [refreshToken, setRefreshToken] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("refreshToken") || "" : ""
  );
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const savedUser = localStorage.getItem("user");
    return savedUser ? (JSON.parse(savedUser) as User) : null;
  });
  const [notes, setNotes] = useState<Note[]>([]);

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [verifyToken, setVerifyToken] = useState("");

  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const saveAuth = (newAccessToken: string, newRefreshToken: string, newUser: User) => {
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setUser(newUser);
    localStorage.setItem("accessToken", newAccessToken);
    localStorage.setItem("refreshToken", newRefreshToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const clearAuth = () => {
    setAccessToken("");
    setRefreshToken("");
    setUser(null);
    setNotes([]);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  };

  const signup = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    const response = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
      }),
    });
    const data = await response.json();
    setMessage(data.message || "Signup complete.");
  };

  const verifyEmail = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    const response = await fetch(
      `${API_BASE}/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}`
    );
    const data = await response.json();
    setMessage(data.message || "Verification complete.");
  };

  const login = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: loginEmail,
        password: loginPassword,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Login failed.");
      return;
    }
    saveAuth(data.accessToken, data.refreshToken, data.user);
    setMessage("Login successful.");
  };

  const loadNotes = async () => {
    if (!accessToken) return;
    const response = await fetch(`${API_BASE}/api/notes`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Failed to load notes.");
      return;
    }
    setNotes(data);
  };

  const createNote = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    const response = await fetch(`${API_BASE}/api/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        title: noteTitle,
        content: noteContent,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Failed to create note.");
      return;
    }
    setNoteTitle("");
    setNoteContent("");
    setMessage("Note created.");
    await loadNotes();
  };

  const toggleComplete = async (note: Note) => {
    const response = await fetch(`${API_BASE}/api/notes/${note._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        completed: !note.completed,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Failed to update note.");
      return;
    }
    await loadNotes();
  };

  const deleteNote = async (id: string) => {
    const response = await fetch(`${API_BASE}/api/notes/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Failed to delete note.");
      return;
    }
    setMessage("Note deleted.");
    await loadNotes();
  };

  const refreshAccess = async () => {
    if (!refreshToken) return;
    const response = await fetch(`${API_BASE}/api/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Refresh token failed.");
      return;
    }
    setAccessToken(data.accessToken);
    localStorage.setItem("accessToken", data.accessToken);
    setMessage("Access token refreshed.");
  };

  const logout = async () => {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    clearAuth();
    setMessage("Logged out.");
  };

  return (
    <main className="mx-auto w-full max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Auth + Notes CRUD Demo</h1>
      <p className="text-sm text-gray-600">Frontend: localhost:3000 | Backend: {API_BASE}</p>
      {message ? <p className="rounded bg-gray-100 px-3 py-2 text-sm">{message}</p> : null}

      <section className="grid gap-6 md:grid-cols-3">
        <form onSubmit={signup} className="space-y-2 rounded border p-4">
          <h2 className="font-semibold">Signup</h2>
          <input className="w-full rounded border p-2" placeholder="Name" value={signupName} onChange={(e) => setSignupName(e.target.value)} />
          <input className="w-full rounded border p-2" placeholder="Email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
          <input className="w-full rounded border p-2" placeholder="Password" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} />
          <button className="rounded bg-black px-3 py-2 text-white" type="submit">Create Account</button>
        </form>

        <form onSubmit={verifyEmail} className="space-y-2 rounded border p-4">
          <h2 className="font-semibold">Verify Email</h2>
          <input className="w-full rounded border p-2" placeholder="Verification token" value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} />
          <button className="rounded bg-black px-3 py-2 text-white" type="submit">Verify</button>
        </form>

        <form onSubmit={login} className="space-y-2 rounded border p-4">
          <h2 className="font-semibold">Login</h2>
          <input className="w-full rounded border p-2" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
          <input className="w-full rounded border p-2" placeholder="Password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
          <button className="rounded bg-black px-3 py-2 text-white" type="submit">Login</button>
        </form>
      </section>

      <section className="space-y-3 rounded border p-4">
        <h2 className="font-semibold">Session</h2>
        <p className="text-sm">{user ? `Logged in as ${user.name} (${user.email})` : "Not logged in"}</p>
        <div className="flex gap-2">
          <button className="rounded bg-black px-3 py-2 text-white" onClick={refreshAccess} type="button">Refresh Access</button>
          <button className="rounded border px-3 py-2" onClick={logout} type="button">Logout</button>
        </div>
      </section>

      <section className="space-y-3 rounded border p-4">
        <h2 className="font-semibold">Notes CRUD (Protected)</h2>
        <form onSubmit={createNote} className="grid gap-2 md:grid-cols-3">
          <input className="rounded border p-2" placeholder="Title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} />
          <input className="rounded border p-2" placeholder="Content" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} />
          <button className="rounded bg-black px-3 py-2 text-white" type="submit">Create Note</button>
        </form>
        <button className="rounded border px-3 py-2" onClick={loadNotes} type="button">Load My Notes</button>
        <ul className="space-y-2">
          {notes.map((note) => (
            <li key={note._id} className="rounded border p-3">
              <p className="font-medium">{note.title}</p>
              <p className="text-sm text-gray-600">{note.content}</p>
              <p className="text-sm">Completed: {note.completed ? "Yes" : "No"}</p>
              <div className="mt-2 flex gap-2">
                <button className="rounded border px-2 py-1 text-sm" onClick={() => toggleComplete(note)} type="button">
                  Toggle Complete
                </button>
                <button className="rounded border px-2 py-1 text-sm" onClick={() => deleteNote(note._id)} type="button">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
