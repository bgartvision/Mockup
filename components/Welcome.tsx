import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon, SparklesIcon, FileZipIcon, LogoIcon } from './icons';

interface WelcomeProps {
    onUpload: (files: FileList) => void;
    onAiGenerate: () => void;
    onTemplateLoad: (file: File) => void;
}

// Card for simple actions like AI Generate
const ActionCard = ({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) => (
    <div 
        onClick={onClick}
        className="bg-slate-800 p-8 rounded-xl border border-slate-700 hover:border-cyan-500 hover:bg-slate-700/50 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 text-center flex flex-col items-center justify-center"
    >
        <div className="w-16 h-16 bg-slate-900 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400">{description}</p>
    </div>
);


const Welcome: React.FC<WelcomeProps> = ({ onUpload, onAiGenerate, onTemplateLoad }) => {
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
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
            <div className="text-center mb-12">
                 <div className="flex items-center justify-center gap-4 mb-4">
                    <LogoIcon className="w-12 h-12 text-cyan-500" />
                    <h1 className="text-5xl font-bold text-white">
                        BGArt <span className="text-slate-400 font-normal">Mockup</span>
                    </h1>
                </div>
                <p className="text-xl text-slate-300">Create stunning product presentations in seconds.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl w-full">
                {/* UPLOAD BACKGROUNDS CARD */}
                <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 flex flex-col text-center">
                    <div className="w-16 h-16 bg-slate-900 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <UploadIcon className="w-8 h-8"/>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Upload Backgrounds</h3>
                    <p className="text-slate-400 mb-6 flex-grow">Start with your own background images to place products on.</p>
                    <div
                        onDrop={handleBgDrop}
                        onDragOver={handleDragOver}
                        onDragEnter={handleBgDragEnter}
                        onDragLeave={handleBgDragLeave}
                        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors duration-200 ${isBgDragOver ? 'border-cyan-400 bg-slate-700' : 'border-slate-600'}`}
                    >
                        <UploadIcon className="w-8 h-8 text-slate-500 mb-2" />
                        <p className="text-sm font-semibold text-slate-300">Drag & Drop Images Here</p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP</p>
                    </div>
                    <div className="text-slate-500 text-sm my-4">— or —</div>
                    <button onClick={() => uploadRef.current?.click()} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Select Files
                    </button>
                </div>

                {/* AI GENERATE CARD */}
                <ActionCard 
                    icon={<SparklesIcon className="w-8 h-8"/>}
                    title="Generate with AI"
                    description="Describe the perfect scene and let AI create unique backgrounds for you."
                    onClick={onAiGenerate}
                />

                {/* LOAD TEMPLATE CARD */}
                 <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 flex flex-col text-center">
                    <div className="w-16 h-16 bg-slate-900 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileZipIcon className="w-8 h-8"/>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Load Template</h3>
                    <p className="text-slate-400 mb-6 flex-grow">Load a .zip template with all your saved settings and backgrounds.</p>
                    <div
                        onDrop={handleTemplateDrop}
                        onDragOver={handleDragOver}
                        onDragEnter={handleTemplateDragEnter}
                        onDragLeave={handleTemplateDragLeave}
                        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors duration-200 ${isTemplateDragOver ? 'border-cyan-400 bg-slate-700' : 'border-slate-600'}`}
                    >
                        <FileZipIcon className="w-8 h-8 text-slate-500 mb-2" />
                        <p className="text-sm font-semibold text-slate-300">Drag & Drop .zip File Here</p>
                        <p className="text-xs text-slate-500 mt-1">A single .zip file</p>
                    </div>
                    <div className="text-slate-500 text-sm my-4">— or —</div>
                    <button onClick={() => templateRef.current?.click()} className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
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
