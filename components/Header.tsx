
import React from 'react';
import { LogoIcon } from './icons';

const Header: React.FC = () => {
    return (
        <header className="bg-gray-800/50 backdrop-blur-sm p-4 sticky top-0 z-10 border-b border-gray-700">
            <div className="container mx-auto flex items-center gap-3">
                <LogoIcon className="w-8 h-8 text-cyan-400" />
                <h1 className="text-xl font-bold text-white">
                    Batch Mockup <span className="text-gray-400 font-normal">Generator</span>
                </h1>
            </div>
        </header>
    );
};

export default Header;
