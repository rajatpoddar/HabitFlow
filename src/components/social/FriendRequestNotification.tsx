"use client";

import React, { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import UserProfileModal from "./UserProfileModal";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface FriendUser {
  id: string;
  name: string | null;
  avatar_url: string | null;
  occupation?: string | null;
  location?: string | null;
  bio?: string | null;
  total_forest_health?: number;
}

interface Friendship {
  id: string;
  requester_id: string;
  status: "pending";
  requester: FriendUser;
}

export default function FriendRequestNotification() {
  const { user } = useStore();
  const [requests, setRequests] = useState<Friendship[]>([]);
  const [selectedUser, setSelectedUser] = useState<FriendUser | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/friends");
      if (res.ok) {
        const data = await res.json();
        // Only show pending requests where the current user is the receiver
        const pending = data.filter((f: any) => f.status === "pending" && f.receiver_id === user?.id);
        setRequests(pending);
      }
    } catch (err) {
      console.error("Failed to fetch requests", err);
    }
  };

  useEffect(() => {
    if (user) fetchRequests();
  }, [user]);

  const handleAccept = async (id: string) => {
    try {
      const res = await fetch("/api/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId: id }),
      });
      if (!res.ok) throw new Error("Failed to accept");
      toast.success("Request accepted!");
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch("/api/friends/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId: id }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      toast.success("Request removed");
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (requests.length === 0) return null;

  return (
    <>
      <div className="space-y-3">
        <AnimatePresence>
          {requests.map((f) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-primary/5 border border-primary/10 rounded-[2rem] p-4 flex items-center justify-between"
            >
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setSelectedUser(f.requester)}
              >
                <div className="w-12 h-12 rounded-2xl bg-surface p-1 shadow-sm group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-xl bg-surface-container-high overflow-hidden">
                    {f.requester.avatar_url ? (
                      <img src={f.requester.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30">
                        <span className="material-symbols-outlined">person</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-headline font-bold text-on-surface text-sm">
                    {f.requester.name || "Anonymous"}
                  </h4>
                  <p className="font-body text-[10px] text-primary font-bold">
                    Wants to be friends
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(f.id)}
                  className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-xl">check</span>
                </button>
                <button
                  onClick={() => handleReject(f.id)}
                  className="w-10 h-10 rounded-xl bg-surface-variant/10 text-on-surface-variant flex items-center justify-center hover:bg-error/10 hover:text-error transition-all"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  );
}
