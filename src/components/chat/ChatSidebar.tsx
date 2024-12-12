"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import CreateGroupChat from "./CreateGroupChat";
import { AddMember } from "./AddMember";

type ChatType = {
  id: string;
  createdAt: Timestamp;
  lastMessage: string;
  lastMessageTime: Timestamp;
  name: string;
  participants: string[];
  type: string;
};

export function ChatSidebar({
  onSelectChat,
}: {
  onSelectChat: (id: string) => void;
}) {
  const [chats, setChats] = useState<ChatType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("lastMessageTime", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatData: ChatType[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatType[];

      setChats(chatData);
    });

    return () => unsubscribe();
  }, []);

  const filteredChats = chats;
  return (
    <div className="w-64 border-r border-gray-200 h-full flex flex-col">
      <div className="p-4">
        <Input
          type="text"
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full mb-2"
        />
        <div className="flex flex-col space-y-2 mb-2">
          <CreateGroupChat />
          <AddMember />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {filteredChats?.map((chat, index) => (
          <motion.div
            key={chat.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Button
              variant="ghost"
              className="w-full justify-start py-3"
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="text-left">
                <div className="font-medium">{chat?.name}</div>
                <div className="text-sm text-gray-500 truncate">
                  {chat?.lastMessage}
                </div>
              </div>
            </Button>
          </motion.div>
        ))}
      </ScrollArea>
    </div>
  );
}
