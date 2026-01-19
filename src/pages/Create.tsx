import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    X,
    Image as ImageIcon,
    Video,
    Type,
    Radio,
    Zap,
    Globe,
    Users,
    Lock,
    Sparkles,
    BarChart3,
    Hash,
    Clock,
    DollarSign,
    CheckCircle2,
    ChevronDown,
    Plus,
    Trash2,
    Loader2
} from "lucide-react";
import Navbar from "@/components/noire/Navbar";
import FloatingSidebar from "@/components/noire/FloatingSidebar";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useToast } from "@/hooks/use-toast";

/**
 * MORRA CREATE EXPERIENCE - "The Studio"
 * Focused on status, power, and high-velocity creation.
 */

type CreateMode = 'Post' | 'Story' | 'Thread' | 'Live';

const Create = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [mode, setMode] = useState<CreateMode>('Post');
    const [content, setContent] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [visibility, setVisibility] = useState('Public');
    const [isEarnEnabled, setIsEarnEnabled] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Media State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileType, setFileType] = useState<'image' | 'video' | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setFileType(file.type.startsWith('image') ? 'image' : 'video');
        }
    };

    const clearMedia = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setFileType(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handlePost = async () => {
        if (!user) {
            toast({
                title: "Authentication Required",
                description: "You must be logged in to deploy influence.",
                variant: "destructive"
            });
            navigate('/login');
            return;
        }

        if (!content.trim() && !selectedFile) {
            toast({
                title: "Content required",
                description: "Please add some text or media to your post.",
                variant: "destructive"
            });
            return;
        }

        setIsPosting(true);
        setUploadProgress(10);
        console.log("Post initiation started for user:", user.uid);

        try {
            let mediaUrl = "";

            // 1. Handle Cloudinary Upload
            if (selectedFile) {
                console.log("Uploading media to Cloudinary...");
                setUploadProgress(30);
                try {
                    mediaUrl = await uploadToCloudinary(selectedFile);
                    console.log("Media uploaded successfully:", mediaUrl);
                } catch (uploadError: any) {
                    console.error("Cloudinary Upload Error Details:", uploadError);
                    throw new Error(`Upload failed: ${uploadError.message}. Ensure 'Unsigned uploads' are enabled in your Cloudinary settings with the 'ml_default' preset.`);
                }
                setUploadProgress(70);
            }

            // 2. Save to Firestore
            console.log("Saving post to Firestore...");
            await addDoc(collection(db, "posts"), {
                userId: user?.uid,
                userEmail: user?.email,
                content: content.trim(),
                mediaUrl: mediaUrl,
                mediaType: fileType,
                mode: mode,
                visibility: visibility,
                isEarnEnabled: isEarnEnabled,
                createdAt: serverTimestamp(),
                likes: 0,
                comments: 0,
                shares: 0,
                isVerified: true
            });

            console.log("Post saved to Firestore successfully.");
            setUploadProgress(100);

            toast({
                title: "Influence Deployed",
                description: "Your creation is now live for the world to see."
            });

            // Brief delay for the user to see the success state before redirecting
            setTimeout(() => {
                navigate('/');
            }, 1200);

        } catch (error: any) {
            console.error("Critical Post Error:", error);
            toast({
                title: "Deployment Failed",
                description: error.message || "An error occurred while publishing.",
                variant: "destructive"
            });
            setUploadProgress(0);
        } finally {
            setIsPosting(false);
        }
    };

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

    const modes: { label: CreateMode; icon: any; color: string; desc: string }[] = [
        { label: 'Post', icon: ImageIcon, color: 'from-blue-500/20 to-indigo-500/20', desc: 'Text + Media' },
        { label: 'Story', icon: Zap, color: 'from-amber-500/20 to-orange-500/20', desc: 'Fast & Ephemeral' },
        { label: 'Thread', icon: Type, color: 'from-emerald-500/20 to-teal-500/20', desc: 'Long-form Thinking' },
        { label: 'Live', icon: Radio, color: 'from-rose-500/20 to-red-500/20', desc: 'Stream Live' },
    ];

    return (
        <div className="fixed inset-0 z-[100] bg-black text-white overflow-hidden flex flex-col">
            {/* Entry Blur Background */}
            <motion.div
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] to-black -z-10"
            />

            {/* Standard Top Navbar */}
            <Navbar />

            {/* Premium Sidebar */}
            {user && <FloatingSidebar />}

            <main className={`flex-1 overflow-y-auto px-6 py-4 w-full pt-24 content-shift ${!user ? "max-w-5xl mx-auto" : ""}`}>
                <div className={`${user ? "max-w-6xl" : "max-w-5xl mx-auto"}`}>

                    {/* Hidden File Input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*,video/*"
                        className="hidden"
                    />

                    {/* 1. Create Modes Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                        {modes.map((m) => (
                            <motion.div
                                key={m.label}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                                style={{
                                    rotateX: mode === m.label ? 0 : rotateX,
                                    rotateY: mode === m.label ? 0 : rotateY,
                                    transformStyle: "preserve-3d",
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate(`/post-entry?type=${m.label}`)}
                                className={`relative cursor-pointer group p-6 rounded-[2rem] border transition-all duration-500 ${mode === m.label
                                    ? 'bg-white text-black border-white shadow-[0_0_40px_rgba(255,255,255,0.1)]'
                                    : 'bg-white/5 border-white/5 hover:border-white/20'
                                    }`}
                            >
                                <div className={`p-4 rounded-2xl w-fit mb-4 transition-colors ${mode === m.label ? 'bg-black/5' : 'bg-white/5'
                                    }`}>
                                    <m.icon size={24} className={mode === m.label ? 'text-black' : 'text-[#FBBF24]'} />
                                </div>
                                <h4 className="text-xl font-display font-bold">{m.label}</h4>
                                <p className={`text-[10px] uppercase tracking-widest mt-1 opacity-60`}>{m.desc}</p>

                                {mode === m.label && (
                                    <motion.div
                                        layoutId="mode-pill"
                                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-3 bg-black rounded-full"
                                    />
                                )}
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* 2. Content Canvas */}
                        <div className="flex-1 space-y-8">
                            <div className="relative group">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={`What's happening in your world?`}
                                    className="w-full bg-transparent border-none outline-none text-4xl font-display font-medium placeholder:text-white/10 resize-none min-h-[200px]"
                                    autoFocus
                                />

                                {content.length > 250 && (
                                    <div className="absolute bottom-0 right-0 py-2 px-4 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold">
                                        {content.length}/280
                                    </div>
                                )}
                            </div>

                            {/* Media Area */}
                            {!previewUrl ? (
                                <motion.div
                                    whileHover={{ scale: 1.01 }}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full aspect-video rounded-[3rem] border-2 border-dashed border-white/5 bg-white/[0.02] flex flex-col items-center justify-center gap-4 group transition-all hover:border-white/20 hover:bg-white/[0.04] cursor-pointer"
                                >
                                    <div className="p-6 rounded-full bg-white/5 group-hover:bg-[#FBBF24]/10 group-hover:text-[#FBBF24] transition-all">
                                        <Plus size={32} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold">Add High-Res Media</p>
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">RAW / 4K / ProRes Supported</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative w-full aspect-video rounded-[3rem] overflow-hidden border border-white/10 group"
                                >
                                    {fileType === 'image' ? (
                                        <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                                    ) : (
                                        <video src={previewUrl} className="w-full h-full object-cover" autoPlay loop muted />
                                    )}

                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                        <button
                                            onClick={clearMedia}
                                            className="p-4 bg-red-500 rounded-full text-white shadow-xl transform transition-transform hover:scale-110"
                                        >
                                            <Trash2 size={24} />
                                        </button>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-4 bg-white text-black rounded-full shadow-xl transform transition-transform hover:scale-110"
                                        >
                                            <ImageIcon size={24} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* 3. Smart Assist Sidebar (Desktop) */}
                        <div className="hidden lg:flex flex-col gap-6 w-[320px]">
                            {/* Boost Meter */}
                            <div className="bg-[#0D0D0D] border border-white/5 rounded-[2.5rem] p-6 space-y-6">
                                <div className="flex items-center gap-3">
                                    <Sparkles size={18} className="text-[#FBBF24]" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-[#FBBF24]">Smart Assist</span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Boost Potential</span>
                                        <span className="text-lg font-display font-medium text-white">
                                            {(content.length > 5 && previewUrl) ? '98%' : (content.length > 5 || previewUrl) ? '64%' : '12%'}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: (content.length > 5 && previewUrl) ? '98%' : (content.length > 5 || previewUrl) ? '64%' : '12%' }}
                                            className="h-full bg-gradient-to-r from-[#FBBF24] to-white rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                                        />
                                    </div>
                                    <p className="text-[9px] text-muted-foreground leading-relaxed italic">
                                        {previewUrl ? '"Media recognized. High-fidelity visual boost applied."' : '"Add visual high-res media to maximize reach potential."'}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-white/5 space-y-4">
                                    <div className="flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <Hash size={14} className="text-muted-foreground group-hover:text-white transition-colors" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-white transition-colors">Suggested Tags</span>
                                        </div>
                                        <ChevronDown size={14} className="text-muted-foreground mt-0.5" />
                                    </div>
                                    <div className="flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <Clock size={14} className="text-muted-foreground group-hover:text-white" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-white">Best time to post</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-[#FBBF24]">Now</span>
                                    </div>
                                </div>
                            </div>

                            {/* Status Controls */}
                            <div className="bg-[#0D0D0D] border border-white/5 rounded-[2.5rem] p-6 space-y-4">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all">
                                    <div className="flex items-center gap-3">
                                        <Globe size={16} className="text-muted-foreground" />
                                        <span className="text-xs font-bold text-white">{visibility}</span>
                                    </div>
                                    <ChevronDown size={14} className="text-muted-foreground" />
                                </div>

                                <button
                                    onClick={() => setIsEarnEnabled(!isEarnEnabled)}
                                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${isEarnEnabled
                                        ? 'bg-[#FBBF24]/10 border-[#FBBF24]/20 text-[#FBBF24]'
                                        : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <DollarSign size={16} />
                                        <span className="text-xs font-bold">Earn Enabled</span>
                                    </div>
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${isEarnEnabled ? 'bg-[#FBBF24]' : 'bg-white/20'}`}>
                                        <div className={`absolute top-1 w-2 h-2 rounded-full bg-black transition-all ${isEarnEnabled ? 'right-1' : 'left-1'}`} />
                                    </div>
                                </button>

                                <div className="p-4 rounded-2xl border border-white/5 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-white/5 blur-xl group-hover:bg-[#FBBF24]/5 transition-all" />
                                    <div className="relative flex items-center gap-3">
                                        <CheckCircle2 size={16} className="text-[#FBBF24]" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-white">Verified Pulse</span>
                                            <span className="text-[8px] text-muted-foreground">Premium Visibility Active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky Bottom Post Button */}
            <div className={`p-6 bg-gradient-to-t from-black via-black/80 to-transparent fixed bottom-0 left-0 right-0 z-[1000] content-shift`}>
                <div className="max-w-5xl mx-auto flex flex-col items-center gap-4">
                    {/* Mobile Only Assist Chips */}
                    <div className="lg:hidden flex gap-2 w-full overflow-x-auto no-scrollbar pb-2">
                        <span className="flex-shrink-0 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">Visibility: {visibility}</span>
                        <span className="flex-shrink-0 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">Earnings: {isEarnEnabled ? 'ON' : 'OFF'}</span>
                    </div>

                    <motion.button
                        disabled={isPosting || (!content.trim() && !selectedFile)}
                        whileHover={(!content.trim() && !selectedFile) ? {} : { scale: 1.02, y: -2 }}
                        whileTap={(!content.trim() && !selectedFile) ? {} : { scale: 0.98 }}
                        onClick={() => {
                            console.log("Post button clicked. User:", !!user, "Content Length:", content.length, "Files:", !!selectedFile);
                            handlePost();
                        }}
                        className={`w-full py-5 rounded-[2rem] font-display font-bold text-xl flex items-center justify-center gap-3 relative overflow-hidden transition-all ${(!content.trim() && !selectedFile)
                            ? 'bg-white/5 text-muted-foreground cursor-not-allowed opacity-50'
                            : 'bg-[#FBBF24] text-black shadow-[0_10px_40px_rgba(251,191,36,0.2)] cursor-pointer'
                            }`}
                    >
                        {isPosting && (
                            <motion.div
                                className="absolute inset-0 bg-white/20"
                                initial={{ x: '-100%' }}
                                animate={{ x: `${uploadProgress - 100}%` }}
                                transition={{ ease: "linear" }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-3">
                            {isPosting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {uploadProgress < 100 ? `Syncing Media (${uploadProgress}%)` : 'Deploying Influence...'}
                                </span>
                            ) : 'Deploy Post'}
                            {!isPosting && <ArrowIcon className="w-5 h-5" />}
                        </span>
                    </motion.button>

                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/30 py-2">Swipe down to cancel</p>
                </div>
            </div>

            {/* Mobile Swipe-to-Cancel Guide */}
            <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="lg:hidden absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full"
            />
        </div>
    );
};

const ArrowIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default Create;
