"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BeatLoader } from "react-spinners";
import { IoIosAttach } from "react-icons/io";
import Login from "../components/Login";
import { users } from "../components/users";

interface Message {
  _id?: string;
  content: string;
  sender: string;
  receiver: string;
  timestamp: string;
  fileUrl?: string;
}

interface User {
  id: number;
  username: string;
  password: string;
  avatar: string;
}

export default function ChatApp() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  let typingTimeout: NodeJS.Timeout;

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    localStorage.setItem("currentUser", JSON.stringify(user));
  };

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      const socketInstance = io("http://localhost:3001", {
        query: { username: currentUser.username, role: "user" },
      });

      socketInstance.on("connect", () => {
        console.log("Connected to server");
      });

      socketInstance.on("previous-messages", (previousMessages: Message[]) => {
        setMessages(previousMessages);
      });

      socketInstance.on("new-message", (message: Message) => {
        setMessages((prev) => [...prev, message]);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [isLoggedIn, currentUser]);

  // After selecting a user, join a room for the conversation:
  useEffect(() => {
    if (socket && currentUser && selectedUser) {
      const room = [currentUser.username, selectedUser.username]
        .sort()
        .join("_");
      socket.emit("join-room", room);
      socket.emit("load-messages", {
        sender: currentUser.username,
        receiver: selectedUser.username,
      });
    }
  }, [selectedUser, socket, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTyping = () => {
    socket?.emit("typing", currentUser?.username);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket?.emit("stop-typing", currentUser?.username);
    }, 1000);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !currentUser || !selectedUser) return;
    if (newMessage.trim() === "" && !file) return;

    if (file) {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("sender", currentUser.username);
      formData.append("receiver", selectedUser.username);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);

            const finalMessage: Message = {
              content: newMessage.trim(),
              sender: currentUser.username,
              receiver: selectedUser.username,
              timestamp: new Date().toISOString(),
              fileUrl: data.fileUrl,
            };

            // Emit the message to the server (the message will then be broadcast back)
            socket.emit("send-message", finalMessage);
          } else {
            alert("File upload failed!");
          }
          setIsUploading(false);
          setUploadProgress(0);
          setFile(null);
        }
      };

      xhr.open("POST", "http://localhost:3001/upload");
      xhr.send(formData);
    } else {
      const messageData: Message = {
        content: newMessage.trim(),
        sender: currentUser.username,
        receiver: selectedUser.username,
        timestamp: new Date().toISOString(),
      };

      // Emit the message to the server
      socket.emit("send-message", messageData);
    }

    setNewMessage("");
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex">
      {/* Sidebar Toggle Button (Mobile/Tablet) */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        ☰
      </button>

      {/* Sidebar */}
      <div
        className={`w-64 bg-white rounded-lg shadow-md p-4 fixed md:relative left-1 top-16 md:top-0 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out z-40`}
      >
        <h2 className="text-xl font-bold mb-4">Users</h2>
        {users
          .filter((user) => user.id !== currentUser?.id)
          .map((user) => {
            const initials = user.username.charAt(0).toUpperCase(); // Get the first letter of the username
            const backgroundColor = `#${Math.floor(
              Math.random() * 16777215
            ).toString(16)}`; // Generate a random background color
            return (
              <div
                key={user.id}
                className="flex items-center mb-4 cursor-pointer"
                onClick={() => {
                  setSelectedUser(user);
                  setIsSidebarOpen(false); // Close sidebar on user selection (mobile/tablet)
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: backgroundColor }} // Set the unique background color
                >
                  <span className="text-white font-bold">{initials}</span>{" "}
                  {/* Display initials in white */}
                </div>
                <span className="text-black ml-2">{user.username}</span>{" "}
                {/* Ensure username text is white */}
              </div>
            );
          })}
      </div>

      {/* Chat Area */}
      <div className="flex-grow ml-4 md:ml-0">
        <Card className="w-full md:ml-4 mx-auto">
          <CardHeader>
            <CardTitle>
              Chat with{" "}
              {selectedUser
                ? selectedUser.username
                : "Select a user to start chatting"}
            </CardTitle>
          </CardHeader>
          {selectedUser ? (
            <>
              <CardContent>
                <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
                  {messages
                    .filter(
                      (msg) =>
                        (msg.sender === currentUser?.username &&
                          msg.receiver === selectedUser?.username) ||
                        (msg.sender === selectedUser?.username &&
                          msg.receiver === currentUser?.username)
                    )
                    .map((msg, index) => (
                      <div
                        key={msg._id || index}
                        className={`mb-4 flex ${
                          msg.sender === currentUser?.username
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            msg.sender === currentUser?.username
                              ? "bg-yellow-400 text-black"
                              : "bg-gray-200"
                          }`}
                        >
                          <div className="text-sm font-semibold mb-1">
                            {msg.sender}
                          </div>
                          {msg.fileUrl ? (
                            <>
                              {msg.content && (
                                <div className="mb-1">{msg.content}</div>
                              )}
                              <a
                                href={msg.fileUrl}
                                target="_blank"
                                className="text-blue-500"
                              >
                                View File
                              </a>
                            </>
                          ) : (
                            <div className="w-full overflow-auto">
                              {msg.content}
                            </div>
                          )}
                          <div className="text-xs opacity-70 mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}

                  <div ref={messagesEndRef} />
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <form
                  onSubmit={sendMessage}
                  className="flex w-full items-center space-x-2"
                >
                  <div className="relative flex-grow">
                    <Input
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      placeholder="Type your message..."
                      disabled={isUploading}
                    />
                    <label className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer">
                      <span className="text-xl">
                        <IoIosAttach />
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const selected = e.target.files?.[0] || null;
                          setFile(selected);
                          if (selected && newMessage.trim() === "") {
                            setNewMessage(selected.name);
                          }
                        }}
                        disabled={isUploading}
                      />
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={
                      isUploading || (newMessage.trim() === "" && !file)
                    }
                  >
                    {isUploading ? "Uploading..." : "Send"}
                  </Button>
                </form>
              </CardFooter>
            </>
          ) : (
            <div className="text-center text-gray-500 text-lg font-semibold">
              👋 Select a user from the sidebar to start chatting!
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
