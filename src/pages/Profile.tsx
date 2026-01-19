import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    User, Mail, Phone, Calendar, Music, Heart,
    MapPin, Edit3, Share2, Shield, Settings,
    ArrowLeft, CheckCircle, Sparkles, Search, X, UserMinus, UserPlus
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import Navbar from "@/components/noire/Navbar";
import FloatingSidebar from "@/components/noire/FloatingSidebar";

/**
 * PRO Profile Page - Immersive, Cinematic, Unique
 */

const Profile = () => {
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [firebaseUser, setFirebaseUser] = useState<any>(null);
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
                            const postsQuery = query(
                                collection(db, "posts"),
                                where("userId", "==", user.uid),
                                orderBy("createdAt", "desc")
                            );
                            const postsSnap = await getDocs(postsQuery);
                            const posts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                            setUserPosts(posts);
                        } catch (postError) {
                            console.error("Post fetch error:", postError);
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
        { label: "Posts", value: userPosts.length.toString(), icon: Music, onClick: null },
        { label: "Followers", value: followersCount.toString(), icon: User, onClick: () => fetchConnections("followers") },
        { label: "Following", value: followingCount.toString(), icon: Share2, onClick: () => fetchConnections("following") },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden content-shift">
            {firebaseUser && <FloatingSidebar />}
            <Navbar />

            {/* Hero Header Section */}
            <section className="relative h-[40vh] md:h-[50vh] flex items-center justify-center overflow-hidden">
                {/* Cinematic Background Blur */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-background/80 to-background" />
                    <motion.div
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.3 }}
                        transition={{ duration: 1.5 }}
                        className="w-full h-full"
                        style={{
                            backgroundImage: `url(${userData?.avatarUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=2070&auto=format&fit=crop'})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'blur(60px)'
                        }}
                    />
                </div>

                <div className="relative z-10 container mx-auto px-6 pt-20">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
                        {/* Profile Avatar with Unique Glow */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="relative group"
                        >
                            <div className="absolute -inset-1.5 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative w-32 h-32 md:w-44 md:h-44 bg-muted/50 rounded-3xl overflow-hidden border border-border/30 backdrop-blur-md">
                                {userData?.avatarUrl ? (
                                    <img src={userData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/20 text-primary">
                                        <User size={64} />
                                    </div>
                                )}
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="absolute bottom-2 right-2 p-2.5 bg-primary text-primary-foreground rounded-xl shadow-xl z-20"
                            >
                                <Edit3 size={18} />
                            </motion.button>
                        </motion.div>

                        {/* User Info Branding */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-center md:text-left flex-1"
                        >
                            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
                                <h1 className="text-4xl md:text-5xl font-display font-bold">
                                    {userData?.fullName || firebaseUser?.email || "User"}
                                </h1>
                                <div className="flex items-center justify-center md:justify-start gap-2">
                                    {userData?.isVerified && (
                                        <CheckCircle size={18} className="text-blue-500" />
                                    )}
                                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full border border-primary/20 uppercase tracking-widest flex items-center gap-1">
                                        <Sparkles size={10} />
                                        PRO MEMBER
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-muted-foreground font-body mb-4">
                                <p className="flex items-center gap-1.5"><User size={14} className="text-primary" /> @{userData?.username || "aura"}</p>
                                <p className="flex items-center gap-1.5"><MapPin size={14} className="text-primary" /> Earth, Milky Way</p>
                            </div>
                            <p className="text-sm text-foreground/80 max-w-md leading-relaxed whitespace-pre-wrap md:text-left text-center">
                                {userData?.bio || "No bio yet. Define your aura."}
                            </p>

                            {/* Quick Actions */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-wrap gap-3 mt-6 justify-center md:justify-start"
                            >
                                <button
                                    onClick={togglePrivacy}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all font-body font-bold border ${isPrivate
                                        ? "bg-red-500/10 border-red-500/30 text-red-500"
                                        : "bg-green-500/10 border-green-500/30 text-green-500"
                                        }`}
                                >
                                    {isPrivate ? <Shield size={18} /> : <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                                    {isPrivate ? "Private Account" : "Public Account"}
                                </button>
                                <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl hover:shadow-lg hover:shadow-primary/20 transition-all font-body font-bold">
                                    <Edit3 size={18} />
                                    Edit Aura
                                </button>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Main Profile Content */}
            <main className="container mx-auto px-6 py-12">
                <div className="grid lg:grid-cols-12 gap-10">

                    {/* Sidebar / Info Cards */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Stats Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="glass-noire rounded-3xl border border-border/30 p-8"
                        >
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">Experience Stats</h3>
                            <div className="grid gap-6">
                                {stats.map((stat, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center gap-4 group ${stat.onClick ? 'cursor-pointer' : ''}`}
                                        onClick={stat.onClick || undefined}
                                    >
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
                        </motion.div>

                        {/* Favorite Genres Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="glass-noire rounded-3xl border border-border/30 p-8"
                        >
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">Your Vibe Palette</h3>
                            <div className="flex flex-wrap gap-3">
                                {userData?.genres?.map((genre: string) => (
                                    <span key={genre} className="px-4 py-2 bg-muted/20 border border-border/20 rounded-xl text-xs font-body capitalize hover:border-primary/50 transition-colors cursor-default">
                                        {genre}
                                    </span>
                                )) || <p className="text-sm text-muted-foreground italic">No genres selected</p>}
                            </div>
                        </motion.div>

                        {/* Security Note */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            className="p-6 bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 rounded-3xl flex items-start gap-4"
                        >
                            <Shield className="text-green-500 w-10 h-10 mt-1" />
                            <div>
                                <p className="font-bold text-sm mb-1 text-green-500">Secured Profile</p>
                                <p className="text-xs text-muted-foreground font-body leading-relaxed">
                                    Your identity is protected with end-to-end encryption. Only choosing what you share keeps your vibe yours.
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Social Feed Grid Area */}
                    <div className="lg:col-span-8 space-y-10">
                        <div>
                            <div className="flex items-center justify-between mb-8 border-b border-border/10 pb-4">
                                <div className="flex items-center gap-4">
                                    <div className="px-4 py-2 bg-primary/10 rounded-xl border border-primary/20 flex items-center gap-2">
                                        <Music className="w-4 h-4 text-primary" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-primary">Grid View</span>
                                    </div>
                                    <button className="text-xs font-bold text-muted-foreground uppercase tracking-widest hover:text-white transition-colors">Tagged</button>
                                </div>
                            </div>

                            {userPosts.length > 0 ? (
                                <div className="grid grid-cols-3 gap-1 md:gap-4">
                                    {userPosts.map((post) => (
                                        <motion.div
                                            key={post.id}
                                            whileHover={{ scale: 1.02 }}
                                            className="aspect-square relative group cursor-pointer overflow-hidden rounded-xl border border-border/10"
                                        >
                                            {post.mediaType === 'video' ? (
                                                <video
                                                    src={post.mediaUrl}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <img
                                                    src={post.mediaUrl}
                                                    alt="Post"
                                                    className="w-full h-full object-cover"
                                                />
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
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center glass-noire rounded-[2.5rem] border border-border/20 text-center">
                                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                        <Sparkles className="w-10 h-10 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-display font-bold mb-2">No Visuals Yet</h3>
                                    <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
                                        Your aura hasn't been shared with the world. Create your first post to start your journey.
                                    </p>
                                    <button
                                        onClick={() => navigate('/create')}
                                        className="mt-8 px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-bold transition-transform hover:scale-105"
                                    >
                                        Share My Aura
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </main>

            {/* Footer Space */}
            <div className="h-32" />

            {/* Connections Modal */}
            <AnimatePresence>
                {showConnections && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowConnections(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-muted/30 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-2xl"
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <h2 className="text-xl font-display font-bold capitalize">
                                    {connectionsType}
                                </h2>
                                <button
                                    onClick={() => setShowConnections(false)}
                                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4">
                                <div className="relative mb-6">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder={`Search ${connectionsType}...`}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                                    />
                                </div>

                                <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                    {connectionsLoading ? (
                                        <div className="py-20 flex justify-center">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            {connections
                                                .filter(c =>
                                                    c.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    c.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
                                                )
                                                .map((conn) => (
                                                    <motion.div
                                                        key={conn.uid}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="flex items-center justify-between group"
                                                    >
                                                        <div
                                                            className="flex items-center gap-3 cursor-pointer"
                                                            onClick={() => {
                                                                setShowConnections(false);
                                                                navigate(`/@${conn.username}`);
                                                            }}
                                                        >
                                                            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-muted/50 border border-white/5 relative">
                                                                {conn.avatarUrl || conn.profileImage ? (
                                                                    <img src={conn.avatarUrl || conn.profileImage} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-primary/50">
                                                                        <User size={20} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm leading-tight text-white group-hover:text-primary transition-colors">
                                                                    {conn.fullName || conn.username}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground font-body">
                                                                    @{conn.username}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all"
                                                            onClick={() => navigate(`/@${conn.username}`)}
                                                        >
                                                            View
                                                        </button>
                                                    </motion.div>
                                                ))
                                            }
                                            {connections.length === 0 && !connectionsLoading && (
                                                <div className="py-20 text-center text-muted-foreground">
                                                    <p className="text-sm font-body">No {connectionsType} yet.</p>
                                                </div>
                                            )}
                                        </>
                                    )}
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
