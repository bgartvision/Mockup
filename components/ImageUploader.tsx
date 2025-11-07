
import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
    onUpload: (files: FileList | null) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload }) => {
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
        // Reset input value to allow uploading the same file again
        e.target.value = '';
    };

    return (
        <div
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ${isDragOver ? 'border-[#F4B83A] bg-[#3A2A5D]' : 'border-[#4C3A7A] hover:border-[#F4B83A] hover:bg-[#251740]/50'}`}
        >
            <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/jpeg, image/png, image/webp"
                className="hidden"
                onChange={handleFileChange}
            />
            <UploadIcon className="w-10 h-10 text-gray-500 mb-3" />
            <p className="text-center text-gray-400">
                <span className="font-semibold text-[#F4B83A]">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP</p>
        </div>
    );
};

export default ImageUploader;