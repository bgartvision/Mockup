import React from 'react';
import { SiksakLogoIcon } from './icons';

interface SplashScreenProps {
    onStart: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onStart }) => {
    return (
        <div className="min-h-screen bg-[#1A0F2D] flex flex-col items-center justify-center p-8 text-white text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                <SiksakLogoIcon className="w-24 h-24" />
                <div className="flex flex-col">
                    <h1 className="text-7xl font-bold tracking-tighter">
                        Şik<span className="text-[#F4B83A]">&</span>Şak
                    </h1>
                    <h2 className="text-4xl font-light text-gray-300 text-right -mt-2">
                        Mockup
                    </h2>
                </div>
            </div>
            <p className="text-xl text-gray-400 mb-12 max-w-lg">
                Şikşak’la yükle, hayranlıkla izle.
            </p>
            <button
                onClick={onStart}
                className="bg-[#F4B83A] hover:bg-yellow-400 text-black font-bold py-4 px-12 rounded-lg text-2xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-yellow-500/20"
            >
                Şikşak’la Başla
            </button>
        </div>
    );
};

export default SplashScreen;