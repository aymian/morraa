import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    User, Mail, Phone, Calendar, Music, Heart,
    MapPin, Share2, Shield, Settings,
    ArrowLeft, CheckCircle, Sparkles, MessageCircle, UserPlus, Check,
    Volume2, UserMinus, MoreVertical, X, Bell
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, orderBy, setDoc, deleteDoc, limit, serverTimestamp, addDoc } from "firebase/firestore";
import Navbar from "@/components/noire/Navbar";
import FloatingSidebar from "@/components/noire/FloatingSidebar";
import { toast } from "sonner";

/**
 * UserDetails Page - The Public view for other profiles
 */

const UserDetails = () => {
    const { username } = useParams();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [targetUid, setTargetUid] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [currentUserData, setCurrentUserData] = useState<any>(null);
    const [userPosts, setUserPosts] = useState<any[]>([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [showFollowMenu, setShowFollowMenu] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    setCurrentUserData(userDoc.data());
                }
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!username) {
            navigate("/");
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setNotFound(false);
            setUserData(null);
            setTargetUid(null);
            setUserPosts([]);
            setIsFollowing(false);
            setRequestSent(false);
            setShowFollowMenu(false);

            try {
                const cleanValue = username.startsWith("@") ? username.slice(1) : username;

                // 1. Try to find by username handle (primary)
                const userQuery = query(
                    collection(db, "users"),
                    where("username", "==", cleanValue.toLowerCase()),
                    limit(1)
                );
                const querySnap = await getDocs(userQuery);

                let uid = "";
                let data = null;

                if (!querySnap.empty) {
                    uid = querySnap.docs[0].id;
                    data = querySnap.docs[0].data();
                } else {
                    // Try case-sensitive exact match if lowercase fails
                    const exactQuery = query(
                        collection(db, "users"),
                        where("username", "==", cleanValue),
                        limit(1)
                    );
                    const exactSnap = await getDocs(exactQuery);
                    if (!exactSnap.empty) {
                        uid = exactSnap.docs[0].id;
                        data = exactSnap.docs[0].data();
                    } else {
                        // 2. Try to find by UID fallback
                        const userDoc = await getDoc(doc(db, "users", cleanValue));
                        if (userDoc.exists()) {
                            uid = userDoc.id;
                            data = userDoc.data();
                        }
                    }
                }

                if (data && uid) {
                    setUserData(data);
                    setTargetUid(uid);

                    // Fetch user posts
                    const postsQuery = query(
                        collection(db, "posts"),
                        where("userId", "==", uid),
                        orderBy("createdAt", "desc")
                    );
                    const postsSnap = await getDocs(postsQuery);
                    const posts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setUserPosts(posts);
                } else {
                    console.warn(`Identity "@${username}" has not been deployed to the aura yet.`);
                    setNotFound(true);
                }
            } catch (error) {
                console.error("Critical aura synchronization error:", error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [username, navigate]);

    // Check following and request status whenever currentUser or targetUid changes
    useEffect(() => {
        const checkStatus = async () => {
            if (currentUser && targetUid) {
                try {
                    // Check if already following
                    const followDoc = await getDoc(doc(db, "users", currentUser.uid, "following", targetUid));
                    setIsFollowing(followDoc.exists());

                    // Check if request is pending
                    const requestQuery = query(
                        collection(db, "notifications"),
                        where("toUserId", "==", targetUid),
                        where("fromUserId", "==", currentUser.uid),
                        where("type", "==", "follow_request"),
                        where("status", "==", "pending"),
                        limit(1)
                    );
                    const requestSnap = await getDocs(requestQuery);
                    setRequestSent(!requestSnap.empty);
                } catch (error) {
                    console.error("Error checking follow/request status:", error);
                }
            }
        };
        checkStatus();
    }, [currentUser, targetUid]);


    const handleFollowAction = async () => {
        console.log("Follow action triggered for target:", targetUid);
        if (!currentUser) {
            toast.error("Please sign in to follow this aura.");
            return;
        }
        if (!targetUid) {
            toast.error("Identity synchronization pending...");
            return;
        }
        if (currentUser.uid === targetUid) {
            toast.error("You cannot follow your own aura.");
            return;
        }

        try {
            if (isFollowing) {
                setShowFollowMenu(!showFollowMenu);
                return;
            }

            if (requestSent) {
                toast.info("Aura request is already pending.");
                return;
            }

            if (userData?.isPrivate) {
                console.log("Creating follow request notification...");
                await addDoc(collection(db, "notifications"), {
                    type: "follow_request",
                    fromUserId: currentUser.uid,
                    fromUsername: currentUserData?.username || currentUser.email?.split('@')[0] || "Aura Identity",
                    fromUserImage: currentUserData?.profileImage || null,
                    toUserId: targetUid,
                    status: "pending",
                    createdAt: serverTimestamp(),
                    message: `${currentUserData?.username || currentUser.email?.split('@')[0] || "Someone"} wants to follow you.`
                });

                setRequestSent(true);
                toast.success("Connection request sent to private aura.");
            } else {
                console.log("Executing auto-follow connection...");
                const followRef = doc(db, "users", currentUser.uid, "following", targetUid);
                const followerRef = doc(db, "users", targetUid, "followers", currentUser.uid);

                // Update current user's following list
                await setDoc(followRef, { timestamp: serverTimestamp() });

                // Update target user's followers list (defensive)
                try {
                    await setDoc(followerRef, { timestamp: serverTimestamp() });
                } catch (followerErr) {
                    console.warn("Follower mirrored write rejected (Security Rules):", followerErr);
                }

                setIsFollowing(true);

                // Send Notification
                await addDoc(collection(db, "notifications"), {
                    type: "follow",
                    fromUserId: currentUser.uid,
                    fromUsername: currentUserData?.username || currentUser.email?.split('@')[0] || "Aura Identity",
                    fromUserImage: currentUserData?.profileImage || null,
                    toUserId: targetUid,
                    createdAt: serverTimestamp(),
                    message: `${currentUserData?.username || currentUser.email?.split('@')[0] || "Someone"} started following you.`
                });

                toast.success(`Now following @${userData?.username || "this aura"}`);
            }
        } catch (error: any) {
            console.error("Critical follow action failure:", error);
            toast.error(error?.message || "Aura connection failed. Please try again.");
        }
    };

    const handleUnfollow = async () => {
        if (!currentUser || !targetUid) return;
        try {
            console.log("Executing unfollow protocol...");
            await deleteDoc(doc(db, "users", currentUser.uid, "following", targetUid));
            await deleteDoc(doc(db, "users", targetUid, "followers", currentUser.uid));
            setIsFollowing(false);
            setShowFollowMenu(false);
        } catch (error) {
            console.error("Unfollow error:", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
                />
            </div>
        );
    }

    const stats = [
        { label: "Posts", value: userPosts.length.toString(), icon: Music },
        { label: "Followers", value: userData?.followersCount || "0", icon: User },
        { label: "Following", value: userData?.followingCount || "0", icon: Share2 },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden content-shift">
            {currentUser && <FloatingSidebar />}
            <Navbar />

            {/* Hero Header Section */}
            <section className="relative h-[40vh] md:h-[50vh] flex items-center justify-center overflow-hidden">
                {/* Cinematic Background Blur */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background/80 to-background" />
                    <motion.div
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.3 }}
                        transition={{ duration: 1.5 }}
                        className="w-full h-full"
                        style={{
                            backgroundImage: `url(${userData?.profileImage || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=2070&auto=format&fit=crop'})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'blur(60px)'
                        }}
                    />
                </div>

                <div className="relative z-10 container mx-auto px-6 pt-20">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
                        {/* Profile Avatar */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="relative group"
                        >
                            <div className="absolute -inset-1.5 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative w-32 h-32 md:w-44 md:h-44 bg-muted/50 rounded-3xl overflow-hidden border border-border/30 backdrop-blur-md">
                                {userData?.profileImage ? (
                                    <img src={userData.profileImage} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/20 text-primary">
                                        <User size={64} />
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* User Info */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-center md:text-left flex-1"
                        >
                            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
                                <h1 className="text-4xl md:text-5xl font-display font-bold">
                                    {userData?.fullName || userData?.username || "Aura Identity"}
                                </h1>
                                <div className="flex items-center justify-center md:justify-start gap-2">
                                    {userData?.isVerified && (
                                        <CheckCircle size={18} className="text-blue-500" />
                                    )}
                                    {userData?.isPro && (
                                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full border border-primary/20 uppercase tracking-widest flex items-center gap-1">
                                            <Sparkles size={10} />
                                            PRO
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-muted-foreground font-body mb-4">
                                <p className="flex items-center gap-1.5"><User size={14} className="text-primary" /> @{userData?.username || "identity"}</p>
                                <p className="flex items-center gap-1.5"><MapPin size={14} className="text-primary" /> Earth, Milky Way</p>
                            </div>
                            <p className="text-sm text-foreground/80 max-w-md leading-relaxed whitespace-pre-wrap md:text-left text-center">
                                {userData?.bio || "No bio yet. This aura is still forming."}
                            </p>
                        </motion.div>

                        {/* Actions */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="flex items-center gap-3 relative"
                        >
                            <div className="flex gap-2">
                                <button
                                    onClick={handleFollowAction}
                                    className={`flex items-center gap-2 px-8 py-4 rounded-2xl transition-all font-body font-bold border ${isFollowing
                                        ? "bg-white/5 border-white/10 text-white"
                                        : requestSent
                                            ? "bg-white/5 border-white/10 text-muted-foreground cursor-default"
                                            : "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105"
                                        }`}
                                >
                                    {isFollowing ? (
                                        <>
                                            <Check size={18} />
                                            <span>Following</span>
                                            <MoreVertical size={16} className="ml-1 opacity-50" />
                                        </>
                                    ) : requestSent ? (
                                        <>
                                            <Sparkles size={18} />
                                            <span>Requested</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={18} />
                                            <span>Follow</span>
                                        </>
                                    )}
                                </button>

                                {isFollowing && (
                                    <button
                                        onClick={() => navigate(`/messages/${userData.username}`)}
                                        className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
                                    >
                                        <MessageCircle size={18} />
                                        <span>Message</span>
                                    </button>
                                )}
                            </div>

                            {/* Following Sub-Menu */}
                            <AnimatePresence>
                                {showFollowMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-full left-0 mt-3 w-56 glass-noire border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl"
                                    >
                                        <div className="p-2 space-y-1">
                                            <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 text-sm transition-all text-white group">
                                                <div className="flex items-center gap-3">
                                                    <Volume2 size={18} className="text-muted-foreground group-hover:text-white" />
                                                    <span>Mute Aura</span>
                                                </div>
                                            </button>
                                            <button
                                                onClick={handleUnfollow}
                                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-red-500/10 text-sm transition-all text-red-400 group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <UserMinus size={18} />
                                                    <span>Unfollow</span>
                                                </div>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Content Area */}
            <main className="container mx-auto px-6 py-12">
                <div className="grid lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="glass-noire rounded-3xl border border-border/30 p-8">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">Experience Stats</h3>
                            <div className="grid gap-6">
                                {stats.map((stat, i) => (
                                    <div key={i} className="flex items-center gap-4 group">
                                        <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 group-hover:scale-110 transition-transform text-primary">
                                            <stat.icon size={20} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-display font-bold leading-none">{stat.value}</p>
                                            <p className="text-xs text-muted-foreground font-body">{stat.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {userData?.isPrivate && (
                            <div className="p-8 glass-noire border border-red-500/20 rounded-3xl text-center space-y-4">
                                <Shield className="w-12 h-12 text-red-500 mx-auto" />
                                <h4 className="text-lg font-bold">This Aura is Private</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Follow this user to see their posts and influence deployments.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-8">
                        {userData?.isPrivate && !isFollowing ? (
                            <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/5 rounded-[40px] text-muted-foreground uppercase tracking-widest font-black opacity-20">
                                Protected Content
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-1 md:gap-4">
                                {userPosts.map((post) => (
                                    <motion.div
                                        key={post.id}
                                        whileHover={{ scale: 1.02 }}
                                        className="aspect-square relative group cursor-pointer overflow-hidden rounded-xl border border-border/10"
                                    >
                                        {post.mediaType === 'video' ? (
                                            <video src={post.mediaUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={post.mediaUrl} alt="Post" className="w-full h-full object-cover" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                                            <div className="flex items-center gap-1.5 text-white">
                                                <Heart className="w-5 h-5 fill-white" />
                                                <span className="font-bold">{post.likes || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-white">
                                                <Music className="w-5 h-5 fill-white" />
                                                <span className="font-bold">{post.comments || 0}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                {userPosts.length === 0 && (
                                    <div className="col-span-3 py-20 text-center opacity-20 uppercase tracking-[0.4em] font-black">
                                        No Influence Deployed
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <div className="h-32" />
        </div>
    );
};

export default UserDetails;
