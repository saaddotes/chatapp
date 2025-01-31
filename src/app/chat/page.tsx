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
      <div className={`${selectedChat ? "hidden md:block" : "w-full md:w-64"}`}>
        <ChatSidebar onSelectChat={setSelectedChat} />
      </div>
      <div
        className={`flex-1 flex flex-col ${
          !selectedChat ? "hidden md:block" : ""
        }`}
      >
        {selectedChat ? (
          <ChatWindow chatId={selectedChat} setSelectedChat={setSelectedChat} />
        ) : (
          <>
            <header className="bg-white shadow-sm p-4 flex justify-between items-center">
              <h1 className="text-xl font-semibold">Quick Chat </h1>
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
            </header>
            <div className="flex-1 h-[60vh] flex items-center justify-center text-gray-500">
              Select a chat to start messaging
            </div>
          </>
        )}
      </div>
    </div>
  );
}
