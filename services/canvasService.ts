
import type { ImageItem, ShadingOptions, LightingOptions, Placement } from '../types';

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
    canvasElement?: HTMLCanvasElement,
    logo?: ImageItem | null,
    productPlacement?: Placement,
    logoPlacementOverride?: Placement
): Promise<string> {
    const canvas = canvasElement || document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    const finalProductPlacement = productPlacement || background.placement;
    const finalLogoPlacement = logoPlacementOverride || background.logoPlacement;

    if (!finalProductPlacement) throw new Error('Background placement is not set');

    const bgImage = await loadImage(background.dataUrl);
    const productImage = await loadImage(product.dataUrl);

    // Fit canvas to image while maintaining aspect ratio, for preview
    if (canvasElement) {
        const parent = canvasElement.parentElement;
        if (parent) {
            const { clientWidth, clientHeight } = parent;
            const hRatio = clientWidth / bgImage.width;
            const vRatio = clientHeight / bgImage.height;
            const ratio = Math.min(hRatio, vRatio, 1);
            canvas.width = bgImage.width * ratio;
            canvas.height = bgImage.height * ratio;
        } else {
             canvas.width = bgImage.width;
             canvas.height = bgImage.height;
        }
    } else { // Use full resolution for final generation
        canvas.width = bgImage.width;
        canvas.height = bgImage.height;
    }


    // 1. Draw background
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

    // 2. Apply background darkness if lighting is enabled
    if (lighting.enabled) {
        ctx.fillStyle = `rgba(0, 0, 0, ${lighting.backgroundDarkness / 100})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.filter = 'none';

    // 3. Apply shading effect
    if (shading.enabled) {
        const scaleFactor = canvas.width / bgImage.width;
        const angleRad = (shading.angle * Math.PI) / 180;
        ctx.shadowColor = `rgba(0, 0, 0, ${shading.opacity / 100})`;
        ctx.shadowBlur = shading.blur * scaleFactor;
        ctx.shadowOffsetX = Math.cos(angleRad) * shading.distance * scaleFactor;
        ctx.shadowOffsetY = Math.sin(angleRad) * shading.distance * scaleFactor;
    }
    
    // 4. Apply lighting effect
    if (lighting.enabled && lightColor) {
        const scaleFactor = canvas.width / bgImage.width;
        const glows = [];
        for (let i = 0; i < 5; i++) { 
            glows.push(`drop-shadow(0 0 ${lighting.intensity * (i + 1) * 0.5 * scaleFactor}px ${lightColor})`);
        }
        ctx.filter = glows.join(' ');
    }

    // 5. Draw product image
    const { x, y, width, height } = finalProductPlacement;
    const destX = x * canvas.width;
    const destY = y * canvas.height;
    const destWidth = width * canvas.width;
    const destHeight = height * canvas.height;
    
    ctx.drawImage(productImage, destX, destY, destWidth, destHeight);

    // 6. Draw logo
    if (logo && finalLogoPlacement) {
        try {
            const logoImage = await loadImage(logo.dataUrl);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.filter = 'none';

            const { x: logoX, y: logoY, width: logoWidth, height: logoHeight } = finalLogoPlacement;
            const logoDestX = logoX * canvas.width;
            const logoDestY = logoY * canvas.height;
            const logoDestWidth = logoWidth * canvas.width;
            const logoDestHeight = logoHeight * canvas.height;
            
            ctx.drawImage(logoImage, logoDestX, logoDestY, logoDestWidth, logoDestHeight);
        } catch (error) {
            console.error("Failed to load or draw logo:", error);
        }
    }

    return canvas.toDataURL('image/jpeg', 0.9);
}
