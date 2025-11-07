
import React from 'react';
import { SiksakLogoIcon, HomeIcon, ArrowLeftIcon } from './icons';

interface HeaderProps {
    showNavButtons: boolean;
    onHomeClick: () => void;
    onBackClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ showNavButtons, onHomeClick, onBackClick }) => {
    return (
        <header className="bg-[#251740]/80 backdrop-blur-sm p-4 sticky top-0 z-10 border-b border-[#3A2A5D]">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <SiksakLogoIcon className="w-8 h-8" />
                    <h1 className="text-xl font-bold text-white">
                        Şik<span className="text-[#F4B83A]">&</span>Şak <span className="text-gray-400 font-normal">Mockup</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    {showNavButtons && (
                        <>
                            <button onClick={onBackClick} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                                <ArrowLeftIcon className="w-5 h-5" />
                                <span className="text-sm font-medium">Back</span>
                            </button>
                            <button onClick={onHomeClick} className="flex items-center gap-2 text-[#F4B83A] hover:text-yellow-400 transition-colors">
                                <HomeIcon className="w-5 h-5" />
                                 <span className="text-sm font-medium">Home</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
