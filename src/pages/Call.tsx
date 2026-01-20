import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    StreamCall,
    StreamVideo,
    SpeakerLayout,
    CallControls,
    useCallStateHooks,
    CallingState,
    ParticipantView
} from "@stream-io/video-react-sdk";
import { useCall } from "@/components/calling/CallProvider";
import { Loader2, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CallInterface = () => {
    const { useCallCallingState, useParticipants } = useCallStateHooks();
    const callingState = useCallCallingState();
    const participants = useParticipants();
    const navigate = useNavigate();

    useEffect(() => {
        if (callingState === CallingState.LEFT) {
            navigate('/messages');
        }
    }, [callingState, navigate]);

    if (callingState !== CallingState.JOINED && callingState !== CallingState.RINGING) {
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
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Live Presence</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
                    <ShieldCheck size={14} className="text-primary" />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Secured Node</span>
                </div>
            </div>

            {/* Main Stage */}
            <div className="flex-1 relative flex items-center justify-center p-4">
                <div className="w-full h-full max-w-5xl rounded-[3rem] overflow-hidden border border-white/5 relative bg-[#0D0D0D]">
                    <SpeakerLayout />
                </div>
            </div>

            {/* Visual Call Controls */}
            <div className="p-12 flex justify-center bg-gradient-to-t from-black/80 to-transparent">
                <div className="glass-noire p-4 rounded-[3rem] border border-white/10 shadow-2xl scale-110">
                    <CallControls onLeave={() => navigate('/messages')} />
                </div>
            </div>

            {/* Bottom Status */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-20 text-[8px] font-black uppercase tracking-[0.8em] pointer-events-none">
                Morra // E2E Visual Tunnel
            </div>
        </div>
    );
};

const CallPage = () => {
    const [searchParams] = useSearchParams();
    const callId = searchParams.get("id");
    const type = searchParams.get("type") || "video";
    const { client } = useCall();
    const navigate = useNavigate();

    // Move join logic to useEffect
    useEffect(() => {
        if (!client || !callId) return;

        const call = client.call('default', callId);

        const joinCall = async () => {
            try {
                await call.join({
                    create: false,
                });

                // If it's an audio call, ensure camera is off by default
                if (type === 'audio') {
                    await call.camera.disable();
                }
            } catch (err) {
                console.error("Failed to join call:", err);
                navigate('/messages');
            }
        };

        joinCall();

        return () => {
            // Leave call on unmount
            call.leave();
        };
    }, [client, callId, type, navigate]);

    if (!client || !callId) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    const call = client.call('default', callId);

    return (
        <StreamCall call={call}>
            <CallInterface />
        </StreamCall>
    );
};

export default CallPage;
