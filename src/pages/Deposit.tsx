import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowDownCircle, Loader2, Upload } from "lucide-react";
import Navbar from "@/components/noire/Navbar";
import FloatingSidebar from "@/components/noire/FloatingSidebar";
import { auth, db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";

const Deposit = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [amountRwf, setAmountRwf] = useState("");
  const [phoneName, setPhoneName] = useState("");
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
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
        console.error("Deposit page load error:", e);
        setError("Failed to load your wallet. Please try again.");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [navigate]);

  const parsedAmount = useMemo(() => {
    const n = Number(amountRwf);
    return Number.isFinite(n) ? n : NaN;
  }, [amountRwf]);

  const canSubmit =
    !loading &&
    !submitting &&
    user &&
    parsedAmount > 0 &&
    phoneName.trim().length > 1 &&
    Boolean(screenshotFile);

  const handleDeposit = async () => {
    if (!user) return;
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount in RWF.");
      return;
    }
    if (!phoneName.trim()) {
      setError("Enter the name on your phone account.");
      return;
    }
    if (!screenshotFile) {
      setError("Upload the payment screenshot.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const screenshotUrl = await uploadToCloudinary(screenshotFile, "morraa_deposits", (p) => setUploadProgress(p));

      await addDoc(collection(db, "depositRequests"), {
        userId: user.uid,
        userEmail: user.email,
        userName: userData?.username || userData?.fullName || user.email,
        amountRwf: parsedAmount,
        phoneName: phoneName.trim(),
        screenshot: screenshotUrl,
        status: "pending",
        createdAt: serverTimestamp(),
        instructions: {
          mtn: "*182*1*1*+250792898287*AMOUNT#",
          airtel: "*500*1*1*+250732539470*AMOUNT#"
        }
      });
      navigate("/wallet");
    } catch (e: any) {
      console.error("Deposit failed:", e);
      setError("Deposit failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleScreenshot = (file: File | null) => {
    if (!file) {
      setScreenshotPreview(null);
      setScreenshotFile(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
    setScreenshotFile(file);
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
                <ArrowDownCircle size={22} className="text-[#FBBF24]" />
              </div>
              <div>
                <h1 className="text-2xl font-normal text-zinc-100">Deposit</h1>
                <p className="text-sm text-zinc-400">Add funds to your Morra balance</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-zinc-400 text-sm">Current Balance</p>
                <p className="text-white font-semibold">
                  ${userData?.balance?.toFixed?.(2) ?? "0.00"}
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-zinc-400 text-sm">Amount (RWF)</label>
                <input
                  type="number"
                  value={amountRwf}
                  onChange={(e) => setAmountRwf(e.target.value)}
                  placeholder="0"
                  step="100"
                  className="w-full glass-noire border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#FBBF24]/50 transition-colors text-lg"
                />
              </div>

              <div className="space-y-3">
                <label className="text-zinc-400 text-sm">Name on phone (for MoMo/Airtel)</label>
                <input
                  type="text"
                  value={phoneName}
                  onChange={(e) => setPhoneName(e.target.value)}
                  placeholder="e.g. Yves Uwimana"
                  className="w-full glass-noire border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#FBBF24]/50 transition-colors text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-zinc-400 text-sm">Payment screenshot</label>
                <label className="w-full flex items-center gap-3 glass-noire border border-dashed border-white/15 rounded-2xl px-5 py-4 hover:border-[#FBBF24]/40 transition-colors cursor-pointer">
                  <Upload size={18} className="text-[#FBBF24]" />
                  <span className="text-sm text-zinc-300">Upload proof of payment</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleScreenshot(e.target.files?.[0] || null)}
                  />
                </label>
                {screenshotPreview && (
                  <div className="mt-2">
                    <p className="text-xs text-zinc-500 mb-1">Preview</p>
                    <img src={screenshotPreview} alt="Payment screenshot" className="w-full rounded-xl border border-white/10" />
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <p className="text-[11px] text-zinc-400 mt-2">Uploading… {uploadProgress}%</p>
                    )}
                  </div>
                )}
              </div>

              <div className="glass-noire border border-white/10 rounded-2xl p-4 text-sm text-zinc-300 space-y-2">
                <p className="font-semibold text-[#FBBF24]">How to pay</p>
                <p>MTN: dial *182*1*1*+250792898287*AMOUNT# then enter your MoMo PIN.</p>
                <p>Airtel: dial *500*1*1*+250732539470*AMOUNT# then enter your Airtel Money PIN.</p>
                <p>Upload the screenshot, then submit. We’ll approve in the manager.</p>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>

            <button
              onClick={handleDeposit}
              disabled={!canSubmit}
              className="mt-6 w-full bg-gradient-to-r from-[#FBBF24]/20 to-[#FBBF24]/10 border border-[#FBBF24]/30 rounded-2xl px-6 py-4 hover:bg-[#FBBF24]/20 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing…
                </>
              ) : (
                "Confirm Deposit"
              )}
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Deposit;

