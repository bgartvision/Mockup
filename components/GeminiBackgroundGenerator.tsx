
import React, { useState } from 'react';
import type { ImageItem } from '../types';
import { generateBackgroundImage } from '../services/geminiService';
import { SparklesIcon } from './icons';

interface GeminiBackgroundGeneratorProps {
    onGenerationComplete: (item: ImageItem) => void;
    setIsLoading: (isLoading: boolean) => void;
    setLoadingMessage: (message: string) => void;
}

const GeminiBackgroundGenerator: React.FC<GeminiBackgroundGeneratorProps> = ({ onGenerationComplete, setIsLoading, setLoadingMessage }) => {
    const [prompt, setPrompt] = useState('');
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Prompt cannot be empty.');
            return;
        }
        setError('');
        setIsLoading(true);
        setLoadingMessage('Generating AI background...');
        try {
            const newItem = await generateBackgroundImage(prompt);
            onGenerationComplete(newItem);
            setPrompt('');
        } catch (err) {
            console.error(err);
            setError('Failed to generate image. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-3 p-4 bg-[#251740]/50 rounded-lg">
            <div>
                 <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-1">
                    Describe the background you want to create:
                </label>
                <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A clean, minimalist desk setup with soft morning light"
                    rows={3}
                    className="w-full bg-[#3A2A5D] border border-[#4C3A7A] rounded-md p-2 text-sm text-white focus:ring-[#F4B83A] focus:border-[#F4B83A] placeholder-gray-500"
                />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
                onClick={handleGenerate}
                className="w-full flex items-center justify-center gap-2 bg-[#F4B83A] hover:bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg transition-colors"
            >
                <SparklesIcon /> Generate with AI
            </button>
        </div>
    );
};

export default GeminiBackgroundGenerator;