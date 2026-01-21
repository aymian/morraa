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
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 max-w-[600px] mask-linear-fade">
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
                            <div className={`w-12 h-12 rounded-full p-[2px] transition-all duration-500 border border-white/10
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
                        <span className="text-[9px] font-medium text-white/60 truncate max-w-[56px] text-center">
                            {group.userName?.split(' ')[0] || "User"}
                        </span>
                    </div>
                ))}
            <style>{`
                .mask-linear-fade {
                    mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                }
            `}</style>
        </div>
    );
};

export default StoryTray;
