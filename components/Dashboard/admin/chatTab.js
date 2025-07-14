// components/Dashboard/admin/ChatTab.js - Unified group & 1‑to‑1 chat

/* -------------------------------------------------------------------------
  ABOUT
  ───────────────────────────────────────────────────────────────────────────
  • All authenticated users (admins + employees) can join a single company‑wide
    “general” chat room **or** start 1‑to‑1 DMs.
  • Chats live in   /chats/{roomId}/messages   where roomId is:
        – "general"  → company‑wide room (everyone sees the same thread)
        – "dm_<uid1>_<uid2>" (sorted) → direct messages between two UIDs
  • Messages documents:
        { text, senderUid, senderName, createdAt: serverTimestamp() }
---------------------------------------------------------------------------*/

import { useState, useEffect, useRef, Fragment } from "react";
import { db, auth } from "../../../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";

const GENERAL_ROOM = "general"; // company‑wide chat id

export default function ChatTab({ employees }) {
  const [user, setUser] = useState(null);           // firebase auth user
  const [roomId, setRoomId] = useState(GENERAL_ROOM); // current room (general or dm)
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef(null);

  /* ─────────────────────────── auth listener */
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  /* ─────────────────────────── subscribe to messages */
  useEffect(() => {
    if (!roomId) return;
    const q = query(
      collection(db, "chats", roomId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() }))
      );
    });
    return () => unsub();
  }, [roomId]);

  /* ─────────────────────────── auto‑scroll */
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));

  /* ─────────────────────────── helpers */
  const sendMessage = async () => {
    if (!user || !message.trim()) return;
    setIsSending(true);
    await addDoc(collection(db, "chats", roomId, "messages"), {
      text: message.trim(),
      senderUid: user.uid,
      senderName: user.displayName || user.email,
      createdAt: serverTimestamp(),
    });
    setMessage("");
    setIsSending(false);
  };

  const dmRoomId = (uid1, uid2) => {
    return [uid1, uid2].sort().join("_").replace(/^/, "dm_");
  };

  /* ─────────────────────────── UI */
  if (!user) return <p className="p-4">Authenticating…</p>;

  /** list of potential DM targets (exclude self) */
  const dmTargets = employees.filter((e) => e.uid !== user.uid);

  return (
    <div className="h-full flex flex-col p-4">
      {/* TOP BAR */}
      <div className="mb-4 flex items-center space-x-2">
        <button
          className={`px-3 py-1.5 rounded-lg text-sm ${roomId === GENERAL_ROOM ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
          onClick={() => setRoomId(GENERAL_ROOM)}
        >
          # General Chat
        </button>
        {dmTargets.length > 0 && (
          <Fragment>
            <span className="text-gray-500 text-sm">|</span>
            <select
              className="border rounded-lg px-2 py-1 text-sm"
              value={roomId.startsWith("dm_") ? roomId : ""}
              onChange={(e) => setRoomId(e.target.value)}
            >
              <option value="">Direct Message…</option>
              {dmTargets.map((emp) => (
                <option key={emp.uid} value={dmRoomId(user.uid, emp.uid)}>
                  {emp.name || emp.email}
                </option>
              ))}
            </select>
          </Fragment>
        )}
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 bg-white border rounded-xl p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500">No messages yet.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.senderUid === user.uid ? "justify-end" : "justify-start"}`}>
              <div className={`px-4 py-2 rounded-lg max-w-xs md:max-w-md text-sm ${m.senderUid === user.uid ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>
                <p>{m.text}</p>
                <p className="text-[10px] opacity-60 mt-1 text-right">
                  {m.senderUid === user.uid ? "You" : m.senderName} • {m.createdAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* INPUT BAR */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="mt-3 flex items-center space-x-2"
      >
        <input
          className="flex-grow border rounded-full px-4 py-2 focus:ring-2 focus:ring-indigo-500"
          placeholder="Type a message…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className={`p-2 rounded-full ${message.trim() ? "bg-indigo-600 text-white" : "bg-gray-300"}`}
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
