import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCall } from "@/components/calling/CallProvider";
import { Loader2, ShieldCheck, Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const CallPage = () => {
    const [searchParams] = useSearchParams();
    const callId = searchParams.get("id");
    const type = searchParams.get("type") || "video";
    const navigate = useNavigate();

    const { localStream, remoteStream, endCall, isInCall } = useCall();
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(type === 'audio');
    const [remoteUserData, setRemoteUserData] = useState<any>(null);
    const [callDuration, setCallDuration] = useState(0);

    // Set up video elements
    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Call duration timer
    useEffect(() => {
        if (!isInCall) return;

        const interval = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isInCall]);

    // Fetch remote user data from call document
    useEffect(() => {
        if (!callId) return;

        const fetchCallData = async () => {
            const callSnap = await getDoc(doc(db, 'calls', callId));
            if (callSnap.exists()) {
                const callData = callSnap.data();
                // Get the other user's data
                const otherUserId = callData.callerUid; // or targetUid depending on who we are
                const userSnap = await getDoc(doc(db, 'users', otherUserId));
                if (userSnap.exists()) {
                    setRemoteUserData(userSnap.data());
                }
            }
        };

        fetchCallData();
    }, [callId]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    const handleEndCall = async () => {
        await endCall();
        navigate('/messages');
    };

    // Loading state
    if (!localStream) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                    <Loader2 className="w-12 h-12 text-primary" />
                </motion.div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Synchronizing Pulse...</p>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#050505] relative overflow-hidden flex flex-col">
            {/* Cinematic Header Overlay */}
            <div className="absolute top-0 left-0 right-0 z-50 p-8 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
                        Live Presence • {formatDuration(callDuration)}
                    </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
                    <ShieldCheck size={14} className="text-primary" />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Secured Node</span>
                </div>
            </div>

            {/* Main Video Stage */}
            <div className="flex-1 relative flex items-center justify-center p-4">
                <div className="w-full h-full max-w-5xl rounded-[3rem] overflow-hidden border border-white/5 relative bg-[#0D0D0D]">
                    {/* Remote Video (Main) */}
                    {type === 'video' && remoteStream ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0D0D0D] to-[#1a1a1a]">
                            <div className="text-center">
                                <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-2 border-white/10">
                                    <img
                                        src={remoteUserData?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${callId}`}
                                        className="w-full h-full object-cover"
                                        alt="Remote user"
                                    />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">
                                    {remoteUserData?.fullName || 'Connecting...'}
                                </h3>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                    {type === 'audio' ? 'Audio Session Active' : 'Waiting for video...'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Local Video (Picture-in-Picture) */}
                    {type === 'video' && !isVideoOff && (
                        <div className="absolute bottom-6 right-6 w-40 h-56 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover mirror"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Call Controls */}
            <div className="p-12 flex justify-center bg-gradient-to-t from-black/80 to-transparent">
                <div className="glass-noire p-4 rounded-[3rem] border border-white/10 shadow-2xl flex items-center gap-4">
                    {/* Mute Button */}
                    <Button
                        onClick={toggleMute}
                        variant="ghost"
                        size="icon"
                        className={`w-14 h-14 rounded-full transition-all ${
                            isMuted 
                                ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                                : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                    >
                        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                    </Button>

                    {/* Video Toggle (only for video calls) */}
                    {type === 'video' && (
                        <Button
                            onClick={toggleVideo}
                            variant="ghost"
                            size="icon"
                            className={`w-14 h-14 rounded-full transition-all ${
                                isVideoOff 
                                    ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                                    : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                        >
                            {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
                        </Button>
                    )}

                    {/* End Call Button */}
                    <Button
                        onClick={handleEndCall}
                        variant="ghost"
                        size="icon"
                        className="w-14 h-14 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                    >
                        <PhoneOff size={22} />
                    </Button>
                </div>
            </div>

            {/* Bottom Status */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-20 text-[8px] font-black uppercase tracking-[0.8em] pointer-events-none">
                Morra // E2E Visual Tunnel
            </div>
        </div>
    );
};

export default CallPage;
