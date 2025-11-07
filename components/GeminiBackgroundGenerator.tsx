
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
        <div className="space-y-3 p-4 bg-slate-900/50 rounded-lg">
            <div>
                 <label htmlFor="prompt" className="block text-sm font-medium text-slate-300 mb-1">
                    Describe the background you want to create:
                </label>
                <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A clean, minimalist desk setup with soft morning light"
                    rows={3}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm text-white focus:ring-cyan-500 focus:border-cyan-500 placeholder-slate-500"
                />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
                onClick={handleGenerate}
                className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                <SparklesIcon /> Generate with AI
            </button>
        </div>
    );
};

export default GeminiBackgroundGenerator;