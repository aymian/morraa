import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
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
    Bookmark,
    Download,
    Send,
    X,
    Volume2,
    VolumeX,
    TrendingUp
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, doc, getDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, increment, limit, startAfter } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { AdvancedImage } from '@cloudinary/react';
import { cld } from "@/lib/cloudinary";
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { useToast } from "@/hooks/use-toast";
import { getOptimizedUrl, getVideoPoster } from "@/lib/cloudinary-helper";
import { Loader2 } from "lucide-react";

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
    likedIds: string[];
    comments: number;
}

const DashboardFeed = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [userData, setUserData] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState("");
    const [postComments, setPostComments] = useState<any[]>([]);
    const [mutedStates, setMutedStates] = useState<Record<string, boolean>>({});
    const { toast } = useToast();
    const [playingPostId, setPlayingPostId] = useState<string | null>(null);
    const [growthCount, setGrowthCount] = useState(0);
    const [showGrowth, setShowGrowth] = useState(false);
    const navigate = useNavigate();

    // Pagination state
    const [lastVisible, setLastVisible] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Intersection Observer for Auto-Play
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const videoId = entry.target.getAttribute('data-post-id');
                        if (videoId) setPlayingPostId(videoId);
                    }
                });
            },
            { threshold: 0.6 } 
        );

        const videoElements = document.querySelectorAll('.post-video-container');
        videoElements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [posts]);

    // Infinite Scroll Observer
    useEffect(() => {
        // Simulated Growth Logic
        const timers: NodeJS.Timeout[] = [];
        
        // Initial burst
        timers.push(setTimeout(() => {
            setGrowthCount(prev => prev + 2);
            setShowGrowth(true);
            toast({ 
                title: "New Followers", 
                description: "2 people started following you just now.",
                className: "bg-[#0A0A0A] border border-white/10 text-white"
            });
        }, 3000));

        // Follow-up
        timers.push(setTimeout(() => {
            setGrowthCount(prev => prev + 5);
             toast({ 
                title: "Momentum", 
                description: "Your profile is gaining visibility.",
                className: "bg-[#0A0A0A] border border-[#FBBF24]/30 text-[#FBBF24]"
            });
        }, 12000));

        return () => timers.forEach(clearTimeout);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isFetchingMore && !isLoading) {
                    fetchMorePosts();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isFetchingMore, isLoading, lastVisible]);

    const fetchPosts = async (currentUser: any) => {
        try {
            const q = query(
                collection(db, "posts"),
                orderBy("createdAt", "desc"),
                limit(5)
            );

            const documentSnapshots = await getDocs(q);
            
            const fetchedPosts = documentSnapshots.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Post[];

            setPosts(fetchedPosts);
            setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
            setHasMore(documentSnapshots.docs.length === 5);
            setIsLoading(false);

        } catch (error) {
            console.error("Error fetching posts:", error);
            setIsLoading(false);
        }
    };

    const fetchMorePosts = async () => {
        if (!lastVisible) return;
        setIsFetchingMore(true);

        try {
            const q = query(
                collection(db, "posts"),
                orderBy("createdAt", "desc"),
                startAfter(lastVisible),
                limit(5)
            );

            const documentSnapshots = await getDocs(q);
            
            if (documentSnapshots.docs.length === 0) {
                setHasMore(false);
                setIsFetchingMore(false);
                return;
            }

            const newPosts = documentSnapshots.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Post[];

            setPosts(prev => [...prev, ...newPosts]);
            setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
            setIsFetchingMore(false);

        } catch (error) {
            console.error("Error fetching more posts:", error);
            setIsFetchingMore(false);
        }
    };

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                // Fetch user data
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) setUserData(userDoc.data());
                
                // Fetch initial posts
                fetchPosts(currentUser);
            } else {
                setUser(null);
                setUserData(null);
                setPosts([]);
                setIsLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        let unsubscribe: () => void;

        if (activeCommentId) {
            // Clear text when opening a new comment section
            setCommentText("");
            
            const q = query(
                collection(db, "posts", activeCommentId, "comments"), 
                orderBy("createdAt", "asc")
            );
            
            unsubscribe = onSnapshot(q, (snapshot) => {
                const comments = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setPostComments(comments);
            }, (error) => {
                console.error("Error fetching comments:", error);
            });
        } else {
            setPostComments([]);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [activeCommentId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const handleLike = async (e: React.MouseEvent, post: Post) => {
        e.stopPropagation();
        if (!user) return;
        const isLiked = post.likedIds?.includes(user.uid);
        const postRef = doc(db, "posts", post.id);

        try {
            await updateDoc(postRef, {
                likedIds: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
                likes: isLiked ? increment(-1) : increment(1)
            });
        } catch (error) {
            console.error("Error toggling like:", error);
            toast({ 
                title: "Error", 
                description: "Failed to update like. Please check your connection or permissions.",
                variant: "destructive"
            });
        }
    };

    const handleShare = async (e: React.MouseEvent, post: Post) => {
        e.stopPropagation();
        try {
            await updateDoc(doc(db, "posts", post.id), {
                shares: increment(1)
            });
             navigator.clipboard.writeText(post.mediaUrl || window.location.href);
             toast({ title: "Shared", description: "Link copied to clipboard." });
        } catch (error) {
             console.error("Error sharing:", error);
        }
    };

    const handleDownload = async (e: React.MouseEvent, post: Post) => {
        e.stopPropagation();
        if (!post.mediaUrl) return;
        try {
            const response = await fetch(post.mediaUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `morraa-post-${post.id}.${post.mediaType === 'video' ? 'mp4' : 'jpg'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast({ title: "Downloaded", description: "Media saved to device." });
        } catch (error) {
            console.error("Download failed:", error);
            window.open(post.mediaUrl, '_blank');
        }
    };

    const toggleMute = (postId: string) => {
        setMutedStates(prev => ({
            ...prev,
            [postId]: !(prev[postId] ?? true)
        }));
    };

    const toggleComments = (e: React.MouseEvent, postId: string) => {
        e.stopPropagation();
        if (activeCommentId === postId) {
            setActiveCommentId(null);
        } else {
            setActiveCommentId(postId);
        }
    };

    const submitComment = async (postId: string) => {
        if (!commentText.trim() || !user) return;
        
        const textToSubmit = commentText.trim();
        setCommentText(""); // Optimistic clear

        try {
            await addDoc(collection(db, "posts", postId, "comments"), {
                text: textToSubmit,
                userId: user.uid,
                userName: userData?.username || user.displayName || "User",
                userAvatar: userData?.profileImage || user.photoURL,
                createdAt: serverTimestamp()
            });
            
            await updateDoc(doc(db, "posts", postId), {
                comments: increment(1)
            });
            
        } catch (error) {
            console.error("Error commenting:", error);
            setCommentText(textToSubmit); // Restore text on error
            toast({ 
                title: "Error", 
                description: "Failed to post comment. Please try again.",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="flex flex-col items-center py-6 px-4">
            
            {/* Posts Feed */}
            <div className="w-full max-w-[380px] space-y-8 pb-32">
                
                {/* Growth Widget */}
                <AnimatePresence>
                    {showGrowth && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            className="bg-gradient-to-r from-[#FBBF24]/10 to-[#F59E0B]/5 border border-[#FBBF24]/20 rounded-3xl p-5 flex items-center gap-4 relative overflow-hidden"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-[#FBBF24]/20 flex items-center justify-center shrink-0">
                                <TrendingUp className="w-6 h-6 text-[#FBBF24]" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-base">Momentum Building</p>
                                <p className="text-white/60 text-xs font-medium mt-0.5">
                                    You gained <span className="text-[#FBBF24] font-bold">+{growthCount} followers</span> in the last 2 minutes
                                </p>
                            </div>
                            <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-[#FBBF24]/10 to-transparent" />
                        </motion.div>
                    )}
                </AnimatePresence>

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
                                    onClick={() => navigate(`/view?type=post&id=${post.id}`)}
                                    className="relative bg-[#0A0A0A] rounded-[2.5rem] overflow-hidden border border-white/[0.03] shadow-[0_40px_80px_rgba(0,0,0,0.4)] group cursor-pointer"
                                >
                                    {/* Card Header - Compact */}
                                    <div className="p-3 flex items-center justify-between relative z-10" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full border border-[#FBBF24]/20 p-0.5 bg-gradient-to-br from-white/10 to-transparent">
                                            <div className="w-full h-full rounded-full bg-[#111] overflow-hidden flex items-center justify-center">
                                                {post.userAvatar ? (
                                            <img 
                                                src={getOptimizedUrl(post.userAvatar, 'image', { width: 100 })} 
                                                className="w-full h-full object-cover" 
                                                alt="User" 
                                                loading="lazy"
                                            />
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
                                                <img 
                                                    src={getOptimizedUrl(post.mediaUrl, 'image', { width: 600 })} 
                                                    className="w-full h-full object-cover shadow-2xl" 
                                                    loading="lazy" 
                                                    alt="Post content"
                                                />
                                            ) : (
                                                <div 
                                                    className="relative w-full h-full post-video-container"
                                                    data-post-id={post.id}
                                                >
                                                    <video 
                                                        src={getOptimizedUrl(post.mediaUrl, 'video')} 
                                                        className="w-full h-full object-cover" 
                                                        muted={mutedStates[post.id] ?? true}
                                                        loop 
                                                        playsInline 
                                                        preload="metadata"
                                                        poster={getVideoPoster(post.mediaUrl)}
                                                        ref={(el) => {
                                                            if (el) {
                                                                if (playingPostId === post.id) {
                                                                    // Only play if it's the active video
                                                                    const playPromise = el.play();
                                                                    if (playPromise !== undefined) {
                                                                        playPromise.catch(() => {
                                                                            // Auto-play was prevented
                                                                        });
                                                                    }
                                                                } else {
                                                                    el.pause();
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleMute(post.id);
                                                        }}
                                                        className="absolute bottom-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white/80 hover:text-white transition-all backdrop-blur-sm z-20"
                                                    >
                                                        {mutedStates[post.id] === false ? (
                                                            <Volume2 size={16} />
                                                        ) : (
                                                            <VolumeX size={16} />
                                                        )}
                                                    </button>
                                                </div>
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
                                            <button 
                                                onClick={(e) => handleLike(e, post)}
                                                className={`transition-colors ${post.likedIds?.includes(user?.uid) ? "text-red-500" : "text-white/60 hover:text-[#FBBF24]"}`}
                                            >
                                                <Heart size={20} strokeWidth={2} className={post.likedIds?.includes(user?.uid) ? "fill-current" : ""} />
                                            </button>
                                            <button 
                                                onClick={(e) => toggleComments(e, post.id)}
                                                className="text-white/60 hover:text-white transition-colors"
                                            >
                                                <MessageCircle size={20} strokeWidth={2} />
                                            </button>
                                            <button 
                                                onClick={(e) => handleShare(e, post)}
                                                className="text-white/60 hover:text-white transition-colors"
                                            >
                                                <Share2 size={20} strokeWidth={2} />
                                            </button>
                                            <button 
                                                onClick={(e) => handleDownload(e, post)}
                                                className="text-white/60 hover:text-white transition-colors"
                                            >
                                                <Download size={20} strokeWidth={2} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[11px] font-black text-white tracking-tight">{post.likes || 0} likes</p>
                                        <p className="text-[11px] leading-relaxed text-white/40">
                                            <span className="font-black text-white/80 mr-2">@{post.userEmail?.split('@')[0]}</span>
                                            {post.content.slice(0, 60)}...
                                        </p>
                                    </div>

                                    {/* Comments Section */}
                                    <AnimatePresence>
                                        {activeCommentId === post.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-2 border-t border-white/5 space-y-2" onClick={(e) => e.stopPropagation()}>
                                                    <div className="max-h-32 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                                        {postComments.map((comment) => (
                                                            <div key={comment.id} className="flex gap-2">
                                                                <span className="text-[10px] font-bold text-white">{comment.userName}:</span>
                                                                <span className="text-[10px] text-white/70">{comment.text}</span>
                                                            </div>
                                                        ))}
                                                        {postComments.length === 0 && (
                                                            <p className="text-[10px] text-white/30 italic">No comments yet.</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={commentText}
                                                            onChange={(e) => setCommentText(e.target.value)}
                                                            placeholder="Add a comment..."
                                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#FBBF24]/50"
                                                            onKeyDown={(e) => e.key === 'Enter' && submitComment(post.id)}
                                                        />
                                                        <button 
                                                            onClick={() => submitComment(post.id)}
                                                            disabled={!commentText.trim()}
                                                            className="text-[#FBBF24] disabled:opacity-50"
                                                        >
                                                            <Send size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.article>
                        ))
                    )}
                </AnimatePresence>
                
                {/* Infinite Scroll Loader / Observer Target */}
                <div ref={observerTarget} className="py-8 flex justify-center w-full min-h-[50px]">
                    {isFetchingMore && <Loader2 className="animate-spin text-[#FBBF24]" size={24} />}
                </div>
            </div>
        </div>
    );
};

export default DashboardFeed;
