"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import TopBar from "@/components/ui/TopBar";
import BottomNav from "@/components/ui/BottomNav";
import UserProfileModal from "@/components/social/UserProfileModal";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface FriendUser {
  id: string;
  name: string | null;
  avatar_url: string | null;
  occupation?: string | null;
  location?: string | null;
  bio?: string | null;
  social_stats?: { total_forest_health: number }[];
  total_forest_health?: number; // From RPC
}

interface Friendship {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  requester: FriendUser;
  receiver: FriendUser;
}

export default function FriendsPage() {
  const router = useRouter();
  const { user, isLoading, checkAuth } = useStore();
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [suggestions, setSuggestions] = useState<FriendUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [selectedUser, setSelectedUser] = useState<FriendUser | null>(null);

  useEffect(() => {
    checkAuth().then(() => {
      const { user: currentUser } = useStore.getState();
      if (!currentUser) {
        router.push("/login");
        return;
      }
      fetchFriendships();
      fetchSuggestions();
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchFriendships = async () => {
    try {
      const res = await fetch("/api/friends");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch friends");
      setFriendships(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsFetching(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await fetch("/api/users/suggestions");
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (err) {
      console.error("Failed to fetch suggestions", err);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?query=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (targetId: string) => {
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Friend request sent!");
      setSearchQuery("");
      setSearchResults([]);
      setSelectedUser(null);
      fetchFriendships();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      const res = await fetch("/api/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId: id }),
      });
      if (!res.ok) throw new Error("Failed to accept");
      toast.success("Request accepted!");
      fetchFriendships();
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
      fetchFriendships();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (isLoading || isFetching) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const pendingReceived = friendships.filter(f => f.status === "pending" && f.receiver_id === user?.id);
  const pendingSent = friendships.filter(f => f.status === "pending" && f.requester_id === user?.id);
  const acceptedFriends = friendships.filter(f => f.status === "accepted");

  return (
    <div className="min-h-screen bg-surface pb-28">
      <TopBar />

      <main className="max-w-xl mx-auto px-4 pt-4 space-y-6">
        <div>
          <h2 className="font-headline text-4xl font-extrabold text-primary tracking-tight">
            Friends
          </h2>
          <p className="font-body text-on-surface-variant mt-1">
            Grow your forest together.
          </p>
        </div>

        {/* Invite System / Search */}
        <section className="bg-surface-container-low rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined icon-fill">person_add</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-on-surface">Find Friends</h3>
              <p className="font-body text-xs text-on-surface-variant">Search by name or see suggestions below.</p>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 bg-surface-container-highest rounded-2xl border-2 border-transparent focus:border-primary/30 text-on-surface focus:ring-0 font-body outline-none transition-all placeholder:text-on-surface-variant/50"
              placeholder="Search by name..."
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Search Results */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-2"
              >
                {searchResults.map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-surface-container-high rounded-2xl p-3">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedUser(u)}>
                      <div className="w-10 h-10 rounded-xl bg-surface-container-highest overflow-hidden">
                        {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30"><span className="material-symbols-outlined">person</span></div>}
                      </div>
                      <div>
                        <h4 className="font-headline font-bold text-on-surface text-sm">{u.name}</h4>
                        <p className="font-body text-[10px] text-on-surface-variant capitalize">{u.occupation || "Explorer"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddFriend(u.id)}
                      className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center hover:scale-105 transition-transform"
                    >
                      <span className="material-symbols-outlined text-xl">add</span>
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Pending Requests Received */}
        {pendingReceived.length > 0 && (
          <section className="bg-primary/5 border border-primary/10 rounded-[2rem] p-6">
            <h3 className="font-headline font-bold text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined icon-fill">notifications_active</span>
              Pending Requests
            </h3>
            <div className="space-y-3">
              {pendingReceived.map(f => (
                <div key={f.id} className="flex items-center justify-between bg-surface rounded-2xl p-3 shadow-sm border border-primary/5">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedUser(f.requester)}>
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high overflow-hidden">
                      {f.requester.avatar_url ? (
                        <img src={f.requester.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30">
                          <span className="material-symbols-outlined">person</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-on-surface text-sm">{f.requester.name || "Anonymous"}</h4>
                      <p className="font-body text-[10px] text-primary font-bold">Requesting to join your forest</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAccept(f.id)} className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
                      <span className="material-symbols-outlined text-xl">check</span>
                    </button>
                    <button onClick={() => handleReject(f.id)} className="w-9 h-9 rounded-xl bg-surface-variant text-on-surface flex items-center justify-center transition-all hover:scale-105 hover:bg-error/10 hover:text-error">
                      <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && !searchQuery && (
          <section className="bg-surface-container-low rounded-[2rem] p-6 shadow-sm">
            <h3 className="font-headline font-bold text-on-surface mb-4">Suggested for you</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {suggestions.map(u => (
                <div key={u.id} className="flex-shrink-0 w-36 bg-surface-container-high rounded-[2rem] p-4 flex flex-col items-center text-center group cursor-pointer" onClick={() => setSelectedUser(u)}>
                  <div className="w-16 h-16 rounded-2xl bg-surface p-1 mb-3 shadow-md group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-xl bg-surface-container-highest overflow-hidden">
                      {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-on-surface-variant/20"><span className="material-symbols-outlined text-2xl">person</span></div>}
                    </div>
                  </div>
                  <h4 className="font-headline font-bold text-on-surface text-xs truncate w-full">{u.name}</h4>
                  <p className="font-body text-[9px] text-on-surface-variant mb-3 truncate w-full">{u.occupation || "Explorer"}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddFriend(u.id); }}
                    className="w-full py-2 bg-primary/10 text-primary rounded-xl font-label font-bold text-[10px] hover:bg-primary hover:text-on-primary transition-colors"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* My Friends */}
        <section className="bg-surface-container-low rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline font-bold text-on-surface">Your Forest Group</h3>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              {acceptedFriends.length} Friends
            </span>
          </div>
          
          {acceptedFriends.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-on-surface-variant/20 text-3xl">group_off</span>
              </div>
              <p className="font-body text-sm text-on-surface-variant">
                You haven&apos;t added any friends yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {acceptedFriends.map(f => {
                const friend = f.requester_id === user?.id ? f.receiver : f.requester;
                return (
                  <div key={f.id} className="flex items-center justify-between bg-surface-container-highest rounded-[1.5rem] p-4 group">
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedUser(friend)}>
                      <div className="w-12 h-12 rounded-[1.25rem] bg-surface p-1 shadow-sm group-hover:scale-105 transition-transform">
                        <div className="w-full h-full rounded-xl bg-surface-container-high overflow-hidden">
                          {friend.avatar_url ? (
                            <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30">
                              <span className="material-symbols-outlined">person</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-headline font-bold text-on-surface text-sm">{friend.name || "Anonymous"}</h4>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-[12px] text-primary icon-fill">forest</span>
                          <span className="font-body text-[10px] text-on-surface-variant font-bold">
                            {friend.social_stats?.[0]?.total_forest_health || 0} Points
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleReject(f.id)} className="w-10 h-10 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors" title="Remove Friend">
                      <span className="material-symbols-outlined text-xl">person_remove</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Sent Requests */}
        {pendingSent.length > 0 && (
          <section className="bg-surface-container-low rounded-[2rem] p-6 opacity-80">
            <h3 className="font-headline font-bold text-on-surface-variant text-xs uppercase tracking-widest mb-4">Pending Sent Requests</h3>
            <div className="space-y-3">
              {pendingSent.map(f => (
                <div key={f.id} className="flex items-center justify-between bg-surface-container-highest rounded-2xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high overflow-hidden">
                      {f.receiver.avatar_url ? (
                        <img src={f.receiver.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30">
                          <span className="material-symbols-outlined">person</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-on-surface text-sm">{f.receiver.name || "Anonymous"}</h4>
                      <p className="font-body text-[10px] text-on-surface-variant">Waiting for approval...</p>
                    </div>
                  </div>
                  <button onClick={() => handleReject(f.id)} className="text-on-surface-variant hover:text-error text-xs font-black uppercase px-3 py-2">
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav />

      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onAddFriend={handleAddFriend}
          showAddButton={!friendships.some(f => f.requester_id === selectedUser.id || f.receiver_id === selectedUser.id)}
        />
      )}
    </div>
  );
}
