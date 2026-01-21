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
    Upload,
    Sticker,
    Download,
    Save,
    Settings,
    Star
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
 * Modeled after Instagram Stories UI/UX
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
    const [duration, setDuration] = useState<number>(5); // Default 5s for images

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
        width: 320,
        x: 0.5,
        y: 0.5
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
                toast({ title: "File too large", description: "Stories are limited to 2 minutes / 50MB.", variant: "destructive" });
                return;
            }

            if (file.type.startsWith('video')) {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.onloadedmetadata = function() {
                    window.URL.revokeObjectURL(video.src);
                    if (video.duration > 120) {
                        toast({ title: "Video too long", description: "Stories are limited to 2 minutes.", variant: "destructive" });
                        return;
                    }
                    setDuration(video.duration);
                    setSelectedFile(file);
                    setPreviewUrl(URL.createObjectURL(file));
                    setFileType('video');
                }
                video.src = URL.createObjectURL(file);
            } else {
                setDuration(5);
                setSelectedFile(file);
                setPreviewUrl(URL.createObjectURL(file));
                setFileType('image');
            }
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
                duration: duration,
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
        <div className="min-h-screen bg-black text-white flex flex-col font-sans overflow-hidden">
            <Navbar logoOnly />

            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*" className="hidden" />
            <input type="file" ref={audioInputRef} onChange={handleAudioSelect} accept="audio/*" className="hidden" />

            <main className="flex-1 flex flex-col items-center justify-center p-0 md:p-6 relative">
                {!previewUrl ? (
                    <div className="w-full h-full flex flex-col">
                        {/* Camera Header */}
                        <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                            <button onClick={() => navigate(-1)}><X className="text-white w-8 h-8" /></button>
                            <div className="bg-black/50 backdrop-blur-md px-4 py-1 rounded-full">
                                <span className="font-bold text-sm">Add to Story</span>
                            </div>
                            <button><Settings className="text-white w-6 h-6 opacity-0" /></button> {/* Spacer */}
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex flex-col items-center justify-center gap-8 relative overflow-hidden bg-[#121212] rounded-none md:rounded-[2rem] w-full max-w-lg mx-auto aspect-[9/16] md:max-h-[85vh] border border-white/5"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-full h-full absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-20 blur-xl" />
                            
                            <div className="relative z-10 flex flex-col items-center gap-6 cursor-pointer group">
                                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Plus className="text-white w-10 h-10" />
                                </div>
                                <div className="text-center space-y-1">
                                    <h2 className="text-2xl font-bold tracking-tight">Create</h2>
                                    <p className="text-white/50 text-sm font-medium">Tap to select photos or videos</p>
                                </div>
                            </div>

                            {/* Recent Gallery Preview Strip (Mock) */}
                            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent flex items-end justify-center pb-8 gap-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="w-12 h-16 rounded-lg bg-white/10 border border-white/10" />
                                ))}
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md aspect-[9/16] md:max-h-[85vh] bg-black rounded-none md:rounded-[2rem] overflow-hidden border-0 md:border border-white/10 relative flex flex-col shadow-2xl"
                    >
                        <div ref={constraintsRef} className="absolute inset-0 bg-zinc-900">
                            {fileType === 'image' ? (
                                <img src={previewUrl} className="w-full h-full object-cover" />
                            ) : (
                                <video src={previewUrl} className="w-full h-full object-cover" autoPlay loop playsInline />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none" />
                        </div>

                        {/* Top Tools Bar */}
                        <div className="relative z-20 pt-6 px-4 flex justify-between items-start">
                            <motion.button 
                                whileTap={{ scale: 0.9 }} 
                                onClick={() => { setPreviewUrl(null); setTextOverlay(prev => ({...prev, content: ""})); setSelectedMusic(null); }} 
                                className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"
                            >
                                <ChevronLeft size={28} />
                            </motion.button>
                            
                            <div className="flex gap-4">
                                <button onClick={() => setShowTextEditor(true)} className="text-white drop-shadow-md hover:scale-110 transition-transform"><Type size={26} /></button>
                                <button className="text-white drop-shadow-md hover:scale-110 transition-transform"><Sticker size={26} /></button>
                                <button className="text-white drop-shadow-md hover:scale-110 transition-transform"><Sparkles size={26} /></button>
                                <button onClick={() => setShowMusicPicker(true)} className={`drop-shadow-md hover:scale-110 transition-transform ${selectedMusic ? 'text-[#FBBF24]' : 'text-white'}`}><Music size={26} /></button>
                                <button className="text-white drop-shadow-md hover:scale-110 transition-transform"><MoreHorizontal size={26} /></button>
                            </div>
                        </div>

                        {/* Draggable Text Overlay */}
                        {textOverlay.content && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                <motion.div
                                    drag
                                    dragConstraints={constraintsRef}
                                    dragMomentum={false}
                                    onDragEnd={(_, info) => {
                                        if (constraintsRef.current) {
                                            const rect = constraintsRef.current.getBoundingClientRect();
                                            const centerX = rect.width / 2;
                                            const centerY = rect.height / 2;
                                            const finalX = centerX + info.offset.x;
                                            const finalY = centerY + info.offset.y;
                                            setTextOverlay(prev => ({
                                                ...prev,
                                                x: finalX / rect.width,
                                                y: finalY / rect.height
                                            }));
                                        }
                                    }}
                                    className="relative pointer-events-auto cursor-move"
                                    style={{ width: 'auto', minWidth: '100px' }}
                                >
                                    <motion.p
                                        style={{
                                            fontSize: `${textOverlay.size}px`,
                                            fontWeight: textOverlay.weight,
                                            fontFamily: textOverlay.fontFamily === 'serif' ? 'serif' : textOverlay.fontFamily === 'mono' ? 'monospace' : 'inherit',
                                            textAlign: 'center'
                                        }}
                                        className={`
                                            text-white select-none shadow-2xl transition-all duration-300 whitespace-pre-wrap
                                            ${textOverlay.style === 'classic' ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : ''}
                                            ${textOverlay.style === 'neon' ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] px-4' : ''}
                                            ${textOverlay.style === 'strong' ? 'bg-white text-black px-4 py-2 rounded-lg font-black' : ''}
                                            ${textOverlay.style === 'typewriter' ? 'bg-black/50 backdrop-blur-sm text-white px-4 py-1 font-mono border border-white/20' : ''}
                                        `}
                                    >
                                        {textOverlay.content}
                                    </motion.p>
                                    <button
                                        onClick={() => setTextOverlay({ ...textOverlay, content: "" })}
                                        className="absolute -top-6 -right-6 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform backdrop-blur-sm"
                                    >
                                        <X size={14} />
                                    </button>
                                </motion.div>
                            </div>
                        )}

                        {/* Bottom Controls */}
                        <div className="relative z-20 mt-auto p-4 flex flex-col gap-4 pb-8 md:pb-6">
                            <AnimatePresence>
                                {selectedMusic && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="self-center flex items-center gap-3 px-5 py-2.5 bg-black/60 backdrop-blur-xl rounded-xl border border-white/10"
                                    >
                                        <div className="w-8 h-8 rounded-md bg-[#FBBF24] flex items-center justify-center">
                                            <Music size={16} className="text-black animate-pulse" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-white leading-tight">{selectedMusic.title}</span>
                                            <span className="text-[10px] text-white/70">{selectedMusic.artist}</span>
                                        </div>
                                        <button onClick={() => setSelectedMusic(null)} className="ml-2 text-white/50 hover:text-white transition-colors">
                                            <X size={14} />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                    <button className="flex flex-col items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
                                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                                            <Download size={20} />
                                        </div>
                                        <span className="text-[10px] font-medium">Save</span>
                                    </button>
                                    <button className="flex flex-col items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
                                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                                            <Star size={20} />
                                        </div>
                                        <span className="text-[10px] font-medium">Close Friends</span>
                                    </button>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate('/story-share', {
                                        state: {
                                            mediaUrl: previewUrl,
                                            fileType,
                                            textOverlay,
                                            selectedMusic,
                                            selectedFile,
                                            duration
                                        }
                                    })}
                                    className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full font-bold text-sm shadow-lg hover:bg-gray-200 transition-colors"
                                >
                                    <span>Your Story</span>
                                    <ArrowRight size={18} />
                                </motion.button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {isUploading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center">
                                    <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
                                    <p className="text-xs font-bold uppercase tracking-widest text-white">Posting...</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </main>

            {/* Music Picker Drawer */}
            <AnimatePresence>
                {showMusicPicker && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-end"
                        onClick={() => setShowMusicPicker(false)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg bg-[#121212] rounded-t-[2rem] h-[70vh] flex flex-col overflow-hidden shadow-2xl border-t border-white/10"
                        >
                            <div className="p-2 flex justify-center">
                                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                            </div>
                            
                            <div className="px-6 pt-2 pb-6 flex flex-col gap-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search music"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white/10 rounded-xl py-3 pl-12 pr-4 text-sm font-medium outline-none placeholder:text-white/40"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
                                <button
                                    onClick={() => audioInputRef.current?.click()}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left group"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20">
                                        <Upload size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Upload Original Audio</p>
                                        <p className="text-xs text-white/50">Import from device</p>
                                    </div>
                                </button>

                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">For You</p>
                                    {mockTracks.map((track) => (
                                        <div
                                            key={track.id}
                                            onClick={() => {
                                                setSelectedMusic(track);
                                                setShowMusicPicker(false);
                                            }}
                                            className="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
                                        >
                                            <img src={track.cover} alt={track.title} className="w-14 h-14 rounded-lg object-cover" />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm text-white truncate">{track.title}</h4>
                                                <p className="text-xs text-white/60 truncate">{track.artist}</p>
                                            </div>
                                            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Play size={12} fill="white" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Text Editor Overlay */}
            <AnimatePresence>
                {showTextEditor && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[700] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center"
                    >
                        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
                            <button onClick={() => setShowTextEditor(false)} className="text-white font-bold text-lg">Cancel</button>
                            <div className="flex gap-2">
                                {['classic', 'strong', 'neon', 'typewriter'].map((style) => (
                                    <button
                                        key={style}
                                        onClick={() => setTextOverlay(prev => ({ ...prev, style }))}
                                        className={`w-6 h-6 rounded-full border border-white ${textOverlay.style === style ? 'bg-white' : 'bg-transparent'}`}
                                    />
                                ))}
                            </div>
                            <button 
                                onClick={() => setShowTextEditor(false)} 
                                className="text-white font-bold text-lg"
                                disabled={!textOverlay.content}
                            >
                                Done
                            </button>
                        </div>
                        
                        <div className="w-full max-w-md px-8 relative z-10">
                            <textarea
                                autoFocus
                                value={textOverlay.content}
                                onChange={(e) => setTextOverlay(prev => ({ ...prev, content: e.target.value }))}
                                placeholder="Start typing..."
                                className={`
                                    w-full bg-transparent outline-none text-center resize-none overflow-hidden placeholder:text-white/30
                                    ${textOverlay.style === 'classic' ? 'text-white drop-shadow-md font-bold' : ''}
                                    ${textOverlay.style === 'strong' ? 'bg-white text-black p-4 font-black uppercase' : ''}
                                    ${textOverlay.style === 'neon' ? 'text-white font-light drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] border-2 border-white/50 p-4 rounded-xl' : ''}
                                    ${textOverlay.style === 'typewriter' ? 'text-white font-mono bg-black/50 p-4' : ''}
                                `}
                                style={{ 
                                    fontSize: '32px',
                                    lineHeight: '1.2'
                                }}
                                rows={3}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Helper Icon
const StarIcon = ({ size, className }: { size?: number, className?: string }) => (
    <svg 
        width={size || 24} 
        height={size || 24} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

export default StoryUpload;
