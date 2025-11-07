
import React from 'react';

interface ControlSectionProps {
    number: number;
    title: string;
    isEnabled: boolean;
    children: React.ReactNode;
}

const ControlSection: React.FC<ControlSectionProps> = ({ number, title, isEnabled, children }) => {
    return (
        <div className={`border-l-4 p-4 rounded-r-lg transition-all duration-300 ${isEnabled ? 'border-cyan-500 bg-gray-900/50' : 'border-gray-600 bg-gray-900/20 opacity-50 pointer-events-none'}`}>
            <div className="flex items-center mb-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-lg mr-3 ${isEnabled ? 'bg-cyan-500 text-black' : 'bg-gray-600 text-gray-300'}`}>
                    {number}
                </div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
            </div>
            <div className="pl-11">
                {children}
            </div>
        </div>
    );
};

export default ControlSection;
