"use client";

import { useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";
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
import toast from "react-hot-toast";

export function AddMember() {
  const [memberUid, setMemberUid] = useState("");

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (memberUid.trim() === "") return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error("You must be logged in to add a member.");
      return;
    }

    toast.promise(
      (async () => {
        // Search for the user by email
        const usersRef = collection(db, "users");
        const userQuery = query(usersRef, where("email", "==", memberUid));
        const userSnap = await getDocs(userQuery);

        if (userSnap.empty) {
          throw new Error("The specified user does not exist.");
        }

        const userDoc = userSnap.docs[0];
        const memberUIDFetched = userDoc.id;

        // Check if a chat already exists
        const chatsRef = collection(db, "chats");
        const chatQuery = query(
          chatsRef,
          where("type", "==", "private"),
          where("participants", "array-contains", currentUser.uid)
        );
        const chatsSnap = await getDocs(chatQuery);

        const chatExists = chatsSnap.docs.some((doc) => {
          const participants = doc.data().participants;
          return participants.includes(memberUIDFetched);
        });

        if (chatExists) {
          throw new Error("A chat with this member already exists.");
        }

        // Create a new chat document
        await addDoc(chatsRef, {
          type: "private",
          participants: [currentUser.uid, memberUIDFetched],
          createdAt: serverTimestamp(),
          lastMessageTime: serverTimestamp(),
          lastMessage: "",
          name: memberUid, // Set a default or dynamic chat name
        });

        setMemberUid(""); // Clear input
      })(),
      {
        loading: "Adding member...",
        success: "Member added successfully!",
        error: (err: Error) =>
          err.message || "Failed to add member. Please try again.",
      }
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Add Member</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a New Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <Label htmlFor="memberUid">Member Email</Label>
            <Input
              id="memberUid"
              value={memberUid}
              onChange={(e) => setMemberUid(e.target.value)}
              required
            />
          </div>
          <Button type="submit">Add Member</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
