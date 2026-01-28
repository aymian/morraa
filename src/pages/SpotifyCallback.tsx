
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exchangeCodeForToken } from "@/lib/spotify";
import { toast } from "sonner";

const SpotifyCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error) {
            console.error("Spotify Auth Error:", error);
            toast.error("Failed to connect to Spotify");
            navigate("/music");
            return;
        }

        if (code) {
            const handleCallback = async () => {
                try {
                    const data = await exchangeCodeForToken(code);

                    // Store tokens securely (localStorage for now, consider more secure options for production)
                    localStorage.setItem("spotify_access_token", data.access_token);
                    localStorage.setItem("spotify_refresh_token", data.refresh_token);
                    localStorage.setItem("spotify_token_expiry", (Date.now() + data.expires_in * 1000).toString());

                    toast.success("Successfully connected to Spotify!");
                    navigate("/music");
                } catch (err) {
                    console.error("Error exchanging code:", err);
                    toast.error("Failed to authenticate with Spotify");
                    navigate("/music");
                }
            };

            handleCallback();
        }
    }, [searchParams, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                Connecting to Spotify...
            </h1>
            <p className="text-gray-400 mt-2">Please wait while we set things up for you.</p>
        </div>
    );
};

export default SpotifyCallback;
