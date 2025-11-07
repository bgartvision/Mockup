
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import type { ImageItem, ShadingOptions, LightingOptions, TemplateData } from '../types';

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl);
    return await res.blob();
}

export async function createTemplate(
    name: string,
    backgrounds: ImageItem[],
    shadingOptions: ShadingOptions,
    lightingOptions: LightingOptions
): Promise<Blob> {
    const zip = new JSZip();

    const templateJson: TemplateData = {
        name,
        backgrounds: [],
        shadingOptions,
        lightingOptions,
    };

    for (const bg of backgrounds) {
        if (!bg.placement) continue;
        const fileName = `${uuidv4()}_${bg.name}`;
        const blob = await dataUrlToBlob(bg.dataUrl);
        zip.file(fileName, blob);
        templateJson.backgrounds.push({
            id: bg.id,
            name: bg.name,
            placement: bg.placement,
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
            });
        }
    }

    return {
        backgrounds,
        shadingOptions: templateJson.shadingOptions,
        lightingOptions: templateJson.lightingOptions,
    };
}
