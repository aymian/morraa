import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    Image as ImageIcon,
    Type,
    Radio,
    Zap,
    Sparkles,
    ChevronRight,
} from "lucide-react";
import Navbar from "@/components/noire/Navbar";
import FloatingSidebar from "@/components/noire/FloatingSidebar";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

/**
 * MORRA CREATE EXPERIENCE - "The Studio Selection"
 * Gateway to the creation ecosystem.
 */

type CreateMode = 'Post' | 'Story' | 'Thread' | 'Live';

const Create = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // For 3D Tilt Effect on Cards
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const modes: { label: CreateMode; icon: any; color: string; desc: string; path: string; gradient: string }[] = [
        {
            label: 'Post',
            icon: ImageIcon,
            color: 'text-blue-400',
            desc: 'Visual High-Fidelity',
            path: '/post-entry?type=Post',
            gradient: 'from-blue-500/10 to-transparent'
        },
        {
            label: 'Story',
            icon: Zap,
            color: 'text-amber-400',
            desc: 'Ephemeral Sync',
            path: '/story-upload',
            gradient: 'from-amber-500/10 to-transparent'
        },
        {
            label: 'Thread',
            icon: Type,
            color: 'text-emerald-400',
            desc: 'Neural Thinking',
            path: '/post-entry?type=Thread',
            gradient: 'from-emerald-500/10 to-transparent'
        },
        {
            label: 'Live',
            icon: Radio,
            color: 'text-rose-400',
            desc: 'Pulse Streaming',
            path: '/post-entry?type=Live',
            gradient: 'from-rose-500/10 to-transparent'
        },
    ];

    return (
        <div className="fixed inset-0 z-[100] bg-black text-white overflow-hidden flex flex-col">
            <motion.div
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] to-black -z-10"
            />

            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FBBF24]/5 blur-[120px] rounded-full pointer-events-none" />

            <Navbar />
            {user && <FloatingSidebar />}

            <main className="flex-1 overflow-y-auto px-6 pt-32 pb-12 w-full content-shift">
                <div className="max-w-6xl mx-auto flex flex-col items-center">

                    {/* Header Section */}
                    <div className="text-center mb-16 space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-center gap-3 mb-4"
                        >
                            <Sparkles className="text-[#FBBF24]" size={20} />
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Studio Infrastructure</span>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-display font-bold tracking-tight"
                        >
                            Select your <span className="text-[#FBBF24]">Medium</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-white/40 max-w-lg mx-auto text-sm md:text-base leading-relaxed font-medium"
                        >
                            Deploy your influence across the pulse. Each mode optimized for deep engagement and high-fidelity reach.
                        </motion.p>
                    </div>

                    {/* Creation Modes Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl">
                        {modes.map((m, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * idx + 0.3 }}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                                style={{
                                    rotateX,
                                    rotateY,
                                    transformStyle: "preserve-3d",
                                }}
                                whileHover={{ scale: 1.05, y: -10 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate(m.path)}
                                className="relative cursor-pointer group bg-[#0D0D0D] border border-white/5 p-8 rounded-[3rem] transition-all duration-500 hover:border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
                            >
                                <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${m.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

                                <div className="relative z-10 flex flex-col h-full items-center text-center">
                                    <div className="p-6 rounded-[2rem] bg-white/5 mb-8 group-hover:bg-white/10 transition-all duration-500">
                                        <m.icon size={36} className={`${m.color} group-hover:scale-110 transition-transform duration-500`} />
                                    </div>

                                    <h3 className="text-2xl font-display font-bold mb-2 group-hover:text-[#FBBF24] transition-colors">{m.label}</h3>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-white/30 group-hover:text-white/60 transition-colors mb-8">
                                        {m.desc}
                                    </p>

                                    <div className="mt-auto opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center gap-2 translate-y-4 group-hover:translate-y-0 text-[10px] font-black uppercase tracking-widest">
                                        Initialize <ChevronRight size={14} />
                                    </div>
                                </div>

                                <div className="absolute top-8 right-8 w-2 h-2 rounded-full bg-white/5 group-hover:bg-[#FBBF24] transition-colors duration-500" />
                            </motion.div>
                        ))}
                    </div>

                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        onClick={() => navigate(-1)}
                        className="mt-16 flex items-center gap-3 text-white/40 hover:text-white transition-colors group px-6 py-3 rounded-full hover:bg-white/5"
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Cancel Infrastructure Deployment</span>
                    </motion.button>
                </div>
            </main>

            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 pointer-events-none select-none opacity-5">
                <span className="text-[8rem] font-black uppercase tracking-[0.8em]">MORRA</span>
            </div>
        </div>
    );
};

export default Create;
