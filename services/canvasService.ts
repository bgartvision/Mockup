
import type { ImageItem, ShadingOptions, LightingOptions } from '../types';

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
    });
}

export async function drawMockupOnCanvas(
    background: ImageItem,
    product: ImageItem,
    shading: ShadingOptions,
    lighting: LightingOptions,
    lightColor?: string,
    canvasElement?: HTMLCanvasElement
): Promise<string> {
    const canvas = canvasElement || document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    if (!background.placement) throw new Error('Background placement is not set');

    const bgImage = await loadImage(background.dataUrl);
    const productImage = await loadImage(product.dataUrl);

    canvas.width = bgImage.width;
    canvas.height = bgImage.height;

    // 1. Draw background
    ctx.drawImage(bgImage, 0, 0);

    // 2. Apply background darkness if lighting is enabled
    if (lighting.enabled) {
        ctx.fillStyle = `rgba(0, 0, 0, ${lighting.backgroundDarkness / 100})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Reset transformations and effects before drawing product
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.filter = 'none';

    // 3. Apply shading effect
    if (shading.enabled) {
        const angleRad = (shading.angle * Math.PI) / 180;
        ctx.shadowColor = `rgba(0, 0, 0, ${shading.opacity / 100})`;
        ctx.shadowBlur = shading.blur;
        ctx.shadowOffsetX = Math.cos(angleRad) * shading.distance;
        ctx.shadowOffsetY = Math.sin(angleRad) * shading.distance;
    }
    
    // 4. Apply lighting effect
    if (lighting.enabled && lightColor) {
        const glows = [];
        for (let i = 0; i < 5; i++) { // Create multiple layers for a softer glow
            glows.push(`drop-shadow(0 0 ${lighting.intensity * (i + 1) * 0.5}px ${lightColor})`);
        }
        ctx.filter = glows.join(' ');
    }

    // 5. Draw product image
    const { x, y, width, height } = background.placement;
    const destX = x * canvas.width;
    const destY = y * canvas.height;
    const destWidth = width * canvas.width;
    const destHeight = height * canvas.height;
    
    ctx.drawImage(productImage, destX, destY, destWidth, destHeight);

    // 6. Return data URL
    return canvas.toDataURL('image/jpeg', 0.9);
}
