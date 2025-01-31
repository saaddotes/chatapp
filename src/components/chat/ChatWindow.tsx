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
  getDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { AddMember } from "./AddMember";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { UserSettings } from "../settings/UserSettings";

type MessageType = {
  id: string;
  sender: string;
  senderAvatar?: string;
  senderName?: string;
  text: string;
  timestamp: Timestamp;
};

export function ChatWindow({
  chatId,
  setSelectedChat,
}: {
  chatId: string | null;
  setSelectedChat: (id: string | null) => void;
}) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userName, setUsername] = useState("");
  // const [participants, setParticipants] = useState<any[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chatId) return;

    // Fetch the chat participants (if applicable) and set username
    const fetchUserName = async () => {
      try {
        const chatRef = doc(db, "chats", chatId);
        const chatSnapshot = await getDoc(chatRef);

        if (chatSnapshot.exists()) {
          const participants = chatSnapshot.data()?.participants || [];
          // Assuming you want to get the name of the other participant, not the current user
          const otherParticipant = participants.find(
            (participant: string) => participant !== auth?.currentUser?.uid
          );

          if (otherParticipant) {
            const userRef = doc(db, "users", otherParticipant);
            const userSnapshot = await getDoc(userRef);

            if (userSnapshot.exists()) {
              const fetchedUserName =
                userSnapshot.data()?.name || "Unknown User";
              setUsername(fetchedUserName);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    };

    fetchUserName();
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;

    // const chatRef = doc(db, "chats", chatId);
    // const unsubscribeChat = onSnapshot(chatRef, (doc) => {
    //   if (doc.exists()) {
    //     setParticipants(doc.data().participants || []);
    //   }
    // });

    const q = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy("timestamp", "asc"),
      limit(50)
    );

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const messageData: MessageType[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          sender: data.sender,
          senderAvatar: data.senderAvatar || "", // Fallback
          senderName: data.senderName || "", // Fallback
          text: data.text,
          timestamp: data.timestamp || Timestamp.now(), // Fallback
        };
      });

      setMessages(messageData);
    });

    return () => {
      // unsubscribeChat();
      unsubscribeMessages();
    };
  }, [chatId]);

  useEffect(() => {
    console.log(
      "Scroll",
      scrollAreaRef.current,
      messages,
      scrollAreaRef?.current?.scrollHeight
    );
    if (scrollAreaRef.current) {
      requestAnimationFrame(() => {
        scrollAreaRef.current?.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
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

    if (!chatId) {
      console.error("Chat ID is null");
      return;
    }

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
        <div className="flex gap-1 items-center">
          <Button variant={"outline"} onClick={() => setSelectedChat(null)}>
            <svg
              className="w-6 h-6 text-gray-800 dark:text-white"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m15 19-7-7 7-7"
              />
            </svg>
          </Button>
          <h2 className="text-xl font-semibold">
            {userName ? userName : "Chat"}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <AddMember />
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Settings</Button>
            </DialogTrigger>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>User Settings</DialogTitle>
              </DialogHeader>
              <UserSettings />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div
        ref={scrollAreaRef}
        className="h-full p-4 overflow-auto"
        style={{ maxHeight: "100%" }}
      >
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
                <div className="text-xs text-gray-500 mx-2">
                  {message.timestamp
                    ? new Date(
                        message.timestamp.seconds * 1000
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Just now"}
                </div>{" "}
                {/* <Avatar className="w-8 h-8">
                  <AvatarImage src={message.senderAvatar} />
                  <AvatarFallback>
                    {message.senderName ? message.senderName[0] : "?"}
                  </AvatarFallback>
                </Avatar> */}
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
      </div>
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
