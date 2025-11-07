import React, { useRef, useEffect } from 'react';
import type { ImageItem, ShadingOptions, LightingOptions } from '../types';
import { drawMockupOnCanvas } from '../services/canvasService';

interface EffectsPreviewProps {
    background?: ImageItem;
    product?: ImageItem;
    logo?: ImageItem | null;
    shadingOptions: ShadingOptions;
    lightingOptions: LightingOptions;
}

const EffectsPreview: React.FC<EffectsPreviewProps> = ({ background, product, logo, shadingOptions, lightingOptions }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current && background && product) {
            const tempCanvas = document.createElement('canvas');
            const activeColor = lightingOptions.enabled && lightingOptions.activeColorId
                ? lightingOptions.colors.find(c => c.id === lightingOptions.activeColorId)
                : undefined;
            const lightColor = activeColor?.color;
            
            drawMockupOnCanvas(background, product, shadingOptions, lightingOptions, lightColor, tempCanvas, logo, background.logoPlacement)
                .then(dataUrl => {
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    const img = new Image();
                    img.onload = () => {
                        // Fit image to canvas while maintaining aspect ratio
                        const canvasWidth = canvas.width;
                        const canvasHeight = canvas.height;
                        const hRatio = canvasWidth / img.width;
                        const vRatio = canvasHeight / img.height;
                        const ratio = Math.min(hRatio, vRatio);
                        const centerShift_x = (canvasWidth - img.width * ratio) / 2;
                        const centerShift_y = (canvasHeight - img.height * ratio) / 2;
                        
                        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                        ctx.drawImage(img, 0, 0, img.width, img.height,
                                      centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
                    }
                    img.src = dataUrl;
                })
                .catch(error => console.error("Error drawing preview:", error));
        }
    }, [background, product, logo, shadingOptions, lightingOptions]);

    if (!background || !product) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-800 rounded-lg text-gray-500">
                Select a background and product to see a preview.
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-4 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4">Live Preview</h2>
            <div className="flex-grow flex items-center justify-center bg-gray-900/50 rounded-md overflow-hidden p-2">
                 <canvas ref={canvasRef} className="max-w-full max-h-full" width="1280" height="720"></canvas>
            </div>
        </div>
    );
};

export default EffectsPreview;