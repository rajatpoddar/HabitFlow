"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface UserProfileModalProps {
  user: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    occupation?: string | null;
    location?: string | null;
    bio?: string | null;
    total_forest_health?: number;
  };
  onClose: () => void;
  onAddFriend?: (id: string) => void;
  showAddButton?: boolean;
}

export default function UserProfileModal({ user, onClose, onAddFriend, showAddButton }: UserProfileModalProps) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm bg-surface rounded-[2.5rem] overflow-hidden shadow-2xl"
        >
          {/* Header/Cover */}
          <div className="h-32 bg-gradient-to-br from-primary to-primary-container relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-8 -mt-12 relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-[2rem] bg-surface p-1.5 shadow-xl">
                <div className="w-full h-full rounded-[1.6rem] bg-surface-container-high overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30">
                      <span className="material-symbols-outlined text-4xl">person</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-headline text-2xl font-black text-on-surface">
                  {user.name || "Anonymous User"}
                </h3>
                <p className="font-body text-primary font-bold text-sm">
                  {user.occupation || "Habit Explorer"}
                </p>
                {user.location && (
                  <div className="flex items-center justify-center gap-1 text-on-surface-variant text-xs mt-1">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {user.location}
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 w-full mt-8">
                <div className="bg-surface-container-low rounded-3xl p-4 flex flex-col items-center">
                  <span className="material-symbols-outlined text-primary icon-fill mb-1">forest</span>
                  <span className="font-headline font-black text-xl text-on-surface">
                    {user.total_forest_health || 0}
                  </span>
                  <span className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                    Forest Health
                  </span>
                </div>
                <div className="bg-surface-container-low rounded-3xl p-4 flex flex-col items-center">
                  <span className="material-symbols-outlined text-secondary icon-fill mb-1">workspace_premium</span>
                  <span className="font-headline font-black text-xl text-on-surface">
                    {(user.total_forest_health || 0) > 100 ? "Pro" : "Seed"}
                  </span>
                  <span className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                    Rank
                  </span>
                </div>
              </div>

              {/* About Section */}
              {user.bio && (
                <div className="mt-6 w-full text-left">
                  <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-2 px-1">
                    About
                  </h4>
                  <p className="font-body text-sm text-on-surface bg-surface-container-lowest rounded-2xl p-4 leading-relaxed">
                    {user.bio}
                  </p>
                </div>
              )}

              {/* Action */}
              {showAddButton && onAddFriend && (
                <button
                  onClick={() => onAddFriend(user.id)}
                  className="mt-8 w-full py-4 bg-primary text-on-primary rounded-2xl font-label font-bold shadow-primary-glow flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined">person_add</span>
                  Add as Friend
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
