"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { UserSettings } from "@/components/settings/UserSettings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!user) {
    return (
      <div className="flex h-screen w-screen justify-center items-center">
        <span className="loading loading-ring loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <ChatSidebar onSelectChat={setSelectedChat} />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Simple Chat </h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Settings</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>User Settings</DialogTitle>
              </DialogHeader>
              <UserSettings />
            </DialogContent>
          </Dialog>
        </header>
        {selectedChat ? (
          <ChatWindow chatId={selectedChat} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
