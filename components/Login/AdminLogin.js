import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      /* 1️⃣  First, check if this email is on the admin allow‑list */
      const allowQ = query(
        collection(db, "admins"),               // 🔑 new collection
        where("email", "==", email.trim().toLowerCase())
      );
      const allowSnap = await getDocs(allowQ);

      if (allowSnap.empty) {
        setError("Not authorised.");
        return; // Stop here, never attempt sign‑in
      }

      /* 2️⃣  Email is allowed → verify password with Firebase Auth */
      await signInWithEmailAndPassword(auth, email, password);

      /* 3️⃣  Success → redirect */
      window.location.href = "/dashboard/admin";
    } catch (err) {
      await signOut(auth).catch(() => {});
      setError("Invalid credentials or not authorised.");
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4 max-w-sm mx-auto">
      <input
        type="email"
        placeholder="Admin Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border px-3 py-2 rounded"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border px-3 py-2 rounded"
        required
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
      >
        Login as Admin
      </button>
    </form>
  );
}
