"use client";

import { useState } from "react";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import toast from "react-hot-toast";

export function UserSettings() {
  const [displayName, setDisplayName] = useState(
    auth.currentUser?.displayName || ""
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      console.log("Error User not found");
      return;
    }
    toast.promise(updateProfile(auth.currentUser, { displayName }), {
      loading: "Updating profile...",
      success: "Your profile has been successfully updated.",
      error: "Failed to update profile. Please try again.",
    });
  };

  const handleToggleNotifications = (checked: boolean) => {
    setNotificationsEnabled(checked);
    toast.success(
      `Notifications are now ${checked ? "enabled" : "disabled"}.`,
      { duration: 3000 }
    );
    // Optionally update this setting in the backend
  };

  const handleSignOut = () => {
    toast.promise(auth.signOut(), {
      loading: "Signing out...",
      success: "You have been successfully signed out.",
      error: "Failed to sign out. Please try again.",
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <div>
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>
        <Button type="submit">Update Profile</Button>
      </form>
      <div className="flex items-center space-x-2">
        <Switch
          id="notifications"
          checked={notificationsEnabled}
          onCheckedChange={handleToggleNotifications}
        />
        <Label htmlFor="notifications">Enable Notifications</Label>
      </div>
      <Button variant="outline" onClick={handleSignOut}>
        Logout
      </Button>
    </div>
  );
}
