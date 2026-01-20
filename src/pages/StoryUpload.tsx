import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    X,
    Music,
    Type,
    Smile,
    Sparkles,
    MoreHorizontal,
    ImageIcon,
    ArrowRight,
    Loader2,
    ChevronLeft,
    Smartphone,
    Search,
    Play,
    Pause,
    Plus,
    Upload
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/noire/Navbar";

/**
 * STORY UPLOAD EXPERIENCE - "The Lens"
 * High-end dedicated interface for story creation with Music Integration.
 */

interface Track {
    id: string;
    title: string;
    artist: string;
    cover: string;
    previewUrl?: string;
}

const StoryUpload = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [user, setUser] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Media State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileType, setFileType] = useState<'image' | 'video' | null>(null);

    // Music State
    const [showMusicPicker, setShowMusicPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMusic, setSelectedMusic] = useState<Track | { title: string, artist: string, isLocal: true } | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioFile, setAudioFile] = useState<File | null>(null);

    const constraintsRef = useRef<HTMLDivElement>(null);
    const [textOverlay, setTextOverlay] = useState({
        content: "",
        size: 32,
        weight: "900",
        style: "classic", // classic, neon, strong, typewriter
        fontFamily: "font-sans",
        width: 320
    });
    const [showTextEditor, setShowTextEditor] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) navigate('/login');
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 50 * 1024 * 1024) {
                toast({ title: "File too large", description: "Stories are limited to 50MB.", variant: "destructive" });
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setFileType(file.type.startsWith('image') ? 'image' : 'video');
        }
    };

    const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAudioFile(file);
            setSelectedMusic({
                title: file.name.replace(/\.[^/.]+$/, ""),
                artist: "Local Upload",
                isLocal: true
            });
            setShowMusicPicker(false);
            toast({ title: "Music Added", description: "Your custom audio has been attached." });
        }
    };

    const handleUploadStory = async () => {
        if (!selectedFile || !user) return;

        setIsUploading(true);
        try {
            // 1. Upload Media
            const mediaUrl = await uploadToCloudinary(selectedFile, "morraa_stories");

            // 2. Upload Music if it's local
            let musicUrl = "";
            if (audioFile) {
                musicUrl = await uploadToCloudinary(audioFile, "morraa_audio");
            }

            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.exists() ? userSnap.data() : null;

            await addDoc(collection(db, "stories"), {
                userId: user.uid,
                userName: userData?.fullName || user.email?.split('@')[0],
                username: userData?.username || user.email?.split('@')[0],
                userAvatar: userData?.profileImage || null,
                mediaUrl,
                mediaType: fileType,
                textOverlay: textOverlay.content ? textOverlay : null,
                music: selectedMusic ? {
                    ...selectedMusic,
                    url: musicUrl || (selectedMusic as any).previewUrl || ""
                } : null,
                createdAt: serverTimestamp(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                seenIds: [],
                likedIds: [],
                isVerified: userData?.isVerified || false
            });

            toast({ title: "Story Shared", description: "Identity sync complete." });
            navigate('/');
        } catch (error: any) {
            toast({ title: "Failed to share", description: error.message, variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    // Simulated Spotify-style tracks
    const mockTracks: Track[] = [
        { id: '1', title: 'Starboy', artist: 'The Weeknd', cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop' },
        { id: '2', title: 'Blinding Lights', artist: 'The Weeknd', cover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=300&h=300&fit=crop' },
        { id: '3', title: 'Gods Plan', artist: 'Drake', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop' },
        { id: '4', title: 'Sicko Mode', artist: 'Travis Scott', cover: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?w=300&h=300&fit=crop' },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden">
            <Navbar logoOnly />

            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*" className="hidden" />
            <input type="file" ref={audioInputRef} onChange={handleAudioSelect} accept="audio/*" className="hidden" />

            <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FBBF24]/5 blur-[150px] rounded-full pointer-events-none" />

                {!previewUrl ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-lg aspect-[9/16] md:max-h-[85vh] bg-zinc-900/50 rounded-[3rem] border border-white/5 backdrop-blur-3xl flex flex-col items-center justify-center gap-8 relative overflow-hidden group cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#FBBF24]/10 group-hover:border-[#FBBF24]/20 transition-all duration-500">
                            <ImageIcon className="text-white/20 group-hover:text-[#FBBF24] transition-colors" size={32} />
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-display font-bold">Select Media</h2>
                            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-white/20">Syncing with system lens</p>
                        </div>
                        {/* Corner Accents */}
                        <div className="absolute top-8 left-8 w-4 h-4 border-t border-l border-white/10 group-hover:border-[#FBBF24]/40" />
                        <div className="absolute top-8 right-8 w-4 h-4 border-t border-r border-white/10 group-hover:border-[#FBBF24]/40" />
                        <div className="absolute bottom-8 left-8 w-4 h-4 border-b border-l border-white/10 group-hover:border-[#FBBF24]/40" />
                        <div className="absolute bottom-8 right-8 w-4 h-4 border-b border-r border-white/10 group-hover:border-[#FBBF24]/40" />
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="w-full max-w-md aspect-[9/16] md:max-h-[85vh] bg-zinc-900 rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative flex flex-col"
                    >
                        <div ref={constraintsRef} className="absolute inset-0">
                            {fileType === 'image' ? (
                                <img src={previewUrl} className="w-full h-full object-cover" />
                            ) : (
                                <video src={previewUrl} className="w-full h-full object-cover" autoPlay loop playsInline />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                        </div>

                        <div className="relative z-10 p-6 flex justify-between items-center">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setPreviewUrl(null); setTextOverlay(""); setSelectedMusic(null); }} className="bg-black/40 backdrop-blur-xl p-3 rounded-full border border-white/10"><ChevronLeft size={20} /></motion.button>
                            <div className="flex gap-2">
                                <button onClick={() => setShowMusicPicker(true)} className={`bg-black/40 backdrop-blur-xl p-3 rounded-full border transition-colors ${selectedMusic ? 'border-[#FBBF24] text-[#FBBF24]' : 'border-white/10 text-white'}`}><Music size={18} /></button>
                                <button onClick={() => setShowTextEditor(true)} className="bg-black/40 backdrop-blur-xl p-3 rounded-full border border-white/10"><Type size={18} /></button>
                                <button className="bg-black/40 backdrop-blur-xl p-3 rounded-full border border-white/10"><Smile size={18} /></button>
                                <button className="bg-black/40 backdrop-blur-xl p-3 rounded-full border border-white/10 text-[#FBBF24]"><Sparkles size={18} /></button>
                            </div>
                        </div>



                        {textOverlay.content && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                <motion.div
                                    drag
                                    dragConstraints={constraintsRef}
                                    dragElastic={0.05}
                                    className="relative pointer-events-auto"
                                    style={{ width: textOverlay.width }}
                                >
                                    <motion.p
                                        style={{
                                            fontSize: `${textOverlay.size}px`,
                                            fontWeight: textOverlay.weight,
                                            fontFamily: textOverlay.fontFamily === 'serif' ? 'serif' : textOverlay.fontFamily === 'mono' ? 'monospace' : 'inherit',
                                            width: '100%',
                                            textAlign: 'center'
                                        }}
                                        className={`
                                            text-white select-none shadow-2xl transition-all duration-300
                                            ${textOverlay.style === 'classic' ? 'bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20' : ''}
                                            ${textOverlay.style === 'neon' ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] px-4' : ''}
                                            ${textOverlay.style === 'strong' ? 'bg-[#FBBF24] text-black px-4 py-2 rounded-lg font-black italic' : ''}
                                            ${textOverlay.style === 'typewriter' ? 'bg-white text-black px-4 py-1 border-l-4 border-black font-mono' : ''}
                                        `}
                                    >
                                        {textOverlay.content}
                                    </motion.p>
                                    <button
                                        onClick={() => setTextOverlay({ ...textOverlay, content: "" })}
                                        className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                    >
                                        <X size={12} />
                                    </button>
                                </motion.div>
                            </div>
                        )}

                        <div className="relative z-10 mt-auto p-8 flex flex-col items-center gap-4">
                            <AnimatePresence>
                                {selectedMusic && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="mb-2 flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 w-fit"
                                    >
                                        <Music size={12} className="text-[#FBBF24] animate-pulse" />
                                        <span className="text-[10px] font-black text-white/80 uppercase tracking-widest truncate max-w-[180px]">
                                            {selectedMusic.title} • {selectedMusic.artist}
                                        </span>
                                        <button onClick={() => setSelectedMusic(null)} className="ml-1 text-white/30 hover:text-white transition-colors">
                                            <X size={12} />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="w-full flex justify-end">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate('/story-share', {
                                        state: {
                                            mediaUrl: previewUrl,
                                            fileType,
                                            textOverlay,
                                            selectedMusic,
                                            selectedFile
                                        }
                                    })}
                                    className="w-16 h-16 rounded-full bg-[#FBBF24] text-black border border-white/20 flex items-center justify-center shadow-[0_10px_30px_rgba(251,191,36,0.3)] relative overflow-hidden group"
                                >
                                    <ArrowRight size={24} />
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-500" />
                                </motion.button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {isUploading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center">
                                    <div className="relative w-24 h-24 mb-6">
                                        <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-t-4 border-[#FBBF24]" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#FBBF24]">Neural Syncing</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                <div className="absolute bottom-12 left-12 hidden lg:flex flex-col gap-2 opacity-20">
                    <Smartphone size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Mobile Studio Context</span>
                </div>
            </main>

            {/* Music Picker Drawer */}
            <AnimatePresence>
                {showMusicPicker && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-md flex flex-col items-center justify-end"
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            className="w-full max-w-lg bg-zinc-900 rounded-t-[3rem] p-8 border-t border-white/10 flex flex-col gap-6"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-display font-bold">Add Soundtrack</h3>
                                <button onClick={() => setShowMusicPicker(false)} className="p-2 bg-white/5 rounded-full"><X size={20} /></button>
                            </div>

                            {/* Search bar */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search Pulse, Artists, or Spotify..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-[#FBBF24]/40 transition-colors"
                                />
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => audioInputRef.current?.click()}
                                    className="flex flex-col items-center gap-2 p-6 bg-[#FBBF24]/5 border border-[#FBBF24]/10 rounded-[2rem] hover:bg-[#FBBF24]/10 transition-colors group"
                                >
                                    <div className="p-3 bg-white/5 rounded-full group-hover:bg-[#FBBF24]/20 transition-colors"><Upload className="text-[#FBBF24]" size={20} /></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Upload Local</span>
                                </button>
                                <button className="flex flex-col items-center gap-2 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] opacity-50 cursor-not-allowed">
                                    <div className="p-3 bg-white/5 rounded-full"><Plus className="text-emerald-500" size={20} /></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Connect Spotify</span>
                                </button>
                            </div>

                            {/* Recommended */}
                            <div className="space-y-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Trending on Pulse</span>
                                <div className="space-y-2">
                                    {mockTracks.map(track => (
                                        <div key={track.id} className="flex items-center justify-between p-3 rounded-2xl border border-white/5 hover:bg-white/5 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-zinc-800 overflow-hidden relative">
                                                    <img src={track.cover} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                                    <Play className="absolute inset-0 m-auto text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all" size={16} fill="white" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold">{track.title}</span>
                                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{track.artist}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { setSelectedMusic(track); setShowMusicPicker(false); }}
                                                className="p-3 bg-white/5 rounded-full hover:bg-[#FBBF24] hover:text-black transition-all"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Advanced Text Editor Context */}
            <AnimatePresence>
                {showTextEditor && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex flex-col p-8"
                    >
                        {/* Editor Header */}
                        <div className="flex justify-between items-center mb-12">
                            <div className="flex gap-4 items-center">
                                <button
                                    onClick={() => setTextOverlay({ ...textOverlay, weight: textOverlay.weight === '900' ? '400' : '900' })}
                                    className={`w-12 h-12 rounded-full border border-white/10 flex items-center justify-center font-bold transition-all ${textOverlay.weight === '900' ? 'bg-white text-black' : 'text-white'}`}
                                >
                                    B
                                </button>
                                <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
                                    {['font-sans', 'serif', 'mono'].map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setTextOverlay({ ...textOverlay, fontFamily: f })}
                                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${textOverlay.fontFamily === f ? 'bg-white text-black' : 'text-white/40'}`}
                                        >
                                            {f.split('-')[1] || f}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => setShowTextEditor(false)} className="px-8 py-3 bg-[#FBBF24] text-black rounded-full font-black uppercase tracking-widest">Done</button>
                        </div>

                        {/* Editor Center */}
                        <div className="flex-1 flex items-center justify-center gap-12 max-w-5xl mx-auto w-full">
                            {/* Font Size Slider */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-64 w-1.5 bg-white/10 rounded-full relative overflow-hidden group">
                                    <input
                                        type="range"
                                        min="12"
                                        max="100"
                                        value={textOverlay.size}
                                        onChange={(e) => setTextOverlay({ ...textOverlay, size: parseInt(e.target.value) })}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer -rotate-180 [writing-mode:vertical-rl] z-10"
                                    />
                                    <div
                                        style={{ height: `${(textOverlay.size - 12) / 88 * 100}%` }}
                                        className="absolute bottom-0 w-full bg-[#FBBF24] rounded-full pointer-events-none transition-all"
                                    />
                                </div>
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">Size</span>
                            </div>

                            <textarea
                                autoFocus
                                value={textOverlay.content}
                                onChange={(e) => setTextOverlay({ ...textOverlay, content: e.target.value })}
                                placeholder="Speak..."
                                style={{
                                    fontSize: `${textOverlay.size}px`,
                                    fontWeight: textOverlay.weight,
                                    fontFamily: textOverlay.fontFamily === 'serif' ? 'serif' : textOverlay.fontFamily === 'mono' ? 'monospace' : 'inherit',
                                    maxWidth: `${textOverlay.width}px`,
                                    margin: '0 auto'
                                }}
                                className={`
                                    flex-1 bg-transparent border-none outline-none text-center text-white placeholder:text-white/10 resize-none h-[400px] transition-all duration-300
                                    ${textOverlay.style === 'neon' ? 'drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : ''}
                                    ${textOverlay.style === 'strong' ? 'font-black italic' : ''}
                                    ${textOverlay.style === 'typewriter' ? 'font-mono' : ''}
                                `}
                            />

                            {/* Font Width/Crop Slider */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-64 w-1.5 bg-white/10 rounded-full relative overflow-hidden group">
                                    <input
                                        type="range"
                                        min="100"
                                        max="500"
                                        value={textOverlay.width}
                                        onChange={(e) => setTextOverlay({ ...textOverlay, width: parseInt(e.target.value) })}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer -rotate-180 [writing-mode:vertical-rl] z-10"
                                    />
                                    <div
                                        style={{ height: `${(textOverlay.width - 100) / 400 * 100}%` }}
                                        className="absolute bottom-0 w-full bg-emerald-500 rounded-full pointer-events-none transition-all"
                                    />
                                </div>
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">Crop</span>
                            </div>
                        </div>

                        {/* Style Presets */}
                        <div className="flex justify-center gap-6 mt-12">
                            {['classic', 'neon', 'strong', 'typewriter'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setTextOverlay({ ...textOverlay, style: s })}
                                    className={`
                                        px-6 py-3 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all
                                        ${textOverlay.style === s ? 'bg-[#FBBF24] text-black border-[#FBBF24]' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'}
                                    `}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StoryUpload;
