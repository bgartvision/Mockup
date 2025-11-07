
import React from 'react';
import { LogoIcon, HomeIcon, ArrowLeftIcon } from './icons';

interface HeaderProps {
    showNavButtons: boolean;
    onHomeClick: () => void;
    onBackClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ showNavButtons, onHomeClick, onBackClick }) => {
    return (
        <header className="bg-slate-800/80 backdrop-blur-sm p-4 sticky top-0 z-10 border-b border-slate-700">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <LogoIcon className="w-8 h-8 text-cyan-500" />
                    <h1 className="text-xl font-bold text-white">
                        BGArt <span className="text-slate-400 font-normal">Mockup</span>
                    </h1>
                </div>
                {showNavButtons && (
                    <div className="flex items-center gap-4">
                        <button onClick={onBackClick} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                            <ArrowLeftIcon className="w-5 h-5" />
                            <span className="text-sm font-medium">Back</span>
                        </button>
                        <button onClick={onHomeClick} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                            <HomeIcon className="w-5 h-5" />
                             <span className="text-sm font-medium">Home</span>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
