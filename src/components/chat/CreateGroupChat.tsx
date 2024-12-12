"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
// import { useToast } from "@/hooks/use-toast";

export default function CreateGroupChat() {
  const [groupName, setGroupName] = useState("");
  const [participants, setParticipants] = useState("");
  // const { toast } = useToast();

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (groupName.trim() === "" || participants.trim() === "") return;

    const participantList = participants.split(",").map((p) => p.trim());
    const currentUser = auth.currentUser;

    if (!currentUser) {
      // toast({
      //   title: "Error",
      //   description: "You must be logged in to create a group chat.",
      //   variant: "destructive",
      // });
      return;
    }

    try {
      await addDoc(collection(db, "chats"), {
        name: groupName,
        type: "group",
        createdBy: currentUser.uid,
        participants: [currentUser.uid, ...participantList],
        createdAt: serverTimestamp(),
        lastMessageTime: serverTimestamp(),
      });
      setGroupName("");
      setParticipants("");
      // toast({
      //   title: "Group Created",
      //   description: "Your new group chat has been created successfully.",
      // });
    } catch (error) {
      console.error("Error creating group chat:", error);
      // toast({
      //   title: "Error",
      //   description: "Failed to create group chat. Please try again.",
      //   variant: "destructive",
      // });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" disabled>
          Create Group Chat
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Group Chat</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="participants">
              Participants (comma-separated UIDs)
            </Label>
            <Input
              id="participants"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              required
            />
          </div>
          <Button type="submit">Create Group</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
