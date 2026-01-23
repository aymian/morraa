import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCall } from "@/components/calling/CallProvider";
import { Loader2, ShieldCheck, Mic, MicOff, Video, VideoOff, PhoneOff, RotateCcw, Maximize2, Minimize2, Wifi, WifiOff, Signal } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Button } from "@/components/ui/button";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

const CallPage = () => {
    const [searchParams] = useSearchParams();
    const callId = searchParams.get("id");
    const type = searchParams.get("type") || "video";
    const navigate = useNavigate();

    const { localStream, remoteStream, endCall, isInCall, switchCamera, connectionQuality } = useCall();
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(type === 'audio');
    const [remoteUserData, setRemoteUserData] = useState<any>(null);
    const [callDuration, setCallDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [pipPosition, setPipPosition] = useState({ x: 0, y: 0 });
    const [isSwapped, setIsSwapped] = useState(false);

    // Hide controls after 3 seconds of inactivity
    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        
        const resetTimer = () => {
            setShowControls(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => setShowControls(false), 3000);
        };

        resetTimer();
        window.addEventListener('touchstart', resetTimer);
        window.addEventListener('mousemove', resetTimer);

        return () => {
            clearTimeout(timeout);
            window.removeEventListener('touchstart', resetTimer);
            window.removeEventListener('mousemove', resetTimer);
        };
    }, []);

    // Set up video elements with optimizations
    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
            // Optimize video playback
            localVideoRef.current.setAttribute('playsinline', 'true');
            localVideoRef.current.setAttribute('webkit-playsinline', 'true');
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.setAttribute('playsinline', 'true');
            remoteVideoRef.current.setAttribute('webkit-playsinline', 'true');
        }
    }, [remoteStream]);

    // Force update when tracks change
    const [, forceUpdate] = useState({});

    useEffect(() => {
        if (remoteStream) {
            const handleTrackChange = () => {
                console.log('Remote stream tracks changed:', remoteStream.getTracks().length);
                forceUpdate({});
            };
            
            remoteStream.addEventListener('addtrack', handleTrackChange);
            remoteStream.addEventListener('removetrack', handleTrackChange);
            
            // Check if we need to force update immediately (in case tracks were added before listener)
            if (remoteStream.getVideoTracks().length > 0) {
                forceUpdate({});
            }

            return () => {
                remoteStream.removeEventListener('addtrack', handleTrackChange);
                remoteStream.removeEventListener('removetrack', handleTrackChange);
            };
        }
    }, [remoteStream]);

    // Call duration timer
    useEffect(() => {
        if (!isInCall || !callId) return;

        let interval: NodeJS.Timeout;

        const updateTimer = async () => {
             const callSnap = await getDoc(doc(db, 'calls', callId));
             if (callSnap.exists()) {
                 const data = callSnap.data();
                 if (data.connectedAt) {
                     const start = data.connectedAt;
                     setCallDuration(Math.floor((Date.now() - start) / 1000));
                     
                     interval = setInterval(() => {
                         setCallDuration(Math.floor((Date.now() - start) / 1000));
                     }, 1000);
                 } else {
                     // Fallback if connectedAt is not yet set
                      interval = setInterval(() => {
                        setCallDuration(prev => prev + 1);
                    }, 1000);
                 }
             }
        };

        updateTimer();

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isInCall, callId]);

    // Fetch remote user data from call document
    useEffect(() => {
        if (!callId) return;

        const fetchCallData = async () => {
            const callSnap = await getDoc(doc(db, 'calls', callId));
            if (callSnap.exists()) {
                const callData = callSnap.data();
                // Get the other user's data
                const currentUid = auth.currentUser?.uid;
                const otherUserId = callData.callerUid === currentUid ? callData.targetUid : callData.callerUid;
                const userSnap = await getDoc(doc(db, 'users', otherUserId));
                if (userSnap.exists()) {
                    setRemoteUserData(userSnap.data());
                }
            }
        };

        fetchCallData();
    }, [callId]);

    const formatDuration = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
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

    const toggleFullscreen = useCallback(async () => {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            await document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    const handlePipDrag = (_: any, info: PanInfo) => {
        setPipPosition(prev => ({
            x: prev.x + info.delta.x,
            y: prev.y + info.delta.y
        }));
    };

    const handleSwapVideos = () => {
        setIsSwapped(!isSwapped);
    };

    const getConnectionIcon = () => {
        switch (connectionQuality) {
            case 'excellent':
                return <Signal size={14} className="text-green-500" />;
            case 'good':
                return <Wifi size={14} className="text-green-400" />;
            case 'poor':
                return <Wifi size={14} className="text-yellow-500" />;
            case 'disconnected':
                return <WifiOff size={14} className="text-red-500" />;
            default:
                return <Wifi size={14} className="text-white/50" />;
        }
    };

    // Loading state
    if (!localStream) {
        return (
            <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-6 z-[9999]">
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

    const mainVideoStream = isSwapped ? localStream : remoteStream;
    const pipVideoStream = isSwapped ? remoteStream : localStream;
    const mainVideoRef = isSwapped ? localVideoRef : remoteVideoRef;
    const pipVideoRef = isSwapped ? remoteVideoRef : localVideoRef;

    return (
        <div 
            className="fixed inset-0 bg-black z-[9998] touch-none select-none"
            onClick={() => setShowControls(!showControls)}
        >
            {/* Main Video - Full Screen */}
            <div className="absolute inset-0">
                {type === 'video' && mainVideoStream && mainVideoStream.getVideoTracks().length > 0 ? (
                    <video
                        ref={mainVideoRef}
                        autoPlay
                        playsInline
                        muted={isSwapped}
                        className={`w-full h-full object-cover ${isSwapped ? 'mirror' : ''}`}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]">
                        <div className="text-center">
                            <motion.div 
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-28 h-28 sm:w-36 sm:h-36 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white/10"
                            >
                                <img
                                    src={remoteUserData?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${callId}`}
                                    className="w-full h-full object-cover"
                                    alt="Remote user"
                                />
                            </motion.div>
                            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                                {remoteUserData?.fullName || 'Connecting...'}
                            </h3>
                            <p id="remote-video-paused" className="text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-widest">
                                {type === 'audio' 
                                    ? 'Audio Session Active' 
                                    : (!mainVideoStream ? 'Waiting for video...' : 'Video paused')
                                }
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* PIP Video - Draggable */}
            {type === 'video' && !isVideoOff && (
                <motion.div
                    drag
                    dragMomentum={false}
                    dragElastic={0.1}
                    onDrag={handlePipDrag}
                    style={{ x: pipPosition.x, y: pipPosition.y }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute bottom-28 sm:bottom-36 right-4 sm:right-6 w-24 h-32 sm:w-32 sm:h-44 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl cursor-move z-50 bg-black"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleSwapVideos();
                    }}
                >
                    <video
                        ref={pipVideoRef}
                        autoPlay
                        playsInline
                        muted={!isSwapped}
                        className={`w-full h-full object-cover ${!isSwapped ? 'mirror' : ''}`}
                    />
                    {/* Swap indicator */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 active:opacity-100 transition-opacity">
                        <RotateCcw size={20} className="text-white" />
                    </div>
                </motion.div>
            )}

            {/* Top Header - Fades in/out */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-0 left-0 right-0 z-50 safe-area-top"
                    >
                        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-8 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                                    <div>
                                        <p className="text-white font-semibold text-sm sm:text-base">
                                            {remoteUserData?.fullName || 'Call'}
                                        </p>
                                        <p className="text-white/60 text-[10px] sm:text-xs font-medium">
                                            {formatDuration(callDuration)}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    {/* Connection quality */}
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full">
                                        {getConnectionIcon()}
                                        <span className="text-[9px] sm:text-[10px] font-bold text-white/60 uppercase">
                                            {connectionQuality}
                                        </span>
                                    </div>
                                    
                                    {/* Fullscreen toggle */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFullscreen();
                                        }}
                                        className="p-2 bg-white/10 backdrop-blur-xl rounded-full"
                                    >
                                        {isFullscreen ? (
                                            <Minimize2 size={16} className="text-white/70" />
                                        ) : (
                                            <Maximize2 size={16} className="text-white/70" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Controls - Fades in/out */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-0 left-0 right-0 z-50 safe-area-bottom"
                    >
                        <div className="px-4 sm:px-6 pb-6 sm:pb-10 pt-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                            <div className="flex items-center justify-center gap-4 sm:gap-6">
                                {/* Mute Button */}
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleMute();
                                    }}
                                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all ${
                                        isMuted 
                                            ? 'bg-white text-black' 
                                            : 'bg-white/20 backdrop-blur-xl text-white'
                                    }`}
                                >
                                    {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                                </motion.button>

                                {/* Video Toggle (only for video calls) */}
                                {type === 'video' && (
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleVideo();
                                        }}
                                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all ${
                                            isVideoOff 
                                                ? 'bg-white text-black' 
                                                : 'bg-white/20 backdrop-blur-xl text-white'
                                        }`}
                                    >
                                        {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
                                    </motion.button>
                                )}

                                {/* Switch Camera (only for video calls) */}
                                {type === 'video' && (
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            switchCamera();
                                        }}
                                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-xl text-white flex items-center justify-center transition-all"
                                    >
                                        <RotateCcw size={22} />
                                    </motion.button>
                                )}

                                {/* End Call Button */}
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEndCall();
                                    }}
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 active:bg-red-600"
                                >
                                    <PhoneOff size={26} />
                                </motion.button>
                            </div>

                            {/* Security indicator */}
                            <div className="flex items-center justify-center gap-2 mt-4 sm:mt-6">
                                <ShieldCheck size={12} className="text-primary/60" />
                                <span className="text-[8px] sm:text-[9px] font-bold text-white/30 uppercase tracking-widest">
                                    End-to-End Encrypted
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Low quality connection warning */}
            <AnimatePresence>
                {connectionQuality === 'poor' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-20 left-1/2 -translate-x-1/2 z-50"
                    >
                        <div className="px-4 py-2 bg-yellow-500/20 backdrop-blur-xl rounded-full border border-yellow-500/30">
                            <p className="text-yellow-500 text-[10px] sm:text-xs font-bold">
                                Weak connection - Video quality reduced
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CallPage;
