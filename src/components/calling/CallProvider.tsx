import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc, updateDoc, collection, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// STUN/TURN servers for NAT traversal
const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

// Ringtone URL (using a free ringtone)
const RINGTONE_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

interface CallContextType {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    initiateCall: (targetUid: string, type: 'video' | 'audio') => Promise<void>;
    answerCall: (callId: string) => Promise<void>;
    endCall: () => Promise<void>;
    isInCall: boolean;
    callType: 'video' | 'audio' | null;
    callId: string | null;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isInCall, setIsInCall] = useState(false);
    const [callType, setCallType] = useState<'video' | 'audio' | null>(null);
    const [callId, setCallId] = useState<string | null>(null);
    const [incomingCall, setIncomingCall] = useState<any>(null);
    const [callerData, setCallerData] = useState<any>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isAnswering, setIsAnswering] = useState(false);

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const ringtoneRef = useRef<HTMLAudioElement | null>(null);
    const navigate = useNavigate();

    // Initialize ringtone audio
    useEffect(() => {
        ringtoneRef.current = new Audio(RINGTONE_URL);
        ringtoneRef.current.loop = true;
        ringtoneRef.current.volume = 0.5;
        
        return () => {
            if (ringtoneRef.current) {
                ringtoneRef.current.pause();
                ringtoneRef.current = null;
            }
        };
    }, []);

    // Play/stop ringtone based on incoming call
    useEffect(() => {
        if (incomingCall && ringtoneRef.current) {
            ringtoneRef.current.play().catch(e => console.log('Ringtone autoplay blocked:', e));
        } else if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
        }
    }, [incomingCall]);

    // Listen for auth state
    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUserId(user.uid);
            } else {
                setCurrentUserId(null);
            }
        });

        return () => unsubAuth();
    }, []);

    // Listen for incoming calls
    useEffect(() => {
        if (!currentUserId) return;

        const callsRef = collection(db, 'calls');
        const q = query(callsRef, where('targetUid', '==', currentUserId), where('status', '==', 'ringing'));

        const unsubCalls = onSnapshot(q, async (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const callData = change.doc.data();
                    setIncomingCall({ id: change.doc.id, ...callData });

                    // Fetch caller info
                    const callerSnap = await getDoc(doc(db, 'users', callData.callerUid));
                    if (callerSnap.exists()) {
                        setCallerData(callerSnap.data());
                    }
                }
                if (change.type === 'removed' || change.type === 'modified') {
                    const callData = change.doc.data();
                    if (callData.status !== 'ringing') {
                        setIncomingCall(null);
                        setCallerData(null);
                    }
                }
            });
        });

        return () => unsubCalls();
    }, [currentUserId]);

    const setupMediaStream = async (type: 'video' | 'audio') => {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: type === 'video',
            audio: true
        });
        setLocalStream(stream);
        return stream;
    };

    const createPeerConnection = (callDocId: string) => {
        const pc = new RTCPeerConnection(iceServers);

        // Create remote stream
        const remote = new MediaStream();
        setRemoteStream(remote);

        // Handle remote tracks
        pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach(track => {
                remote.addTrack(track);
            });
        };

        // Handle ICE candidates
        pc.onicecandidate = async (event) => {
            if (event.candidate) {
                const candidatesRef = collection(db, 'calls', callDocId, 'candidates');
                await setDoc(doc(candidatesRef), {
                    ...event.candidate.toJSON(),
                    from: currentUserId
                });
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                endCall();
            }
        };

        peerConnection.current = pc;
        return pc;
    };

    const initiateCall = async (targetUid: string, type: 'video' | 'audio') => {
        if (!currentUserId) throw new Error('Not authenticated');

        const stream = await setupMediaStream(type);
        const callDocId = `call_${Date.now()}_${currentUserId}`;

        // Create call document
        await setDoc(doc(db, 'calls', callDocId), {
            callerUid: currentUserId,
            targetUid,
            type,
            status: 'ringing',
            createdAt: Date.now()
        });

        const pc = createPeerConnection(callDocId);

        // Add local tracks to peer connection
        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        // Create and set offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await updateDoc(doc(db, 'calls', callDocId), {
            offer: {
                type: offer.type,
                sdp: offer.sdp
            }
        });

        setCallId(callDocId);
        setCallType(type);
        setIsInCall(true);

        // Listen for answer
        onSnapshot(doc(db, 'calls', callDocId), async (snapshot) => {
            const data = snapshot.data();
            if (data?.answer && pc.currentRemoteDescription === null) {
                const answerDesc = new RTCSessionDescription(data.answer);
                await pc.setRemoteDescription(answerDesc);
            }
            if (data?.status === 'ended') {
                endCall();
            }
        });

        // Listen for remote ICE candidates
        const candidatesRef = collection(db, 'calls', callDocId, 'candidates');
        onSnapshot(candidatesRef, (snapshot) => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    if (data.from !== currentUserId) {
                        pc.addIceCandidate(new RTCIceCandidate(data));
                    }
                }
            });
        });

        // Auto-end call after 60s if not answered
        setTimeout(async () => {
            const callSnap = await getDoc(doc(db, 'calls', callDocId));
            if (callSnap.exists() && callSnap.data().status === 'ringing') {
                await endCall();
            }
        }, 60000);

        navigate(`/call?id=${callDocId}&type=${type}`);
    };

    const answerCall = async (incomingCallId: string) => {
        if (!currentUserId) throw new Error('Not authenticated');

        setIsAnswering(true);

        try {
            const callSnap = await getDoc(doc(db, 'calls', incomingCallId));
            if (!callSnap.exists()) throw new Error('Call not found');

            const callData = callSnap.data();
            const type = callData.type as 'video' | 'audio';

            // Stop ringtone
            if (ringtoneRef.current) {
                ringtoneRef.current.pause();
                ringtoneRef.current.currentTime = 0;
            }

            const stream = await setupMediaStream(type);
            const pc = createPeerConnection(incomingCallId);

            // Add local tracks
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Set remote description from offer
            const offerDesc = new RTCSessionDescription(callData.offer);
            await pc.setRemoteDescription(offerDesc);

            // Create and set answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await updateDoc(doc(db, 'calls', incomingCallId), {
                answer: {
                    type: answer.type,
                    sdp: answer.sdp
                },
                status: 'connected'
            });

            setCallId(incomingCallId);
            setCallType(type);
            setIsInCall(true);
            setIncomingCall(null);
            setCallerData(null);

            // Listen for remote ICE candidates
            const candidatesRef = collection(db, 'calls', incomingCallId, 'candidates');
            onSnapshot(candidatesRef, (snapshot) => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const data = change.doc.data();
                        if (data.from !== currentUserId) {
                            pc.addIceCandidate(new RTCIceCandidate(data));
                        }
                    }
                });
            });

            // Listen for call end
            onSnapshot(doc(db, 'calls', incomingCallId), (snapshot) => {
                const data = snapshot.data();
                if (data?.status === 'ended') {
                    endCall();
                }
            });

            // Navigate to call page
            navigate(`/call?id=${incomingCallId}&type=${type}`);
        } catch (error) {
            console.error('Failed to answer call:', error);
            setIsAnswering(false);
        }
    };

    const endCall = useCallback(async () => {
        // Stop ringtone
        if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
        }

        // Stop all local tracks
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }

        // Close peer connection
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }

        // Update call status in Firestore
        if (callId) {
            try {
                await updateDoc(doc(db, 'calls', callId), {
                    status: 'ended',
                    endedAt: Date.now()
                });
            } catch (err) {
                console.error('Failed to update call status:', err);
            }
        }

        setRemoteStream(null);
        setIsInCall(false);
        setCallType(null);
        setCallId(null);
        setIsAnswering(false);
    }, [localStream, callId]);

    const handleAnswerIncoming = async () => {
        if (incomingCall && !isAnswering) {
            try {
                await answerCall(incomingCall.id);
            } catch (error) {
                console.error('Error answering call:', error);
                setIsAnswering(false);
            }
        }
    };

    const handleRejectIncoming = async () => {
        if (incomingCall) {
            // Stop ringtone
            if (ringtoneRef.current) {
                ringtoneRef.current.pause();
                ringtoneRef.current.currentTime = 0;
            }

            await updateDoc(doc(db, 'calls', incomingCall.id), {
                status: 'rejected'
            });
            setIncomingCall(null);
            setCallerData(null);
        }
    };

    return (
        <CallContext.Provider value={{
            localStream,
            remoteStream,
            initiateCall,
            answerCall,
            endCall,
            isInCall,
            callType,
            callId
        }}>
            {children}

            {/* Full-screen Incoming Call Overlay */}
            <AnimatePresence>
                {incomingCall && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6"
                    >
                        {/* Animated background rings */}
                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                            <motion.div
                                animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                                className="absolute w-48 h-48 rounded-full border-2 border-primary/30"
                            />
                            <motion.div
                                animate={{ scale: [1, 2.5, 1], opacity: [0.2, 0, 0.2] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                                className="absolute w-48 h-48 rounded-full border-2 border-primary/20"
                            />
                            <motion.div
                                animate={{ scale: [1, 3, 1], opacity: [0.1, 0, 0.1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }}
                                className="absolute w-48 h-48 rounded-full border-2 border-primary/10"
                            />
                        </div>

                        <motion.div
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 50 }}
                            className="relative flex flex-col items-center text-center max-w-sm w-full"
                        >
                            {/* Close button */}
                            <button
                                onClick={handleRejectIncoming}
                                className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <X size={18} />
                            </button>

                            {/* Caller Avatar */}
                            <div className="relative mb-8">
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="relative"
                                >
                                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-primary/50 shadow-[0_0_60px_rgba(251,191,36,0.3)]">
                                        <img
                                            src={callerData?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${incomingCall.callerUid}`}
                                            className="w-full h-full object-cover"
                                            alt="Caller"
                                        />
                                    </div>
                                    {/* Pulsing ring */}
                                    <motion.div
                                        animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                        className="absolute inset-0 rounded-full border-4 border-primary"
                                    />
                                </motion.div>

                                {/* Call type indicator */}
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary rounded-full flex items-center gap-2">
                                    {incomingCall.type === 'audio' ? (
                                        <Phone size={14} className="text-black" />
                                    ) : (
                                        <Video size={14} className="text-black" />
                                    )}
                                    <span className="text-[10px] font-black uppercase tracking-wider text-black">
                                        {incomingCall.type === 'audio' ? 'Audio' : 'Video'}
                                    </span>
                                </div>
                            </div>

                            {/* Caller Name */}
                            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                                {callerData?.fullName || "Unknown Caller"}
                            </h2>
                            <p className="text-sm text-white/50 mb-2">
                                @{callerData?.username || 'user'}
                            </p>

                            {/* Call Status */}
                            <motion.p
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="text-primary font-bold uppercase tracking-[0.2em] text-sm mb-12"
                            >
                                Incoming {incomingCall.type === 'audio' ? 'Audio' : 'Video'} Call...
                            </motion.p>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-center gap-8 sm:gap-12">
                                {/* Decline */}
                                <div className="flex flex-col items-center gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={handleRejectIncoming}
                                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_40px_rgba(239,68,68,0.6)] transition-all"
                                    >
                                        <PhoneOff size={28} />
                                    </motion.button>
                                    <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Decline</span>
                                </div>

                                {/* Accept */}
                                <div className="flex flex-col items-center gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={handleAnswerIncoming}
                                        disabled={isAnswering}
                                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:shadow-[0_0_40px_rgba(34,197,94,0.6)] transition-all disabled:opacity-50"
                                    >
                                        {isAnswering ? (
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                className="w-7 h-7 border-3 border-white border-t-transparent rounded-full"
                                            />
                                        ) : incomingCall.type === 'audio' ? (
                                            <Phone size={28} />
                                        ) : (
                                            <Video size={28} />
                                        )}
                                    </motion.button>
                                    <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
                                        {isAnswering ? 'Connecting...' : 'Accept'}
                                    </span>
                                </div>
                            </div>

                            {/* Bottom branding */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-20 opacity-20">
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white">
                                    Morra Secure Call
                                </span>
                            </div>
                        </motion.div>
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
