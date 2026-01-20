import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, onSnapshot, limit, getDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const StoryTray = () => {
    const [activeStories, setActiveStories] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        const storiesQuery = query(
            collection(db, "stories"),
            limit(50)
        );

        const unsubStories = onSnapshot(storiesQuery, (snapshot) => {
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
                        hasUnseen: story.seenIds ? !story.seenIds.includes(user?.uid) : true
                    });
                } else {
                    existingUser.stories.push(story);
                    if (story.seenIds && !story.seenIds.includes(user?.uid)) {
                        existingUser.hasUnseen = true;
                    }
                }
                return acc;
            }, []);

            setActiveStories(grouped);
        });

        return () => {
            unsubscribe();
            unsubStories();
        };
    }, [user?.uid]);

    if (activeStories.length === 0) return null;

    return (
        <div className="w-full max-w-[380px] mb-8 overflow-hidden">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
                {activeStories.map((group) => (
                    <div key={group.userId} className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                if (group.username) {
                                    navigate(`/stories/@${group.username}`);
                                } else {
                                    getDoc(doc(db, "users", group.userId)).then(snap => {
                                        if (snap.exists()) {
                                            const uData = snap.data();
                                            navigate(`/stories/@${uData.username}`);
                                        }
                                    });
                                }
                            }}
                            className="relative"
                        >
                            <div className={`w-16 h-16 rounded-full p-[3px] transition-all duration-500 border border-white/10
                                ${group.hasUnseen
                                    ? 'bg-gradient-to-tr from-[#FBBF24] via-[#FBBF24] to-yellow-200 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                                    : 'bg-white/5 shadow-none'
                                }`}
                            >
                                <div className="w-full h-full rounded-full bg-black border-[2px] border-black overflow-hidden relative">
                                    {group.userAvatar ? (
                                        <img src={group.userAvatar} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-[10px] font-black uppercase text-white/40">
                                            {group.userName?.[0]}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.button>
                        <span className={`text-[10px] font-bold transition-colors truncate max-w-[64px] text-center
                            ${group.hasUnseen ? 'text-white/60 group-hover:text-[#FBBF24]' : 'text-white/20'}`}
                        >
                            {group.userName?.split(' ')[0]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StoryTray;
