import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    User, Mail, Phone, Calendar, Music, Heart,
    MapPin, Edit3, Share2, Shield, Settings,
    ArrowLeft, CheckCircle, Sparkles, Search, X, UserMinus, UserPlus,
    Bookmark, Trash2, MoreVertical
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, deleteDoc } from "firebase/firestore";
import Navbar from "@/components/noire/Navbar";
import MobileBottomNav from "@/components/noire/MobileBottomNav";
import FloatingSidebar from "@/components/noire/FloatingSidebar";
import { useToast } from "@/hooks/use-toast";

import EditProfileModal from "@/components/noire/EditProfileModal";

/**
 * PRO Profile Page - Immersive, Cinematic, Unique
 */

const Profile = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [firebaseUser, setFirebaseUser] = useState<any>(null);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const navigate = useNavigate();

    const [userPosts, setUserPosts] = useState<any[]>([]);
    const [isPrivate, setIsPrivate] = useState(false);

    // Connections Modal State
    const [showConnections, setShowConnections] = useState(false);
    const [connectionsType, setConnectionsType] = useState<"followers" | "following">("followers");
    const [connections, setConnections] = useState<any[]>([]);
    const [connectionsLoading, setConnectionsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    // Edit/Delete State
    const [editingPost, setEditingPost] = useState<any>(null);
    const [editContent, setEditContent] = useState("");
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    setFirebaseUser(user);
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserData(data);
                        setIsPrivate(data.isPrivate || false);

                        try {
                            console.log("Fetching posts for user:", user.uid);
                            // DEBUG: Try fetching without ordering first to check if posts exist
                            const postsQuery = query(
                                collection(db, "posts"),
                                where("userId", "==", user.uid),
                                orderBy("createdAt", "desc")
                            );
                            const postsSnap = await getDocs(postsQuery);
                            console.log("Posts found:", postsSnap.size);
                            
                            const posts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                            setUserPosts(posts);
                        } catch (postError) {
                            console.error("Post fetch error details:", postError);
                            // Fallback: Try without ordering if index is missing or field is missing
                            try {
                                console.log("Retrying fetch without sort...");
                                const fallbackQuery = query(
                                    collection(db, "posts"),
                                    where("userId", "==", user.uid)
                                );
                                const fallbackSnap = await getDocs(fallbackQuery);
                                console.log("Fallback posts found:", fallbackSnap.size);
                                const posts = fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                // Sort manually if needed
                                posts.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                                setUserPosts(posts);
                            } catch (fallbackError) {
                                console.error("Fallback fetch failed:", fallbackError);
                            }
                        }

                        // Fetch real counts
                        try {
                            const followersSnap = await getDocs(collection(db, "users", user.uid, "followers"));
                            setFollowersCount(followersSnap.size);

                            const followingSnap = await getDocs(collection(db, "users", user.uid, "following"));
                            setFollowingCount(followingSnap.size);
                        } catch (socialError) {
                            console.error("Error fetching social counts:", socialError);
                        }
                    }
                } catch (error) {
                    console.error("Profile load error:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                navigate("/login");
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const fetchConnections = async (type: "followers" | "following") => {
        if (!firebaseUser) return;
        setConnectionsType(type);
        setShowConnections(true);
        setConnectionsLoading(true);
        setSearchQuery("");

        try {
            const subCol = type === "followers" ? "followers" : "following";
            const snap = await getDocs(collection(db, "users", firebaseUser.uid, subCol));
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

    const togglePrivacy = async () => {
        if (!firebaseUser) return;
        const newStatus = !isPrivate;
        setIsPrivate(newStatus);
        try {
            await updateDoc(doc(db, "users", firebaseUser.uid), {
                isPrivate: newStatus
            });
        } catch (error) {
            console.error("Error updating privacy:", error);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;
        
        setIsDeleting(postId);
        try {
            await deleteDoc(doc(db, "posts", postId));
            setUserPosts(prev => prev.filter(p => p.id !== postId));
            toast({ title: "Post Deleted", description: "Your post has been permanently removed." });
        } catch (error) {
            console.error("Error deleting post:", error);
            toast({ title: "Error", description: "Failed to delete post.", variant: "destructive" });
        } finally {
            setIsDeleting(null);
        }
    };

    const openEditModal = (post: any) => {
        setEditingPost(post);
        setEditContent(post.content || "");
    };

    const saveEdit = async () => {
        if (!editingPost) return;
        
        try {
            await updateDoc(doc(db, "posts", editingPost.id), {
                content: editContent
            });
            
            setUserPosts(prev => prev.map(p => 
                p.id === editingPost.id ? { ...p, content: editContent } : p
            ));
            
            setEditingPost(null);
            toast({ title: "Post Updated", description: "Your changes have been saved." });
        } catch (error) {
            console.error("Error updating post:", error);
            toast({ title: "Error", description: "Failed to update post.", variant: "destructive" });
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
            {firebaseUser && <FloatingSidebar />}
            <Navbar />

            <main className="container max-w-4xl mx-auto px-4 pt-24 pb-20">
                {/* Profile Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-16 mb-12 px-4 md:px-0">

                    {/* Avatar Section */}
                    <div className="flex-shrink-0 mx-auto md:mx-0 relative group">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-[2px] bg-gradient-to-tr from-zinc-700 to-zinc-900">
                            <div className="w-full h-full rounded-full bg-black p-[3px]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 relative">
                                    {userData?.avatarUrl || userData?.profileImage ? (
                                        <img
                                            src={userData.avatarUrl || userData.profileImage}
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

                        {/* Note Bubble (Cosmetic/Static for now based on image) */}
                        <div className="absolute -top-4 -right-2 bg-[#262626] rounded-[1rem] px-3 py-2 text-[10px] text-zinc-300 shadow-xl border border-white/5 animate-in fade-in zoom-in duration-500 hidden md:block">
                            <p className="font-bold mb-0.5">Listening to...</p>
                            <p className="opacity-60 truncate max-w-[80px]">Major League ...</p>
                        </div>
                    </div>

                    {/* User Info Section */}
                    <div className="flex-1 flex flex-col gap-4 w-full">
                        {/* Username Row */}
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
                            <h1 className="text-xl md:text-2xl font-normal text-zinc-100 flex items-center gap-2">
                                {userData?.username || "username"}
                                {userData?.isVerified && <CheckCircle size={16} className="text-blue-500 fill-blue-500/10" />}
                            </h1>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setShowEditProfile(true)}
                                    className="md:hidden px-4 py-1.5 bg-[#363636] rounded-lg text-sm font-semibold text-white"
                                >
                                    Edit Profile
                                </button>
                                <button className="md:hidden p-1.5 bg-[#363636] rounded-lg text-white">
                                    <UserPlus size={16} />
                                </button>
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
                            <p className="font-bold text-sm text-white">{userData?.fullName || "Full Name"}</p>
                            <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                {userData?.bio || "Silent in flame, calm as steel. A warrior of steadfast spirit."}
                            </p>
                            {userData?.website && (
                                <a href={userData.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-[#E0F1FF] hover:underline mt-1">
                                    <Share2 size={12} className="rotate-45" />
                                    {userData.website.replace(/^https?:\/\//, '')}
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Bio (Below Header) */}
                <div className="md:hidden px-4 mb-6 space-y-2">
                    <p className="font-bold text-sm text-white">{userData?.fullName || "Full Name"}</p>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                        {userData?.bio || "Silent in flame, calm as steel."}
                    </p>
                    <div className="p-3 bg-[#1A1A1A] rounded-lg text-xs text-zinc-400 mt-4 mb-4">
                        <p className="font-bold text-white mb-1">Professional Dashboard</p>
                        <p>4.2K accounts reached in the last 30 days.</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-10 px-4 md:px-0">
                    <button 
                        onClick={() => setShowEditProfile(true)}
                        className="flex-1 group relative overflow-hidden bg-[#363636] hover:bg-[#262626] rounded-xl transition-all duration-300 p-0.5"
                    >
                        <div className="relative bg-[#1A1A1A] rounded-[10px] px-4 py-3 flex items-center justify-center gap-2 group-hover:bg-[#202020] transition-colors">
                            <Edit3 size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
                            <span className="text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors">Edit Profile</span>
                        </div>
                    </button>
                    
                    <button className="flex-1 bg-[#363636] hover:bg-[#262626] text-white text-sm font-semibold py-2 rounded-xl transition-colors">
                        View archive
                    </button>
                </div>

                <EditProfileModal 
                    isOpen={showEditProfile} 
                    onClose={() => setShowEditProfile(false)}
                    userData={userData}
                    userId={firebaseUser?.uid}
                    onUpdate={() => {
                        // Refresh user data logic here if needed, or rely on existing listeners if they are real-time.
                        // Since Profile uses onAuthStateChanged -> getDoc once, we might want to manually re-fetch or use onSnapshot.
                        // For now, let's just let the user know it's updated. 
                        // Actually, let's update local state to reflect changes immediately if modal doesn't do it.
                        // The modal updates Firestore, but Profile.tsx fetches once.
                        // We should probably convert Profile.tsx to use onSnapshot for userData or reload window.
                        // Simple fix: reload or re-fetch.
                        window.location.reload(); 
                    }}
                />

                {/* Highlights Section */}
                <div className="flex gap-6 overflow-x-auto no-scrollbar mb-12 px-4 md:px-0 pb-2">
                    {[
                        { label: "Highlights", img: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=150&h=150&fit=crop" },
                        { label: "love", img: "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=150&h=150&fit=crop" },
                        { label: "silence", img: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=150&h=150&fit=crop" },
                        { label: "New", isAdd: true }
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 cursor-pointer group flex-shrink-0">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full p-[1px] bg-zinc-800 border border-white/10 group-hover:border-white/30 transition-colors">
                                <div className="w-full h-full rounded-full bg-black p-[2px] overflow-hidden flex items-center justify-center">
                                    {item.isAdd ? (
                                        <div className="w-full h-full border border-white/20 rounded-full flex items-center justify-center bg-zinc-900 group-hover:bg-zinc-800">
                                            <Search size={24} className="text-white rotate-90" /> {/* Using Search as a generic plus-like icon for now? Actually lets use a proper Plus */}
                                            {/* Lucide Plus imported above is fine, replacing Search with Plus logic visually if needed or just styling */}
                                            <span className="text-2xl text-white font-thin">+</span>
                                        </div>
                                    ) : (
                                        <img src={item.img} className="w-full h-full object-cover rounded-full opacity-80 group-hover:opacity-100 transition-opacity" />
                                    )}
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
                            <Bookmark size={12} />
                            Saved
                        </button>
                        <button className="flex items-center gap-2 py-4 border-t border-transparent text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors -mt-[1px]">
                            <User size={12} />
                            Tagged
                        </button>
                    </div>
                </div>

                {/* Posts Grid */}
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
                                            <Music className="w-6 h-6 fill-white" />
                                            <span className="font-bold">{post.comments || 0}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Edit/Delete Actions */}
                                    <div className="flex gap-3 mt-2">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditModal(post);
                                            }}
                                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                            title="Edit Post"
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeletePost(post.id);
                                            }}
                                            className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-400 hover:text-red-200 transition-colors"
                                            title="Delete Post"
                                            disabled={isDeleting === post.id}
                                        >
                                            <Trash2 size={18} />
                                        </button>
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
                        <h3 className="text-xl font-bold text-white">Share Photos</h3>
                        <p className="text-sm text-zinc-400 max-w-xs">When you share photos, they will appear on your profile.</p>
                        <button
                            onClick={() => navigate('/create')}
                            className="text-blue-500 font-bold text-sm hover:text-blue-400"
                        >
                            Share your first photo
                        </button>
                    </div>
                )}
            </main>
            <MobileBottomNav />

            {/* Connections Modal */}
            <AnimatePresence>
                {showConnections && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#262626] w-full max-w-sm rounded-[12px] overflow-hidden shadow-2xl border border-zinc-800"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                                <h3 className="font-bold text-center flex-1 capitalize text-zinc-100">{connectionsType}</h3>
                                <button onClick={() => setShowConnections(false)}><X size={20} className="text-zinc-100" /></button>
                            </div>
                            <div className="p-2 h-[400px] overflow-y-auto custom-scrollbar">
                                {connectionsLoading ? (
                                    <div className="flex justify-center p-8"><span className="loader"></span></div>
                                ) : (
                                    <div className="space-y-2">
                                        {connections.map((u) => (
                                            <div key={u.uid} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-zinc-800 bg-cover bg-center" style={{ backgroundImage: `url(${u.avatarUrl || u.profileImage})` }} />
                                                    <div>
                                                        <p className="font-bold text-sm text-zinc-100">{u.username}</p>
                                                        <p className="text-xs text-zinc-400">{u.fullName}</p>
                                                    </div>
                                                </div>
                                                <button className="px-4 py-1.5 bg-[#363636] text-white text-xs font-bold rounded-lg">Remove</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Edit Post Modal */}
            <AnimatePresence>
                {editingPost && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#262626] w-full max-w-lg rounded-[12px] overflow-hidden shadow-2xl border border-zinc-800"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                                <h3 className="font-bold text-center flex-1 text-zinc-100">Edit Info</h3>
                                <button onClick={() => setEditingPost(null)}><X size={20} className="text-zinc-100" /></button>
                            </div>
                            
                            <div className="p-4 flex flex-col md:flex-row gap-4">
                                <div className="w-full md:w-1/3 aspect-square bg-black rounded-lg overflow-hidden">
                                    {editingPost.mediaType === 'video' ? (
                                        <video src={editingPost.mediaUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={editingPost.mediaUrl} alt="Post" className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col gap-2">
                                    <label className="text-xs font-bold text-zinc-400 uppercase">Caption</label>
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full h-32 bg-[#1A1A1A] text-zinc-100 p-3 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-zinc-600"
                                        placeholder="Write a caption..."
                                    />
                                    <div className="flex justify-end gap-2 mt-4">
                                        <button 
                                            onClick={() => setEditingPost(null)}
                                            className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={saveEdit}
                                            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Profile;
