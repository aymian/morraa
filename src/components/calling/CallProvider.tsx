import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

// STUN/TURN servers for NAT traversal
const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

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

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const navigate = useNavigate();

    // Listen for auth state and incoming calls
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
        const unsubAnswer = onSnapshot(doc(db, 'calls', callDocId), async (snapshot) => {
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
        const unsubCandidates = onSnapshot(candidatesRef, (snapshot) => {
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

        const callSnap = await getDoc(doc(db, 'calls', incomingCallId));
        if (!callSnap.exists()) throw new Error('Call not found');

        const callData = callSnap.data();
        const type = callData.type as 'video' | 'audio';

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

        navigate(`/call?id=${incomingCallId}&type=${type}`);
    };

    const endCall = useCallback(async () => {
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
    }, [localStream, callId]);

    const handleAnswerIncoming = () => {
        if (incomingCall) {
            answerCall(incomingCall.id);
        }
    };

    const handleRejectIncoming = async () => {
        if (incomingCall) {
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

            {/* Incoming Call Overlay */}
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
                                            src={callerData?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${incomingCall.callerUid}`}
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
                                        {incomingCall.type === 'audio' ? 'Audio Session' : 'Visual Presence'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={handleRejectIncoming}
                                    variant="ghost"
                                    size="icon"
                                    className="w-11 h-11 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                >
                                    <PhoneOff size={18} />
                                </Button>
                                <Button
                                    onClick={handleAnswerIncoming}
                                    size="icon"
                                    className="w-11 h-11 rounded-full bg-green-500 text-white shadow-lg shadow-green-500/20 hover:scale-110 transition-transform"
                                >
                                    {incomingCall.type === 'audio' ? <Phone size={18} /> : <Video size={18} />}
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
