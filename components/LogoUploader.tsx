import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './icons';

interface LogoUploaderProps {
    onUpload: (files: FileList | null) => void;
}

const LogoUploader: React.FC<LogoUploaderProps> = ({ onUpload }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            onUpload(files);
        }
    }, [onUpload]);
    
    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpload(e.target.files);
        e.target.value = '';
    };

    return (
        <div
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ${isDragOver ? 'border-cyan-400 bg-slate-700' : 'border-slate-600 hover:border-cyan-500 hover:bg-slate-700/50'}`}
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg, image/png, image/webp"
                className="hidden"
                onChange={handleFileChange}
            />
            <UploadIcon className="w-10 h-10 text-slate-500 mb-3" />
            <p className="text-center text-slate-400">
                <span className="font-semibold text-cyan-500">Click to upload logo</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500 mt-1">PNG or JPG, 500x500px recommended</p>
        </div>
    );
};

export default LogoUploader;
