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
                                {userData?.isVerified && <CheckCircle size={16} className="text-blue-500 fill-blue-500/10" />}
                            </h1>
                            
                            {/* Desktop Actions */}
                            <div className="hidden md:flex items-center gap-2">
                                <button
                                    onClick={handleFollowAction}
                                    className={`px-6 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                                        isFollowing 
                                        ? "bg-[#363636] text-white hover:bg-[#262626]" 
                                        : "bg-blue-500 text-white hover:bg-blue-600"
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
                            <div className="flex gap-1.5">
                                <span className="font-bold text-white">{userPosts.length}</span>
                                <span className="text-zinc-400">posts</span>
                            </div>
                            <div className="flex gap-1.5">
                                <span className="font-bold text-white">{userData?.followersCount || 0}</span>
                                <span className="text-zinc-400">followers</span>
                            </div>
                            <div className="flex gap-1.5">
                                <span className="font-bold text-white">{userData?.followingCount || 0}</span>
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
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                isFollowing 
                                ? "bg-[#363636] text-white" 
                                : "bg-blue-500 text-white"
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
                                        className="aspect-square relative group cursor-pointer bg-zinc-900"
                                    >
                                        {post.mediaType === 'video' ? (
                                            <video src={post.mediaUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={post.mediaUrl} alt="Post" className="w-full h-full object-cover" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                                            <div className="flex items-center gap-1.5 text-white">
                                                <Heart className="w-6 h-6 fill-white" />
                                                <span className="font-bold">{post.likes || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-white">
                                                <Music className="w-6 h-6 fill-white" />
                                                <span className="font-bold">{post.comments || 0}</span>
                                            </div>
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
        </div>
    );
};

export default UserDetails;
