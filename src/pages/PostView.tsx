import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    X,
    Heart,
    Send,
    MoreHorizontal,
    Download,
    Share2,
    MessageCircle,
    User as UserIcon,
    Volume2,
    VolumeX
} from "lucide-react";
import MobileBottomNav from "@/components/noire/MobileBottomNav";
import { db, auth } from "@/lib/firebase";
import {
    getDoc,
    doc,
    collection,
    query,
    onSnapshot,
    updateDoc,
    arrayUnion,
    arrayRemove,
    orderBy,
    addDoc,
    serverTimestamp,
    increment
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { AdvancedImage } from '@cloudinary/react';
import { cld } from "@/lib/cloudinary";
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';

/**
 * POST VIEW - "The Detail"
 * Instagram-style immersive post viewer with comments and likes.
 */

const PostView = () => {
    const [searchParams] = useSearchParams();
    const postId = searchParams.get('id');

    const navigate = useNavigate();
    const { toast } = useToast();

    // Global State
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [post, setPost] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Comments State
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState("");
    
    // Media State
    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) setUserData(userDoc.data());
            } else {
                setUser(null);
                setUserData(null);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!postId) {
            setIsLoading(false);
            return;
        }

        const postRef = doc(db, "posts", postId);
        
        // Subscribe to post updates (likes count etc)
        const unsubscribePost = onSnapshot(postRef, (docSnap) => {
            if (docSnap.exists()) {
                setPost({ id: docSnap.id, ...docSnap.data() });
            } else {
                toast({ title: "Error", description: "Post not found", variant: "destructive" });
                navigate('/');
            }
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching post:", error);
            setIsLoading(false);
        });

        // Subscribe to comments
        const commentsQuery = query(
            collection(db, "posts", postId, "comments"),
            orderBy("createdAt", "asc")
        );

        const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
            const fetchedComments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setComments(fetchedComments);
        });

        return () => {
            unsubscribePost();
            unsubscribeComments();
        };
    }, [postId, navigate, toast]);

    const handleLike = async () => {
        if (!user || !post) return;
        const isLiked = post.likedIds?.includes(user.uid);
        const postRef = doc(db, "posts", post.id);

        try {
            await updateDoc(postRef, {
                likedIds: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
                likes: isLiked ? increment(-1) : increment(1)
            });
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    const submitComment = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!commentText.trim() || !user || !post) return;
        
        const textToSubmit = commentText;
        setCommentText(""); // Optimistic clear

        try {
            await addDoc(collection(db, "posts", post.id, "comments"), {
                text: textToSubmit,
                userId: user.uid,
                userName: userData?.username || user.displayName || "User",
                userAvatar: userData?.profileImage || user.photoURL,
                createdAt: serverTimestamp()
            });
            
            await updateDoc(doc(db, "posts", post.id), {
                comments: increment(1)
            });
            
        } catch (error) {
            console.error("Error commenting:", error);
            setCommentText(textToSubmit);
            toast({ 
                title: "Error", 
                description: "Failed to post comment.",
                variant: "destructive"
            });
        }
    };

    const handleShare = async () => {
        if (!post) return;
        try {
            await updateDoc(doc(db, "posts", post.id), {
                shares: increment(1)
            });
             navigator.clipboard.writeText(window.location.href);
             toast({ title: "Shared", description: "Link copied to clipboard." });
        } catch (error) {
             console.error("Error sharing:", error);
        }
    };

    if (isLoading) return (
        <div className="fixed inset-0 bg-black flex items-center justify-center">
             <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );

    if (!post) return null;

    return (
        <div className="fixed inset-0 bg-black/95 z-[2000] flex items-center justify-center overflow-hidden font-sans backdrop-blur-sm">
            {/* Close Button */}
            <button 
                onClick={() => navigate(-1)} 
                className="absolute top-6 right-6 z-[2010] text-white/60 hover:text-white transition-colors p-2 bg-black/50 rounded-full"
            >
                <X size={24} />
            </button>

            <div className="w-full h-full max-w-6xl flex flex-col md:flex-row items-center justify-center md:gap-0 bg-black md:bg-[#090909] md:rounded-[2rem] md:overflow-hidden md:max-h-[85vh] shadow-2xl border border-white/5">
                
                {/* Media Section (Left) */}
                <div className="w-full md:w-[60%] h-[50vh] md:h-full bg-black flex items-center justify-center relative group">
                    {post.mediaUrl ? (
                        post.mediaType === 'video' ? (
                            <div className="relative w-full h-full flex items-center justify-center bg-black">
                                <video 
                                    src={post.mediaUrl}
                                    className="w-full h-full object-contain"
                                    autoPlay
                                    loop
                                    muted={isMuted}
                                    playsInline
                                />
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                                    className="absolute bottom-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white/70 hover:text-white transition-colors"
                                >
                                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                </button>
                            </div>
                        ) : (
                            (() => {
                                const url = post.mediaUrl;
                                const uploadIndex = url.indexOf('/upload/');
                                if (uploadIndex !== -1 && url.includes('cloudinary')) {
                                    const publicId = url.split('/upload/')[1].split('.')[0];
                                    const myImage = cld.image(publicId)
                                        .resize(auto().gravity(autoGravity()))
                                        .format('auto')
                                        .quality('auto');
                                    
                                    return (
                                        <AdvancedImage 
                                            cldImg={myImage} 
                                            className="w-full h-full object-contain"
                                        />
                                    );
                                } else {
                                    return <img src={post.mediaUrl} className="w-full h-full object-contain" alt="Post content" />;
                                }
                            })()
                        )
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-xl font-medium text-white">{post.content}</p>
                        </div>
                    )}
                </div>

                {/* Info & Comments Section (Right) */}
                <div className="w-full md:w-[40%] h-[50vh] md:h-full flex flex-col bg-[#090909] border-l border-white/5">
                    {/* Header */}
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/@${post.userName || "user"}`)}>
                            <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-white/10">
                                <img src={post.userAvatar || "https://github.com/shadcn.png"} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white">{post.userName}</span>
                                {post.location && <span className="text-xs text-white/40">{post.location}</span>}
                            </div>
                        </div>
                        <button className="text-white/40 hover:text-white">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>

                    {/* Comments Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Post Caption as first comment if exists */}
                        {post.content && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
                                    <img src={post.userAvatar} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none">
                                        <span className="text-sm font-bold text-white block mb-1">{post.userName}</span>
                                        <p className="text-sm text-white/80 leading-relaxed">{post.content}</p>
                                    </div>
                                    <span className="text-[10px] text-white/30 ml-2">Posted just now</span>
                                </div>
                            </div>
                        )}

                        {comments.length === 0 && !post.content ? (
                            <div className="flex flex-col items-center justify-center h-full text-white/20">
                                <MessageCircle size={32} className="mb-2 opacity-50" />
                                <p className="text-sm">No comments yet</p>
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3 group">
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => navigate(`/@${comment.userName}`)}>
                                        <img src={comment.userAvatar || `https://i.pravatar.cc/150?u=${comment.userId}`} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col gap-1 flex-1">
                                        <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none group-hover:bg-white/10 transition-colors relative">
                                            <span className="text-sm font-bold text-white block mb-1 cursor-pointer" onClick={() => navigate(`/@${comment.userName}`)}>{comment.userName}</span>
                                            <p className="text-sm text-white/80 leading-relaxed break-words">{comment.text}</p>
                                        </div>
                                        <span className="text-[10px] text-white/30 ml-2">
                                            {comment.createdAt?.toDate?.()?.toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Actions & Input */}
                    <div className="p-4 border-t border-white/5 bg-[#090909]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={handleLike}
                                    className={`transition-colors ${post.likedIds?.includes(user?.uid) ? 'text-red-500' : 'text-white hover:text-white/70'}`}
                                >
                                    <Heart size={24} fill={post.likedIds?.includes(user?.uid) ? "currentColor" : "none"} />
                                </button>
                                <button className="text-white hover:text-white/70" onClick={() => document.getElementById('comment-input')?.focus()}>
                                    <MessageCircle size={24} />
                                </button>
                                <button onClick={handleShare} className="text-white hover:text-white/70">
                                    <Share2 size={24} />
                                </button>
                            </div>
                            <button className="text-white hover:text-white/70">
                                <Download size={24} />
                            </button>
                        </div>
                        
                        <div className="text-sm font-bold text-white mb-2">
                            {post.likes || 0} likes
                        </div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wider mb-4">
                            {post.createdAt?.toDate?.()?.toLocaleDateString()}
                        </div>

                        <form onSubmit={submitComment} className="flex items-center gap-2 relative">
                            <input
                                id="comment-input"
                                type="text"
                                placeholder="Add a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 placeholder:text-white/20"
                            />
                            {commentText.trim() && (
                                <button 
                                    type="submit"
                                    className="absolute right-2 p-1.5 bg-primary text-black rounded-full hover:scale-105 transition-transform"
                                >
                                    <Send size={16} />
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            </div>
            <MobileBottomNav />
        </div>
    );
};

export default PostView;
