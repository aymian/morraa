import { motion } from "framer-motion";
import { useState } from "react";
import {
    CreditCard, Send, ArrowDownLeft, ArrowUpRight,
    Wallet as WalletIcon, TrendingUp, MoreHorizontal,
    DollarSign, Activity, Lock, Smartphone
} from "lucide-react";
import Navbar from "@/components/noire/Navbar";
import FloatingSidebar from "@/components/noire/FloatingSidebar";
import NoireLogo from "@/components/noire/NoireLogo";

const Wallet = () => {
    const [balanceHidden, setBalanceHidden] = useState(false);

    const transactions = [
        { id: 1, name: "Apple Music", date: "Today, 10:42 AM", amount: "-$12.99", type: "expense", icon: <MusicIcon /> },
        { id: 2, name: "Freelance Payment", date: "Yesterday, 4:20 PM", amount: "+$2,450.00", type: "income", icon: <DollarSign size={18} /> },
        { id: 3, name: "Uber Ride", date: "Jan 18, 9:15 PM", amount: "-$24.50", type: "expense", icon: <CarIcon /> },
        { id: 4, name: "Coffee Shop", date: "Jan 18, 8:30 AM", amount: "-$6.40", type: "expense", icon: <CoffeeIcon /> },
    ];

    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden content-shift font-sans selection:bg-[#FBBF24] selection:text-black">
            <FloatingSidebar />
            <Navbar />

            <div className="container mx-auto px-6 pt-24 pb-20 max-w-6xl">

                {/* Header Phase */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 flex items-center justify-between"
                >
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                            My <span className="text-[#FBBF24]">Vault</span>
                        </h1>
                        <p className="text-zinc-500 font-medium">Manage your digital influence and assets.</p>
                    </div>
                </motion.div>

                <div className="grid lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN - CARDS & ACTIONS */}
                    <div className="lg:col-span-7 space-y-8">

                        {/* MAIN CARD - PREMIUM MORRAA BLACK CARD */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="relative w-full aspect-[1.586/1] rounded-3xl overflow-hidden shadow-2xl group cursor-pointer"
                        >
                            {/* Card Background - Dynamic Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] via-[#0D0D0D] to-black z-0" />
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay z-0" />

                            {/* Gold Sheen Effect */}
                            <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-[#FBBF24]/20 to-transparent rotate-45 translate-x-[-100%] animate-[shimmer_5s_infinite] pointer-events-none z-10" />

                            <div className="absolute inset-0 p-8 flex flex-col justify-between z-20">
                                <div className="flex justify-between items-start">
                                    <NoireLogo size={32} showText={true} />
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-6 rounded bg-[#FBBF24]/20 border border-[#FBBF24]/50 flex items-center justify-center">
                                            <div className="w-[80%] h-[1px] bg-[#FBBF24]" />
                                        </div>
                                        <Activity className="text-[#FBBF24] animate-pulse" size={20} />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-9 bg-[#FBBF24]/20 rounded-md border border-[#FBBF24]/30 flex items-center justify-center">
                                            <div className="w-8 h-5 border border-[#FBBF24]/40 rounded-sm grid grid-cols-2 gap-[1px]">
                                                <div className="bg-[#FBBF24]/30" />
                                                <div className="bg-[#FBBF24]/10" />
                                            </div>
                                        </div>
                                        <Activity size={24} className="text-zinc-600 rotate-90" />
                                    </div>
                                    <p className="text-[#FBBF24] font-mono text-xl tracking-[0.2em] drop-shadow-md">
                                        {balanceHidden ? "•••• •••• •••• 4209" : "4920 1948 2910 4209"}
                                    </p>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Card Holder</p>
                                        <p className="text-white font-bold tracking-wide">YVES M.</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Expires</p>
                                        <p className="text-white font-bold tracking-wide">09/28</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* QUICK ACTIONS */}
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { label: "Send", icon: <Send size={24} className="-ml-1" />, color: "bg-[#FBBF24]", text: "text-black" },
                                { label: "Receive", icon: <ArrowDownLeft size={24} />, color: "bg-white/5", text: "text-white" },
                                { label: "Swap", icon: <TrendingUp size={24} />, color: "bg-white/5", text: "text-white" },
                                { label: "More", icon: <MoreHorizontal size={24} />, color: "bg-white/5", text: "text-white" },
                            ].map((action, i) => (
                                <motion.button
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + (i * 0.1) }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl ${action.color} ${action.text} font-bold shadow-lg transition-colors group`}
                                >
                                    <div className={`p-3 rounded-xl ${action.label === 'Send' ? 'bg-black/10' : 'bg-white/10 group-hover:bg-[#FBBF24] group-hover:text-black transition-colors'}`}>
                                        {action.icon}
                                    </div>
                                    <span className="text-sm">{action.label}</span>
                                </motion.button>
                            ))}
                        </div>

                    </div>

                    {/* RIGHT COLUMN - BALANCE & HISTORY */}
                    <div className="lg:col-span-5 space-y-6">

                        {/* TOTAL BALANCE DISPLAY */}
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-[#111] border border-white/5 rounded-3xl p-8 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-20 text-[#FBBF24]">
                                <WalletIcon size={80} strokeWidth={1} />
                            </div>

                            <div className="relative z-10">
                                <p className="text-zinc-400 font-bold text-sm uppercase tracking-widest mb-2">Total Balance</p>
                                <div className="flex items-baseline gap-2 mb-6">
                                    <h2 className="text-5xl font-black text-white tracking-tight">
                                        $24,582<span className="text-2xl text-zinc-500">.50</span>
                                    </h2>
                                    <button onClick={() => setBalanceHidden(!balanceHidden)} className="text-zinc-600 hover:text-white transition-colors">
                                        <Lock size={16} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl w-fit">
                                    <TrendingUp size={16} className="text-green-500" />
                                    <span className="text-green-500 font-bold text-sm">+2.4% this week</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* RECENT TRANSACTIONS */}
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-[#111] border border-white/5 rounded-3xl p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold">Recent Activity</h3>
                                <button className="text-sm text-[#FBBF24] font-bold hover:underline">View All</button>
                            </div>

                            <div className="space-y-4">
                                {transactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-3 rounded-xl transition-colors -mx-3">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#FBBF24] group-hover:bg-[#FBBF24] group-hover:text-black transition-colors">
                                                {tx.icon}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm">{tx.name}</p>
                                                <p className="text-xs text-zinc-500 font-medium">{tx.date}</p>
                                            </div>
                                        </div>
                                        <span className={`font-bold font-mono text-sm ${tx.type === 'income' ? 'text-green-500' : 'text-white'}`}>
                                            {tx.amount}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* UPGRADE PROMO */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-gradient-to-r from-[#FBBF24] to-yellow-600 rounded-3xl p-6 relative overflow-hidden group cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-black font-black text-xl mb-1">Go Premium</h3>
                                    <p className="text-black/70 text-sm font-bold max-w-[150px]">Get exclusive black card & lower fees.</p>
                                </div>
                                <div className="w-12 h-12 bg-black/20 rounded-full flex items-center justify-center">
                                    <ArrowUpRight className="text-black" />
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </div>
        </div>
    );
};

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

export default Wallet;