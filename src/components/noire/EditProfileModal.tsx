import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { X, User, Save, Loader2, Camera, Link as LinkIcon, AlignLeft } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userData: any;
    userId: string;
    onUpdate?: () => void; // Callback to refresh parent data
}

const EditProfileModal = ({ isOpen, onClose, userData, userId, onUpdate }: EditProfileModalProps) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Form States
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [website, setWebsite] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Initialize form with userData
    useEffect(() => {
        if (userData && isOpen) {
            setFullName(userData.fullName || "");
            setUsername(userData.username || "");
            setBio(userData.bio || "");
            setWebsite(userData.website || "");
            setAvatarUrl(userData.avatarUrl || userData.profileImage || "");
            setSelectedFile(null);
            setPreviewUrl(null);
        }
    }, [userData, isOpen]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleSave = async () => {
        if (!userId) return;
        setIsLoading(true);

        try {
            let finalAvatarUrl = avatarUrl;

            if (selectedFile) {
                // Upload to Cloudinary
                try {
                    finalAvatarUrl = await uploadToCloudinary(selectedFile, "morraa_avatars");
                } catch (uploadError) {
                    console.error("Image upload failed:", uploadError);
                    toast({
                        title: "Image Upload Failed",
                        description: "Could not upload profile picture. Please try again.",
                        variant: "destructive"
                    });
                    setIsLoading(false);
                    return;
                }
            }

            await updateDoc(doc(db, "users", userId), {
                fullName,
                username,
                bio,
                website,
                avatarUrl: finalAvatarUrl,
                profileImage: finalAvatarUrl, // Keep both for compatibility
                updatedAt: new Date()
            });

            toast({
                title: "Profile Updated",
                description: "Your identity has been refined.",
            });
            
            if (onUpdate) onUpdate();
            onClose();
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                title: "Update Failed",
                description: "Could not save changes. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg bg-[#0F0F0F] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div>
                                <h2 className="text-xl font-display font-bold text-white">Edit Profile</h2>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-1">Refine your persona</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Form Area */}
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                            
                            {/* Avatar Preview (Read-only for now or URL edit) */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative w-24 h-24 rounded-full p-[2px] bg-gradient-to-tr from-[#FBBF24] to-transparent">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-black border-2 border-black">
                                        {previewUrl || avatarUrl ? (
                                            <img src={previewUrl || avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                                <User size={32} className="text-zinc-500" />
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={triggerFileInput}
                                        className="absolute bottom-0 right-0 p-2 bg-[#FBBF24] text-black rounded-full shadow-lg hover:bg-[#F59E0B] transition-colors"
                                    >
                                        <Camera size={14} />
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileSelect} 
                                        accept="image/*" 
                                        className="hidden" 
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Tap the camera icon to upload a new profile photo.</p>
                            </div>

                            {/* Inputs */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">Display Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Your Name"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#FBBF24]/50 focus:bg-white/10 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">Username</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-bold">@</span>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="username"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#FBBF24]/50 focus:bg-white/10 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">Bio</label>
                                    <div className="relative">
                                        <AlignLeft className="absolute left-4 top-4 w-4 h-4 text-white/30" />
                                        <textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            placeholder="Tell your story..."
                                            rows={3}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#FBBF24]/50 focus:bg-white/10 transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">Website</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                        <input
                                            type="text"
                                            value={website}
                                            onChange={(e) => setWebsite(e.target.value)}
                                            placeholder="https://yoursite.com"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#FBBF24]/50 focus:bg-white/10 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/5 bg-white/[0.02]">
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="w-full py-3 bg-[#FBBF24] text-black font-bold rounded-xl hover:bg-[#F59E0B] transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Save size={18} />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default EditProfileModal;
