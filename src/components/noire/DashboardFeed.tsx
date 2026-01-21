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
            
            {/* Posts Feed */}
            <div className="w-full max-w-[380px] space-y-8 pb-32">
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
                                {/* Card Header - Compact */}
                                <div className="p-3 flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full border border-[#FBBF24]/20 p-0.5 bg-gradient-to-br from-white/10 to-transparent">
                                            <div className="w-full h-full rounded-full bg-[#111] overflow-hidden flex items-center justify-center">
                                                {post.userAvatar ? (
                                                    <img src={post.userAvatar} className="w-full h-full object-cover" alt="User" />
                                                ) : (
                                                    <UserIcon size={14} className="text-muted-foreground" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <h4 className="text-[12px] font-black text-white tracking-tight leading-none">{post.userName || "Aura Member"}</h4>
                                            <p className="text-[8px] text-muted-foreground font-bold tracking-widest uppercase opacity-40 mt-1">@{post.userEmail?.split('@')[0] || "identity"}</p>
                                        </div>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-[#FBBF24]/40 shadow-[0_0_10px_rgba(251,191,36,0.2)]" />
                                </div>

                                {/* Media & Content Layer */}
                                <div className="relative aspect-[5/4] w-full bg-[#050505] overflow-hidden mx-auto">
                                    {post.mediaUrl ? (
                                        <>
                                            {post.mediaType === 'image' ? (
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

                                                    return <AdvancedImage cldImg={img} className="w-full h-full object-cover" />;
                                                })()
                                            ) : (
                                                <video src={post.mediaUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                                            )}
                                            {/* Text Overlay on Media */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                                            <div className="absolute bottom-6 left-6 right-6">
                                                <p className="text-xl font-display font-black text-white leading-tight drop-shadow-2xl">
                                                    {post.content}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center p-10 bg-gradient-to-br from-[#111] via-[#0A0A0A] to-black">
                                            <p className="text-xl font-display font-medium text-center italic leading-tight text-white/80 px-4">
                                                "{post.content}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Interaction Layer - Minimalist */}
                                <div className="p-4 pt-2 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <button className="text-white/60 hover:text-[#FBBF24] transition-colors"><Heart size={20} strokeWidth={2} /></button>
                                            <button className="text-white/60 hover:text-white transition-colors"><MessageCircle size={20} strokeWidth={2} /></button>
                                            <button className="text-white/60 hover:text-white transition-colors"><Share2 size={20} strokeWidth={2} /></button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[11px] font-black text-white tracking-tight">{post.likes || 0} likes</p>
                                        <p className="text-[11px] leading-relaxed text-white/40">
                                            <span className="font-black text-white/80 mr-2">@{post.userEmail?.split('@')[0]}</span>
                                            {post.content.slice(0, 60)}...
                                        </p>
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
