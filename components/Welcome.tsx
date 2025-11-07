
import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon, FileZipIcon } from './icons';

interface WelcomeProps {
    onUpload: (files: FileList) => void;
    onTemplateLoad: (file: File) => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onUpload, onTemplateLoad }) => {
    const uploadRef = useRef<HTMLInputElement>(null);
    const templateRef = useRef<HTMLInputElement>(null);
    const [isBgDragOver, setIsBgDragOver] = useState(false);
    const [isTemplateDragOver, setIsTemplateDragOver] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, callback: (files: any) => void) => {
        if (e.target.files && e.target.files.length > 0) {
            callback(e.target.files);
        }
        e.target.value = '';
    };

    // Generic drag handlers
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    // Backgrounds Drop Zone Handlers
    const handleBgDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsBgDragOver(true);
    }, []);

    const handleBgDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsBgDragOver(false);
    }, []);

    const handleBgDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsBgDragOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            onUpload(files);
        }
    }, [onUpload]);

    // Template Drop Zone Handlers
    const handleTemplateDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsTemplateDragOver(true);
    }, []);
    
    const handleTemplateDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsTemplateDragOver(false);
    }, []);
    
    const handleTemplateDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsTemplateDragOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length === 1 && files[0].name.endsWith('.zip')) {
            onTemplateLoad(files[0]);
        } else {
            alert("Please drop a single .zip file.");
        }
    }, [onTemplateLoad]);


    return (
        <div className="min-h-screen bg-[#1A0F2D] flex flex-col items-center justify-center p-8 relative">
            <div className="text-center mb-12">
                 <h1 className="text-5xl font-bold text-white">Get Started</h1>
                 <p className="text-xl text-gray-300 mt-2">Upload your images or load a project template.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
                {/* UPLOAD BACKGROUNDS CARD */}
                <div className="bg-[#251740] p-8 rounded-xl border border-[#3A2A5D] flex flex-col text-center">
                    <div className="w-16 h-16 bg-[#1A0F2D] text-[#F4B83A] rounded-full flex items-center justify-center mx-auto mb-6">
                        <UploadIcon className="w-8 h-8"/>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Upload Backgrounds</h3>
                    <p className="text-gray-400 mb-6 flex-grow">Start with your own background images to place products on.</p>
                    <div
                        onDrop={handleBgDrop}
                        onDragOver={handleDragOver}
                        onDragEnter={handleBgDragEnter}
                        onDragLeave={handleBgDragLeave}
                        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors duration-200 ${isBgDragOver ? 'border-[#F4B83A] bg-[#3A2A5D]' : 'border-[#4C3A7A]'}`}
                    >
                        <UploadIcon className="w-8 h-8 text-gray-500 mb-2" />
                        <p className="text-sm font-semibold text-gray-300">Drag & Drop Images Here</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP</p>
                    </div>
                    <div className="text-gray-500 text-sm my-4">— or —</div>
                    <button onClick={() => uploadRef.current?.click()} className="w-full bg-[#F4B83A] hover:bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg transition-colors">
                        Select Files
                    </button>
                </div>

                {/* LOAD TEMPLATE CARD */}
                 <div className="bg-[#251740] p-8 rounded-xl border border-[#3A2A5D] flex flex-col text-center">
                    <div className="w-16 h-16 bg-[#1A0F2D] text-[#F4B83A] rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileZipIcon className="w-8 h-8"/>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Load Template</h3>
                    <p className="text-gray-400 mb-6 flex-grow">Load a .zip template with all your saved settings and backgrounds.</p>
                    <div
                        onDrop={handleTemplateDrop}
                        onDragOver={handleDragOver}
                        onDragEnter={handleTemplateDragEnter}
                        onDragLeave={handleTemplateDragLeave}
                        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors duration-200 ${isTemplateDragOver ? 'border-[#F4B83A] bg-[#3A2A5D]' : 'border-[#4C3A7A]'}`}
                    >
                        <FileZipIcon className="w-8 h-8 text-gray-500 mb-2" />
                        <p className="text-sm font-semibold text-gray-300">Drag & Drop .zip File Here</p>
                        <p className="text-xs text-gray-500 mt-1">A single .zip file</p>
                    </div>
                    <div className="text-gray-500 text-sm my-4">— or —</div>
                    <button onClick={() => templateRef.current?.click()} className="w-full bg-[#F4B83A] hover:bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg transition-colors">
                        Select .zip File
                    </button>
                </div>
            </div>

            {/* Hidden file inputs */}
            <input
                ref={uploadRef}
                type="file"
                multiple
                accept="image/jpeg, image/png, image/webp"
                className="hidden"
                onChange={(e) => handleFileChange(e, (files) => onUpload(files))}
            />
            <input
                ref={templateRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => handleFileChange(e, (files) => onTemplateLoad(files[0]))}
            />
        </div>
    );
};

export default Welcome;
