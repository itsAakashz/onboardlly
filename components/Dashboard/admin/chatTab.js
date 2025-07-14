// components/Dashboard/admin/ChatTab.js – unified group + DM with sender names
/* -------------------------------------------------------------------------
   • “general” room for everyone.
   • “dm_<uid1>_<uid2>” for direct messages (uids sorted).
   • Every message stores senderName, so the bubble shows who wrote it.
---------------------------------------------------------------------------*/

import { useState, useEffect, useRef, Fragment } from "react";
import { db, auth } from "../../../lib/firebase";
import {
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";

const GENERAL_ROOM = "general";

export default function ChatTab({ employees }) {
  const [user, setUser] = useState(null);
  const [roomId, setRoomId] = useState(GENERAL_ROOM);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);

  /* auth */
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  /* subscribe to selected room */
  useEffect(() => {
    if (!roomId) return;
    const q = query(
      collection(db, "chats", roomId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate(),
        }))
      );
    });
    return () => unsub();
  }, [roomId]);

  /* auto‑scroll */
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [
    messages,
  ]);

  /* helpers */
  const dmId = (uid1, uid2) => `dm_${[uid1, uid2].sort().join("_")}`;

  const sendMessage = async () => {
    if (!user || !message.trim()) return;
    await addDoc(collection(db, "chats", roomId, "messages"), {
      text: message.trim(),
      senderUid: user.uid,
      senderName: user.displayName || user.email,
      createdAt: serverTimestamp(),
    });
    setMessage("");
  };

  if (!user) return <p className="p-4">Authenticating…</p>;

  const dmTargets = employees.filter((e) => e.uid !== user.uid);
  const activeDM =
    roomId.startsWith("dm_") &&
    dmTargets.find((t) => roomId.includes(t.uid));

  return (
    <div className="h-full flex flex-col p-4">
      {/* TOP BAR */}
      <div className="mb-4 flex items-center space-x-2">
        <button
          className={`px-3 py-1.5 rounded-lg text-sm ${
            roomId === GENERAL_ROOM ? "bg-indigo-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setRoomId(GENERAL_ROOM)}
        >
          # General
        </button>

        {dmTargets.length > 0 && (
          <Fragment>
            <span className="text-gray-500 text-sm">|</span>
            <select
              className="border rounded-lg px-2 py-1 text-sm bg-black"
              value={roomId.startsWith("dm_") ? roomId : ""}
              onChange={(e) => setRoomId(e.target.value)}
            >
              <option value="">Direct Message…</option>
              {dmTargets.map((emp) => (
                <option key={emp.uid} value={dmId(user.uid, emp.uid)}>
                  {emp.name || emp.email}
                </option>
              ))}
            </select>
          </Fragment>
        )}

        <span className="ml-auto text-sm text-gray-600">
          {roomId === GENERAL_ROOM
            ? "#general"
            : activeDM
            ? activeDM.name || activeDM.email
            : "DM"}
        </span>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 bg-white border rounded-xl p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500">No messages yet.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.senderUid === user.uid ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-lg max-w-xs md:max-w-md text-sm ${
                  m.senderUid === user.uid
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100"
                }`}
              >
                <p>{m.text}</p>
                <p className="text-[10px] opacity-60 mt-1 text-right">
                  {m.senderName} •{" "}
                  {m.createdAt?.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="mt-3 flex items-center space-x-2"
      >
        <input
          className="flex-grow border rounded-full px-4 py-2 focus:ring-2 focus:ring-indigo-500 bg-black"
          placeholder="Type a message…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className={`p-2 rounded-full ${
            message.trim() ? "bg-indigo-600 text-white" : "bg-gray-300"
          }`}
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
