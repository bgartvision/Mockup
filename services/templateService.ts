import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import type { ImageItem, ShadingOptions, LightingOptions, TemplateData } from '../types';

// More robust than fetch(dataUrl) for potentially large data URLs
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const parts = dataUrl.split(',');
    if (parts.length < 2) {
        throw new Error('Invalid dataURL format');
    }
    const mimeTypePart = parts[0].match(/:(.*?);/);
    const mimeType = mimeTypePart ? mimeTypePart[1] : 'application/octet-stream';
    const base64Data = parts[1];

    try {
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    } catch (e) {
        console.error("Failed to decode base64 string", e);
        throw new Error("Failed to decode base64 string for blob conversion.");
    }
}

export async function createTemplate(
    name: string,
    backgrounds: ImageItem[],
    shadingOptions: ShadingOptions,
    lightingOptions: LightingOptions,
    logo: ImageItem | null
): Promise<Blob> {
    const zip = new JSZip();

    const templateJson: TemplateData = {
        name,
        backgrounds: [],
        shadingOptions,
        lightingOptions,
    };

    if (logo) {
        const sanitizedLogoName = logo.name.replace(/[^a-z0-9_.-]/gi, '_');
        const logoFileName = `logo_${sanitizedLogoName}`;
        const logoBlob = await dataUrlToBlob(logo.dataUrl);
        zip.file(logoFileName, logoBlob);
        templateJson.logo = {
            name: logo.name,
            fileName: logoFileName,
        };
    }

    for (const bg of backgrounds) {
        if (!bg.placement) continue;

        // Sanitize the background name to create a valid file name
        const sanitizedBgName = bg.name.replace(/[^a-z0-9_.-]/gi, '_');
        const fileName = `${uuidv4()}_${sanitizedBgName}`;
        
        const blob = await dataUrlToBlob(bg.dataUrl);
        zip.file(fileName, blob);
        
        templateJson.backgrounds.push({
            id: bg.id,
            name: bg.name,
            placement: bg.placement,
            logoPlacement: bg.logoPlacement,
            fileName: fileName,
        });
    }

    zip.file('template.json', JSON.stringify(templateJson, null, 2));

    return zip.generateAsync({ type: 'blob' });
}


export async function loadTemplate(zipFile: File): Promise<{
    backgrounds: ImageItem[];
    shadingOptions: ShadingOptions;
    lightingOptions: LightingOptions;
    logo: ImageItem | null;
}> {
    const zip = await JSZip.loadAsync(zipFile);
    const templateFile = zip.file('template.json');
    if (!templateFile) {
        throw new Error('template.json not found in the zip file.');
    }

    const templateJson: TemplateData = JSON.parse(await templateFile.async('string'));

    const backgrounds: ImageItem[] = [];
    for (const bgData of templateJson.backgrounds) {
        const imageFile = zip.file(bgData.fileName);
        if (imageFile) {
            const blob = await imageFile.async('blob');
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target?.result as string);
                reader.onerror = e => reject(e);
                reader.readAsDataURL(blob);
            });

            backgrounds.push({
                id: bgData.id || uuidv4(),
                name: bgData.name,
                dataUrl: dataUrl,
                placement: bgData.placement,
                logoPlacement: bgData.logoPlacement,
            });
        }
    }

    let logo: ImageItem | null = null;
    if (templateJson.logo) {
        const logoFile = zip.file(templateJson.logo.fileName);
        if (logoFile) {
            const blob = await logoFile.async('blob');
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target?.result as string);
                reader.onerror = e => reject(e);
                reader.readAsDataURL(blob);
            });
            logo = {
                id: uuidv4(),
                name: templateJson.logo.name,
                dataUrl,
            };
        }
    }

    return {
        backgrounds,
        shadingOptions: templateJson.shadingOptions,
        lightingOptions: templateJson.lightingOptions,
        logo,
    };
}