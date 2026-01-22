import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

const FeedPreview = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 pointer-events-none" />
            
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative max-w-md w-full bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl z-10"
            >
                {/* Header Image / Graphic */}
                <div className="h-48 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="relative z-10 flex flex-col items-center gap-2"
                    >
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                            <Sparkles className="text-white w-8 h-8" />
                        </div>
                    </motion.div>
                    
                    {/* Decorative Circles */}
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-black/20 rounded-full blur-2xl" />
                </div>

                {/* Content */}
                <div className="p-8 space-y-6 text-center">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-display font-bold text-white tracking-tight">
                            Welcome to Morraa
                        </h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Experience a new dimension of social connection. 
                            Share your moments, discover trends, and connect with your circle in real-time.
                        </p>
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-left">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <span className="text-lg">✨</span>
                            </div>
                            <div>
                                <h4 className="text-white text-sm font-medium">Immersive Feed</h4>
                                <p className="text-xs text-white/40">Scroll through high-quality content</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-left">
                            <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400">
                                <span className="text-lg">💬</span>
                            </div>
                            <div>
                                <h4 className="text-white text-sm font-medium">Real-time Chat</h4>
                                <p className="text-xs text-white/40">Connect instantly with friends</p>
                            </div>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate("/")}
                        className="w-full py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-white/90 transition-colors shadow-lg shadow-white/10"
                    >
                        Start Exploring
                        <ArrowRight size={18} />
                    </motion.button>
                    
                    <p className="text-[10px] text-white/20 uppercase tracking-widest font-medium">
                        Join the pulse
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default FeedPreview;
