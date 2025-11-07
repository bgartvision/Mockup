
import React from 'react';
import { CheckIcon } from './icons';

interface ControlSectionProps {
    number: number;
    title: string;
    isEnabled: boolean;
    children: React.ReactNode;
    isComplete?: boolean;
}

const ControlSection: React.FC<ControlSectionProps> = ({ number, title, isEnabled, children, isComplete }) => {
    return (
        <div className={`transition-all duration-300 ${isEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
             <div className="flex items-center mb-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-lg mr-3 ${isComplete ? 'bg-green-500 text-white' : 'bg-[#F4B83A] text-black'}`}>
                    {isComplete ? <CheckIcon className="w-5 h-5"/> : number}
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