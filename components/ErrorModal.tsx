import React from 'react';
import { CloseIcon, ExclamationTriangleIcon } from './icons';

interface ErrorModalProps {
    message: string;
    onClose: () => void;
}

// Function to parse the message and find URLs
// Fix: Changed JSX.Element to React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
const linkify = (text: string): (string | React.ReactElement)[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
        if (part.match(urlRegex)) {
            return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">{part}</a>;
        }
        return part;
    });
};


const ErrorModal: React.FC<ErrorModalProps> = ({ message, onClose }) => {
    
    // Split the message by newlines to render them as paragraphs
    const messageParts = message.split('\n').filter(p => p).map((part, index) => (
        <p key={index} className="mb-2 last:mb-0">{linkify(part)}</p>
    ));

    return (
        <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-[#251740] rounded-lg shadow-xl w-full max-w-md p-6 border border-red-500/50"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                         <ExclamationTriangleIcon className="w-6 h-6 text-red-400"/>
                        <h2 className="text-xl font-bold text-white">An Error Occurred</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="text-gray-300 text-sm leading-relaxed">
                    {messageParts}
                </div>
                <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-[#3A2A5D]">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-[#4C3A7A] hover:bg-[#5E48A7] text-white font-semibold rounded-md transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorModal;