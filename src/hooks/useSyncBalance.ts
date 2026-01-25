import { useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const useSyncBalance = (userId: string | undefined, currentBalance: number | undefined, currentEarnings: number | undefined, spentPoints: number | undefined, referralPoints: number | undefined) => {
    useEffect(() => {
        if (!userId) return;

        const syncBalance = async () => {
            try {
                // Fetch all posts by the user
                const postsQuery = query(
                    collection(db, "posts"),
                    where("userId", "==", userId)
                );
                const postsSnap = await getDocs(postsQuery);
                
                let totalLikes = 0;
                postsSnap.forEach((doc) => {
                    const data = doc.data();
                    totalLikes += (data.likes || 0);
                });

                // Calculate points: 2 likes = 0.5 points => 1 like = 0.25 points
                // Add referral points to total earned
                const totalEarnedPoints = (totalLikes * 0.25) + (referralPoints || 0);
                const totalSpentPoints = spentPoints || 0;
                
                // Available earnings should be total earned minus total spent
                const calculatedEarnings = totalEarnedPoints - totalSpentPoints;

                // 1. Sync Earnings (Points)
                if (currentEarnings !== calculatedEarnings) {
                    await updateDoc(doc(db, "users", userId), {
                        earnings: calculatedEarnings
                    });
                    console.log(`Earnings synced to ${calculatedEarnings} (Total: ${totalEarnedPoints} - Spent: ${totalSpentPoints})`);
                }

                // 2. Fix Incorrect Balance (Cleanup)
                // If the user's main wallet balance is exactly equal to the calculated earnings (artifact of previous bug),
                // and it's not 0, reset it to 0 to separate the wallets.
                // Note: We use totalEarnedPoints here as the bug likely synced the raw points before spending logic existed
                // But to be safe, we check against both.
                if ((currentBalance === calculatedEarnings || currentBalance === totalEarnedPoints) && currentBalance > 0) {
                     console.log("Detected incorrectly merged balance. Resetting main wallet to 0.");
                     await updateDoc(doc(db, "users", userId), {
                         balance: 0
                     });
                }
            } catch (error) {
                console.error("Error syncing balance:", error);
            }
        };

        syncBalance();
    }, [userId, currentBalance, currentEarnings, spentPoints, referralPoints]);
};
