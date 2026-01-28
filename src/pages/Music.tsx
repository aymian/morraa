
import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Music2, Play, Pause, Search,
    Disc, X, Volume2, SkipForward, SkipBack,
    Heart, Share2, ExternalLink, Flame,
    Sparkles, Shuffle, Repeat
} from "lucide-react";
import { searchTracks, getNewReleases } from "@/lib/spotify";
import Navbar from "@/components/noire/Navbar";
import MobileBottomNav from "@/components/noire/MobileBottomNav";
import FloatingSidebar from "@/components/noire/FloatingSidebar";
import { toast } from "sonner";

declare global {
    interface Window {
        onSpotifyIframeApiReady: (IFrameAPI: any) => void;
    }
}

// Optimized Skeleton Component
const Skeleton = ({ className }: { className: string }) => (
    <div className={`animate-pulse bg-white/5 rounded-2xl ${className}`} />
);

const Music = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [discoverTracks, setDiscoverTracks] = useState<any[]>([]);
    const [selectedTrack, setSelectedTrack] = useState<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isControllerReady, setIsControllerReady] = useState(false);

    const embedController = useRef<any>(null);
    const searchTimeout = useRef<any>(null);

    const memoizedResults = useMemo(() => results, [results]);

    useEffect(() => {
        fetchInitialData();
        loadSpotifyApi();

        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, []);

    const loadSpotifyApi = () => {
        // Define callback before script loading
        window.onSpotifyIframeApiReady = (IFrameAPI: any) => {
            const element = document.getElementById('spotify-embed-container');
            if (!element) return;

            // Use minimal visible size to ensure Spotify initializes
            const options = {
                width: '100%',
                height: '80px',
                uri: ''
            };

            IFrameAPI.createController(element, options, (controller: any) => {
                embedController.current = controller;
                setIsControllerReady(true);

                controller.on('playback_update', (e: any) => {
                    const paused = e.data.isPaused;
                    setIsPlaying(!paused);
                });

                controller.on('ready', () => {
                    console.log('Spotify Controller Ready');
                });
            });
        };

        if (document.getElementById('spotify-player-script')) return;

        const script = document.createElement("script");
        script.id = 'spotify-player-script';
        script.src = "https://open.spotify.com/embed-podcast/iframe-api/v1";
        script.async = true;
        document.body.appendChild(script);
    };

    const fetchInitialData = async () => {
        try {
            const data = await getNewReleases();
            setDiscoverTracks(data.albums.items);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (!query.trim()) {
            setResults([]);
            setShowResults(false);
            return;
        }

        setSearching(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                const data = await searchTracks(query);
                setResults(data.tracks.items);
                setShowResults(true);
            } catch (err) {
                console.error("Search API error:", err);
            } finally {
                setSearching(false);
            }
        }, 400);
    };

    const openPlayer = (track: any) => {
        setSelectedTrack(track);
        setShowResults(false);

        if (embedController.current && isControllerReady) {
            // Re-initialize play/pause state for UI
            setIsPlaying(true);

            // Spotify API requires load then play
            embedController.current.loadUri(track.uri);

            // Brief delay to allow iframe to swap URIs before calling play
            setTimeout(() => {
                embedController.current.play();
            }, 100);
        } else {
            toast.error("Vibration engine is still initializing. Please wait 2 seconds.");
        }
    };

    const togglePlay = () => {
        if (embedController.current && isControllerReady) {
            embedController.current.togglePlay();
        } else {
            toast.error("Controller not ready. Refreshing core sync...");
        }
    };

    return (
        <div className="min-h-screen bg-[#020202] text-white pb-32 font-body overflow-x-hidden selection:bg-primary/30">
            <FloatingSidebar />
            <Navbar />

            {/* Hidden but initialized container - necessary for controller to work */}
            <div className="fixed bottom-0 left-0 opacity-0 pointer-events-none -z-50 w-px h-px overflow-hidden">
                <div id="spotify-embed-container" />
            </div>

            {/* Hero Section */}
            <section className="relative pt-32 md:pt-40 pb-16 px-6 container mx-auto z-10">
                <div className="absolute top-0 right-0 w-[60%] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto text-center">
                    <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter mb-10 bg-gradient-to-b from-white to-white/20 bg-clip-text text-transparent">
                        Aura Beats
                    </h1>

                    <div className="relative">
                        <div className="relative flex items-center bg-white/5 border border-white/10 rounded-[2rem] p-1.5 pr-6 backdrop-blur-2xl transition-all duration-300 focus-within:border-primary/50 shadow-2xl">
                            <div className="p-3 text-primary">
                                {searching ? <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Search size={24} />}
                            </div>
                            <input
                                type="text"
                                placeholder="Search vibrations..."
                                className="flex-1 bg-transparent border-none outline-none text-xl py-3 placeholder:text-gray-700"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>

                        <AnimatePresence>
                            {showResults && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="absolute top-full left-0 right-0 mt-4 bg-[#080808]/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-3 shadow-2xl z-50 max-h-[400px] overflow-y-auto no-scrollbar scroll-smooth"
                                >
                                    {memoizedResults.map((track) => (
                                        <button
                                            key={track.id}
                                            onClick={() => openPlayer(track)}
                                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all text-left group"
                                        >
                                            <img
                                                src={track.album.images[2]?.url || track.album.images[0]?.url}
                                                loading="lazy"
                                                className="w-12 h-12 rounded-lg object-cover bg-white/5"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold truncate text-base group-hover:text-primary transition-colors">{track.name}</h4>
                                                <p className="text-gray-500 text-xs truncate uppercase tracking-widest font-black opacity-40">{track.artists[0].name}</p>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                <Play size={14} className="text-primary fill-primary" />
                                            </div>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </section>

            <main className="container mx-auto px-6 space-y-20">
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-display font-bold flex items-center gap-2">
                            <Flame size={20} className="text-primary" /> New Signatures
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                        {loading ? (
                            [...Array(10)].map((_, i) => (
                                <div key={i} className="space-y-4">
                                    <Skeleton className="aspect-square rounded-[2rem]" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            ))
                        ) : (
                            discoverTracks.map((album, idx) => (
                                <motion.div
                                    key={album.id}
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => window.open(album.external_urls.spotify, '_blank')}
                                    className="group cursor-pointer"
                                >
                                    <div className="relative aspect-square mb-4 rounded-[2rem] overflow-hidden border border-white/5 bg-white/5">
                                        <img
                                            src={album.images[1]?.url || album.images[0]?.url}
                                            loading="lazy"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Play className="text-primary fill-primary" size={32} />
                                        </div>
                                    </div>
                                    <h4 className="font-bold truncate text-sm mb-1">{album.name}</h4>
                                    <p className="text-gray-500 text-[10px] uppercase tracking-widest">{album.artists[0]?.name}</p>
                                </motion.div>
                            ))
                        )}
                    </div>
                </section>
            </main>

            <AnimatePresence>
                {selectedTrack && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center px-4"
                    >
                        <div onClick={() => setSelectedTrack(null)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />

                        <motion.div
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                            className="relative w-full max-w-4xl bg-[#080808] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row"
                        >
                            <div className="md:w-2/5 p-10 flex flex-col items-center justify-center border-r border-white/5 bg-gradient-to-br from-white/5 to-transparent text-center">
                                <motion.div
                                    animate={{ rotate: isPlaying ? 360 : 0 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="w-64 h-64 rounded-full border-[10px] border-black shadow-2xl overflow-hidden mb-8 ring-1 ring-white/10"
                                >
                                    <img src={selectedTrack.album.images[0]?.url} className="w-full h-full object-cover" />
                                </motion.div>
                                <h2 className="text-2xl font-display font-black mb-2 leading-tight">{selectedTrack.name}</h2>
                                <p className="text-primary font-bold text-[10px] uppercase tracking-widest opacity-60">{selectedTrack.artists[0].name}</p>
                            </div>

                            <div className="md:w-3/5 p-10 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black tracking-widest text-primary/40 uppercase">AURA SIGNATURE ENGINE</span>
                                        {!isControllerReady && <span className="text-[8px] text-red-500 font-bold animate-pulse mt-1 uppercase">Warming up synchronization...</span>}
                                    </div>
                                    <button onClick={() => setSelectedTrack(null)} className="p-2 hover:bg-white/5 rounded-full transition-all text-gray-500 hover:text-white">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-center gap-1.5 h-16 my-8">
                                    {[...Array(12)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ height: isPlaying ? [10, 40, 10] : 10 }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.05 }}
                                            className="w-1 bg-primary/40 rounded-full"
                                        />
                                    ))}
                                </div>

                                <div className="flex flex-col gap-8">
                                    <div className="flex items-center justify-center gap-8">
                                        <button className="text-white/20 hover:text-white"><SkipBack size={32} /></button>
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={togglePlay}
                                            className="w-20 h-20 bg-primary text-black rounded-full flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                                        >
                                            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                                        </motion.button>
                                        <button className="text-white/20 hover:text-white"><SkipForward size={32} /></button>
                                    </div>

                                    <div className="flex items-center justify-between bg-white/5 p-5 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-3">
                                                <Volume2 size={18} className="text-white/40" />
                                                <div className="w-24 h-1 bg-white/10 rounded-full"><div className="w-3/4 h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" /></div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => window.open(selectedTrack.external_urls.spotify, '_blank')}
                                            className="px-5 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-primary hover:text-black transition-all"
                                        >
                                            View Source
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <MobileBottomNav />
        </div>
    );
};

export default Music;
