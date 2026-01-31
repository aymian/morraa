import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const MigrationNotice = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl border-primary/50 bg-black/95 text-white shadow-[0_0_50px_hsl(var(--primary)/0.3)] animate-in fade-in zoom-in duration-300">
        <CardHeader className="text-center space-y-4 pt-10">
          <CardTitle className="text-4xl md:text-6xl font-black bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
            WE HAVE MOVED!
          </CardTitle>
          <div className="text-2xl font-semibold text-gray-200">
            Big Changes & Better Experience
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-8 pb-10 text-center">
          <p className="text-xl md:text-2xl text-gray-400 max-w-lg leading-relaxed">
            We've completely revamped our platform to give you the best experience possible. 
            This version is no longer supported.
          </p>
          
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 w-full max-w-md">
            <p className="text-sm text-gray-500 mb-2 uppercase tracking-wider font-bold">New Destination</p>
            <a 
              href="https://credaa.vercel.app" 
              className="text-3xl font-mono font-bold text-primary hover:text-primary/80 transition-colors break-all"
            >
              credaa.vercel.app
            </a>
          </div>

          <Button 
            size="lg" 
            className="w-full max-w-md h-16 text-xl font-bold rounded-xl shadow-lg hover:shadow-primary/25 hover:scale-105 transition-all duration-300"
            onClick={() => window.location.href = "https://credaa.vercel.app"}
          >
            Go to New Website <ExternalLink className="ml-2 h-6 w-6" />
          </Button>
          
          <p className="text-sm text-gray-600 animate-pulse">
            You will be redirected shortly...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MigrationNotice;
