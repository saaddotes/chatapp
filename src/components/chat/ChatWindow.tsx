"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { AddMember } from "./AddMember";

type MessageType = {
  id: string;
  sender: string;
  senderAvatar?: string;
  senderName?: string;
  text: string;
  timestamp: Timestamp;
};

export function ChatWindow({ chatId }: { chatId: string | null }) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [participants, setParticipants] = useState<any[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chatId) return;

    const chatRef = doc(db, "chats", chatId);
    const unsubscribeChat = onSnapshot(chatRef, (doc) => {
      if (doc.exists()) {
        setParticipants(doc.data().participants || []);
      }
    });

    const q = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy("timestamp", "asc"),
      limit(50)
    );

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const messageData: MessageType[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messageData);
    });

    return () => {
      unsubscribeChat();
      unsubscribeMessages();
    };
  }, [chatId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo(0, scrollAreaRef.current.scrollHeight);
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth?.currentUser?.uid) return;

    await addDoc(collection(db, `chats/${chatId}/messages`), {
      text: newMessage,
      sender: auth?.currentUser?.uid,
      timestamp: serverTimestamp(),
    });

    await setDoc(
      doc(db, "chats", chatId),
      {
        lastMessage: newMessage,
        lastMessageTime: serverTimestamp(),
      },
      { merge: true }
    );

    setNewMessage("");
  };

  if (!chatId) {
    return (
      <div className="flex h-screen w-screen justify-center items-center">
        <span className="loading loading-ring loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold">Chat</h2>
        <AddMember />
      </div>
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <AnimatePresence>
          {messages?.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${
                message.sender === auth?.currentUser?.uid
                  ? "justify-end"
                  : "justify-start"
              } mb-4`}
            >
              <div
                className={`flex ${
                  message.sender === auth?.currentUser?.uid
                    ? "flex-row-reverse"
                    : "flex-row"
                } items-end`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={message.senderAvatar} />
                  <AvatarFallback>
                    {message.senderName ? message.senderName[0] : "?"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`mx-2 p-3 rounded-lg ${
                    message.sender === auth.currentUser?.uid
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </ScrollArea>
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-gray-200"
      >
        <div className="flex">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 mr-2"
          />
          <Button type="submit">Send</Button>
        </div>
      </form>
    </div>
  );
}
