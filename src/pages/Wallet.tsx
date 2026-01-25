import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, query, where, getDocs, collection, runTransaction, Timestamp, onSnapshot, limit, addDoc, serverTimestamp, or } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    CreditCard, Send, ArrowDownLeft, ArrowUpRight,
    Wallet as WalletIcon, TrendingUp, MoreHorizontal,
    DollarSign, Activity, Lock, Smartphone, ArrowDownCircle, ArrowUpCircle
} from "lucide-react";
import Navbar from "@/components/noire/Navbar";
import MobileBottomNav from "@/components/noire/MobileBottomNav";
import FloatingSidebar from "@/components/noire/FloatingSidebar";
import NoireLogo from "@/components/noire/NoireLogo";
import { useSyncBalance } from "@/hooks/useSyncBalance";

// Simple Icons for demo
const MusicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
);
const CarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>
);
const CoffeeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" /><line x1="6" x2="6" y1="2" y2="4" /><line x1="10" x2="10" y1="2" y2="4" /><line x1="14" x2="14" y1="2" y2="4" /></svg>
);

const Wallet = () => {
    const navigate = useNavigate();
    const [balanceHidden, setBalanceHidden] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [morraCardNumber, setMorraCardNumber] = useState("");
    const [sendModalOpen, setSendModalOpen] = useState(false);
    const [recipientCardNumber, setRecipientCardNumber] = useState("");
    const [sendAmount, setSendAmount] = useState("");
    const [receiveModalOpen, setReceiveModalOpen] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [convertPoints, setConvertPoints] = useState("");

    // Sync balance based on likes (Pass Balance, Earnings, and Spent Points, Referral Points)
    useSyncBalance(user?.uid, userData?.balance, userData?.earnings, userData?.spentPoints, userData?.referralPoints);

    const handleConvertPoints = async () => {
        if (!userData || !user) return;
        
        const points = parseFloat(convertPoints);
        if (isNaN(points) || points <= 0) {
            alert("Please enter a valid amount of points.");
            return;
        }

        if (points > (userData.earnings || 0)) {
            alert("Insufficient points.");
            return;
        }

        const frwAmount = points * 10; // 50 points = 500 FRW => 1 point = 10 FRW

        try {
             await runTransaction(db, async (transaction) => {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await transaction.get(userDocRef);
                if (!userDoc.exists()) {
                    throw "User does not exist!";
                }

                const currentEarnings = userDoc.data().earnings || 0;
                const currentSpent = userDoc.data().spentPoints || 0;

                if (currentEarnings < points) {
                    throw "Insufficient points!";
                }
                
                const newEarnings = currentEarnings - points;
                const newBalance = (userDoc.data().balance || 0) + frwAmount;
                const newSpent = currentSpent + points;

                transaction.update(userDocRef, {
                    earnings: newEarnings,
                    balance: newBalance,
                    spentPoints: newSpent
                });

                // Add transaction record
                const newTxRef = doc(collection(db, "transactions"));
                transaction.set(newTxRef, {
                    userId: user.uid,
                    amount: frwAmount,
                    pointsConverted: points,
                    type: "conversion",
                    note: `Converted ${points} points to ${frwAmount} FRW`,
                    createdAt: serverTimestamp()
                });
            });

            setConvertPoints("");
            alert(`Successfully converted ${points} points to ${frwAmount} FRW!`);

        } catch (e) {
            console.error("Conversion failed: ", e);
            alert("Conversion failed. Please try again.");
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDocRef = doc(db, "users", currentUser.uid);
                const unsubDoc = onSnapshot(userDocRef, (snap) => {
                    if (snap.exists()) {
                        setUserData(snap.data());
                    }
                });

                const txQuery = query(
                    collection(db, "transactions"),
                    or(
                        where("userId", "==", currentUser.uid),
                        where("toUserId", "==", currentUser.uid)
                    )
                );
                const unsubTx = onSnapshot(txQuery, (snap) => {
                    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                    const sorted = list.sort((a: any, b: any) => {
                        const aMs = a?.createdAt?.toMillis?.() ?? a?.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
                        const bMs = b?.createdAt?.toMillis?.() ?? b?.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
                        return bMs - aMs;
                    });
                    setTransactions(sorted);
                });

                return () => {
                    unsubDoc();
                    unsubTx();
                };
            } else {
                setUser(null);
                setUserData(null);
                setTransactions([]);
            }
        });

        return () => unsubscribe();
    }, [db, auth]);

    const handleRegisterMorraCard = async () => {
        if (user && morraCardNumber.length === 10 && /^\d+$/.test(morraCardNumber)) {
            const userDocRef = doc(db, "users", user.uid);
            try {
                // ensure card number is unique
                const existing = await getDocs(query(collection(db, "users"), where("morraCardNumber", "==", morraCardNumber), limit(1)));
                if (!existing.empty && existing.docs[0].id !== user.uid) {
                    alert("This card number is already registered.");
                    return;
                }

                const cardCreatedAt = Timestamp.now();
                await updateDoc(userDocRef, {
                    morraCardNumber: morraCardNumber,
                    cardCreatedAt: cardCreatedAt
                });
                setMorraCardNumber("");
                alert("Morra card registered successfully!");
            } catch (error) {
                console.error("Error updating document: ", error);
                alert("Failed to register card. Please try again.");
            }
        } else {
            alert("Please enter a valid 10-digit Morra card number.");
        }
    };

    const formatCardNumber = (number: string) => {
        if (!number) return "•••• •••• •••• ••••";
        // Format as XXXX XXXX XXXX (10 digits = 3 groups of 4, then 2)
        return number.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    };

    const getExpirationDate = () => {
        if (!userData?.cardCreatedAt) return null;
        let createdAt: Date;
        if (userData.cardCreatedAt.toDate) {
            // Firestore Timestamp
            createdAt = userData.cardCreatedAt.toDate();
        } else if (userData.cardCreatedAt instanceof Date) {
            createdAt = userData.cardCreatedAt;
        } else if (typeof userData.cardCreatedAt === 'number') {
            createdAt = new Date(userData.cardCreatedAt);
        } else if (userData.cardCreatedAt.seconds) {
            // Firestore Timestamp object with seconds
            createdAt = new Date(userData.cardCreatedAt.seconds * 1000);
        } else {
            createdAt = new Date(userData.cardCreatedAt);
        }
        const expirationDate = new Date(createdAt);
        expirationDate.setHours(expirationDate.getHours() + 48);
        return expirationDate;
    };

    const formatExpirationDate = () => {
        const expDate = getExpirationDate();
        if (!expDate) return "N/A";
        const hoursLeft = Math.floor((expDate.getTime() - Date.now()) / (1000 * 60 * 60));
        const minutesLeft = Math.floor(((expDate.getTime() - Date.now()) % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hoursLeft <= 0 && minutesLeft <= 0) {
            return "Expired";
        }
        
        if (hoursLeft < 1) {
            return `${minutesLeft}m left`;
        }
        return `${hoursLeft}h ${minutesLeft}m left`;
    };

    const isCardExpired = () => {
        const expDate = getExpirationDate();
        if (!expDate) return false;
        return Date.now() > expDate.getTime();
    };

    const formatRwf = (val?: number) => {
        const num = Number(val || 0);
        return `RWF ${num.toLocaleString("en-KE", { minimumFractionDigits: 0 })}`;
    };

    const handleSendMoney = async () => {
        if (!recipientCardNumber || !sendAmount || !user) return;

        const amount = parseFloat(sendAmount);
        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }
        const currentBalance = Number(userData?.balance || 0);
        if (currentBalance < amount) {
            alert("Insufficient balance.");
            return;
        }
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("morraCardNumber", "==", recipientCardNumber));
        try {
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                alert("Recipient not found. Please check the card number.");
                return;
            }
            const recipientDoc = querySnapshot.docs[0];
            const recipientId = recipientDoc.id;
            const recipientData = recipientDoc.data();
            if (recipientId === user.uid) {
                alert("You cannot send money to yourself.");
                return;
            }

            await runTransaction(db, async (transaction) => {
                const senderDocRef = doc(db, "users", user.uid);
                const recipientDocRef = doc(db, "users", recipientId);
                const senderDoc = await transaction.get(senderDocRef);
                const recipientSnap = await transaction.get(recipientDocRef);
                if (!senderDoc.exists() || !recipientSnap.exists()) {
                    throw "Document does not exist!";
                }
                const newSenderBalance = Number(senderDoc.data().balance || 0) - amount;
                const newRecipientBalance = Number(recipientSnap.data().balance || 0) + amount;
                transaction.update(senderDocRef, { balance: newSenderBalance });
                transaction.update(recipientDocRef, { balance: newRecipientBalance });
            });

            // Create transaction record for sender (outgoing)
            await addDoc(collection(db, "transactions"), {
                userId: user.uid,
                toUserId: recipientId,
                toUserName: recipientData.fullName || recipientData.username || "User",
                toCardNumber: recipientCardNumber,
                amount: amount,
                currency: "RWF",
                type: "send",
                note: `Sent to ${recipientData.fullName || recipientData.username || recipientCardNumber}`,
                createdAt: serverTimestamp()
            });

            // Create transaction record for receiver (incoming)
            await addDoc(collection(db, "transactions"), {
                userId: recipientId,
                fromUserId: user.uid,
                fromUserName: userData?.fullName || userData?.username || "User",
                fromCardNumber: userData?.morraCardNumber || "",
                amount: amount,
                currency: "RWF",
                type: "receive",
                note: `Received from ${userData?.fullName || userData?.username || "User"}`,
                createdAt: serverTimestamp()
            });

            alert("Money sent successfully!");
            setSendModalOpen(false);
            setRecipientCardNumber("");
            setSendAmount("");
        } catch (error) {
            console.error("Transaction failed: ", error);
            alert("Transaction failed. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden content-shift">
            {user && <FloatingSidebar forceCollapsed />}
            <Navbar />

            <main className="container mx-auto px-6 pt-24 pb-20 max-w-7xl font-sans selection:bg-[#FBBF24] selection:text-black">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-8"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-normal text-zinc-100 mb-2">Vault</h1>
                            <p className="text-zinc-400 text-sm">Manage your funds and transactions</p>
                        </div>
                    </div>

                    {/* Main Layout: Card Left, Vault Right */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left: Morra Card Section */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-normal text-zinc-100 mb-1">Morra Card</h3>
                                    <p className="text-zinc-400 text-sm">Your premium payment card</p>
                                </div>
                                <CreditCard size={24} className="text-[#FBBF24] opacity-50" />
                            </div>

                            {userData?.morraCardNumber ? (
                                <div className="space-y-4">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                        className="relative"
                                    >
                                {/* Premium Credit Card */}
                                <div className={`relative overflow-hidden rounded-[2.5rem] p-8 min-h-[280px] flex flex-col justify-between ${
                                    isCardExpired() 
                                        ? "bg-gradient-to-br from-zinc-800 to-zinc-900 border border-red-500/30" 
                                        : "bg-gradient-to-br from-[#FBBF24]/20 via-[#FBBF24]/10 to-transparent border border-[#FBBF24]/30"
                                } shadow-2xl`}>
                                    {/* Animated Background Pattern */}
                                    <div className="absolute inset-0 opacity-10">
                                        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FBBF24] rounded-full blur-3xl"></div>
                                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#FBBF24] rounded-full blur-3xl"></div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="relative z-10">
                                        {/* Top Row - Logo and Expiration */}
                                        <div className="flex items-center justify-between mb-12">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10">
                                                    <NoireLogo size={40} showText={false} />
                                                </div>
                                                <span className="text-xl font-bold tracking-wider text-[#FBBF24]">MORRA</span>
                                            </div>
                                            {!isCardExpired() && (
                                                <div className="text-right">
                                                    <p className="text-zinc-400 text-xs mb-1">Expires in</p>
                                                    <p className="text-white font-semibold text-sm">{formatExpirationDate()}</p>
                                                </div>
                                            )}
                                            {isCardExpired() && (
                                                <div className="text-right">
                                                    <p className="text-red-400 font-semibold text-sm">Expired</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Number */}
                                        <div className="mb-8">
                                            <p className="text-zinc-400 text-xs mb-3 tracking-wider">CARD NUMBER</p>
                                            <p className="text-white font-mono text-2xl tracking-wider select-all">
                                                {formatCardNumber(userData.morraCardNumber)}
                                            </p>
                                        </div>

                                        {/* Bottom Row - Balance and Cardholder */}
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-zinc-400 text-xs mb-1 tracking-wider">BALANCE</p>
                                                <p className="text-white text-3xl font-light">
                                                    {balanceHidden ? "••••" : formatRwf(userData?.balance)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-zinc-400 text-xs mb-1 tracking-wider">CARDHOLDER</p>
                                                <p className="text-white text-sm font-medium">
                                                    {userData?.username || userData?.fullName || "MORRA USER"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shine Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none"></div>
                                </div>

                                {/* Expired Card Notice */}
                                {isCardExpired() && (
                                    <div className="mt-4 glass-noire border border-red-500/30 rounded-xl p-4 text-center">
                                        <p className="text-red-400 text-sm">Your Morra card has expired. Register a new card to continue using it.</p>
                                    </div>
                                )}
                                    </motion.div>



                            {/* Deposit / Withdraw */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    onClick={() => navigate("/deposit")}
                                    className="glass-noire border border-white/10 rounded-2xl px-5 py-4 hover:border-[#FBBF24]/50 transition-all flex items-center justify-center gap-2"
                                >
                                    <ArrowDownCircle size={18} className="text-[#FBBF24]" />
                                    <span className="font-semibold">Deposit</span>
                                </button>
                                <button
                                    onClick={() => navigate("/withdraw")}
                                    className="glass-noire border border-white/10 rounded-2xl px-5 py-4 hover:border-[#FBBF24]/50 transition-all flex items-center justify-center gap-2"
                                >
                                    <ArrowUpCircle size={18} className="text-[#FBBF24]" />
                                    <span className="font-semibold">Withdraw</span>
                                </button>
                            </div>
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="glass-noire rounded-[2rem] border border-white/5 p-8 shadow-2xl"
                                >
                                    <div className="text-center space-y-6">
                                    <div className="flex justify-center">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FBBF24]/20 to-[#FBBF24]/5 flex items-center justify-center border border-[#FBBF24]/30">
                                            <CreditCard size={48} className="text-[#FBBF24]" />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-normal text-zinc-100 mb-2">Get Your Morra Card</h4>
                                        <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
                                            Register your 10-digit card number to start sending and receiving money instantly. 
                                            Your card will be valid for 48 hours.
                                        </p>
                                    </div>
                                    <div className="flex gap-3 max-w-md mx-auto">
                                        <input
                                            type="text"
                                            value={morraCardNumber}
                                            onChange={(e) => setMorraCardNumber(e.target.value.replace(/\D/g, ''))}
                                            placeholder="1234567890"
                                            maxLength={10}
                                            className="flex-1 glass-noire border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#FBBF24]/50 transition-colors text-center font-mono text-lg tracking-wider"
                                        />
                                        <button
                                            onClick={handleRegisterMorraCard}
                                            disabled={morraCardNumber.length !== 10}
                                            className="px-8 py-3 bg-gradient-to-r from-[#FBBF24]/20 to-[#FBBF24]/10 border border-[#FBBF24]/30 rounded-xl hover:bg-[#FBBF24]/20 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Register Card
                                        </button>
                                    </div>
                                    <p className="text-zinc-500 text-xs">Enter a 10-digit number</p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Influence Cards Section */}
                            <div className="mt-12">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-normal text-zinc-100 mb-1">Influence Cards</h3>
                                        <p className="text-zinc-400 text-sm">Your points and rewards</p>
                                    </div>
                                    <Activity size={24} className="text-purple-400 opacity-50" />
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                    className="relative"
                                >
                                    <div className="relative overflow-hidden rounded-[2.5rem] p-8 min-h-[220px] flex flex-col justify-between bg-gradient-to-br from-zinc-900 to-black border border-white/10 shadow-xl group">
                                        {/* Background Elements */}
                                        <div className="absolute inset-0 opacity-20">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>
                                        </div>

                                        <div className="relative z-10 flex flex-col justify-between h-full">
                                            {/* Top Row */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                                        <NoireLogo size={16} showText={false} />
                                                    </div>
                                                    <span className="font-mono text-sm tracking-widest text-zinc-400">INFLUENCE</span>
                                                </div>
                                                <Activity size={24} className="text-purple-400 opacity-50" />
                                            </div>

                                            {/* Balance */}
                                            <div className="mb-4">
                                                <p className="text-zinc-500 text-xs mb-1 tracking-wider">POINTS BALANCE</p>
                                                <p className="text-white text-3xl font-light">
                                                    {userData?.earnings ? userData.earnings.toFixed(2) : "0.00"} <span className="text-lg text-zinc-500">PTS</span>
                                                </p>
                                            </div>

                                            {/* Bottom Row */}
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <p className="text-zinc-500 text-xs">Earn points by engaging</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-purple-400/80 text-xs font-medium tracking-wider">REWARDS WALLET</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Shine Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none"></div>
                                    </div>
                                </motion.div>

                                {/* Converter Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.4 }}
                                    className="relative mt-6"
                                >
                                    <div className="relative overflow-hidden rounded-[2.5rem] p-8 bg-zinc-900/50 border border-white/5 shadow-xl group">
                                         <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h4 className="text-lg font-normal text-zinc-100">Point Converter</h4>
                                                <p className="text-zinc-500 text-xs">50 Points = 500 FRW</p>
                                                <p className="text-[#FBBF24] text-xs mt-1 font-mono">Available: {userData?.earnings ? userData.earnings.toFixed(2) : "0.00"} Points</p>
                                            </div>
                                            <div className="p-2 bg-white/5 rounded-xl">
                                                <ArrowDownLeft size={20} className="text-[#FBBF24]" />
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <div className="flex-1 relative">
                                                <input
                                                    type="number"
                                                    value={convertPoints}
                                                    onChange={(e) => setConvertPoints(e.target.value)}
                                                    placeholder="Enter points"
                                                    className="w-full glass-noire border border-white/10 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:border-[#FBBF24]/50 transition-colors text-sm"
                                                />
                                                <div className="absolute left-3 top-3.5 text-zinc-500">
                                                    <Activity size={14} />
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleConvertPoints}
                                                className="px-6 py-3 bg-[#FBBF24]/10 border border-[#FBBF24]/30 rounded-xl hover:bg-[#FBBF24]/20 transition-colors font-medium text-sm text-[#FBBF24]"
                                            >
                                                Convert
                                            </button>
                                        </div>
                                         <p className="text-zinc-600 text-[10px] mt-3 ml-1">
                                            {convertPoints ? `${parseFloat(convertPoints) * 10} FRW` : "0 FRW"}
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        {/* Right: Vault Controls */}
                        <div className="space-y-6">
                            <div className="glass-noire rounded-[2rem] border border-white/5 p-8 shadow-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-zinc-400 text-sm mb-2">Total Balance</p>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-4xl font-light text-white">
                                                {balanceHidden ? "•••••" : formatRwf(userData?.balance)}
                                            </h2>
                                            <button
                                                onClick={() => setBalanceHidden(!balanceHidden)}
                                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                            >
                                                <Lock size={18} className={balanceHidden ? "text-zinc-600" : "text-zinc-400"} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <WalletIcon size={48} className="text-[#FBBF24] opacity-20" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                    <button
                                        onClick={() => setSendModalOpen(true)}
                                        className="glass-noire border border-white/10 rounded-2xl px-6 py-4 hover:border-[#FBBF24]/50 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <Send size={20} className="text-[#FBBF24] group-hover:scale-110 transition-transform" />
                                        <span className="font-semibold">Send</span>
                                    </button>
                                    <button
                                        onClick={() => setReceiveModalOpen(true)}
                                        className="glass-noire border border-white/10 rounded-2xl px-6 py-4 hover:border-[#FBBF24]/50 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <ArrowDownLeft size={20} className="text-[#FBBF24] group-hover:scale-110 transition-transform" />
                                        <span className="font-semibold">Receive</span>
                                    </button>
                                </div>

                                <div className="mt-6 flex items-center justify-between text-xs text-zinc-500">
                                    <span>Instant transfers • Firestore-backed</span>
                                    <span className="text-zinc-400">{userData?.morraCardNumber ? "Card linked" : "No card linked"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="glass-noire rounded-[2rem] border border-white/5 p-8 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-normal text-zinc-100 mb-1">Recent Activity</h3>
                                <p className="text-zinc-400 text-sm">Your transaction history</p>
                            </div>
                            <Activity size={24} className="text-[#FBBF24] opacity-50" />
                        </div>

                        {transactions.length > 0 ? (
                            <div className="space-y-4">
                                {transactions.map((tx) => {
                                    const isIncome = tx.type === "deposit" || tx.type === "receive" || tx.type === "income";
                                    const isSend = tx.type === "send";
                                    return (
                                        <div
                                            key={tx.id}
                                            className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                    isIncome ? "bg-green-500/10" : "bg-red-500/10"
                                                }`}>
                                                    {isIncome ? <ArrowDownLeft size={18} className="text-green-400" /> : <ArrowUpRight size={18} className="text-red-400" />}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">
                                                        {tx.type === "deposit" ? "Deposit" : 
                                                         tx.type === "receive" ? `From ${tx.fromUserName || tx.fromCardNumber || "User"}` :
                                                         tx.type === "send" ? `To ${tx.toUserName || tx.toCardNumber || "User"}` :
                                                         (tx.note || "Transaction")}
                                                    </p>
                                                    <p className="text-zinc-400 text-sm">
                                                        {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleString() : ""}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className={`font-semibold ${isIncome ? "text-green-400" : "text-red-400"}`}>
                                                {isIncome ? "+" : "-"}{formatRwf(tx.amount)}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <TrendingUp size={48} className="text-zinc-600 mx-auto mb-4" />
                                <p className="text-zinc-400">No transactions yet</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Send Money Modal */}
                {sendModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-noire rounded-[2rem] border border-white/10 p-8 max-w-md w-full mx-4"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-normal">Send Money</h3>
                                <button
                                    onClick={() => setSendModalOpen(false)}
                                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-zinc-400 text-sm mb-2 block">Recipient Card Number</label>
                                    <input
                                        type="text"
                                        value={recipientCardNumber}
                                        onChange={(e) => setRecipientCardNumber(e.target.value)}
                                        placeholder="Enter 10-digit card number"
                                        maxLength={10}
                                        className="w-full glass-noire border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#FBBF24]/50 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-zinc-400 text-sm mb-2 block">Amount</label>
                                    <input
                                        type="number"
                                        value={sendAmount}
                                        onChange={(e) => setSendAmount(e.target.value)}
                                        placeholder="0.00"
                                        step="0.01"
                                        className="w-full glass-noire border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#FBBF24]/50 transition-colors"
                                    />
                                </div>
                                <button
                                    onClick={handleSendMoney}
                                    className="w-full bg-[#FBBF24]/10 border border-[#FBBF24]/30 rounded-xl px-6 py-4 hover:bg-[#FBBF24]/20 transition-colors font-medium"
                                >
                                    Send Money
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Receive Money Modal */}
                {receiveModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-noire rounded-[2rem] border border-white/10 p-8 max-w-md w-full mx-4"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-normal">Receive Money</h3>
                                <button
                                    onClick={() => setReceiveModalOpen(false)}
                                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {userData?.morraCardNumber ? (
                                    <div className="text-center space-y-6">
                                        {/* Mini Card Preview */}
                                        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-[#FBBF24]/20 via-[#FBBF24]/10 to-transparent border border-[#FBBF24]/30">
                                            <div className="absolute inset-0 opacity-10">
                                                <div className="absolute top-0 right-0 w-40 h-40 bg-[#FBBF24] rounded-full blur-2xl"></div>
                                            </div>
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-center gap-2 mb-6">
                                                    <div className="w-8 h-8">
                                                        <NoireLogo size={32} showText={false} />
                                                    </div>
                                                    <span className="text-sm font-bold tracking-wider text-[#FBBF24]">MORRA</span>
                                                </div>
                                                <div>
                                                    <p className="text-zinc-400 text-xs mb-2 tracking-wider">CARD NUMBER</p>
                                                    <p className="text-white font-mono text-xl tracking-wider select-all">
                                                        {formatCardNumber(userData.morraCardNumber)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <p className="text-zinc-400 text-sm mb-2">Share this card number to receive money</p>
                                            {isCardExpired() && (
                                                <p className="text-red-400 text-xs mb-2">⚠️ Card expired - Register a new card</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(userData.morraCardNumber);
                                                alert("Card number copied to clipboard!");
                                            }}
                                            className="w-full bg-[#FBBF24]/10 border border-[#FBBF24]/30 rounded-xl px-6 py-3 hover:bg-[#FBBF24]/20 transition-colors font-medium text-sm"
                                        >
                                            Copy Card Number
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-zinc-400 mb-4">Register a Morra card number first</p>
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                value={morraCardNumber}
                                                onChange={(e) => setMorraCardNumber(e.target.value.replace(/\D/g, ''))}
                                                placeholder="1234567890"
                                                maxLength={10}
                                                className="flex-1 glass-noire border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#FBBF24]/50 transition-colors text-center font-mono"
                                            />
                                            <button
                                                onClick={handleRegisterMorraCard}
                                                disabled={morraCardNumber.length !== 10}
                                                className="px-6 py-3 bg-[#FBBF24]/10 border border-[#FBBF24]/30 rounded-xl hover:bg-[#FBBF24]/20 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Register
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </main>
            <MobileBottomNav />
        </div>
    );
};

export default Wallet;
