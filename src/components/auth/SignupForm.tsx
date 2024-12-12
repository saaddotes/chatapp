"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { doc, setDoc } from "firebase/firestore";

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.promise(
      (async () => {
        // Create a new user with Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Update the user's display name in Firebase Auth
        await updateProfile(userCredential.user, { displayName: name });

        // Save the user's basic info to Firestore
        const userDoc = {
          name,
          email,
          role: "user", // Default role; can be updated as needed
          createdAt: new Date().toISOString(), // Add a timestamp
        };

        await setDoc(doc(db, "users", userCredential.user.uid), userDoc);
      })(),
      {
        loading: "Creating your account...",
        success: "Account created successfully!",
        error: "Failed to create account. Please try again.",
      }
    );
  };

  return (
    <motion.form
      onSubmit={handleSignup}
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full">
        Sign Up
      </Button>
    </motion.form>
  );
}
