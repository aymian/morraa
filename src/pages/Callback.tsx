import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

const Callback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const provider = searchParams.get("spotify") !== null ? "spotify" : null; // Check if it's Spotify callback

    // The user's URL was https://morraa.vercel.app/callback?spotify so 'spotify' param might be present but empty
    // But Spotify auth redirects to REDIRECT_URI?code=...
    // If the redirect URI is .../callback?spotify, then spotify param is preserved?
    // Actually, usually redirect URI must match exactly. 
    // If I registered https://morraa.vercel.app/callback?spotify, then I get ?spotify&code=...
    
    if (error) {
      console.error("Auth Error:", error);
      setStatus("Authentication failed.");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    if (code) {
      handleSpotifyAuth(code);
    } else {
      setStatus("No code found.");
      setTimeout(() => navigate("/login"), 2000);
    }
  }, [searchParams]);

  const handleSpotifyAuth = async (code: string) => {
    setStatus("Connecting to Spotify...");
    
    // CLIENT SECRETS ON FRONTEND IS NOT SECURE - DOING THIS PER USER REQUEST
    const clientId = "4597632630b54b4b9b8658064f1ef7ad";
    const clientSecret = "643ac9c2dce64a0ca2fe23a19229bdf0";
    const redirectUri = "https://morraa.vercel.app/callback?spotify";

    try {
      // 1. Exchange code for token
      const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": "Basic " + btoa(clientId + ":" + clientSecret)
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: redirectUri
        })
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        throw new Error(tokenData.error_description || "Token exchange failed");
      }

      const { access_token, refresh_token, expires_in } = tokenData;

      // 2. Get User Profile
      setStatus("Fetching Profile...");
      const userResponse = await fetch("https://api.spotify.com/v1/me", {
        headers: {
          "Authorization": `Bearer ${access_token}`
        }
      });

      const userData = await userResponse.json();

      if (userData.error) {
        throw new Error(userData.error.message || "Failed to fetch profile");
      }

      // 3. Handle Firebase User
      // Since we don't have custom auth, we use anonymous auth and link/update
      setStatus("Finalizing Login...");
      
      let currentUser = auth.currentUser;
      if (!currentUser) {
        const { user } = await signInAnonymously(auth);
        currentUser = user;
      }

      // 4. Save/Update User in Firestore
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      const isExisting = userSnap.exists() && userSnap.data().onboardingComplete;

      await setDoc(userRef, {
        uid: currentUser.uid,
        email: userData.email, // Note: might conflict if email exists on another account
        fullName: userData.display_name,
        photo: userData.images?.[0]?.url || "",
        spotifyId: userData.id,
        spotifyAccessToken: access_token,
        spotifyRefreshToken: refresh_token,
        spotifyTokenExpiresAt: Date.now() + (expires_in * 1000),
        onboardingComplete: userSnap.data()?.onboardingComplete ?? false,
        createdAt: userSnap.exists() ? userSnap.data()?.createdAt : serverTimestamp(),
        lastLogin: serverTimestamp()
      }, { merge: true });

      // 5. Redirect based on onboarding
      const updatedSnap = await getDoc(userRef);
      const isComplete = updatedSnap.data()?.onboardingComplete;

      navigate(isComplete ? "/" : "/onboarding");

    } catch (err: any) {
      console.error("Spotify Auth Error:", err);
      setStatus("Error: " + err.message);
      setTimeout(() => navigate("/login"), 3000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-[#1DB954]" />
      <p className="text-lg font-medium">{status}</p>
    </div>
  );
};

export default Callback;
