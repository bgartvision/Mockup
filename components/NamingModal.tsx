import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons';

interface NamingModalProps {
    isOpen: boolean;
    title: string;
    inputLabel: string;
    defaultValue: string;
    buttonText: string;
    onCancel: () => void;
    onSave: (name: string) => void;
}

const NamingModal: React.FC<NamingModalProps> = ({ isOpen, title, inputLabel, defaultValue, buttonText, onCancel, onSave }) => {
    const [name, setName] = useState(defaultValue);

    useEffect(() => {
        if (isOpen) {
            setName(defaultValue);
        }
    }, [isOpen, defaultValue]);

    if (!isOpen) {
        return null;
    }

    const handleSaveClick = () => {
        if (name.trim()) {
            onSave(name.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveClick();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={onCancel}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-[#251740] rounded-lg shadow-xl w-full max-w-md p-6 border border-[#3A2A5D]"
                onClick={e => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name-input" className="block text-sm font-medium text-gray-300 mb-2">
                            {inputLabel}
                        </label>
                        <input
                            id="name-input"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            className="w-full bg-[#3A2A5D] border border-[#4C3A7A] rounded-md px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#F4B83A] focus:border-[#F4B83A]"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button 
                            onClick={onCancel}
                            className="px-4 py-2 bg-[#4C3A7A] hover:bg-[#5E48A7] text-white font-semibold rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveClick}
                            className="px-4 py-2 bg-[#F4B83A] hover:bg-yellow-400 text-black font-bold rounded-md transition-colors"
                        >
                            {buttonText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NamingModal;