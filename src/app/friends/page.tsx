"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import TopBar from "@/components/ui/TopBar";
import BottomNav from "@/components/ui/BottomNav";
import toast from "react-hot-toast";

interface FriendUser {
  id: string;
  name: string | null;
  avatar_url: string | null;
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
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    checkAuth().then(() => {
      const { user: currentUser } = useStore.getState();
      if (!currentUser) {
        router.push("/login");
        return;
      }
      fetchFriendships();
    });
  }, []);

  const fetchFriendships = async () => {
    try {
      const res = await fetch("/api/friends");
      if (!res.ok) throw new Error("Failed to fetch friends");
      const data = await res.json();
      setFriendships(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: searchEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Friend request sent!");
      setSearchEmail("");
      fetchFriendships();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSearching(false);
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

        {/* Add Friend Section */}
        <section className="bg-surface-container-low rounded-[1.5rem] p-6">
          <h3 className="font-headline font-bold text-on-surface mb-3">Add Friend</h3>
          <form onSubmit={handleAddFriend} className="flex gap-2">
            <div className="relative flex-1 bg-surface-container-highest rounded-full border-b-2 border-primary/20 focus-within:border-primary transition-colors overflow-hidden">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-primary/60 text-xl">mail</span>
              </div>
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 bg-transparent border-none text-on-surface focus:ring-0 font-body outline-none"
                placeholder="Friend's email"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="py-3 px-6 rounded-full bg-primary text-on-primary font-label font-semibold transition-all hover:scale-[1.02] disabled:opacity-60"
            >
              {isSearching ? "Sending..." : "Add"}
            </button>
          </form>
        </section>

        {/* Pending Requests Received */}
        {pendingReceived.length > 0 && (
          <section className="bg-surface-container-low rounded-[1.5rem] p-6">
            <h3 className="font-headline font-bold text-on-surface mb-4">Friend Requests</h3>
            <div className="space-y-3">
              {pendingReceived.map(f => (
                <div key={f.id} className="flex items-center justify-between bg-surface-container-highest rounded-[1.25rem] p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden">
                      {f.requester.avatar_url ? (
                        <img src={f.requester.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                          <span className="material-symbols-outlined">person</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-on-surface text-sm">{f.requester.name || "Anonymous"}</h4>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAccept(f.id)} className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center transition-all hover:scale-105">
                      <span className="material-symbols-outlined text-sm">check</span>
                    </button>
                    <button onClick={() => handleReject(f.id)} className="w-8 h-8 rounded-full bg-surface-variant text-on-surface flex items-center justify-center transition-all hover:scale-105 hover:bg-error/20 hover:text-error">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sent Requests */}
        {pendingSent.length > 0 && (
          <section className="bg-surface-container-low rounded-[1.5rem] p-6">
            <h3 className="font-headline font-bold text-on-surface mb-4">Sent Requests</h3>
            <div className="space-y-3">
              {pendingSent.map(f => (
                <div key={f.id} className="flex items-center justify-between bg-surface-container-highest rounded-[1.25rem] p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden">
                      {f.receiver.avatar_url ? (
                        <img src={f.receiver.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                          <span className="material-symbols-outlined">person</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-on-surface text-sm">{f.receiver.name || "Anonymous"}</h4>
                      <p className="font-body text-xs text-on-surface-variant">Pending...</p>
                    </div>
                  </div>
                  <button onClick={() => handleReject(f.id)} className="text-on-surface-variant hover:text-error text-xs font-semibold px-2">
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* My Friends */}
        <section className="bg-surface-container-low rounded-[1.5rem] p-6">
          <h3 className="font-headline font-bold text-on-surface mb-4">My Friends</h3>
          {acceptedFriends.length === 0 ? (
            <p className="font-body text-sm text-on-surface-variant text-center py-4">
              You haven't added any friends yet.
            </p>
          ) : (
            <div className="space-y-3">
              {acceptedFriends.map(f => {
                const friend = f.requester_id === user?.id ? f.receiver : f.requester;
                return (
                  <div key={f.id} className="flex items-center justify-between bg-surface-container-highest rounded-[1.25rem] p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden">
                        {friend.avatar_url ? (
                          <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                            <span className="material-symbols-outlined">person</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-headline font-bold text-on-surface text-sm">{friend.name || "Anonymous"}</h4>
                      </div>
                    </div>
                    <button onClick={() => handleReject(f.id)} className="text-on-surface-variant hover:text-error text-xs font-semibold px-2" title="Remove Friend">
                      <span className="material-symbols-outlined text-sm">person_remove</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
