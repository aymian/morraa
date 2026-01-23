import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, onSnapshot, limit, getDoc, doc, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { getOptimizedUrl } from "@/lib/cloudinary-helper";

const StoryTray = () => {
    const [activeStories, setActiveStories] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [page, setPage] = useState(0);
    const STORIES_PER_PAGE = 5;
    const navigate = useNavigate();

    useEffect(() => {
        let unsubStories: (() => void) | undefined;

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            
            if (currentUser) {
                // 1. Get following list
                const followingRef = collection(db, "users", currentUser.uid, "following");
                const followingSnap = await getDocs(followingRef);
                const followingIds = followingSnap.docs.map(doc => doc.id);
                
                // Always include self
                const relevantUserIds = [...followingIds, currentUser.uid];
                
                // Firestore 'in' query limit is 30. We take the first 30 for now.
                // In a real app, you might want to paginate or fetch differently.
                const queryIds = relevantUserIds.slice(0, 30);

                if (queryIds.length > 0) {
                    const storiesQuery = query(
                        collection(db, "stories"),
                        where("userId", "in", queryIds),
                        limit(50)
                    );

                    unsubStories = onSnapshot(storiesQuery, (snapshot) => {
                        const stories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
                        const now = Date.now();

                        const grouped = stories.reduce((acc: any[], story: any) => {
                            const expiry = story.expiresAt?.toDate?.()?.getTime() || story.expiresAt?.seconds * 1000 || 0;
                            if (expiry <= now) return acc;

                            const existingUser = acc.find(u => u.userId === story.userId);
                            if (!existingUser) {
                                acc.push({
                                    userId: story.userId,
                                    userName: story.userName,
                                    username: story.username,
                                    userAvatar: story.userAvatar,
                                    stories: [story],
                                    hasUnseen: story.seenIds ? !story.seenIds.includes(currentUser.uid) : true
                                });
                            } else {
                                existingUser.stories.push(story);
                                if (story.seenIds && !story.seenIds.includes(currentUser.uid)) {
                                    existingUser.hasUnseen = true;
                                }
                            }
                            return acc;
                        }, []);

                        setActiveStories(grouped);
                    });
                } else {
                    setActiveStories([]);
                }
            } else {
                setActiveStories([]);
            }
        });

        return () => {
            unsubscribe();
            if (unsubStories) unsubStories();
        };
    }, []);

    if (activeStories.length === 0) return null;

    const displayedStories = activeStories.slice(page * STORIES_PER_PAGE, (page + 1) * STORIES_PER_PAGE);
    const hasNextPage = activeStories.length > (page + 1) * STORIES_PER_PAGE;
    const hasPrevPage = page > 0;

    return (
        <div className="flex items-center gap-3 py-2">
            {hasPrevPage && (
                <button 
                    onClick={() => setPage(p => p - 1)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-white/70" />
                </button>
            )}

            {displayedStories.map((group) => (
                <div key={group.userId} className="flex flex-col items-center gap-1 group cursor-pointer flex-shrink-0">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                                if (group.username) {
                                    navigate(`/view?type=story&username=@${group.username}`);
                                } else {
                                    getDoc(doc(db, "users", group.userId)).then(snap => {
                                        if (snap.exists()) {
                                            const uData = snap.data();
                                            navigate(`/view?type=story&username=@${uData.username}`);
                                        }
                                    });
                                }
                            }}
                            className="relative"
                        >
                            <div className={`w-12 h-12 rounded-full p-[2px] transition-all duration-500 border border-white/10
                                ${group.hasUnseen
                                    ? 'bg-gradient-to-tr from-[#FBBF24] via-[#FBBF24] to-yellow-200 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                                    : 'bg-white/5 shadow-none'
                                }`}
                            >
                                <div className="w-full h-full rounded-full bg-black border-[2px] border-black overflow-hidden relative">
                                    {group.userAvatar ? (
                                        <img 
                                            src={getOptimizedUrl(group.userAvatar, 'image', { width: 100 })} 
                                            className="w-full h-full object-cover" 
                                            loading="lazy" 
                                            alt={group.userName}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-[10px] font-black uppercase text-white/40">
                                            {group.userName?.[0]}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.button>
                        <span className="text-[9px] font-medium text-white/60 truncate max-w-[56px] text-center">
                            {group.userName?.split(' ')[0] || "User"}
                        </span>
                    </div>
                ))}

            {hasNextPage && (
                <button 
                    onClick={() => setPage(p => p + 1)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <ChevronRight className="w-5 h-5 text-white/70" />
                </button>
            )}
        </div>
    );
};

export default StoryTray;
