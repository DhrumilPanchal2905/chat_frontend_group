// components/ChatPlatform.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IoIosAttach } from "react-icons/io";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ChatPlatformProps {
  socket: Socket | null;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  currentUser: User | null;
  selectedUser: User | null;
}

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

const ChatPlatform = ({
  socket,
  messages,
  setMessages,
  currentUser,
  selectedUser,
}: ChatPlatformProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !socket ||
      !currentUser ||
      !selectedUser ||
      (newMessage.trim() === "" && !file)
    )
      return;
    const messageData: Message = {
      content: newMessage.trim(),
      sender: currentUser.username,
      receiver: selectedUser.username,
      timestamp: new Date().toISOString(),
    };
    socket.emit("send-message", messageData);
    setNewMessage("");
  };

  return (
    <Card className="w-full md:ml-4 mx-auto">
      <CardHeader>
        <CardTitle>
          Chat with {selectedUser ? selectedUser.username : "Select a user"}
        </CardTitle>
      </CardHeader>
      {selectedUser ? (
        <>
          <CardContent>
            <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-4 flex ${
                    msg.sender === currentUser?.username
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div className="max-w-[70%] rounded-lg px-4 py-2 bg-gray-200">
                    {msg.content}
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
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
              />
              <Button type="submit">Send</Button>
            </form>
          </CardFooter>
        </>
      ) : (
        <div className="text-center text-gray-500 text-lg font-semibold">
          👋 Select a user from the sidebar to start chatting!
        </div>
      )}
    </Card>
  );
};
export default ChatPlatform;
