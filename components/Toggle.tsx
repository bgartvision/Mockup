import React from 'react';
import { EyeIcon, EyeOffIcon } from './icons';

interface ToggleProps {
    label: string;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    previewVisible?: boolean;
    onPreviewToggle?: (visible: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({ label, enabled, onChange, previewVisible, onPreviewToggle }) => (
    <div className="flex items-center justify-between">
        <span className="font-semibold text-white">{label}</span>
        <div className="flex items-center gap-4">
            {enabled && onPreviewToggle && typeof previewVisible !== 'undefined' && (
                <button
                    onClick={() => onPreviewToggle(!previewVisible)}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label={previewVisible ? 'Hide effect in preview' : 'Show effect in preview'}
                >
                    {previewVisible ? <EyeIcon className="w-5 h-5" /> : <EyeOffIcon className="w-5 h-5" />}
                </button>
            )}
            <label className="inline-flex relative items-center cursor-pointer">
                <input type="checkbox" checked={enabled} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-[#4C3A7A] rounded-full peer peer-focus:ring-2 peer-focus:ring-[#F4B83A] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F4B83A]"></div>
            </label>
        </div>
    </div>
);

export default Toggle;