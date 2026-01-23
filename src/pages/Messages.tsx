import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    MoreVertical,
    Phone,
    Video,
    Plus,
    Smile,
    Send,
    Check,
    Mic,
    ArrowLeft,
    CheckCheck,
    MoreHorizontal,
    Reply,
    Pencil,
    Trash2,
    FileIcon,
    Film,
    Loader2,
    Image as ImageIcon,
    Download,
    Sparkles,
    Zap,
    ChevronLeft,
    X,
    Upload
} from "lucide-react";
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { useParams, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { uploadToCloudinary } from "@/lib/cloudinary";
import Navbar from "@/components/noire/Navbar";
import FloatingSidebar from "@/components/noire/FloatingSidebar";
import MobileBottomNav from "@/components/noire/MobileBottomNav";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    addDoc,
    serverTimestamp,
    doc,
    getDoc,
    setDoc,
    limit,
    getDocs,
    updateDoc,
    arrayUnion,
    increment
} from "firebase/firestore";

// Final integration of real data replaces MOCKs
const MOCK_CONVERSATIONS: any[] = [];
const MOCK_MESSAGES: any[] = [];

// Synthesized 'Glass' Notification Sound
const playNotificationSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Bell/Glass Texture
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02); // Quick Attack
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5); // Smooth Decay

        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.error("Audio notification failed", e);
    }
};

