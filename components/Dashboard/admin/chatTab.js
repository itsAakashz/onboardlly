import { useState, useEffect, useRef } from "react";
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
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";

const ChatTab = ({ employees, currentUser }) => {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch messages between admin and selected employee
  useEffect(() => {
    if (!selectedEmployee) return;

    // Create a combined chat ID that's the same for both participants
    const chatId = [currentUser.email, selectedEmployee]
      .sort()
      .join("_");

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() 
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedEmployee, currentUser.email]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !message.trim() || isSending) return;

    setIsSending(true);
    try {
      // Create consistent chat ID for both participants
      const chatId = [currentUser.email, selectedEmployee]
        .sort()
        .join("_");

      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: message,
        sender: currentUser.email, // Track who sent the message
        receiver: selectedEmployee,
        timestamp: serverTimestamp(),
        isAdmin: true // Mark admin messages
      });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const getEmployeeName = (email) => {
    const employee = employees.find(emp => emp.email === email);
    return employee ? employee.name : "Employee";
  };

  // For employee view (to chat with admin)
  const getAdminMessages = () => {
    if (!currentUser || currentUser.isAdmin) return [];

    const chatId = [currentUser.email, "admin@company.com"]
      .sort()
      .join("_");

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const [messages, setMessages] = useState([]);

    useEffect(() => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() 
        }));
        setMessages(msgs);
      });

      return () => unsubscribe();
    }, []);

    return messages;
  };

  return (
    <div className="p-4 h-full flex flex-col">
      {currentUser.isAdmin ? (
        <>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Employee Chat</h2>
          <div className="mb-4">
            <label htmlFor="employee-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Employee
            </label>
            <select
              id="employee-select"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">Choose an employee to chat with...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.email}>
                  {emp.name} ({emp.department || 'No department'})
                </option>
              ))}
            </select>
          </div>
        </>
      ) : (
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Chat with Admin</h2>
      )}

      {(!currentUser.isAdmin || selectedEmployee) ? (
        <>
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-medium text-gray-800">
                {currentUser.isAdmin 
                  ? `Chat with ${getEmployeeName(selectedEmployee)}`
                  : "Chat with Admin Support"}
              </h3>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              {(currentUser.isAdmin ? messages : getAdminMessages()).length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <div className="space-y-3">
                  {(currentUser.isAdmin ? messages : getAdminMessages()).map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === currentUser.email ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${
                          msg.sender === currentUser.email
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p className="text-xs mt-1 opacity-70 text-right">
                          {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  className="flex-grow border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || isSending}
                  className={`p-2 rounded-full ${message.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'} transition-colors`}
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-center p-6">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {currentUser.isAdmin ? "No employee selected" : "Chat unavailable"}
            </h3>
            <p className="text-gray-500">
              {currentUser.isAdmin 
                ? "Choose an employee from the dropdown to start chatting"
                : "There was an issue loading the chat. Please try again later."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatTab;