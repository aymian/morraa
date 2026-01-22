import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, onSnapshot, limit, getDoc, doc, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Plus } from "lucide-react";

const StoryTray = () => {
    const [activeStories, setActiveStories] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
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

                        // Sort: Unseen first, then by latest story time
                        grouped.sort((a, b) => {
                            if (a.hasUnseen && !b.hasUnseen) return -1;
                            if (!a.hasUnseen && b.hasUnseen) return 1;
                            return 0;
                        });

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

    if (!user) return null;

    return (
        <div className="flex items-center gap-4 py-4 overflow-x-auto no-scrollbar px-4 md:px-0">
            {/* Add Story Button */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/create?type=story')}
                    className="relative"
                >
                    <div className="w-[72px] h-[72px] rounded-full p-[2px] bg-white/5 border border-white/10">
                        <div className="w-full h-full rounded-full bg-black overflow-hidden relative flex items-center justify-center">
                            {user.photoURL ? (
                                <img src={user.photoURL} className="w-full h-full object-cover opacity-60" loading="lazy" />
                            ) : (
                                <div className="w-full h-full bg-zinc-800" />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-[#FBBF24] rounded-full p-1.5 shadow-lg border-2 border-black">
                                    <Plus className="w-5 h-5 text-black stroke-[3]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.button>
                <span className="text-[11px] font-medium text-white/80">Your Story</span>
            </div>

            {/* Stories List */}
            {activeStories.map((group) => (
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
                        <div className={`w-[72px] h-[72px] rounded-full p-[3px] transition-all duration-500
                            ${group.hasUnseen
                                ? 'bg-gradient-to-tr from-[#FBBF24] via-[#FBBF24] to-yellow-200 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                                : 'bg-white/10 border border-white/10'
                            }`}
                        >
                            <div className="w-full h-full rounded-full bg-black border-[3px] border-black overflow-hidden relative">
                                {group.userAvatar ? (
                                    <img src={group.userAvatar} className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-xs font-black uppercase text-white/40">
                                        {group.userName?.[0]}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.button>
                    <span className="text-[11px] font-medium text-white/80 truncate max-w-[70px] text-center">
                        {group.userId === user.uid ? "Your Story" : (group.userName?.split(' ')[0] || "User")}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default StoryTray;
