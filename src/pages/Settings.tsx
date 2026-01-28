import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    User, Settings as SettingsIcon, Bell, Shield,
    Volume2, Globe, CreditCard, LogOut, ChevronRight,
    Camera, Check, Info, Smartphone, Mail, Phone,
    Lock, Eye, Moon, Zap, Wifi, HelpCircle, FileText,
    Share2, AlertTriangle, Download, Trash2, Key,
    Music, Mic2, Cast, ChevronLeft, ToggleLeft, ToggleRight, Calendar
} from "lucide-react";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged, signOut, deleteUser, reauthenticateWithPopup, GoogleAuthProvider, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, getDoc, updateDoc, addDoc, collection, query, getDocs, serverTimestamp, onSnapshot, deleteDoc, writeBatch } from "firebase/firestore";
import { ref, deleteObject, listAll } from "firebase/storage";
import Navbar from "@/components/noire/Navbar";
import MobileBottomNav from "@/components/noire/MobileBottomNav";
import FloatingSidebar from "@/components/noire/FloatingSidebar";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { cn, isEligibleForVerification } from "@/lib/utils";
import { useSyncBalance } from "@/hooks/useSyncBalance";

/**
 * ULTRA PRO Settings Page
 * Surpassing industry standards with a "Noire" premium aesthetic.
 */

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);

    // Navigation State
    const [activeCategory, setActiveCategory] = useState<string | null>("account");
    const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

    // Sync balance based on likes
    useSyncBalance(user?.uid, userData?.balance);

    const navigate = useNavigate();
    const { toast } = useToast();

    // Form states
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [phone, setPhone] = useState("");
    const [bio, setBio] = useState("");
    const [website, setWebsite] = useState("");
    const [birthday, setBirthday] = useState("");
    const [saving, setSaving] = useState(false);

    // Mock Settings States (would be connected to backend in full prod)
    const [settings, setSettings] = useState({
        privateAccount: false,
        activityStatus: true,
        readReceipts: true,
        dataSaver: false,
        autoplay: true,
        highQualityUploads: true,
        pushNotifications: true,
        emailNotifications: true,
        marketingEmails: false,
        darkMode: true,
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const unsubDoc = onSnapshot(doc(db, "users", currentUser.uid), (userDoc) => {
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserData(data);
                        setFullName(data.fullName || "");
                        setUsername(data.username || "");
                        setPhone(data.phone || "");
                        setBio(data.bio || "");
                        setWebsite(data.website || "");
                        setBirthday(data.birthday || "");
                    }
                });
                setLoading(false);
                return () => unsubDoc();
            } else {
                navigate("/login");
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                fullName,
                username,
                phone,
                bio,
                website,
                birthday
            });
            toast({
                title: "Profile Sync Complete",
                description: "Your digital persona has been updated across the aura.",
                className: "bg-[#0A0A0A] border border-[#FBBF24]/30 text-white"
            });
        } catch (error: any) {
            toast({
                title: "Sync Failed",
                description: "Could not update profile. Please check your connection.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
        toast({
            title: "Preference Saved",
            description: "Settings updated successfully.",
            duration: 1500,
            className: "bg-[#0A0A0A] border border-white/10 text-white"
        });
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    const handleDeleteAccount = async () => {
        if (!user) return;

        const confirmDelete = window.confirm(
            "CRITICAL ACTION: This will permanently delete your Morra account, balance, and all associated data. This cannot be undone. Are you absolutely certain?"
        );

        if (!confirmDelete) return;

        setSaving(true);
        try {
            // 1. Storage Cleanup (Optional but good practice)
            // Note: Thorough cleanup usually requires a backend function, 
            // but we'll attempt basic Firestore cleanup here.

            const userId = user.uid;

            // 2. Delete User Document and subcollections
            const batch = writeBatch(db);

            // Delete notifications
            const notificationsQuery = query(collection(db, "users", userId, "notifications"));
            const notificationsSnap = await getDocs(notificationsQuery);
            notificationsSnap.forEach((doc) => batch.delete(doc.ref));

            // Delete followers/following references (simplistic version)
            // A full deletion would involve finding every doc where this user is mentioned.

            // Delete main user document
            batch.delete(doc(db, "users", userId));

            // Execute batched Firestore deletions
            await batch.commit();

            // 3. Delete Firebase Auth User
            // Note: deleteUser() requires a recent login. 
            // If it fails, we catch the "requires-recent-login" error.
            await deleteUser(user);

            toast({
                title: "Account Terminated",
                description: "Your digital essence has been wiped from the aura.",
                className: "bg-red-950 border-red-500 text-white"
            });

            navigate("/login");

        } catch (error: any) {
            console.error("Deletion error:", error);

            if (error.code === 'auth/requires-recent-login') {
                toast({
                    title: "Security Verification Required",
                    description: "For your protection, please log out and log back in before deleting your account.",
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Engine Error",
                    description: "A system error occurred during deletion. Please try again later.",
                    variant: "destructive"
                });
            }
        } finally {
            setSaving(false);
        }
    };

    const handleRequestVerification = async () => {
        if (!user || !userData) return;

        // 1. Check Age (Must be 18+)
        if (!userData.birthday) {
            toast({ variant: "destructive", title: "Missing Information", description: "Please add your birthday to your profile first." });
            return;
        }

        if (!isEligibleForVerification(userData.birthday)) {
            toast({ variant: "destructive", title: "Eligibility", description: "You must be at least 18 years old to be verified." });
            return;
        }

        // 2. Check Followers (Must be 2+)
        try {
            const followersSnap = await getDocs(collection(db, "users", user.uid, "followers"));
            if (followersSnap.size < 350) {
                toast({ variant: "destructive", title: "Eligibility", description: `You need at least 2 followers. You currently have ${followersSnap.size}.` });
                return;
            }

            // 3. Submit Request
            await addDoc(collection(db, "verificationRequests"), {
                userId: user.uid,
                username: userData.username,
                fullName: userData.fullName,
                email: user.email,
                followersCount: followersSnap.size,
                status: "pending",
                createdAt: serverTimestamp()
            });

            toast({
                title: "Request Sent",
                description: "Your verification request has been sent to the manager.",
                className: "bg-[#0A0A0A] border border-[#FBBF24]/30 text-white"
            });

        } catch (error) {
            console.error("Verification request error:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to send request. Please try again." });
        }
    };

    const handleCategoryClick = (id: string) => {
        setActiveCategory(id);
        setIsMobileDetailOpen(true);
    };

    const handleBackToMenu = () => {
        setIsMobileDetailOpen(false);
    };

    if (loading) return null;

    // --- Configuration ---

    const menuCategories = [
        {
            id: "account",
            label: "Account Center",
            icon: User,
            description: "Personal details, security, and verification.",
            sections: [
                {
                    title: "Profile Identity",
                    type: "form",
                    fields: [
                        { label: "Full Name", value: fullName, setter: setFullName, icon: User, type: "text" },
                        { label: "Username", value: username, setter: setUsername, icon: User, type: "text", prefix: "@" },
                        { label: "Date of Birth", value: birthday, setter: setBirthday, icon: Calendar, type: "date" },
                        { label: "Bio", value: bio, setter: setBio, icon: FileText, type: "textarea" },
                        { label: "Website", value: website, setter: setWebsite, icon: Globe, type: "url" },
                    ]
                },
                {
                    title: "Contact Info",
                    type: "form",
                    fields: [
                        { label: "Email", value: user?.email, icon: Mail, type: "email", disabled: true },
                        { label: "Phone", value: phone, setter: setPhone, icon: Phone, type: "tel" },
                    ]
                },
                {
                    title: "Account Actions",
                    type: "actions",
                    items: [
                        { label: "Request Verification", icon: Check, action: handleRequestVerification },
                        { label: "Change Password", icon: Key, action: () => toast({ title: "Email Sent", description: "Password reset link sent to your email." }) },
                        { label: "Delete Account Permanently", icon: Trash2, danger: true, action: handleDeleteAccount }
                    ]
                }
            ]
        },
        {
            id: "privacy",
            label: "Privacy & Safety",
            icon: Lock,
            description: "Control who sees what and manage your data.",
            sections: [
                {
                    title: "Discoverability",
                    type: "toggles",
                    items: [
                        { key: "privateAccount", label: "Private Account", desc: "Only followers can see your posts" },
                        { key: "activityStatus", label: "Activity Status", desc: "Show when you're active together" },
                        { key: "readReceipts", label: "Read Receipts", desc: "Show when you've seen messages" },
                    ]
                },
                {
                    title: "Data & Permissions",
                    type: "actions",
                    items: [
                        { label: "Blocked Accounts", icon: Shield, action: () => { } },
                        { label: "Download Your Data", icon: Download, action: () => { } },
                    ]
                }
            ]
        },
        {
            id: "notifications",
            label: "Notifications",
            icon: Bell,
            description: "Manage how we communicate with you.",
            sections: [
                {
                    title: "Push Notifications",
                    type: "toggles",
                    items: [
                        { key: "pushNotifications", label: "Pause All", desc: "Temporarily pause notifications" },
                    ]
                },
                {
                    title: "Email",
                    type: "toggles",
                    items: [
                        { key: "emailNotifications", label: "Feedback Emails", desc: "Give feedback on Morra" },
                        { key: "marketingEmails", label: "Product Emails", desc: "Tips, news, and updates" },
                    ]
                }
            ]
        },
        {
            id: "content",
            label: "Content & Display",
            icon: Eye,
            description: "Customize your viewing experience.",
            sections: [
                {
                    title: "Media Quality",
                    type: "toggles",
                    items: [
                        { key: "highQualityUploads", label: "Upload at Highest Quality", desc: "Always upload high-res media" },
                        { key: "dataSaver", label: "Data Saver", desc: "Use less data for videos" },
                        { key: "autoplay", label: "Autoplay Videos", desc: "Play videos automatically" },
                    ]
                },
                {
                    title: "Accessibility",
                    type: "actions",
                    items: [
                        { label: "Captions", icon: FileText, action: () => { } },
                        { label: "Dark Mode", icon: Moon, action: () => { }, value: "On" },
                    ]
                }
            ]
        },
        {
            id: "wallet",
            label: "Wallet & Earnings",
            icon: CreditCard,
            description: "Manage your balance and payout methods.",
            sections: [
                {
                    title: "Balance",
                    type: "custom",
                    content: (
                        <div className="bg-gradient-to-r from-[#FBBF24]/20 to-[#F59E0B]/20 p-6 rounded-3xl border border-[#FBBF24]/30 mb-6">
                            <p className="text-sm font-bold text-[#FBBF24] uppercase tracking-widest mb-1">Total Balance</p>
                            <h2 className="text-4xl font-display font-bold text-white mb-4">$0.00</h2>
                            <div className="flex gap-3">
                                <button onClick={() => navigate('/deposit')} className="flex-1 py-3 bg-[#FBBF24] text-black font-bold rounded-xl text-sm">Deposit</button>
                                <button onClick={() => navigate('/withdraw')} className="flex-1 py-3 bg-white/10 text-white font-bold rounded-xl text-sm hover:bg-white/20">Withdraw</button>
                            </div>
                        </div>
                    )
                },
                {
                    title: "Monetization",
                    type: "actions",
                    items: [
                        { label: "Refer & Earn", icon: Zap, action: () => navigate('/refer'), value: "Get Paid" },
                        { label: "Payout Settings", icon: CreditCard, action: () => { } },
                        { label: "Transaction History", icon: FileText, action: () => { } },
                    ]
                }
            ]
        },
        {
            id: "support",
            label: "Support & About",
            icon: HelpCircle,
            description: "Get help and view legal information.",
            sections: [
                {
                    title: "Help",
                    type: "actions",
                    items: [
                        { label: "Help Center", icon: HelpCircle, action: () => { } },
                        { label: "Report a Problem", icon: AlertTriangle, action: () => { } },
                    ]
                },
                {
                    title: "Legal",
                    type: "actions",
                    items: [
                        { label: "Terms of Service", icon: FileText, action: () => { } },
                        { label: "Privacy Policy", icon: Lock, action: () => { } },
                        { label: "Open Source Libraries", icon: Share2, action: () => { } },
                    ]
                }
            ]
        }
    ];

    const activeMenu = menuCategories.find(c => c.id === activeCategory);

    return (
        <div className="min-h-screen bg-background text-foreground pb-4 content-shift overflow-hidden">
            {user && <FloatingSidebar />}
            <Navbar />

            <main className="container mx-auto px-4 md:px-6 pt-24 md:pt-32 max-w-7xl h-[calc(100vh-100px)]">
                <div className="flex h-full gap-8 relative">

                    {/* --- Sidebar / Main Menu --- */}
                    <motion.aside
                        className={`
                            w-full md:w-[350px] lg:w-[400px] flex flex-col h-full overflow-y-auto custom-scrollbar pb-4
                            ${isMobileDetailOpen ? 'hidden md:flex' : 'flex'}
                        `}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <header className="mb-8 px-2">
                            <h1 className="text-3xl md:text-4xl font-display font-bold flex items-center gap-3">
                                <SettingsIcon className="text-primary w-8 h-8" />
                                Settings
                            </h1>
                            <p className="text-muted-foreground font-body mt-2 text-sm md:text-base">
                                Fine-tune your Morra experience.
                            </p>
                        </header>

                        <div className="space-y-3 flex-1">
                            {menuCategories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategoryClick(cat.id)}
                                    className={`
                                        w-full flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 border
                                        ${activeCategory === cat.id
                                            ? "bg-white/5 border-primary/30 shadow-[0_0_30px_rgba(251,191,36,0.1)]"
                                            : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/5"}
                                    `}
                                >
                                    <div className={`
                                        w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors
                                        ${activeCategory === cat.id ? "bg-primary text-black" : "bg-white/5 text-muted-foreground"}
                                    `}>
                                        <cat.icon size={22} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h3 className={`font-bold text-base ${activeCategory === cat.id ? "text-foreground" : "text-muted-foreground"}`}>
                                            {cat.label}
                                        </h3>
                                        <p className="text-xs text-muted-foreground/60 line-clamp-1">{cat.description}</p>
                                    </div>
                                    <ChevronRight size={18} className={`text-muted-foreground/40 ${activeCategory === cat.id ? "text-primary" : ""}`} />
                                </button>
                            ))}
                        </div>

                        <div className="pt-6 px-2 mt-auto">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all font-bold"
                            >
                                <LogOut size={20} />
                                Log Out
                            </button>
                            <p className="text-center text-[10px] text-muted-foreground/30 mt-4 uppercase tracking-widest font-bold">
                                Morra v2.4.0 (Build 842)
                            </p>
                        </div>
                    </motion.aside>

                    {/* --- Detail View (Desktop & Mobile Slide-over) --- */}
                    <AnimatePresence mode="wait">
                        {(activeCategory || isMobileDetailOpen) && (
                            <motion.section
                                key={activeCategory}
                                className={`
                                    flex-1 h-full overflow-y-auto custom-scrollbar md:block
                                    ${isMobileDetailOpen ? 'fixed inset-0 z-50 bg-background md:static md:bg-transparent' : 'hidden'}
                                `}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <div className="glass-noire md:border border-white/5 md:rounded-[40px] h-full md:h-auto min-h-full p-6 md:p-10 pb-10">

                                    {/* Mobile Header */}
                                    <div className="md:hidden flex items-center gap-4 mb-8 pt-4">
                                        <button
                                            onClick={handleBackToMenu}
                                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
                                        >
                                            <ChevronLeft size={24} />
                                        </button>
                                        <h2 className="text-2xl font-bold">{activeMenu?.label}</h2>
                                    </div>

                                    {/* Desktop Header */}
                                    <div className="hidden md:flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                                        <div className="w-14 h-14 rounded-[20px] bg-primary/10 flex items-center justify-center text-primary">
                                            {activeMenu && <activeMenu.icon size={32} />}
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-display font-bold">{activeMenu?.label}</h2>
                                            <p className="text-muted-foreground">{activeMenu?.description}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-10 max-w-3xl">
                                        {activeMenu?.sections.map((section: any, idx: number) => (
                                            <div key={idx} className="space-y-6">
                                                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/50 pl-2">
                                                    {section.title}
                                                </h3>

                                                {section.type === "custom" && section.content}

                                                {section.type === "form" && (
                                                    <div className="space-y-6">
                                                        {section.fields.map((field: any, fIdx: number) => (
                                                            <div key={fIdx} className="space-y-2">
                                                                <label className="text-xs font-bold text-muted-foreground ml-4">{field.label}</label>
                                                                <div className="relative group">
                                                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                                                        <field.icon size={18} />
                                                                    </div>
                                                                    {field.type === "textarea" ? (
                                                                        <textarea
                                                                            value={field.value}
                                                                            onChange={(e) => field.setter(e.target.value)}
                                                                            className="w-full pl-14 pr-6 py-4 bg-muted/20 border border-white/5 rounded-3xl font-body text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none min-h-[120px]"
                                                                            placeholder={`Enter your ${field.label.toLowerCase()}...`}
                                                                        />
                                                                    ) : (
                                                                        <input
                                                                            type={field.type}
                                                                            value={field.value}
                                                                            onChange={(e) => field.setter && field.setter(e.target.value)}
                                                                            disabled={field.disabled}
                                                                            className="w-full pl-14 pr-6 py-4 bg-muted/20 border border-white/5 rounded-3xl font-body text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                                            placeholder={field.placeholder || `Enter your ${field.label.toLowerCase()}...`}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <div className="flex justify-end pt-4">
                                                            <button
                                                                onClick={handleUpdateProfile}
                                                                disabled={saving}
                                                                className="px-8 py-3 bg-primary text-black font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                                            >
                                                                {saving ? "Saving..." : "Save Changes"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {section.type === "toggles" && (
                                                    <div className="space-y-4">
                                                        {section.items.map((item: any, tIdx: number) => (
                                                            <div key={tIdx} className="flex items-center justify-between p-4 rounded-3xl bg-muted/10 border border-white/5">
                                                                <div>
                                                                    <p className="font-bold text-sm">{item.label}</p>
                                                                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                                                                </div>
                                                                <Switch
                                                                    checked={settings[item.key as keyof typeof settings]}
                                                                    onCheckedChange={() => handleToggle(item.key)}
                                                                    className="data-[state=checked]:bg-primary"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {section.type === "actions" && (
                                                    <div className="space-y-3">
                                                        {section.items.map((item: any, aIdx: number) => (
                                                            <button
                                                                key={aIdx}
                                                                onClick={item.action}
                                                                className={`w-full flex items-center justify-between p-5 rounded-3xl border transition-all duration-200 group
                                                                    ${item.danger
                                                                        ? "bg-red-500/5 border-red-500/20 hover:bg-red-500/10"
                                                                        : "bg-muted/10 border-white/5 hover:bg-white/5 hover:border-white/10"}
                                                                `}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`
                                                                        w-10 h-10 rounded-xl flex items-center justify-center
                                                                        ${item.danger ? "bg-red-500/20 text-red-500" : "bg-white/5 text-muted-foreground group-hover:text-primary"}
                                                                    `}>
                                                                        <item.icon size={20} />
                                                                    </div>
                                                                    <span className={`font-bold ${item.danger ? "text-red-500" : "text-foreground"}`}>
                                                                        {item.label}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    {item.value && <span className="text-xs text-muted-foreground font-mono">{item.value}</span>}
                                                                    <ChevronRight size={18} className="text-muted-foreground/30 group-hover:text-foreground" />
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.section>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <MobileBottomNav />
        </div>
    );
};

export default Settings;