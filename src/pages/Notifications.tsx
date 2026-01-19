import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Bell, Heart, UserPlus, Check, X, Clock,
    MessageCircle, Sparkles, Shield, ArrowLeft,
    MoreVertical
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    collection, query, where, getDocs, orderBy,
    doc, updateDoc, deleteDoc, onSnapshot, serverTimestamp,
    setDoc
} from "firebase/firestore";
import Navbar from "@/components/noire/Navbar";
import FloatingSidebar from "@/components/noire/FloatingSidebar";
import { toast } from "sonner";

const Notifications = () => {
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (!user) {
                navigate("/login");
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, "notifications"),
            where("toUserId", "==", currentUser.uid)
        );

        const unsub = onSnapshot(q, (snapshot) => {
            console.log("Aura Pulse Sync: Received", snapshot.size, "notifications");
            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort client-side to avoid index requirements for now
            const sortedNotifs = notifs.sort((a: any, b: any) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeB - timeA;
            });

            setNotifications(sortedNotifs);
            setLoading(false);
        }, (error) => {
            console.error("Critical Social Pulse Error:", error);
            toast.error("Cloud synchronization failed. Please check your network.");
            setLoading(false);
        });

        return () => unsub();
    }, [currentUser]);

    const handleAcceptRequest = async (notif: any) => {
        try {
            // 1. Update following/followers
            const followRef = doc(db, "users", notif.fromUserId, "following", currentUser.uid);
            const followerRef = doc(db, "users", currentUser.uid, "followers", notif.fromUserId);

            await setDoc(followRef, { timestamp: serverTimestamp() });
            await setDoc(followerRef, { timestamp: serverTimestamp() });

            // 2. Update notification status
            await updateDoc(doc(db, "notifications", notif.id), {
                status: "accepted",
                updatedAt: serverTimestamp()
            });

            toast.success(`Aura connection established with @${notif.fromUsername}`);
        } catch (error) {
            console.error("Accept request error:", error);
            toast.error("Failed to establish connection.");
        }
    };

    const handleDeclineRequest = async (notifId: string) => {
        try {
            await updateDoc(doc(db, "notifications", notifId), {
                status: "declined",
                updatedAt: serverTimestamp()
            });
            toast.info("Aura request declined.");
        } catch (error) {
            console.error("Decline request error:", error);
        }
    };

    const deleteNotification = async (notifId: string) => {
        try {
            await deleteDoc(doc(db, "notifications", notifId));
        } catch (error) {
            console.error("Delete notification error:", error);
        }
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return "Just now";
        const date = timestamp.toDate();
        return new Intl.RelativeTimeFormat('en', { style: 'short' }).format(
            Math.ceil((date.getTime() - Date.now()) / (1000 * 60)),
            'minutes'
        ).replace("in ", "").replace(" ago", "") + "m";
    };

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden content-shift">
            {currentUser && <FloatingSidebar />}
            <Navbar />

            <main className="container mx-auto px-6 pt-32 pb-20">
                <div className="max-w-2xl mx-auto">
                    <header className="flex items-center justify-between mb-12">
                        <div>
                            <h1 className="text-4xl font-display font-bold mb-2 flex items-center gap-3">
                                Social Pulse
                                <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                            </h1>
                            <p className="text-muted-foreground font-body">Manage your aura connections and alerts.</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
                            <Bell className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold">{notifications.length}</span>
                        </div>
                    </header>

                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {notifications.map((notif) => (
                                    <motion.div
                                        key={notif.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, x: 50 }}
                                        className={`glass-noire p-6 rounded-[2rem] border border-white/10 flex items-start justify-between group hover:border-primary/30 transition-all ${notif.status === 'pending' ? 'bg-primary/5' : ''
                                            }`}
                                    >
                                        <div className="flex gap-4 flex-1">
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-white/5 overflow-hidden">
                                                    {notif.fromUserImage ? (
                                                        <img src={notif.fromUserImage} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-primary/40">
                                                            <UserPlus size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-background rounded-full border border-white/10 flex items-center justify-center">
                                                    {notif.type === 'follow_request' ? (
                                                        <UserPlus size={12} className="text-primary" />
                                                    ) : (
                                                        <Heart size={12} className="text-red-500 fill-red-500" />
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm leading-relaxed mb-1 text-white/90">
                                                    <span
                                                        className="font-bold text-primary hover:underline cursor-pointer"
                                                        onClick={() => navigate(`/@${notif.fromUsername}`)}
                                                    >
                                                        @{notif.fromUsername}
                                                    </span>{" "}
                                                    {notif.message || (notif.type === 'follow_request' ? "requested to join your pulse." : "started following you.")}
                                                </p>
                                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {formatTime(notif.createdAt)}
                                                    </span>
                                                    {notif.status === 'accepted' && (
                                                        <span className="text-green-500 flex items-center gap-1">
                                                            <Check size={10} />
                                                            Connected
                                                        </span>
                                                    )}
                                                </div>

                                                {notif.status === 'pending' && (
                                                    <div className="flex gap-2 mt-4">
                                                        <button
                                                            onClick={() => handleAcceptRequest(notif)}
                                                            className="flex-1 bg-primary text-primary-foreground py-2 rounded-xl text-xs font-bold hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                                                        >
                                                            <Check size={14} />
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeclineRequest(notif.id)}
                                                            className="flex-1 bg-white/5 border border-white/10 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <X size={14} />
                                                            Decline
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 ml-4">
                                            <button
                                                onClick={() => deleteNotification(notif.id)}
                                                className="p-2 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-red-500/10"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {notifications.length === 0 && (
                                <div className="py-32 text-center space-y-4 opacity-30">
                                    <Bell className="w-16 h-16 mx-auto" />
                                    <p className="font-black uppercase tracking-[0.5em] text-sm">Silence in the Pulse</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Notifications;
