import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    User, Mail, Phone, Calendar, Music, Heart,
    MapPin, Share2, Shield, Settings,
    ArrowLeft, CheckCircle, Sparkles, MessageCircle, UserPlus, Check,
    Volume2, UserMinus, MoreVertical, X, Bell, Search, Trash2
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, orderBy, setDoc, deleteDoc, limit, serverTimestamp, addDoc } from "firebase/firestore";
import Navbar from "@/components/noire/Navbar";
import MobileBottomNav from "@/components/noire/MobileBottomNav";
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

    // Connections Modal State
    const [showConnections, setShowConnections] = useState(false);
    const [connectionsType, setConnectionsType] = useState<"followers" | "following">("followers");
    const [connections, setConnections] = useState<any[]>([]);
    const [connectionsLoading, setConnectionsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

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

    // Fetch real counts whenever targetUid changes
    useEffect(() => {
        if (!targetUid) return;

        const fetchCounts = async () => {
            try {
                const followersSnap = await getDocs(collection(db, "users", targetUid, "followers"));
                setFollowersCount(followersSnap.size);

                const followingSnap = await getDocs(collection(db, "users", targetUid, "following"));
                setFollowingCount(followingSnap.size);
            } catch (error) {
                console.error("Error fetching counts:", error);
            }
        };
        fetchCounts();
    }, [targetUid]);


    const handleDeletePost = async (postId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to remove this post?")) return;

        try {
            await deleteDoc(doc(db, "posts", postId));
            setUserPosts(prev => prev.filter(p => p.id !== postId));
            toast.success("Post removed.");
        } catch (error) {
            console.error("Error removing post:", error);
            toast.error("Failed to remove post.");
        }
    };

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

    const fetchConnections = async (type: "followers" | "following") => {
        if (!targetUid) return;
        setConnectionsType(type);
        setShowConnections(true);
        setConnectionsLoading(true);
        setSearchQuery("");

        try {
            const subCol = type === "followers" ? "followers" : "following";
            const snap = await getDocs(collection(db, "users", targetUid, subCol));
            const uids = snap.docs.map(doc => doc.id);

            if (uids.length === 0) {
                setConnections([]);
                setConnectionsLoading(false);
                return;
            }

            // Fetch user details for each UID
            const userDetails = await Promise.all(
                uids.slice(0, 50).map(async (uid) => {
                    const uDoc = await getDoc(doc(db, "users", uid));
                    return uDoc.exists() ? { uid, ...uDoc.data() } : null;
                })
            );

            setConnections(userDetails.filter(u => u !== null));
        } catch (error) {
            console.error("Error fetching connections:", error);
        } finally {
            setConnectionsLoading(false);
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


    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden content-shift">
            {currentUser && <FloatingSidebar />}
            <Navbar />

            <main className="container max-w-4xl mx-auto px-4 pt-24 pb-20">
                {/* Profile Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-16 mb-12 px-4 md:px-0">

                    {/* Avatar Section */}
                    <div className="flex-shrink-0 mx-auto md:mx-0 relative group">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-[2px] bg-gradient-to-tr from-zinc-700 to-zinc-900">
                            <div className="w-full h-full rounded-full bg-black p-[3px]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 relative">
                                    {userData?.profileImage ? (
                                        <img
                                            src={userData.profileImage}
                                            alt={userData?.username}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                            <User size={48} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Info Section */}
                    <div className="flex-1 flex flex-col gap-4 w-full">
                        {/* Username Row */}
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
                            <h1 className="text-xl md:text-2xl font-normal text-zinc-100 flex items-center gap-2">
                                {userData?.username || "identity"}
                                {userData?.isVerified && (
                                    <div className="relative flex items-center justify-center w-[18px] h-[18px] bg-gradient-to-br from-[#4C9EEB] to-[#0866FF] rounded-full shadow-sm">
                                        <svg viewBox="0 0 40 40" className="w-[18px] h-[18px]" fill="none">
                                            <path d="M19.7 8.93994L17.85 10.79L13.45 15.19L11.6 17.04C10.42 18.22 10.42 20.12 11.6 21.3L17.85 27.55C19.03 28.73 20.93 28.73 22.11 27.55L28.36 21.3C29.54 20.12 29.54 18.22 28.36 17.04L22.11 10.79L19.7 8.93994C19.32 8.55994 18.69 8.55994 18.31 8.93994C17.93 9.31994 17.93 9.94994 18.31 10.33L19.98 12L12 19.98L10.33 18.31C9.95 17.93 9.32 17.93 8.94 18.31C8.56 18.69 8.56 19.32 8.94 19.7L10.79 21.55L15.19 25.95L17.04 27.8C18.22 28.98 20.12 28.98 21.3 27.8L27.55 21.55C28.73 20.37 28.73 18.47 27.55 17.29L21.3 11.04L19.7 8.93994Z" fill="white" />
                                            <path d="M19.98 12L28.36 20.38C28.74 20.76 28.74 21.39 28.36 21.77L22.11 28.02C21.73 28.4 21.1 28.4 20.72 28.02L11.6 18.9C11.22 18.52 11.22 17.89 11.6 17.51L17.85 11.26C18.23 10.88 18.86 10.88 19.24 11.26L19.98 12Z" fill="white" />
                                        </svg>
                                    </div>
                                )}
                            </h1>

                            {/* Desktop Actions */}
                            <div className="hidden md:flex items-center gap-2">
                                <button
                                    onClick={handleFollowAction}
                                    className={`px-6 py-1.5 rounded-lg text-sm font-semibold transition-colors ${isFollowing
                                        ? "bg-[#363636] text-white hover:bg-[#262626]"
                                        : "bg-[#FBBF24] text-black hover:bg-[#F59E0B]"
                                        }`}
                                >
                                    {isFollowing ? "Following" : requestSent ? "Requested" : "Follow"}
                                </button>

                                {isFollowing && (
                                    <button
                                        onClick={() => navigate(`/messages/${userData.username}`)}
                                        className="px-4 py-1.5 bg-[#363636] text-white text-sm font-semibold rounded-lg hover:bg-[#262626]"
                                    >
                                        Message
                                    </button>
                                )}

                                {isFollowing && (
                                    <button
                                        onClick={() => setShowFollowMenu(!showFollowMenu)}
                                        className="p-1.5 bg-[#363636] text-white rounded-lg hover:bg-[#262626] relative"
                                    >
                                        <MoreVertical size={16} />
                                        {/* Dropdown Menu */}
                                        <AnimatePresence>
                                            {showFollowMenu && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute top-full right-0 mt-2 w-48 bg-[#262626] border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden"
                                                >
                                                    <button onClick={handleUnfollow} className="w-full text-left px-4 py-3 text-red-500 hover:bg-white/5 text-sm font-semibold">
                                                        Unfollow
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center justify-center md:justify-start gap-8 text-sm md:text-base">
                            <div className="flex gap-1.5 cursor-pointer hover:opacity-70 transition-opacity">
                                <span className="font-bold text-white">{userPosts.length}</span>
                                <span className="text-zinc-400">posts</span>
                            </div>
                            <div
                                className="flex gap-1.5 cursor-pointer hover:opacity-70 transition-opacity"
                                onClick={() => fetchConnections("followers")}
                            >
                                <span className="font-bold text-white">{followersCount}</span>
                                <span className="text-zinc-400">followers</span>
                            </div>
                            <div
                                className="flex gap-1.5 cursor-pointer hover:opacity-70 transition-opacity"
                                onClick={() => fetchConnections("following")}
                            >
                                <span className="font-bold text-white">{followingCount}</span>
                                <span className="text-zinc-400">following</span>
                            </div>
                        </div>

                        {/* Bio Section */}
                        <div className="hidden md:block space-y-1">
                            <p className="font-bold text-sm text-white">{userData?.fullName || "Aura Identity"}</p>
                            <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                {userData?.bio || "Silent in flame, calm as steel."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mobile Bio & Actions */}
                <div className="md:hidden px-4 mb-6 space-y-4">
                    <div className="space-y-1">
                        <p className="font-bold text-sm text-white">{userData?.fullName || "Aura Identity"}</p>
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                            {userData?.bio || "Silent in flame, calm as steel."}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleFollowAction}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${isFollowing
                                ? "bg-[#363636] text-white"
                                : "bg-[#FBBF24] text-black hover:bg-[#F59E0B]"
                                }`}
                        >
                            {isFollowing ? "Following" : requestSent ? "Requested" : "Follow"}
                        </button>
                        {isFollowing && (
                            <button
                                onClick={() => navigate(`/messages/${userData.username}`)}
                                className="flex-1 py-2 bg-[#363636] text-white text-sm font-semibold rounded-lg"
                            >
                                Message
                            </button>
                        )}
                    </div>
                </div>

                {/* Highlights Section */}
                <div className="flex gap-6 overflow-x-auto no-scrollbar mb-12 px-4 md:px-0 pb-2">
                    {[
                        { label: "Highlights", img: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=150&h=150&fit=crop" },
                        { label: "Vibe", img: "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=150&h=150&fit=crop" },
                        { label: "Life", img: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=150&h=150&fit=crop" }
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 cursor-pointer group flex-shrink-0">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full p-[1px] bg-zinc-800 border border-white/10 group-hover:border-white/30 transition-colors">
                                <div className="w-full h-full rounded-full bg-black p-[2px] overflow-hidden">
                                    <img src={item.img} className="w-full h-full object-cover rounded-full opacity-80 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                            <span className="text-xs text-zinc-100 font-medium">{item.label}</span>
                        </div>
                    ))}
                </div>

                {/* Profile Tabs */}
                <div className="border-t border-zinc-800 mb-1">
                    <div className="flex justify-center gap-12">
                        <button className="flex items-center gap-2 py-4 border-t border-white text-xs font-bold uppercase tracking-widest text-white -mt-[1px]">
                            <svg aria-label="" className="x1lliihq x1n2onr6 x5n08af" fill="currentColor" height="12" role="img" viewBox="0 0 24 24" width="12">
                                <rect fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" width="18" x="3" y="3"></rect>
                                <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="9.015" x2="9.015" y1="3" y2="21"></line>
                                <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="14.985" x2="14.985" y1="3" y2="21"></line>
                                <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="21" x2="3" y1="9.015" y2="9.015"></line>
                                <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="21" x2="3" y1="14.985" y2="14.985"></line>
                            </svg>
                            Posts
                        </button>
                        <button className="flex items-center gap-2 py-4 border-t border-transparent text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors -mt-[1px]">
                            <User size={12} />
                            Tagged
                        </button>
                    </div>
                </div>

                {/* Content Logic */}
                {userData?.isPrivate && !isFollowing ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 border border-zinc-800 rounded-3xl mx-4 md:mx-0">
                        <div className="w-16 h-16 rounded-full border-2 border-zinc-800 flex items-center justify-center">
                            <Shield size={32} className="text-zinc-600" />
                        </div>
                        <h3 className="text-lg font-bold text-white">This Account is Private</h3>
                        <p className="text-sm text-zinc-400 max-w-xs">Follow this account to see their photos and videos.</p>
                    </div>
                ) : (
                    <>
                        {userPosts.length > 0 ? (
                            <div className="grid grid-cols-3 gap-1 md:gap-4">
                                {userPosts.map((post) => (
                                    <motion.div
                                        key={post.id}
                                        onClick={() => navigate(`/view?type=post&id=${post.id}`)}
                                        className="aspect-square relative group cursor-pointer bg-zinc-900"
                                    >
                                        {post.mediaType === 'video' ? (
                                            <video src={post.mediaUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={post.mediaUrl} alt="Post" className="w-full h-full object-cover" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-1.5 text-white">
                                                    <Heart className="w-6 h-6 fill-white" />
                                                    <span className="font-bold">{post.likes || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-white">
                                                    <MessageCircle className="w-6 h-6 fill-white" />
                                                    <span className="font-bold">{post.comments || 0}</span>
                                                </div>
                                            </div>
                                            {currentUser?.uid === targetUid && (
                                                <button
                                                    onClick={(e) => handleDeletePost(post.id, e)}
                                                    className="bg-red-500/80 p-2 rounded-full text-white hover:bg-red-500 transition-colors mt-2"
                                                    title="Remove Post"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full border-2 border-zinc-800 flex items-center justify-center">
                                    <Music size={32} className="text-zinc-600" />
                                </div>
                                <h3 className="text-xl font-bold text-white">No Posts Yet</h3>
                            </div>
                        )}
                    </>
                )}
            </main>
            <MobileBottomNav />

            {/* Connections Modal */}
            <AnimatePresence>
                {showConnections && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#1A1A1A] w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                        >
                            <div className="p-4 border-b border-white/5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-center flex-1 capitalize text-white text-lg">{connectionsType}</h3>
                                    <button onClick={() => setShowConnections(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                        <X size={20} className="text-white" />
                                    </button>
                                </div>

                                {/* Search Bar */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#FBBF24]/50 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="p-2 h-[400px] overflow-y-auto custom-scrollbar">
                                {connectionsLoading ? (
                                    <div className="flex justify-center p-8">
                                        <div className="w-8 h-8 border-2 border-[#FBBF24] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {connections
                                            .filter(u =>
                                                u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                u.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
                                            )
                                            .map((u) => (
                                                <div
                                                    key={u.uid}
                                                    className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors"
                                                    onClick={() => {
                                                        setShowConnections(false);
                                                        navigate(`/@${u.username}`);
                                                    }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-zinc-800 bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${u.avatarUrl || u.profileImage})` }} />
                                                        <div>
                                                            <p className="font-bold text-sm text-white">{u.username}</p>
                                                            <p className="text-xs text-zinc-400">{u.fullName}</p>
                                                        </div>
                                                    </div>
                                                    <button className="px-4 py-1.5 bg-white/5 text-white text-xs font-bold rounded-lg hover:bg-white/10 transition-colors border border-white/5">
                                                        View
                                                    </button>
                                                </div>
                                            ))}
                                        {connections.length === 0 && !connectionsLoading && (
                                            <p className="text-center text-zinc-500 py-8 text-sm">No users found.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserDetails;