const Messages = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [messageText, setMessageText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isMobileView, setIsMobileView] = useState(false);
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [replyingTo, setReplyingTo] = useState<any | null>(null);
    const [editingMessage, setEditingMessage] = useState<any | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [studioMode, setStudioMode] = useState<'none' | 'post' | 'story'>('none');
    const [studioMedia, setStudioMedia] = useState<File | null>(null);
    const [studioPreview, setStudioPreview] = useState<string | null>(null);
    const [studioCaption, setStudioCaption] = useState("");
    const [isStudioProcessing, setIsStudioProcessing] = useState(false);
    const studioFileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastTypingUpdateRef = useRef<number>(0);

    // Notification Refs
    const prevUnreadRef = useRef<number>(0);
    const prevMsgCountRef = useRef<number>(0);
    const isConvFirstLoadRef = useRef(true);
    const isChatFirstLoadRef = useRef(true);
    const selectedChatIdRef = useRef<string | null>(null);

    // Sync ref for callback access
    useEffect(() => {
        selectedChatIdRef.current = selectedChat?.id || null;
    }, [selectedChat]);

    const formatPresence = (timestamp: any) => {
        if (!timestamp) return "Identity Unknown";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diff = (Date.now() - date.getTime()) / 1000;

        if (diff < 60) return "Active now";
        if (diff < 3600) return `Active ${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `Active ${Math.floor(diff / 3600)}h ago`;
        return `Active ${Math.floor(diff / 86400)}d ago`;
    };

    const [resolvedUid, setResolvedUid] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (!user) return;
        // Heartbeat activity
        const updateActivity = () => {
            updateDoc(doc(db, "users", user.uid), {
                lastActive: serverTimestamp()
            }).catch(e => console.error("Heartbeat fail:", e));
        };
        updateActivity();
        const interval = setInterval(updateActivity, 30000); // Pulse every 30s
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // Close emoji picker on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        if (showEmojiPicker) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showEmojiPicker]);

    // Resolve userId param to a real UID if it's a username
    useEffect(() => {
        const resolve = async () => {
            if (!userId) {
                setResolvedUid(null);
                return;
            }

            console.log("Starting resolution for identity:", userId);

            // If it looks like a UID (standard Firebase UIDs are ~28 chars)
            if (userId.length >= 20 && !userId.startsWith('@') && !userId.includes('_')) {
                setResolvedUid(userId);
                return;
            }

            // Otherwise, treat as username
            try {
                const cleanUsername = userId.startsWith('@') ? userId.slice(1) : userId;
                const userQuery = query(collection(db, "users"), where("username", "==", cleanUsername.toLowerCase()), limit(1));
                const snap = await getDocs(userQuery);
                if (!snap.empty) {
                    const foundUid = snap.docs[0].id;
                    console.log("Identity resolved to UID:", foundUid);
                    setResolvedUid(foundUid);
                } else {
                    console.warn("Could not find identity deployment for:", cleanUsername);
                }
            } catch (err) {
                console.error("Resolution failure:", err);
            }
        };
        resolve();
    }, [userId]);

    // Fetch Conversations
    useEffect(() => {
        if (!user) {
            console.log("Waiting for user authentication...");
            return;
        }

        console.log("Syncing conversation nodes for user:", user.uid);
        const q = query(
            collection(db, "conversations"),
            where("participants", "array-contains", user.uid)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            console.log(`Synchronization pulse: ${snapshot.docs.length} conversation nodes detected.`);

            const convs = await Promise.all(snapshot.docs.map(async (d) => {
                try {
                    const data = d.data();
                    const otherUid = data.participants.find((p: string) => p !== user.uid);

                    if (!otherUid) return null;

                    // Fetch other user profile
                    const userDoc = await getDoc(doc(db, "users", otherUid));
                    const userData = userDoc.exists() ? userDoc.data() : { fullName: "Aura Identity", profileImage: null };

                    return {
                        id: d.id,
                        participants: data.participants,
                        ...data,
                        user: {
                            name: userData.fullName || userData.username || "Identity",
                            username: userData.username,
                            avatar: userData.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUid}`,
                            lastActive: userData.lastActive
                        },
                        lastMessage: data.lastMessage || "Start a session...",
                        time: data.lastMessageTime ? new Date(data.lastMessageTime.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "New",
                        otherUid: otherUid,
                        unread: data.unreadCounts?.[user.uid] || 0,
                    };
                } catch (err) {
                    console.error("Node mapping error:", err);
                    return null;
                }
            }));

            const validConvs = convs.filter(c => c !== null);

            // Notification Logic (Global - for background chats)
            // Calculate total unread from chats that are NOT currently open to avoid double-notify
            const totalUnread = validConvs.reduce((acc: number, c: any) => {
                if (c.id === selectedChatIdRef.current) return acc; 
                return acc + (c.unread || 0);
            }, 0);
            
            // Play sound if unread count increased (new message in background)
            if (totalUnread > prevUnreadRef.current && !isConvFirstLoadRef.current) {
                playNotificationSound();
            }
            
            prevUnreadRef.current = totalUnread;
            // Only mark as loaded if we actually got data, or if it's empty but connection established
            if (!snapshot.empty || validConvs.length === 0) isConvFirstLoadRef.current = false;

            setConversations(validConvs);

            // Handle selection or creation from URL
            if (resolvedUid && resolvedUid !== user.uid) {
                const existing = validConvs.find(c => c.participants.includes(resolvedUid));
                if (existing) {
                    // Always update selection with the latest data from Firestore
                    setSelectedChat(existing);
                } else {
                    // Create deterministic 1-to-1 chat ID
                    const chatId = [user.uid, resolvedUid].sort().join("_");
                    const newConvRef = doc(db, "conversations", chatId);

                    const createNew = async () => {
                        console.log("Initializing new conversation node:", chatId);
                        await setDoc(newConvRef, {
                            participants: [user.uid, resolvedUid],
                            createdAt: serverTimestamp(),
                            lastMessage: "",
                            lastMessageTime: serverTimestamp()
                        }, { merge: true });
                    };
                    createNew();
                }
            } else if (!userId) {
                // Clear selection if we are on the base /messages route
                setSelectedChat(null);
            }
        }, (error) => {
            console.error("Conversation sync error:", error);
        });

        return () => unsubscribe();
    }, [user, resolvedUid, userId]);

    // Track Partner Typing Status
    useEffect(() => {
        if (!selectedChat || !user) return;
        const otherUid = selectedChat.participants.find((p: string) => p !== user.uid);
        if (!otherUid) return;

        const checkTyping = () => {
            const typingData = selectedChat.typingStatus?.[otherUid];
            if (!typingData) {
                setIsPartnerTyping(false);
                return;
            }

            const typingTime = typingData.toMillis?.() || 0;
            const diff = Date.now() - typingTime;
            setIsPartnerTyping(diff < 5000); // 5 second window
        };

        checkTyping();
        const interval = setInterval(checkTyping, 2000);
        return () => clearInterval(interval);
    }, [selectedChat, user]);

    // Handle Typing Logic
    const handleTyping = async () => {
        if (!user || !selectedChat) return;

        const now = Date.now();
        // Only update Firestore once every 3 seconds to save on writes
        if (now - lastTypingUpdateRef.current > 3000) {
            lastTypingUpdateRef.current = now;
            const chatRef = doc(db, "conversations", selectedChat.id);
            await updateDoc(chatRef, {
                [`typingStatus.${user.uid}`]: serverTimestamp()
            });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(async () => {
            if (!selectedChat) return;
            const chatRef = doc(db, "conversations", selectedChat.id);
            await updateDoc(chatRef, {
                [`typingStatus.${user.uid}`]: null
            });
            lastTypingUpdateRef.current = 0;
        }, 4000);
    };

    // Fetch Messages
    useEffect(() => {
        isChatFirstLoadRef.current = true;
        prevMsgCountRef.current = 0;

        if (!selectedChat) {
            setMessages([]);
            return;
        }

        // Reset unread count when entering chat
        if (user && selectedChat.unread > 0) {
             updateDoc(doc(db, "conversations", selectedChat.id), {
                 [`unreadCounts.${user.uid}`]: 0
             }).catch(e => console.error("Failed to reset unread count:", e));
        }

        const q = query(
            collection(db, "conversations", selectedChat.id, "messages"),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    sender: data.senderId === user?.uid ? "me" : "them",
                    text: data.text,
                    fileUrl: data.fileUrl,
                    fileName: data.fileName,
                    fileSize: data.fileSize,
                    time: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "...",
                    status: data.status,
                    type: data.type || "text",
                    duration: data.duration,
                    reaction: data.reaction,
                    replyTo: data.replyTo,
                    isEdited: data.isEdited,
                    isDeleted: data.isDeleted
                };
            });
            setMessages(msgs);

            // Notification Logic (Active Chat)
            if (msgs.length > prevMsgCountRef.current) {
                const lastMsg = msgs[msgs.length - 1];
                // Play sound if new message arrived from 'them' while we are watching
                if (lastMsg && lastMsg.sender !== 'me' && !isChatFirstLoadRef.current) {
                    playNotificationSound();
                }
            }
            prevMsgCountRef.current = msgs.length;
            isChatFirstLoadRef.current = false;
        });

        return () => unsubscribe();
    }, [selectedChat, user]);

    useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth < 1024);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            setTimeout(() => {
                scrollRef.current?.scrollTo({
                    top: scrollRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }, [messages]);

    const handleEditMessage = async (messageId: string, newText: string) => {
        if (!selectedChat) return;
        try {
            const msgRef = doc(db, "conversations", selectedChat.id, "messages", messageId);
            await updateDoc(msgRef, {
                text: newText,
                isEdited: true,
                editedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Edit failed:", error);
        }
    };

    const handleUnsendMessage = async (messageId: string) => {
        if (!selectedChat) return;
        try {
            const msgRef = doc(db, "conversations", selectedChat.id, "messages", messageId);
            await updateDoc(msgRef, {
                text: "Message unsent",
                isDeleted: true,
                deletedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Unsend failed:", error);
        }
    };

    const handleReact = async (messageId: string, emoji: string) => {
        if (!selectedChat) return;
        try {
            const msgRef = doc(db, "conversations", selectedChat.id, "messages", messageId);
            await updateDoc(msgRef, {
                reaction: emoji
            });
        } catch (error) {
            console.error("Reaction failed:", error);
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedChat || !user) return;

        const text = messageText;
        const replyContext = replyingTo;

        if (editingMessage) {
            await handleEditMessage(editingMessage.id, text);
            setEditingMessage(null);
            setMessageText("");
            return;
        }

        setMessageText("");
        setReplyingTo(null);

        // Clear typing status immediately
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        const chatRef = doc(db, "conversations", selectedChat.id);
        updateDoc(chatRef, { [`typingStatus.${user.uid}`]: null });
        lastTypingUpdateRef.current = 0;

        try {
            const messageData: any = {
                senderId: user.uid,
                text: text,
                type: "text",
                status: "sent",
                createdAt: serverTimestamp()
            };

            if (replyContext) {
                messageData.replyTo = {
                    id: replyContext.id,
                    text: replyContext.text,
                    sender: replyContext.sender
                };
            }

            await addDoc(collection(db, "conversations", selectedChat.id, "messages"), messageData);

            // Calculate unread count update for recipient
            const recipientId = selectedChat.participants.find((p: string) => p !== user.uid);
            
            await updateDoc(doc(db, "conversations", selectedChat.id), {
                lastMessage: text,
                lastMessageTime: serverTimestamp(),
                ...(recipientId ? { [`unreadCounts.${recipientId}`]: increment(1) } : {})
            });
        } catch (error) {
            console.error("Message delivery failed:", error);
        }
    };

    const onEmojiClick = (emojiData: any) => {
        setMessageText(prev => prev + emojiData.emoji);
        handleTyping();
    };

    const handleStudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setStudioMedia(file);
            const url = URL.createObjectURL(file);
            setStudioPreview(url);
        }
    };

    const handleStudioDeploy = async () => {
        if (!studioMedia || !selectedChat || !user) return;

        setIsStudioProcessing(true);
        setUploadProgress(10);

        try {
            const downloadURL = await uploadToCloudinary(studioMedia, `chats/${selectedChat.id}`, (progress) => {
                setUploadProgress(progress);
            });

            const messageData: any = {
                senderId: user.uid,
                type: studioMode,
                fileUrl: downloadURL,
                content: studioCaption,
                createdAt: serverTimestamp(),
                status: "sent"
            };

            await addDoc(collection(db, "conversations", selectedChat.id, "messages"), messageData);

            const recipientId = selectedChat.participants.find((p: string) => p !== user.uid);

            await updateDoc(doc(db, "conversations", selectedChat.id), {
                lastMessage: studioMode === 'post' ? '📮 Shared Post' : '⚡ Shared Story',
                lastMessageTime: serverTimestamp(),
                ...(recipientId ? { [`unreadCounts.${recipientId}`]: increment(1) } : {})
            });

            // Reset studio
            setStudioMode('none');
            setStudioMedia(null);
            setStudioPreview(null);
            setStudioCaption("");
            setUploadProgress(null);
        } catch (error) {
            console.error("Studio deployment failed:", error);
        } finally {
            setIsStudioProcessing(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'file') => {
        const file = e.target.files?.[0];
        if (!file || !selectedChat || !user) return;

        setUploadProgress(0); // Start preloader from 0

        try {
            const downloadURL = await uploadToCloudinary(file, `chats/${selectedChat.id}`, (progress) => {
                setUploadProgress(progress);
            });

            const messageData: any = {
                senderId: user.uid,
                type: type,
                fileUrl: downloadURL,
                fileName: file.name,
                fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                status: "sent",
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, "conversations", selectedChat.id, "messages"), messageData);

            const recipientId = selectedChat.participants.find((p: string) => p !== user.uid);

            await updateDoc(doc(db, "conversations", selectedChat.id), {
                lastMessage: type === 'image' ? '📷 Photo' : type === 'video' ? '🎬 Video' : '📁 File',
                lastMessageTime: serverTimestamp(),
                ...(recipientId ? { [`unreadCounts.${recipientId}`]: increment(1) } : {})
            });

            setUploadProgress(null);
        } catch (error) {
            console.error("Cloudinary upload failed:", error);
            setUploadProgress(null);
        }
    };

    const filteredConversations = conversations.filter(c =>
        c.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <main className={`relative h-[100dvh] bg-noire-hero text-foreground overflow-hidden flex flex-col ${user ? "content-shift" : ""}`}>
            {/* Cinematic Background Elements */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.05)_0%,transparent_70%)] opacity-50" />
            </div>

            <Navbar logoOnly={true} onAuthClick={() => { }} />
            {user && <FloatingSidebar />}

            <div className="flex-1 flex overflow-hidden pt-0 lg:mt-0">
                {/* Conversations Sidebar */}
                <aside className={`
          ${isMobileView && selectedChat ? "hidden" : "flex"} 
          flex-col w-full lg:w-[400px] border-r border-white/5 glass-noire relative z-10
        `}>
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-display font-bold text-gradient-gold tracking-tight">Messages</h1>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-1 font-bold">Secure Communication</p>
                            </div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button variant="ghost" size="icon" className="rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 w-11 h-11 text-primary">
                                    <Plus className="w-5 h-5" />
                                </Button>
                            </motion.div>
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Find creators or messages..."
                                className="pl-12 bg-white/5 border-white/5 focus-visible:ring-1 focus-visible:ring-primary/30 text-base h-12 rounded-2xl transition-all duration-300"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <ScrollArea className="flex-1 px-3 pb-24 lg:pb-6">
                        <div className="space-y-2">
                            <AnimatePresence mode="popLayout">
                                {filteredConversations.map((conv, idx) => (
                                    <motion.div
                                        key={conv.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        whileHover={{ scale: 0.99, x: 4 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => navigate(`/messages/${conv.user.username || conv.otherUid}`)}
                                        className={`
                      p-4 rounded-[2rem] cursor-pointer transition-all duration-500 flex items-center gap-4 relative overflow-hidden group
                      ${selectedChat?.id === conv.id ? "bg-white/10 border border-white/10 shadow-noire-elevated" : "hover:bg-white/5 border border-transparent"}
                    `}
                                    >
                                        {selectedChat?.id === conv.id && (
                                            <motion.div
                                                layoutId="active-pill"
                                                className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-r-full shadow-glow-gold"
                                            />
                                        )}

                                        <div className="relative shrink-0">
                                            <div className="p-0.5 rounded-2xl bg-gradient-to-br from-white/20 to-transparent">
                                                <Avatar className="w-14 h-14 rounded-[1.1rem] border border-white/20 shadow-lg">
                                                    <AvatarImage src={conv.user.avatar} className="object-cover" />
                                                    <AvatarFallback className="bg-muted text-sm font-black uppercase text-white/50">{conv.user.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                            </div>
                                            {conv.online && (
                                                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-[3px] border-noire-deep shadow-lg" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className={`font-bold text-base truncate tracking-tight transition-colors ${selectedChat?.id === conv.id ? "text-primary" : "text-white/90 group-hover:text-white"}`}>
                                                    {conv.user.name}
                                                </h3>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{conv.time}</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={`text-xs truncate transition-colors ${conv.unread > 0 ? "text-white font-semibold" : "text-muted-foreground"}`}>
                                                    {conv.lastMessage}
                                                </p>
                                                {conv.unread > 0 && (
                                                    <motion.span
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="flex items-center justify-center min-w-[20px] h-[20px] px-1.5 bg-primary text-primary-foreground text-[10px] font-black rounded-lg shadow-glow-gold"
                                                    >
                                                        {conv.unread}
                                                    </motion.span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </ScrollArea>
                </aside>

                {/* Chat Area */}
                <section className={`
          flex-1 flex flex-col relative bg-transparent
          ${isMobileView && !selectedChat ? "hidden" : "flex"}
        `}>
                    {/* Internal Auras for Chat */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
                        <div className="absolute bottom-[20%] -left-[10%] w-[30%] h-[30%] bg-purple-500/10 blur-[100px] rounded-full" />
                    </div>
                    {selectedChat ? (
                        <>
                            {/* Chat Header */}
                            <header className="h-[72px] sm:h-[88px] border-b border-white/5 flex items-center justify-between px-3 sm:px-6 lg:px-10 glass-noire sticky top-0 z-20">
                                <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
                                    {isMobileView && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => navigate('/messages')}
                                            className="hover:bg-white/5 rounded-xl w-9 h-9 shrink-0"
                                        >
                                            <ArrowLeft className="w-5 h-5 text-white" />
                                        </Button>
                                    )}
                                    <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
                                        <motion.div
                                            layoutId={`avatar-${selectedChat.id}`}
                                            className="relative shrink-0"
                                        >
                                            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border border-white/10 shrink-0">
                                                <AvatarImage src={selectedChat.user.avatar} className="object-cover" />
                                                <AvatarFallback className="bg-muted font-bold text-sm">{selectedChat.user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            {(Date.now() - (selectedChat.user.lastActive?.toMillis?.() || 0)) < 60000 && (
                                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-green-500 rounded-full border-2 sm:border-[3px] border-noire-deep shadow-glow-green" />
                                            )}
                                        </motion.div>
                                        <div className="flex flex-col min-w-0">
                                            <h2 className="font-bold text-base sm:text-lg text-white leading-none tracking-tight truncate">{selectedChat.user.name}</h2>
                                            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] mt-1 sm:mt-1.5 flex items-center gap-1.5 overflow-hidden h-4">
                                                <AnimatePresence mode="wait">
                                                    {isPartnerTyping ? (
                                                        <motion.span
                                                            key="typing"
                                                            initial={{ y: 10, opacity: 0 }}
                                                            animate={{ y: 0, opacity: 1 }}
                                                            exit={{ y: -10, opacity: 0 }}
                                                            className="text-primary flex items-center gap-1"
                                                        >
                                                            <span className="relative flex h-2 w-2">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                                            </span>
                                                            typing...
                                                        </motion.span>
                                                    ) : (
                                                        <motion.span
                                                            key="presence"
                                                            initial={{ y: 10, opacity: 0 }}
                                                            animate={{ y: 0, opacity: 1 }}
                                                            exit={{ y: -10, opacity: 0 }}
                                                            className="text-muted-foreground truncate"
                                                        >
                                                            {formatPresence(selectedChat.user.lastActive)}
                                                        </motion.span>
                                                    )}
                                                </AnimatePresence>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Call buttons - visible on all screens */}
                                    <div className="flex items-center gap-1 sm:gap-2 sm:mr-4 px-2 sm:px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button 
                                                        onClick={() => navigate(`/video-call-setup?userId=${selectedChat.otherUid}&type=audio`)}
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="w-9 h-9 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-primary transition-all"
                                                    >
                                                        <Phone className="w-4 h-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-black border-white/10 text-[10px] font-bold uppercase tracking-widest">Audio Session</TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button 
                                                        onClick={() => navigate(`/video-call-setup?userId=${selectedChat.otherUid}&type=video`)}
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="w-9 h-9 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-primary transition-all"
                                                    >
                                                        <Video className="w-4 h-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-black border-white/10 text-[10px] font-bold uppercase tracking-widest">Visual Presence</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>

                                    <Button variant="ghost" size="icon" className="hidden sm:flex w-11 h-11 rounded-2xl hover:bg-white/10 text-muted-foreground">
                                        <Search className="w-5 h-5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl hover:bg-white/10 text-muted-foreground">
                                        <MoreVertical className="w-5 h-5" />
                                    </Button>
                                </div>
                            </header>

                            {/* Messages Container */}
                            <ScrollArea className="flex-1 px-3 sm:px-6 lg:px-10 py-2" ref={scrollRef}>
                                <div className="max-w-xl mx-auto flex flex-col gap-4 sm:gap-6">
                                    <div className="flex justify-center my-4">
                                        <div className="px-5 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl shadow-noire relative group">
                                            <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
                                            <span className="text-[10px] text-primary/80 uppercase tracking-[0.4em] font-black group-hover:text-primary transition-colors">Genesis Conversation</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {messages.map((msg, idx) => {
                                            const isMe = msg.sender === "me";
                                            const showAvatar = msg.sender === "them" && (idx === 0 || messages[idx - 1].sender === "me");

                                            return (
                                                <motion.div
                                                    key={msg.id}
                                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                                                    className={`flex items-end gap-3 ${isMe ? "justify-end" : "justify-start"} ${!showAvatar && !isMe ? "ml-11" : ""}`}
                                                >
                                                    {!isMe && showAvatar && (
                                                        <Avatar className="w-8 h-8 rounded-xl border border-white/10 shrink-0 mb-1">
                                                            <AvatarImage src={selectedChat.user.avatar} className="object-cover" />
                                                            <AvatarFallback className="bg-muted text-[10px] font-bold">{selectedChat.user.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                    )}

                                                    <div className={`flex flex-col group relative ${isMe ? "items-end" : "items-start hover:translate-x-1"} transition-transform duration-300`}>
                                                        {msg.type === "text" ? (
                                                            <div className={`
                                 px-4 py-3 sm:px-5 sm:py-3.5 rounded-[1.5rem] sm:rounded-[1.8rem] text-[13px] sm:text-[14px] leading-relaxed relative max-w-[85vw] sm:max-w-none
                                 ${isMe
                                                                    ? "bg-gradient-to-br from-[#FBBF24] to-[#F59E0B] text-black font-semibold rounded-br-[0.5rem] shadow-[0_10px_30px_rgba(251,191,36,0.2)]"
                                                                    : "bg-white/5 text-white/90 rounded-bl-[0.5rem] border border-white/5 backdrop-blur-xl group-hover:bg-white/[0.08] transition-colors"}
                               `}>
                                                                {msg.replyTo && (
                                                                    <div className={`mb-2 p-2 rounded-xl text-[11px] border-l-2 bg-black/20 ${isMe ? 'border-black/30' : 'border-primary/50'}`}>
                                                                        <span className="font-bold opacity-50 block mb-0.5">{msg.replyTo.sender === 'me' ? 'You' : selectedChat.user.name}</span>
                                                                        <span className="opacity-70 line-clamp-1 italic">{msg.replyTo.text}</span>
                                                                    </div>
                                                                )}
                                                                {msg.isDeleted ? (
                                                                    <span className="italic opacity-50 text-[12px]">Message unsent</span>
                                                                ) : msg.text}
                                                                {msg.isEdited && !msg.isDeleted && <span className="text-[8px] opacity-40 ml-2">(edited)</span>}
                                                                {msg.reaction && (
                                                                    <div className="absolute -bottom-3 -right-2 bg-[#1A1A1A] border border-white/10 rounded-full px-1.5 py-0.5 text-xs shadow-xl animate-bounce">
                                                                        {msg.reaction}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : msg.type === "image" ? (
                                                            <div className={`
                                 p-1 rounded-3xl overflow-hidden border border-white/10 bg-white/5
                                 ${isMe ? "rounded-br-[0.5rem]" : "rounded-bl-[0.5rem]"}
                               `}>
                                                                <img src={msg.fileUrl} className="max-w-[300px] rounded-2xl object-cover hover:scale-[1.02] transition-transform duration-500 cursor-zoom-in" alt="Attachment" />
                                                            </div>
                                                        ) : msg.type === "video" ? (
                                                            <div className={`
                                 p-1 rounded-3xl overflow-hidden border border-white/10 bg-white/5
                                 ${isMe ? "rounded-br-[0.5rem]" : "rounded-bl-[0.5rem]"}
                               `}>
                                                                <video src={msg.fileUrl} controls className="max-w-[300px] rounded-2xl outline-none" />
                                                            </div>
                                                        ) : msg.type === "file" ? (
                                                            <div className={`
                                 flex items-center gap-4 px-5 py-4 rounded-[1.8rem] bg-white/5 border border-white/10 backdrop-blur-xl group/file
                                 ${isMe ? "rounded-br-[0.5rem]" : "rounded-bl-[0.5rem]"}
                               `}>
                                                                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover/file:bg-primary group-hover/file:text-black transition-all">
                                                                    <FileIcon className="w-6 h-6" />
                                                                </div>
                                                                <div className="flex flex-col min-w-0 pr-4">
                                                                    <span className="text-sm font-bold text-white truncate max-w-[150px]">{msg.fileName}</span>
                                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{msg.fileSize}</span>
                                                                </div>
                                                                <a href={msg.fileUrl} download={msg.fileName} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors">
                                                                    <Download className="w-5 h-5" />
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <div className={`
                                flex items-center gap-3 px-5 py-3 rounded-[1.8rem] bg-white/5 border border-white/10 backdrop-blur-xl
                                ${isMe ? "rounded-br-[0.5rem]" : "rounded-bl-[0.5rem]"}
                              `}>
                                                                <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-primary text-black hover:bg-primary/90">
                                                                    <Mic className="w-5 h-5" />
                                                                </Button>
                                                                <div className="flex items-end gap-1 h-8">
                                                                    {[30, 60, 40, 70, 50, 80, 40, 60, 30, 50].map((h, i) => (
                                                                        <motion.div
                                                                            key={i}
                                                                            animate={{ height: [`${h}%`, `${h + 10}%`, `${h}%`] }}
                                                                            transition={{ repeat: Infinity, duration: 1 + Math.random(), delay: i * 0.1 }}
                                                                            className="w-1 bg-primary/40 rounded-full"
                                                                        />
                                                                    ))}
                                                                </div>
                                                                <span className="text-[10px] font-black text-muted-foreground ml-2">{msg.duration}</span>
                                                            </div>
                                                        )}

                                                        <div className={`
                              flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[9px] font-black uppercase tracking-wider
                              ${isMe ? "text-primary" : "text-muted-foreground"}
                            `}>
                                                            <span>{msg.time}</span>
                                                            {isMe && (
                                                                msg.status === "read" ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                                                            )}
                                                        </div>

                                                        {/* Three-Dots Action Menu */}
                                                        {!msg.isDeleted && (
                                                            <div className={`
                                  absolute top-0 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto
                                  ${isMe ? "right-full mr-2" : "left-full ml-2"}
                                `}>
                                                                <input
                                                                    type="file"
                                                                    ref={studioFileInputRef}
                                                                    className="hidden"
                                                                    accept="image/*,video/*"
                                                                    onChange={handleStudioFileSelect}
                                                                />
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all pointer-events-auto">
                                                                            <MoreHorizontal className="w-4 h-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent className="bg-[#121212] border-white/10 p-1.5 min-w-[160px] shadow-2xl rounded-2xl backdrop-blur-xl">
                                                                        {/* Reaction Row */}
                                                                        <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/5 mb-1.5">
                                                                            {['❤️', '🔥', '😂', '😮', '👍'].map(emoji => (
                                                                                <button
                                                                                    key={emoji}
                                                                                    onClick={() => handleReact(msg.id, emoji)}
                                                                                    className="text-lg hover:scale-125 transition-transform duration-200"
                                                                                >
                                                                                    {emoji}
                                                                                </button>
                                                                            ))}
                                                                        </div>

                                                                        <DropdownMenuItem
                                                                            onClick={() => setReplyingTo(msg)}
                                                                            className="flex items-center gap-3 rounded-xl focus:bg-white/10 focus:text-primary transition-colors cursor-pointer"
                                                                        >
                                                                            <Reply className="w-4 h-4" />
                                                                            <span className="font-bold text-xs">Reply</span>
                                                                        </DropdownMenuItem>

                                                                        {isMe && (
                                                                            <>
                                                                                <DropdownMenuItem
                                                                                    onClick={() => { setEditingMessage(msg); setMessageText(msg.text); }}
                                                                                    className="flex items-center gap-3 rounded-xl focus:bg-white/10 focus:text-primary transition-colors cursor-pointer"
                                                                                >
                                                                                    <Pencil className="w-4 h-4" />
                                                                                    <span className="font-bold text-xs">Edit</span>
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem
                                                                                    onClick={() => handleUnsendMessage(msg.id)}
                                                                                    className="flex items-center gap-3 rounded-xl focus:bg-red-500/10 focus:text-red-500 transition-colors cursor-pointer"
                                                                                >
                                                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                                                    <span className="font-bold text-xs text-red-500">Unsend</span>
                                                                                </DropdownMenuItem>
                                                                            </>
                                                                        )}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}

                                        {/* Real Typing Indicator */}
                                        {isPartnerTyping && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex justify-start items-center gap-3 ml-11 mt-4"
                                            >
                                                <div className="bg-white/5 px-4 py-3 rounded-[1.5rem] rounded-bl-[0.3rem] border border-white/5 flex gap-1.5 items-center backdrop-blur-sm">
                                                    <motion.span animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                                                    <motion.span animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                                                    <motion.span animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                                                    <span className="text-[10px] font-bold text-primary/80 ml-2 tracking-tight">Active Typing</span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </ScrollArea>

                            {/* Message Input Container */}
                            <footer className="px-3 pb-4 sm:px-6 sm:pb-6 lg:px-10 lg:pb-8 pt-0 bg-transparent z-10">
                                <div className="max-w-2xl mx-auto">
                                    {/* Reply / Edit Preview */}
                                    <AnimatePresence>
                                        {(replyingTo || editingMessage) && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="mb-2 px-6 py-3 bg-white/5 border border-white/10 rounded-[1.5rem] backdrop-blur-xl flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-1 h-8 bg-primary rounded-full shrink-0" />
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                                            {editingMessage ? "Editing Session" : `Replying to ${replyingTo.sender === 'me' ? 'You' : selectedChat.user.name}`}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground line-clamp-1 italic">
                                                            {editingMessage ? editingMessage.text : replyingTo.text}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-8 h-8 rounded-full hover:bg-white/10 hover:text-red-500 transition-colors"
                                                    onClick={() => { setReplyingTo(null); setEditingMessage(null); if (editingMessage) setMessageText(""); }}
                                                >
                                                    <Plus className="w-4 h-4 rotate-45" />
                                                </Button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <motion.div
                                        layout
                                        className="relative group"
                                    >
                                        {/* Glowing border effect */}
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 via-transparent to-primary/50 rounded-[2.5rem] blur opacity-0 group-focus-within:opacity-20 transition duration-1000 group-focus-within:duration-200" />

                                        <div className="relative flex items-end gap-2 sm:gap-3 bg-white/10 border border-white/20 glass-noire rounded-[2rem] sm:rounded-[2.5rem] p-2 sm:p-3 transition-all duration-500 focus-within:border-primary/30 focus-within:bg-white/15 shadow-noire-elevated overflow-hidden">
                                            {/* Unified Progress Overlay */}
                                            <AnimatePresence>
                                                {uploadProgress !== null && (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-2"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                                            <span className="text-xl font-black text-primary tracking-tighter">{uploadProgress}%</span>
                                                        </div>
                                                        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                                                            <motion.div
                                                                className="h-full bg-primary shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${uploadProgress}%` }}
                                                                transition={{ duration: 0.2 }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Encrypting & Uploading</span>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <div className="flex items-center self-center pl-1 sm:pl-2">
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file';
                                                            handleFileSelect(e, type);
                                                        }
                                                    }}
                                                />
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <motion.div whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}>
                                                            <Button variant="ghost" size="icon" className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all shadow-inner relative">
                                                                {uploadProgress !== null ? (
                                                                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-primary" />
                                                                ) : (
                                                                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                                                                )}
                                                            </Button>
                                                        </motion.div>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="bg-[#121212] border-white/10 p-2 min-w-[180px] rounded-3xl shadow-2xl backdrop-blur-2xl">
                                                        <DropdownMenuItem onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = "image/*"; fileInputRef.current.click(); } }} className="flex items-center gap-3 rounded-2xl p-3 focus:bg-white/10 cursor-pointer transition-colors group">
                                                            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-black transition-all">
                                                                <ImageIcon className="w-5 h-5" />
                                                            </div>
                                                            <span className="font-bold text-sm">Send Image</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = "video/*"; fileInputRef.current.click(); } }} className="flex items-center gap-3 rounded-2xl p-3 focus:bg-white/10 cursor-pointer transition-colors group">
                                                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-black transition-all">
                                                                <Film className="w-5 h-5" />
                                                            </div>
                                                            <span className="font-bold text-sm">Send Video</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = "*"; fileInputRef.current.click(); } }} className="flex items-center gap-3 rounded-2xl p-3 focus:bg-white/10 cursor-pointer transition-colors group">
                                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                                                                <FileIcon className="w-5 h-5" />
                                                            </div>
                                                            <span className="font-bold text-sm">Any File</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <div className="flex-1 flex flex-col min-w-0 py-0.5 sm:py-1">
                                                <textarea
                                                    placeholder={`Message ${selectedChat.user.name.split(' ')[0]}...`}
                                                    rows={1}
                                                    className="w-full bg-transparent border-none focus:ring-0 text-sm sm:text-base py-2 sm:py-3 px-1 sm:px-2 resize-none text-white placeholder:text-muted-foreground/50 max-h-32 sm:max-h-40 overflow-y-auto"
                                                    value={messageText}
                                                    onChange={(e) => {
                                                        setMessageText(e.target.value);
                                                        handleTyping();
                                                        e.target.style.height = 'auto';
                                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSendMessage();
                                                        }
                                                    }}
                                                />
                                            </div>

                                            <div className="flex items-center gap-1 sm:gap-2 pr-1 sm:pr-2 self-center relative" ref={emojiPickerRef}>
                                                <div className="absolute bottom-full right-0 mb-4 z-50">
                                                    <AnimatePresence>
                                                        {showEmojiPicker && (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                                                className="shadow-2xl rounded-3xl overflow-hidden border border-white/10"
                                                            >
                                                                <EmojiPicker
                                                                    theme={Theme.DARK}
                                                                    onEmojiClick={onEmojiClick}
                                                                    autoFocusSearch={false}
                                                                    width={isMobileView ? 280 : 320}
                                                                    height={isMobileView ? 350 : 400}
                                                                    lazyLoadEmojis={true}
                                                                    skinTonesDisabled={true}
                                                                    searchPlaceHolder="Search vibes..."
                                                                />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl transition-colors ${showEmojiPicker ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-primary'}`}
                                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                >
                                                    <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </Button>
                                                <motion.div
                                                    initial={false}
                                                    animate={{ scale: messageText.trim() ? 1 : 0.9, opacity: messageText.trim() ? 1 : 0.5 }}
                                                >
                                                    <Button
                                                        onClick={handleSendMessage}
                                                        disabled={!messageText.trim()}
                                                        className="w-9 h-9 sm:w-11 sm:h-11 bg-primary hover:bg-primary/90 text-black rounded-xl sm:rounded-2xl p-0 shadow-glow-gold overflow-hidden relative group/btn transition-all duration-300"
                                                    >
                                                        <Send className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                                                    </Button>
                                                </motion.div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <div className="hidden sm:flex items-center justify-between px-6 mt-4 opacity-30">
                                        <div className="flex gap-4">
                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white">Quantum Encrypted</span>
                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white">P2P Node: Alpha</span>
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">Noire Protocol v4.2</span>
                                    </div>
                                </div>
                            </footer>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-10 bg-radial-at-c from-primary/5 to-transparent">
                            <div className="relative group">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full group-hover:bg-primary/40 transition-colors duration-1000"
                                />
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                    transition={{ duration: 1.2, type: "spring", bounce: 0.4 }}
                                    className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center backdrop-blur-3xl relative z-10 shadow-2xl overflow-hidden"
                                >
                                    <Send className="w-12 h-12 text-primary drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                                    <div className="absolute -inset-2 bg-gradient-to-tr from-primary/20 to-transparent animate-pulse" />
                                </motion.div>
                            </div>

                            <div className="space-y-4 max-w-sm relative z-10">
                                <h3 className="text-4xl font-display font-bold text-white tracking-tight">Digital Studio Hub</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed font-body">
                                    Connect with creators in an environment designed for <span className="text-primary font-bold italic tracking-wider">high-frequency</span> collaboration.
                                </p>
                            </div>

                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button className="rounded-2xl h-14 px-8 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold gap-3 group backdrop-blur-md">
                                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                                        <Plus className="w-4 h-4 text-primary group-hover:text-black" />
                                    </div>
                                    New Creative Session
                                </Button>
                            </motion.div>
                        </div>
                    )}
                </section>
            </div>

            <MobileBottomNav onAuthClick={() => { }} />
        </main>
    );
};

export default Messages;
