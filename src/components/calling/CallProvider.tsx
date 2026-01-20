import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    StreamVideo,
    StreamVideoClient,
    User,
    Call,
    StreamCall,
} from '@stream-io/video-react-sdk';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { apiKey, generateStreamToken } from '@/lib/stream';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CallContextType {
    client: StreamVideoClient | null;
    activeCall: Call | null;
    initiateCall: (targetUid: string, type: 'video' | 'audio') => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [client, setClient] = useState<StreamVideoClient | null>(null);
    const [activeCall, setActiveCall] = useState<Call | null>(null);
    const [incomingCall, setIncomingCall] = useState<Call | null>(null);
    const [callerData, setCallerData] = useState<any>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const streamUser: User = {
                    id: user.uid,
                    name: user.displayName || user.email?.split('@')[0] || 'Aura Member',
                    image: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
                };

                try {
                    const token = await generateStreamToken(user.uid);
                    const videoClient = new StreamVideoClient({
                        apiKey,
                        user: streamUser,
                        token: token,
                    });
                    setClient(videoClient);

                    // Listen for incoming calls
                    const unsubscribeIncoming = videoClient.on('call.created', (event) => {
                        const call = videoClient.call(event.call.type, event.call.id);
                        setIncomingCall(call);

                        // Fetch caller data from Firestore
                        const callerId = event.call.created_by.id;
                        onSnapshot(doc(db, "users", callerId), (snap) => {
                            if (snap.exists()) setCallerData(snap.data());
                        });
                    });

                    return () => {
                        unsubscribeIncoming();
                        videoClient.disconnectUser();
                    };
                } catch (error) {
                    console.error("Stream initialization error:", error);
                }
            } else {
                setClient(null);
            }
        });

        return () => unsubscribe();
    }, []);


    const initiateCall = async (targetUid: string, type: 'video' | 'audio') => {
        if (!client) {
            throw new Error("Stream frequency not yet synchronized. Please wait a moment.");
        }

        try {
            const callId = `call_${Date.now()}`;
            const call = client.call('default', callId);

            await call.getOrCreate({
                data: {
                    members: [{ user_id: auth.currentUser?.uid! }, { user_id: targetUid }],
                    custom: { type }
                },
            });

            // Auto hang up if not accepted within 60 seconds
            const timeoutId = setTimeout(async () => {
                try {
                    const state = call.state;
                    // If the call hasn't moved beyond 'joining' or 'calling' phase 
                    // or if there are no other participants after 60s
                    if (state.participantCount <= 1) {
                        console.log("Call timed out - no response within 60s");
                        await call.leave();
                        setActiveCall(null);
                        navigate('/messages');
                    }
                } catch (e) {
                    console.error("Timeout cleanup error:", e);
                }
            }, 60000);

            // Clear timeout if someone joins
            const unsubscribe = call.on('call.session_participant_joined', () => {
                console.log("Participant joined - clearing timeout");
                clearTimeout(timeoutId);
                unsubscribe();
            });

            setActiveCall(call);
            navigate(`/call?id=${callId}&type=${type}`);
        } catch (error) {
            console.error("Failed to initiate call:", error);
            throw error;
        }
    };

    const handleAnswer = () => {
        if (incomingCall) {
            setActiveCall(incomingCall);
            const type = incomingCall.state.custom?.type || 'video';
            navigate(`/call?id=${incomingCall.id}&type=${type}`);
            setIncomingCall(null);
        }
    };

    const handleReject = () => {
        if (incomingCall) {
            incomingCall.leave();
            setIncomingCall(null);
        }
    };

    return (
        <CallContext.Provider value={{ client, activeCall, initiateCall }}>
            {client && <StreamVideo client={client}>{children}</StreamVideo>}
            {!client && children}

            {/* Incoming Call Overlay - Instagram Style */}
            <AnimatePresence>
                {incomingCall && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 20, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md"
                    >
                        <div className="glass-noire rounded-[2.5rem] border border-white/10 p-6 shadow-2xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/20">
                                        <img
                                            src={callerData?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${incomingCall.id}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full blur-[2px]"
                                    />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white">{callerData?.fullName || "Incoming Call"}</h4>
                                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">
                                        {incomingCall.state.custom?.type === 'audio' ? 'Audio Session' : 'Visual Presence'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={handleReject}
                                    variant="ghost"
                                    size="icon"
                                    className="w-11 h-11 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                >
                                    <PhoneOff size={18} />
                                </Button>
                                <Button
                                    onClick={handleAnswer}
                                    size="icon"
                                    className="w-11 h-11 rounded-full bg-green-500 text-white shadow-lg shadow-green-500/20 hover:scale-110 transition-transform"
                                >
                                    {incomingCall.state.custom?.type === 'audio' ? <Phone size={18} /> : <Video size={18} />}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </CallContext.Provider>
    );
};

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) throw new Error('useCall must be used within CallProvider');
    return context;
};
