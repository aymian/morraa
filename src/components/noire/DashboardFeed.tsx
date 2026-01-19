import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Heart,
    MessageCircle,
    Share2,
    MoreHorizontal,
    ShieldCheck,
    Music2,
    LayoutGrid,
    Play,
    User as UserIcon,
    Plus,
    Bookmark
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, doc, getDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { AdvancedImage } from '@cloudinary/react';
import { cld } from "@/lib/cloudinary";
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';

interface Post {
    isVerified: any;
    userAvatar: any;
    userName: any;
    userEmail: any;
    id: string;
    content: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    createdAt: any;
    likes: number;
    comments: number;
}

const DashboardFeed = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [userData, setUserData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let unsubscribePosts: () => void;

        const setupListeners = async (currentUser: any) => {
            if (!currentUser) return;

            try {
                // 1. Fetch/Stream User Data
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) setUserData(userDoc.data());

                // 2. Real-time Global Pulse Stream
                const q = query(
                    collection(db, "posts"),
                    orderBy("createdAt", "desc")
                );

                unsubscribePosts = onSnapshot(q, async (snapshot) => {
                    const fetchedPosts = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as Post[];

                    setPosts(fetchedPosts);
                    setIsLoading(false);
                }, (error) => {
                    console.error("Pulse stream error:", error);
                    setIsLoading(false);
                });

            } catch (error) {
                console.error("Error setting up dashboard listeners:", error);
                setIsLoading(false);
            }
        };

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setupListeners(currentUser);
            } else {
                setUserData(null);
                setPosts([]);
                setIsLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribePosts) unsubscribePosts();
        };
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center py-6 px-4">
            {/* The Pulse Header */}
            <div className="w-full max-w-[500px] mb-10 flex items-center justify-between px-2">
                <div>
                    <h2 className="text-2xl font-display font-bold text-white tracking-tight">The Pulse</h2>
                    <div className="flex items-center gap-1.5 pt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24] animate-pulse" />
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.25em]">Global Influence Feed</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-px h-6 bg-white/10 mx-2" />
                    <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
                        <Play size={16} className="text-muted-foreground" />
                    </button>
                </div>
            </div>

            {/* Posts Feed */}
            <div className="w-full max-w-[500px] space-y-14 pb-32">
                <AnimatePresence>
                    {posts.length === 0 ? (
                        <div className="py-24 text-center space-y-6">
                            <div className="w-16 h-16 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto border border-white/5">
                                <Plus size={24} className="text-muted-foreground opacity-30" />
                            </div>
                            <p className="text-muted-foreground font-display font-medium tracking-wide">The Pulse is dormant.<br />Be the first to project influence.</p>
                        </div>
                    ) : (
                        posts.map((post, idx) => (
                            <motion.article
                                key={post.id}
                                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className="relative bg-[#0A0A0A] rounded-[2.5rem] overflow-hidden border border-white/[0.03] shadow-[0_40px_80px_rgba(0,0,0,0.4)] group"
                            >
                                {/* Card Header */}
                                <div className="p-5 flex items-center justify-between relative z-10 border-b border-white/[0.02]">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-11 h-11 rounded-full border border-[#FBBF24]/20 p-0.5 bg-gradient-to-br from-white/10 to-transparent">
                                            <div className="w-full h-full rounded-full bg-[#111] overflow-hidden flex items-center justify-center border border-white/5">
                                                {post.userAvatar ? (
                                                    <img src={post.userAvatar} className="w-full h-full object-cover" alt="User" />
                                                ) : (
                                                    <UserIcon size={18} className="text-muted-foreground" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <h4 className="text-[13px] font-black text-white tracking-tight leading-none">{post.userName || "Aura Member"}</h4>
                                                {post.isVerified && <ShieldCheck size={12} className="text-[#FBBF24]" fill="#FBBF24" fillOpacity={0.1} />}
                                            </div>
                                            <p className="text-[9px] text-muted-foreground font-bold tracking-widest uppercase opacity-40 mt-1">@{post.userEmail?.split('@')[0] || "identity"}</p>
                                        </div>
                                    </div>
                                    <button className="p-2 hover:bg-white/5 rounded-xl transition-all">
                                        <div className="flex gap-0.5">
                                            <div className="w-1 h-1 rounded-full bg-white/30" />
                                            <div className="w-1 h-1 rounded-full bg-white/30" />
                                            <div className="w-1 h-1 rounded-full bg-white/30" />
                                        </div>
                                    </button>
                                </div>

                                {/* Main Media Area */}
                                <div className="relative aspect-square w-full bg-[#050505] overflow-hidden border-b border-white/[0.02]">
                                    {post.mediaUrl ? (
                                        post.mediaType === 'image' ? (
                                            (() => {
                                                const url = post.mediaUrl;
                                                const uploadIndex = url.indexOf('/upload/');
                                                if (uploadIndex === -1) return <img src={url} className="w-full h-full object-cover shadow-2xl" />;

                                                const stringAfterUpload = url.substring(uploadIndex + 8);
                                                const parts = stringAfterUpload.split('/');
                                                const startIndex = parts[0].startsWith('v') ? 1 : 0;
                                                const pathWithExt = parts.slice(startIndex).join('/');
                                                const publicId = pathWithExt.substring(0, pathWithExt.lastIndexOf('.'));

                                                const img = cld.image(publicId)
                                                    .format('auto')
                                                    .quality('auto')
                                                    .resize(auto().gravity(autoGravity()).width(1000).height(1000));

                                                return <AdvancedImage cldImg={img} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-105" />;
                                            })()
                                        ) : (
                                            <video src={post.mediaUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                                        )
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center p-14 bg-gradient-to-br from-[#111] via-[#0A0A0A] to-black">
                                            <p className="text-2xl font-display font-medium text-center italic leading-tight text-white/80 drop-shadow-2xl px-4">
                                                "{post.content}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Interaction Layer */}
                                <div className="p-6 space-y-5 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <button className="group flex items-center gap-2.5 text-muted-foreground hover:text-[#FBBF24] transition-all">
                                                <Heart size={24} className="group-active:scale-150 transition-transform duration-300" strokeWidth={1.5} />
                                                <span className="text-[11px] font-bold font-mono tracking-tighter">{post.likes || 0}</span>
                                            </button>
                                            <button className="group flex items-center gap-2.5 text-muted-foreground hover:text-white transition-all">
                                                <MessageCircle size={24} strokeWidth={1.5} />
                                                <span className="text-[11px] font-bold font-mono tracking-tighter">{post.comments || 0}</span>
                                            </button>
                                            <button className="group flex items-center gap-2.5 text-muted-foreground hover:text-white transition-all">
                                                <Share2 size={24} strokeWidth={1.5} />
                                            </button>
                                        </div>
                                        <button className="text-muted-foreground hover:text-white transition-all">
                                            <Bookmark size={22} strokeWidth={1.5} />
                                        </button>
                                    </div>

                                    <div className="space-y-2.5">
                                        <p className="text-[13px] leading-relaxed text-white/90">
                                            <span className="font-black text-white mr-2.5 tracking-tighter">@{post.userEmail?.split('@')[0]}</span>
                                            <span className="font-medium opacity-80">{post.content}</span>
                                        </p>
                                        <div className="flex items-center gap-3 pt-1">
                                            <div className="h-[1px] w-6 bg-[#FBBF24]/30" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FBBF24]/60">Pulse Verified</span>
                                            <div className="h-px flex-1 bg-white/[0.03]" />
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-30">
                                                {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Aura Active'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.article>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default DashboardFeed;
