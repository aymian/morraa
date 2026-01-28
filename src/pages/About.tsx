import { motion } from "framer-motion";
import Navbar from "@/components/noire/Navbar";
import MobileBottomNav from "@/components/noire/MobileBottomNav";
import { Sparkles, Users, Globe, Zap } from "lucide-react";

const About = () => {
    const handleAuthClick = (action: "login" | "signup") => {
        window.location.href = `/login?action=${action}`;
    };

    const values = [
        {
            icon: <Users className="w-6 h-6 text-primary" />,
            title: "Community First",
            description: "We believe social media should actually be social. We build for connection, not just consumption."
        },
        {
            icon: <Globe className="w-6 h-6 text-primary" />,
            title: "Global Reach",
            description: "Breaking down barriers and connecting cultures through shared experiences across the world."
        },
        {
            icon: <Zap className="w-6 h-6 text-primary" />,
            title: "Real-time Magic",
            description: "Experience the world as it happens with our hyper-fast, immersive social ecosystem."
        }
    ];

    return (
        <main className="relative min-h-screen bg-background overflow-x-hidden">
            <Navbar onAuthClick={handleAuthClick} />

            {/* Hero Section */}
            <section className="pt-40 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] -z-10" />

                <div className="container mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-display font-bold mb-8">
                            The Evolution of <br />
                            <span className="text-gradient-gold italic">Social Media</span>
                        </h1>
                        <p className="max-w-3xl mx-auto text-xl text-muted-foreground font-body leading-relaxed">
                            Morra was born from a simple idea: that digital interaction should feel as deep and meaningful as a face-to-face conversation. We're building a world where dimensions don't divide us—they bring us together.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Stats/Highlight Section */}
            <section className="py-20 px-6">
                <div className="container mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {values.map((value, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2, duration: 0.6 }}
                                className="glass-noire p-8 rounded-3xl border border-border/30 hover:border-primary/50 transition-colors"
                            >
                                <div className="mb-6 p-3 w-fit bg-primary/10 rounded-xl">
                                    {value.icon}
                                </div>
                                <h3 className="text-2xl font-display font-bold mb-4">{value.title}</h3>
                                <p className="text-muted-foreground font-body leading-relaxed">{value.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-20 px-6 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] -z-10" />

                <div className="container mx-auto">
                    <div className="glass-noire p-12 md:p-20 rounded-[3rem] border border-border/30 flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1">
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-6">
                                Our Mission
                            </span>
                            <h2 className="text-4xl md:text-5xl font-display font-bold mb-8">
                                To connect the world <br /> through <span className="text-gradient-gold">shared emotions</span>
                            </h2>
                            <p className="text-lg text-muted-foreground font-body leading-relaxed mb-10">
                                In an era of endless scrolling, we've lost the "social" in social media.
                                Morra is here to change that. We prioritize depth over depth, connection over clicks,
                                and humanity over hashtags.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleAuthClick("signup")}
                                className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-full shadow-glow-gold"
                            >
                                Join the Movement
                            </motion.button>
                        </div>
                        <div className="flex-1 relative">
                            <div className="aspect-square rounded-2xl overflow-hidden glass-noire border border-border/30 rotate-3">
                                <img
                                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800"
                                    alt="Mission"
                                    className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700"
                                />
                            </div>
                            <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                        </div>
                    </div>
                </div>
            </section>

            {/* CEO Section */}
            <section className="py-20 px-6">
                <div className="container mx-auto flex flex-col items-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="flex flex-col items-center"
                    >
                        <div className="relative group">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-2 border-primary/30 p-1 bg-background shadow-2xl">
                                <img
                                    src="/assets/images/image.png"
                                    alt="Ishimwe Yves Ian"
                                    className="w-full h-full object-cover rounded-full transition-transform duration-700 group-hover:scale-110"
                                />
                            </div>
                        </div>
                        <div className="mt-8 text-center">
                            <h3 className="text-3xl md:text-4xl font-display font-bold text-gradient-gold">Ishimwe Yves Ian</h3>
                            <p className="text-sm md:text-base text-muted-foreground uppercase tracking-[0.4em] font-bold mt-2 opacity-60">The CEO of this App</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer Placeholder for visual completeness */}
            <footer className="py-20 border-t border-border/20 text-center">
                <div className="container mx-auto px-6">
                    <p className="text-muted-foreground text-sm font-body">
                        © 2026 MORRA Ecosystems. All rights reserved.
                    </p>
                </div>
            </footer>
            <MobileBottomNav onAuthClick={handleAuthClick} />
        </main>
    );
};

export default About;
