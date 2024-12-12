"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc as firestoreDoc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import CreateGroupChat from "./CreateGroupChat";
import { AddMember } from "./AddMember";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { UserSettings } from "../settings/UserSettings";

interface ChatType {
  id: string;
  createdAt: Timestamp;
  lastMessage: string;
  lastMessageTime: Timestamp;
  name: string;
  participants: string[];
  type: string;
  otherParticipantName?: string;
}

export function ChatSidebar({
  onSelectChat,
}: {
  onSelectChat: (id: string) => void;
}) {
  const [chats, setChats] = useState<ChatType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("lastMessageTime", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const chatData: ChatType[] = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const chat = doc.data() as ChatType;
              const otherParticipant = chat.participants.find(
                (participant) => participant !== user.uid
              );

              let otherParticipantName = "Unknown User";
              if (otherParticipant) {
                try {
                  const userRef = firestoreDoc(db, "users", otherParticipant);
                  const userSnapshot = await getDoc(userRef);
                  if (userSnapshot.exists()) {
                    otherParticipantName =
                      userSnapshot.data()?.name || "Unknown User";
                  }
                } catch (error) {
                  console.error(
                    "Error fetching other participant name:",
                    error
                  );
                }
              }

              return {
                ...chat,
                otherParticipantName,
                id: doc.id,
              };
            })
          );

          setChats(chatData);
        } catch (error) {
          console.error("Error fetching chats:", error);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error in onSnapshot listener:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredChats = chats.filter((chat) =>
    chat.otherParticipantName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full md:w-64 border-r border-gray-200 h-full flex flex-col">
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
        {loading ? (
          <div className="text-center text-gray-500">Loading chats...</div>
        ) : filteredChats.length > 0 ? (
          filteredChats.map((chat, index) => (
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
                  <div className="font-medium">
                    {chat.type === "group"
                      ? chat.name
                      : chat.otherParticipantName}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {chat?.lastMessage}
                  </div>
                </div>
              </Button>
            </motion.div>
          ))
        ) : (
          <div className="text-center text-gray-500">No chats found.</div>
        )}
      </ScrollArea>
      <div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full mb-5">
              Settings
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>User Settings</DialogTitle>
            </DialogHeader>
            <UserSettings />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
