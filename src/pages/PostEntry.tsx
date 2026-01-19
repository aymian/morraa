import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    X,
    Upload,
    Image as ImageIcon,
    Video,
    Sparkles,
    ShieldCheck,
    ArrowRight,
    Loader2,
    CheckCircle2,
    Zap,
    MessageSquare,
    Radio,
    ChevronLeft
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/noire/Navbar";
import FloatingSidebar from "@/components/noire/FloatingSidebar";

const PostEntry = () => {
    const [searchParams] = useSearchParams();
    const type = searchParams.get("type") || "Post";
    const navigate = useNavigate();
    const { toast } = useToast();

    // State
    const [user, setUser] = useState<any>(null);
    const [content, setContent] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Media State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileType, setFileType] = useState<'image' | 'video' | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                toast({ title: "Session Required", description: "Identity verification needed for deployment." });
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 100 * 1024 * 1024) { // 100MB Limit
                toast({ title: "File too large", description: "Max 100MB per influence deployment.", variant: "destructive" });
                return;
            }
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setFileType(file.type.startsWith('image') ? 'image' : 'video');
        }
    };

    const clearMedia = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
        setPreviewUrl(null);
        setFileType(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDeploy = async () => {
        if (!content.trim() && !selectedFile) {
            toast({ title: "Data Required", description: "An influence post requires text or media.", variant: "destructive" });
            return;
        }

        setIsPosting(true);
        setUploadProgress(10);

        try {
            let mediaUrl = "";
            if (selectedFile) {
                setUploadProgress(30);
                // Upload to the 'morraa_posts' folder we configured
                mediaUrl = await uploadToCloudinary(selectedFile, "morraa_posts");
                setUploadProgress(70);
            }

            // Fetch current user details for the post metadata
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.exists() ? userSnap.data() : null;

            await addDoc(collection(db, "posts"), {
                userId: user.uid,
                userEmail: user.email,
                userName: userData?.fullName || user.email?.split('@')[0],
                userAvatar: userData?.profileImage || null,
                content: content.trim(),
                mediaUrl: mediaUrl,
                mediaType: fileType,
                type: type,
                createdAt: serverTimestamp(),
                likes: 0,
                comments: 0,
                isVerified: userData?.isVerified || false
            });

            setUploadProgress(100);
            toast({ title: "Influence Deployed", description: "Your creation is now live." });

            setTimeout(() => {
                navigate('/');
            }, 1200);

        } catch (error: any) {
            console.error("Deploy error:", error);
            toast({ title: "Deployment Failed", description: error.message, variant: "destructive" });
            setUploadProgress(0);
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Navbar />
            {user && <FloatingSidebar />}

            <main className={`pt-28 pb-12 px-6 content-shift ${!user ? "max-w-4xl mx-auto" : ""}`}>
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Header */}
                    <header className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                <ChevronLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-3xl font-display font-bold">New <span className="text-[#FBBF24]">{type}</span></h1>
                                <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] mt-1 font-bold">Studio Mode Active</p>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#FBBF24]/10 border border-[#FBBF24]/20 rounded-full">
                            <ShieldCheck size={14} className="text-[#FBBF24]" />
                            <span className="text-[10px] font-bold text-[#FBBF24] uppercase tracking-widest">Secure Deployment</span>
                        </div>
                    </header>

                    <div className="grid lg:grid-cols-5 gap-8">
                        {/* Editor Side */}
                        <div className="lg:col-span-3 space-y-6">
                            <div className="glass-noire border border-white/5 rounded-[2.5rem] p-6 min-h-[400px] flex flex-col">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={`Share your thoughts, @${user?.displayName || 'user'}...`}
                                    className="w-full flex-1 bg-transparent border-none outline-none text-xl font-medium placeholder:text-white/10 resize-none py-4"
                                    autoFocus
                                />

                                {/* Status Footer inside box */}
                                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${content.length > 0 ? "bg-[#FBBF24]" : "bg-white/20"}`} />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Live Preview Enabled</span>
                                    </div>
                                    <span className={`text-[10px] font-bold tracking-widest ${content.length > 250 ? "text-red-500" : "text-muted-foreground"}`}>
                                        {content.length} characters
                                    </span>
                                </div>
                            </div>

                            <motion.button
                                disabled={isPosting || (!content.trim() && !selectedFile)}
                                onClick={handleDeploy}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                className={`w-full py-5 rounded-3xl font-display font-bold text-xl flex items-center justify-center gap-3 relative overflow-hidden transition-all ${(!content.trim() && !selectedFile)
                                    ? 'bg-white/5 text-muted-foreground opacity-50 cursor-not-allowed'
                                    : 'bg-[#FBBF24] text-black shadow-[0_10px_40px_rgba(251,191,36,0.3)]'
                                    }`}
                            >
                                {isPosting ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span>Deploying Influence...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Post to Pulse</span>
                                        <ArrowRight size={20} />
                                    </>
                                )}
                                {isPosting && (
                                    <motion.div
                                        className="absolute bottom-0 left-0 h-1 bg-white"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${uploadProgress}%` }}
                                    />
                                )}
                            </motion.button>
                        </div>

                        {/* Media Side */}
                        <div className="lg:col-span-2 space-y-6">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept="image/*,video/*"
                                className="hidden"
                            />

                            <motion.div
                                onClick={() => !isPosting && fileInputRef.current?.click()}
                                whileHover={{ scale: 1.02 }}
                                className={`relative aspect-square rounded-[3rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-4 group ${previewUrl
                                    ? 'border-transparent bg-black'
                                    : 'border-white/10 bg-white/[0.02] hover:border-[#FBBF24]/40 hover:bg-[#FBBF24]/5'
                                    }`}
                            >
                                {previewUrl ? (
                                    <>
                                        {fileType === 'image' ? (
                                            <img src={previewUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <video src={previewUrl} className="w-full h-full object-cover" autoPlay loop muted />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={clearMedia}
                                                className="p-4 bg-red-500 rounded-full text-white shadow-2xl hover:scale-110 transition-transform"
                                            >
                                                <X size={24} />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-6 rounded-full bg-white/5 group-hover:bg-[#FBBF24]/20 group-hover:text-[#FBBF24] transition-all">
                                            <Upload size={32} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold">Visual Asset</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">4K Image or ProRes Video</p>
                                        </div>

                                        {/* Corner Accents */}
                                        <div className="absolute top-6 left-6 w-4 h-4 border-t-2 border-l-2 border-white/10 group-hover:border-[#FBBF24]/40 transition-colors" />
                                        <div className="absolute top-6 right-6 w-4 h-4 border-t-2 border-r-2 border-white/10 group-hover:border-[#FBBF24]/40 transition-colors" />
                                        <div className="absolute bottom-6 left-6 w-4 h-4 border-b-2 border-l-2 border-white/10 group-hover:border-[#FBBF24]/40 transition-colors" />
                                        <div className="absolute bottom-6 right-6 w-4 h-4 border-b-2 border-r-2 border-white/10 group-hover:border-[#FBBF24]/40 transition-colors" />
                                    </>
                                )}
                            </motion.div>

                            {/* Assist Box */}
                            <div className="glass-noire border border-white/5 rounded-[2.5rem] p-6 space-y-6">
                                <div className="flex items-center gap-3">
                                    <Sparkles size={18} className="text-[#FBBF24]" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-[#FBBF24]">Smart Assist</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white">Authenticity</p>
                                            <p className="text-[9px] text-muted-foreground">Original creation verified</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                                            <Zap size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white">Reach Potential</p>
                                            <p className="text-[9px] text-muted-foreground">{previewUrl ? 'Boost algorithm active (98%)' : 'Add media for higher reach'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PostEntry;
