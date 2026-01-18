import { motion } from "framer-motion";
import Navbar from "@/components/noire/Navbar";
import MobileBottomNav from "@/components/noire/MobileBottomNav";
import { Mail, MessageSquare, MapPin, Send } from "lucide-react";

const Contact = () => {
    const handleAuthClick = (action: "login" | "signup") => {
        window.location.href = `/login?action=${action}`;
    };

    const contactInfo = [
        {
            icon: <Mail className="w-5 h-5" />,
            label: "Support",
            value: "hello@morra.so"
        },
        {
            icon: <MessageSquare className="w-5 h-5" />,
            label: "Twitter / X",
            value: "@morra_social"
        },
        {
            icon: <MapPin className="w-5 h-5" />,
            label: "Base",
            value: "Digital Nomad, Global"
        }
    ];

    return (
        <main className="relative min-h-screen bg-background overflow-x-hidden">
            <Navbar onAuthClick={handleAuthClick} />

            <section className="pt-40 pb-20 px-6">
                <div className="container mx-auto">
                    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-20">
                        {/* Contact Info */}
                        <div className="flex-1">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                                <h1 className="text-5xl md:text-7xl font-display font-bold mb-8">
                                    Get in <span className="text-gradient-gold">Touch</span>
                                </h1>
                                <p className="text-xl text-muted-foreground font-body leading-relaxed mb-12">
                                    Have a question, feedback, or just want to say hi?
                                    Our team is always listening to the pulse of our community.
                                </p>

                                <div className="space-y-8">
                                    {contactInfo.map((info, index) => (
                                        <div key={index} className="flex items-center gap-6 group">
                                            <div className="p-4 rounded-2xl bg-muted/50 border border-border/30 group-hover:border-primary/50 transition-colors">
                                                {info.icon}
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{info.label}</p>
                                                <p className="text-lg font-body font-medium">{info.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        {/* Contact Form */}
                        <div className="flex-1 lg:max-w-md">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="glass-noire p-8 md:p-10 rounded-[2.5rem] border border-border/30 shadow-noire-elevated"
                            >
                                <form className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-body font-medium text-muted-foreground ml-1">Full Name</label>
                                        <input
                                            type="text"
                                            placeholder="Alex Rivers"
                                            className="w-full px-6 py-4 rounded-2xl bg-background/50 border border-border/30 focus:border-primary/50 outline-none transition-all font-body text-foreground"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-body font-medium text-muted-foreground ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="alex@example.com"
                                            className="w-full px-6 py-4 rounded-2xl bg-background/50 border border-border/30 focus:border-primary/50 outline-none transition-all font-body text-foreground"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-body font-medium text-muted-foreground ml-1">Message</label>
                                        <textarea
                                            rows={4}
                                            placeholder="What's on your mind?"
                                            className="w-full px-6 py-4 rounded-2xl bg-background/50 border border-border/30 focus:border-primary/50 outline-none transition-all font-body text-foreground resize-none"
                                        ></textarea>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-glow-gold flex items-center justify-center gap-2 group"
                                    >
                                        Send Message
                                        <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </motion.button>
                                </form>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Background Decor */}
            <div className="fixed top-[20%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] -z-10" />
            <div className="fixed bottom-0 right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px] -z-10" />
            <MobileBottomNav onAuthClick={handleAuthClick} />
        </main>
    );
};

export default Contact;
