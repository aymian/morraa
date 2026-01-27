import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, runTransaction, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/noire/Navbar";
import FloatingSidebar from "@/components/noire/FloatingSidebar";
import { auth, db } from "@/lib/firebase";

const Withdraw = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/login");
        return;
      }
      setUser(u);
      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        setUserData(snap.exists() ? snap.data() : null);
      } catch (e: any) {
        console.error("Withdraw page load error:", e);
        setError("Failed to load your wallet. Please try again.");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [navigate]);

  const parsedAmount = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) ? n : NaN;
  }, [amount]);

  const fee = useMemo(() => {
    if (!parsedAmount || isNaN(parsedAmount)) return 0;
    return parsedAmount * 0.20;
  }, [parsedAmount]);

  const netAmount = useMemo(() => {
    if (!parsedAmount || isNaN(parsedAmount)) return 0;
    return parsedAmount - fee;
  }, [parsedAmount, fee]);

  const canSubmit = !loading && !submitting && user && parsedAmount > 0 && phoneNumber.trim().length >= 10;

  const handleWithdraw = async () => {
    if (!user) return;
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (phoneNumber.trim().length < 10) {
      setError("Enter a valid phone number.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // Check balance first
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error("User not found.");
      const currentBalance = Number(userSnap.data().balance || 0);

      if (currentBalance < parsedAmount) {
        throw new Error("Insufficient balance.");
      }

      // Instead of updating balance, we create a withdrawal request
      await addDoc(collection(db, "withdrawRequests"), {
        userId: user.uid,
        userName: userData?.fullName || userData?.username || "Unknown User",
        userEmail: user.email,
        amount: parsedAmount,
        fee: fee,
        netAmount: netAmount,
        phoneNumber: phoneNumber,
        status: "pending",
        createdAt: serverTimestamp()
      });

      alert("Withdrawal request submitted! Waiting for manager approval.");
      navigate("/wallet");
    } catch (e: any) {
      console.error("Withdraw failed:", e);
      setError(e?.message === "Insufficient balance." ? e.message : "Withdraw failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden content-shift">
      {user && <FloatingSidebar />}
      <Navbar />

      <main className="container mx-auto px-6 pt-24 pb-20 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/wallet")}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
              Back
            </button>
          </div>

          <div className="glass-noire rounded-[2rem] border border-white/5 p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#FBBF24]/10 border border-[#FBBF24]/20 flex items-center justify-center">
                <ArrowUpCircle size={22} className="text-[#FBBF24]" />
              </div>
              <div>
                <h1 className="text-2xl font-normal text-zinc-100">Withdraw</h1>
                <p className="text-sm text-zinc-400">Move funds out of your Morra balance</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <p className="text-zinc-400 text-sm">Available Balance</p>
              <p className="text-white font-semibold">
                {userData?.balance ? `RWF ${userData.balance.toLocaleString()}` : "RWF 0"}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-zinc-400 text-sm">Amount to Withdraw (RWF)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full glass-noire border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#FBBF24]/50 transition-colors text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-zinc-400 text-sm">Phone Number to Receive Money</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 078XXXXXXX"
                  className="w-full glass-noire border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#FBBF24]/50 transition-colors text-lg"
                />
              </div>

              {parsedAmount > 0 && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Withdrawal Amount:</span>
                    <span>RWF {parsedAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Processing Fee (20%):</span>
                    <span className="text-red-400">- RWF {fee.toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-white/10 my-1" />
                  <div className="flex justify-between font-semibold">
                    <span className="text-zinc-400">You will receive:</span>
                    <span className="text-[#FBBF24]">RWF {netAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>

            <button
              onClick={handleWithdraw}
              disabled={!canSubmit}
              className="mt-6 w-full bg-gradient-to-r from-[#FBBF24]/20 to-[#FBBF24]/10 border border-[#FBBF24]/30 rounded-2xl px-6 py-4 hover:bg-[#FBBF24]/20 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing…
                </>
              ) : (
                "Submit Request"
              )}
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Withdraw;

