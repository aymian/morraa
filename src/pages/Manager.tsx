import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { collection, doc, getDocs, query, updateDoc, where, runTransaction, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ShieldX, Loader2, LogOut, ArrowLeft, FileText } from "lucide-react";
import Navbar from "@/components/noire/Navbar";
import FloatingSidebar from "@/components/noire/FloatingSidebar";
import { auth, db } from "@/lib/firebase";

type DepositRequest = {
  id: string;
  userName?: string;
  userEmail?: string;
  amountRwf: number;
  phoneName: string;
  screenshot?: string;
  createdAt?: any;
};

const MANAGER_USER = "yves";
const MANAGER_PASS = "yves";

const Manager = () => {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(() => localStorage.getItem("manager-auth") === "true");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<DepositRequest[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fbReady, setFbReady] = useState(false);

  // Ensure an authenticated session (anonymous) to satisfy Firestore rules
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setFbReady(!!u));
    signInAnonymously(auth).catch((e) => {
      console.error("Anonymous sign-in failed:", e);
      setError("Auth error. Refresh and try again.");
    });
    return () => unsub();
  }, []);

  const loadPending = async () => {
    if (!fbReady) return;
    setFetching(true);
    try {
      // Avoid composite-index requirement (status + createdAt). We'll sort client-side instead.
      const q = query(collection(db, "depositRequests"), where("status", "==", "pending"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DepositRequest));
      const sorted = list.sort((a: any, b: any) => {
        const aMs = a?.createdAt?.toMillis?.() ?? a?.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
        const bMs = b?.createdAt?.toMillis?.() ?? b?.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
        return bMs - aMs;
      });
      setItems(sorted);
    } catch (e: any) {
      console.error("Manager fetch error:", e);
      setError(`Failed to load pending deposits. ${e?.code ? `[${e.code}] ` : ""}${e?.message || ""}`.trim());
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (authed) {
      loadPending();
      localStorage.setItem("manager-auth", "true"); // persist in browser
    }
  }, [authed, fbReady]);

  const handleLogin = () => {
    if (username === MANAGER_USER && password === MANAGER_PASS) {
      setAuthed(true);
      setError(null);
    } else {
      setError("Invalid credentials.");
    }
  };

  const handleUpdateStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      let requestData: any = null;

      await runTransaction(db, async (tx) => {
        // 1. All Reads First
        const reqRef = doc(db, "depositRequests", id);
        const snap = await tx.get(reqRef);
        
        if (!snap.exists()) throw new Error("Request not found.");
        const data = snap.data();
        if (data.status !== "pending") throw new Error("Already processed.");
        requestData = data;

        // If approved, we need to read user data too
        let currentBalance = 0;
        let userRef = null;
        
        if (status === "approved") {
          userRef = doc(db, "users", data.userId);
          const userSnap = await tx.get(userRef);
          currentBalance = userSnap.exists() ? Number((userSnap.data() as any).balance || 0) : 0;
        }

        // 2. All Writes Second
        tx.update(reqRef, { status, processedAt: serverTimestamp() });

        if (status === "approved" && userRef) {
          tx.update(userRef, { balance: currentBalance + Number(data.amountRwf || 0) });
        }
      });

      // Add transaction record (outside of transaction to keep it simple)
      if (status === "approved" && requestData?.userId) {
        await addDoc(collection(db, "transactions"), {
          userId: requestData.userId,
          amount: Number(requestData.amountRwf || 0),
          currency: "RWF",
          type: "deposit",
          source: "manager",
          requestId: id,
          userName: requestData.userName || "",
          createdAt: serverTimestamp()
        });
      }

      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) {
      console.error("Update status error:", e);
      setError(e?.message || "Failed to update status.");
    }
  };

  const formattedDate = (val: any) => {
    if (!val) return "—";
    try {
      const date = val.toDate ? val.toDate() : new Date(val);
      return date.toLocaleString();
    } catch {
      return "—";
    }
  };

  const content = useMemo(() => {
    if (!authed) {
      return (
        <div className="max-w-md mx-auto mt-12 glass-noire border border-white/5 rounded-[1.5rem] p-8 space-y-6">
          <div className="flex items-center gap-3">
            <FileText className="text-[#FBBF24]" />
            <div>
              <h1 className="text-xl font-semibold">Manager Login</h1>
              <p className="text-zinc-400 text-sm">Enter credentials to review deposits.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full glass-noire border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#FBBF24]/50"
                placeholder="yves"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-noire border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#FBBF24]/50"
                placeholder="yves"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-[#FBBF24]/20 to-[#FBBF24]/10 border border-[#FBBF24]/30 rounded-xl px-6 py-3 hover:bg-[#FBBF24]/20 transition-all font-semibold"
            >
              Log in
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Pending Deposits</h1>
            <p className="text-zinc-400 text-sm">Approve or reject user submissions.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadPending}
              className="px-3 py-2 glass-noire border border-white/10 rounded-lg text-sm"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("manager-auth");
                setAuthed(false);
                setUsername("");
                setPassword("");
              }}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {fetching ? (
          <div className="flex items-center gap-2 text-zinc-400">
            <Loader2 className="animate-spin" size={16} />
            Loading pending deposits...
          </div>
        ) : items.length === 0 ? (
          <div className="glass-noire border border-white/5 rounded-2xl p-6 text-center text-zinc-400">
            No pending deposits.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-noire border border-white/10 rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">{item.userName}</p>
                    <p className="text-xs text-zinc-500">{item.userEmail}</p>
                  </div>
                  <span className="text-lg font-semibold text-[#FBBF24]">{item.amountRwf} RWF</span>
                </div>
                <div className="text-sm text-zinc-400">
                  <p>Phone name: <span className="text-white">{item.phoneName}</span></p>
                  <p>Submitted: {formattedDate(item.createdAt)}</p>
                </div>
                {item.screenshot && (
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <img src={item.screenshot} alt="Payment proof" className="w-full" />
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus(item.id, "approved")}
                    className="flex-1 bg-green-500/15 border border-green-500/40 text-green-200 rounded-xl px-4 py-2 flex items-center justify-center gap-2 hover:bg-green-500/25 transition-all"
                  >
                    <ShieldCheck size={16} /> Approve
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(item.id, "rejected")}
                    className="flex-1 bg-red-500/15 border border-red-500/40 text-red-200 rounded-xl px-4 py-2 flex items-center justify-center gap-2 hover:bg-red-500/25 transition-all"
                  >
                    <ShieldX size={16} /> Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    );
  }, [authed, error, fetching, items, password, username]);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden content-shift">
      {/* Sidebar remains collapsed if user toggled previously */}
      <FloatingSidebar />
      <Navbar />

      <main className="container mx-auto px-6 pt-24 pb-20 max-w-6xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        {content}
      </main>
    </div>
  );
};

export default Manager;

