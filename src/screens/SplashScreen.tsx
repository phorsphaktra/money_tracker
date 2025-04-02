import { useEffect, useState } from 'react';

export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold text-white mb-4 animate-fade-in">
          Money Tracker
        </h1>
        <div className="relative">
          <div className="animate-pulse w-16 h-16 bg-white/30 rounded-full mx-auto"></div>
          <div className="absolute top-0 left-1/2 -ml-8 w-16 h-16">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
