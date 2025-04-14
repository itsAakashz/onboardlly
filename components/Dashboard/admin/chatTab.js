import { useEffect, useRef, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";

const ChatTab = ({ users, currentUser }) => {
  const [selectedUser, setSelectedUser] = useState("");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  const chatId = selectedUser
    ? [currentUser.email, selectedUser].sort().join("_")
    : null;

  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: message.trim(),
        sender: currentUser.email,
        receiver: selectedUser,
        timestamp: serverTimestamp(),
      });
      setMessage("");
    } catch (err) {
      console.error("Message send error:", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const getUserLabel = (email) => {
    const user = users.find((u) => u.email === email);
    return user ? `${user.name || email}` : email;
  };

  const filteredUsers = users.filter((u) => u.email !== currentUser.email);

  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {currentUser.isAdmin ? "Admin Chat Panel" : "Employee Chat Panel"}
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select {currentUser.isAdmin ? "Employee" : "Admin"}
        </label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Choose a user to chat with...</option>
          {filteredUsers.map((user) => (
            <option key={user.email} value={user.email}>
              {getUserLabel(user.email)}
            </option>
          ))}
        </select>
      </div>

      {selectedUser ? (
        <>
          <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-y-auto p-4 space-y-2">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500">
                No messages yet. Start the conversation!
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === currentUser.email ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[75%] ${
                      msg.sender === currentUser.email
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs text-right mt-1 opacity-60">
                      {msg.timestamp?.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="mt-4">
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-grow border border-gray-300 rounded-full px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full flex items-center"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 bg-white rounded-lg shadow-sm border border-gray-200">
          <p>Select a user to start chatting.</p>
        </div>
      )}
    </div>
  );
};

export default ChatTab;
