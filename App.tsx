import React, { useState, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import type { ImageItem, ShadingOptions, LightingOptions, WorkspaceView, Placement, ResultItem, LightingColor } from './types';
import Header from './components/Header';
import ControlSection from './components/ControlSection';
import ImageUploader from './components/ImageUploader';
import Gallery from './components/Gallery';
import PlacementEditor from './components/PlacementEditor';
import GeminiBackgroundGenerator from './components/GeminiBackgroundGenerator';
import EffectsEditor from './components/EffectsEditor';
import EffectsPreview from './components/EffectsPreview';
import { WelcomeIcon, DownloadIcon, RestartIcon, TrashIcon } from './components/icons';
import { drawMockupOnCanvas } from './services/canvasService';
import { createTemplate, loadTemplate } from './services/templateService';

const DEFAULT_SHADING: ShadingOptions = { enabled: true, angle: 135, distance: 10, blur: 20, opacity: 50 };
const initialDefaultColorId = uuidv4();
const DEFAULT_LIGHTING: LightingOptions = { enabled: false, intensity: 15, backgroundDarkness: 70, colors: [{ id: initialDefaultColorId, color: '#00ffff' }], activeColorId: initialDefaultColorId };

function App() {
    const [backgrounds, setBackgrounds] = useState<ImageItem[]>([]);
    const [products, setProducts] = useState<ImageItem[]>([]);
    const [logo, setLogo] = useState<ImageItem | null>(null);
    const [shadingOptions, setShadingOptions] = useState<ShadingOptions>(DEFAULT_SHADING);
    const [lightingOptions, setLightingOptions] = useState<LightingOptions>(DEFAULT_LIGHTING);
    
    const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('welcome');
    const [activePlacementEditor, setActivePlacementEditor] = useState<ImageItem | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [results, setResults] = useState<ResultItem[]>([]);
    const [activeBgTab, setActiveBgTab] = useState<'upload' | 'ai' | 'template'>('upload');

    const allPlacementsSet = useMemo(() => 
        backgrounds.length > 0 && 
        backgrounds.every(bg => !!bg.placement && (!logo || !!bg.logoPlacement)), 
    [backgrounds, logo]);
    const isStep2Enabled = allPlacementsSet;
    const isStep3Enabled = isStep2Enabled && products.length > 0;
    const isStep4Enabled = isStep3Enabled;

    const handleFileToImageItem = (file: File): Promise<ImageItem> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                resolve({
                    id: uuidv4(),
                    name: file.name,
                    dataUrl: event.target?.result as string,
                });
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };

    const addImages = async (files: FileList | null, type: 'background' | 'product') => {
        if (!files) return;
        setIsLoading(true);
        setLoadingMessage(`Loading ${type}s...`);
        const newItems = await Promise.all(Array.from(files).map(handleFileToImageItem));
        if (type === 'background') {
            setBackgrounds(prev => [...prev, ...newItems]);
        } else {
            setProducts(prev => [...prev, ...newItems]);
            if (workspaceView === 'welcome') setWorkspaceView('preview');
        }
        setIsLoading(false);
    };

    const addAiBackground = (item: ImageItem) => {
        setBackgrounds(prev => [...prev, item]);
    };
    
    const handleLogoUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        const newItem = await handleFileToImageItem(file);
        setLogo(newItem);
    };
    
    const deleteLogo = () => {
        setLogo(null);
    };

    const deleteImage = (id: string, type: 'background' | 'product') => {
        if (type === 'background') {
            setBackgrounds(prev => prev.filter(item => item.id !== id));
        } else {
            setProducts(prev => prev.filter(item => item.id !== id));
            if (products.length === 1) setWorkspaceView('welcome');
        }
    };
    
    const savePlacements = (id: string, placements: { product: Placement; logo?: Placement }) => {
        setBackgrounds(prev => prev.map(bg => bg.id === id ? { ...bg, placement: placements.product, logoPlacement: placements.logo } : bg));
        setActivePlacementEditor(null);
    };

    const handleGenerateMockups = async () => {
        setIsLoading(true);
        setLoadingMessage('Generating mockups...');
        const newResults: ResultItem[] = [];
        
        const generationJobs: {
            product: ImageItem;
            background: ImageItem;
            shading: ShadingOptions;
            lighting: LightingOptions;
            lightColor: string | undefined;
        }[] = [];

        for (const product of products) {
            const productJobs = [];
            
            if (lightingOptions.enabled && lightingOptions.colors.length > 0) {
                if (shadingOptions.enabled && backgrounds.length > 0) {
                    productJobs.push({
                        product,
                        background: backgrounds[0],
                        shading: shadingOptions,
                        lighting: { ...lightingOptions, enabled: false },
                        lightColor: undefined,
                    });
                }
                
                for (let i = 0; i < Math.min(backgrounds.length, lightingOptions.colors.length); i++) {
                     productJobs.push({
                        product,
                        background: backgrounds[i],
                        shading: shadingOptions,
                        lighting: lightingOptions,
                        lightColor: lightingOptions.colors[i].color,
                    });
                }
            } else {
                for (const background of backgrounds) {
                    productJobs.push({
                        product,
                        background,
                        shading: shadingOptions,
                        lighting: lightingOptions,
                        lightColor: undefined,
                    });
                }
            }
            generationJobs.push(...productJobs);
        }
        
        const uniqueJobs = [...new Map(generationJobs.map(job => 
            [`${job.product.id}-${job.background.id}-${job.lightColor || 'no-color'}`, job]
        )).values()];

        const total = uniqueJobs.length;
        if (total === 0) {
            setIsLoading(false);
            return;
        }
        
        let count = 0;
        for (const job of uniqueJobs) {
            count++;
            setLoadingMessage(`Generating... (${count}/${total})`);
            const dataUrl = await drawMockupOnCanvas(job.background, job.product, job.shading, job.lighting, job.lightColor, undefined, logo, job.background.logoPlacement);
            newResults.push({
                id: uuidv4(),
                productId: job.product.id,
                productName: job.product.name,
                backgroundName: job.background.name,
                lightColor: job.lightColor,
                dataUrl,
            });
        }

        setResults(newResults);
        setWorkspaceView('results');
        setIsLoading(false);
    };

    const handleDownloadAll = async () => {
        setIsLoading(true);
        setLoadingMessage("Zipping files...");
        const zip = new JSZip();
        results.forEach(result => {
            const productFolder = result.productName.replace(/\.[^/.]+$/, "");
            const fileName = `${result.backgroundName.replace(/\.[^/.]+$/, "")}${result.lightColor ? `_${result.lightColor}`: ''}.jpg`;
            zip.folder(productFolder)?.file(fileName, result.dataUrl.split(',')[1], { base64: true });
        });
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "mockups.zip");
        setIsLoading(false);
    };

    const handleDownloadByProduct = async (productId: string) => {
        setIsLoading(true);
        const productResults = results.filter(r => r.productId === productId);
        if (productResults.length === 0) {
            setIsLoading(false);
            return;
        }
        const productName = productResults[0].productName.replace(/\.[^/.]+$/, "");
        setLoadingMessage(`Zipping ${productName}...`);
        const zip = new JSZip();
        productResults.forEach(result => {
            const fileName = `${result.backgroundName.replace(/\.[^/.]+$/, "")}${result.lightColor ? `_${result.lightColor}`: ''}.jpg`;
            zip.file(fileName, result.dataUrl.split(',')[1], { base64: true });
        });
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `mockups_${productName}.zip`);
        setIsLoading(false);
    };

    const handleReset = () => {
        setBackgrounds([]);
        setProducts([]);
        setLogo(null);
        setShadingOptions(DEFAULT_SHADING);
        setLightingOptions(DEFAULT_LIGHTING);
        setResults([]);
        setWorkspaceView('welcome');
        setActiveBgTab('upload');
    };
    
    const handleSaveTemplate = async () => {
        if (!allPlacementsSet) {
            alert("Please set placement for all backgrounds before saving a template.");
            return;
        }
        setIsLoading(true);
        setLoadingMessage('Creating template...');
        try {
            const zipBlob = await createTemplate('My Mockup Template', backgrounds, shadingOptions, lightingOptions);
            saveAs(zipBlob, 'mockup-template.zip');
        } catch (error) {
            console.error('Failed to create template:', error);
            alert('Error creating template.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleLoadTemplate = async (file: File) => {
        setIsLoading(true);
        setLoadingMessage('Loading template...');
        try {
            const { backgrounds: loadedBgs, shadingOptions: loadedShading, lightingOptions: loadedLighting } = await loadTemplate(file);
            handleReset();
            setBackgrounds(loadedBgs);
            setShadingOptions(loadedShading);
            setLightingOptions(loadedLighting);
        } catch (error) {
            console.error('Failed to load template:', error);
            alert('Error loading template. Please check the file format.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderWorkspace = () => {
        switch (workspaceView) {
            case 'preview':
                return <EffectsPreview background={backgrounds[0]} product={products[0]} logo={logo} shadingOptions={shadingOptions} lightingOptions={lightingOptions} />;
            case 'results':
                const groupedResults = products.map(p => ({
                    ...p,
                    mockups: results.filter(r => r.productId === p.id)
                }));
                return (
                     <div className="h-full flex flex-col p-4 md:p-8 bg-gray-800 rounded-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Generated Mockups</h2>
                            <div className="flex gap-2">
                                <button onClick={handleReset} className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                    <RestartIcon /> Start Over
                                </button>
                                <button onClick={handleDownloadAll} className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 px-4 rounded-lg transition-colors">
                                    <DownloadIcon /> Download All (.zip)
                                </button>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto custom-scrollbar pr-4">
                            {groupedResults.map(group => (
                                <div key={group.id} className="mb-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-semibold text-gray-200">{group.name}</h3>
                                        <button onClick={() => handleDownloadByProduct(group.id)} className="flex items-center gap-2 text-sm bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-1 px-3 rounded-md transition-colors">
                                            <DownloadIcon className="w-4 h-4" /> Download Product (.zip)
                                        </button>
                                    </div>
                                    <Gallery images={group.mockups} type="result" />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'welcome':
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8 bg-gray-800 rounded-lg">
                        <WelcomeIcon className="w-32 h-32 mb-6 text-gray-600" />
                        <h2 className="text-3xl font-bold text-white mb-2">Welcome to the Mockup Generator</h2>
                        <p className="max-w-md">
                            Follow the steps on the left to upload your backgrounds and products, apply effects, and generate stunning mockups in seconds.
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-900">
            <Header />
            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="text-center">
                        <svg className="animate-spin h-10 w-10 text-cyan-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-xl text-white font-semibold">{loadingMessage}</p>
                    </div>
                </div>
            )}
            {activePlacementEditor && (
                <PlacementEditor
                    background={activePlacementEditor}
                    logo={logo}
                    onClose={() => setActivePlacementEditor(null)}
                    onSave={savePlacements}
                />
            )}
            <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
                <div className="lg:col-span-1 bg-gray-800 rounded-lg p-4 overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                        {/* Step 1 */}
                        <ControlSection number={1} title="Add Backgrounds & Logo" isEnabled={true}>
                             <div className="flex border-b border-gray-700 mb-4">
                                {(['upload', 'ai', 'template'] as const).map(tab => (
                                    <button key={tab} onClick={() => setActiveBgTab(tab)} className={`capitalize px-4 py-2 text-sm font-medium transition-colors ${activeBgTab === tab ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400 hover:text-white'}`}>
                                        {tab === 'ai' ? 'AI Generate' : tab}
                                    </button>
                                ))}
                            </div>
                            {activeBgTab === 'upload' && <ImageUploader onUpload={(files) => addImages(files, 'background')} />}
                            {activeBgTab === 'ai' && <GeminiBackgroundGenerator onGenerationComplete={addAiBackground} setIsLoading={setIsLoading} setLoadingMessage={setLoadingMessage} />}
                            {activeBgTab === 'template' && <div className="p-4 bg-gray-900/50 rounded-lg"><label className="block text-sm font-medium text-gray-300 mb-2">Load from .zip template:</label><input type="file" accept=".zip" onChange={(e) => e.target.files && handleLoadTemplate(e.target.files[0])} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"/></div>}
                            <Gallery images={backgrounds} type="background" onDelete={deleteImage} onEditPlacement={(id) => setActivePlacementEditor(backgrounds.find(bg => bg.id === id) || null)} isLogoActive={!!logo} />
                             <div className="mt-4 pt-4 border-t border-gray-700">
                                <h3 className="text-base font-semibold text-gray-200 mb-2">Optional: Add Logo</h3>
                                {logo ? (
                                    <div className="flex items-center gap-3 p-2 bg-gray-900/50 rounded-lg">
                                        <img src={logo.dataUrl} alt={logo.name} className="w-12 h-12 object-cover rounded-md" />
                                        <div className="flex-grow text-sm text-gray-300 truncate">
                                            {logo.name}
                                        </div>
                                        <button onClick={deleteLogo} className="p-1.5 bg-red-600/80 hover:bg-red-500 rounded-full text-white transition-colors">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <label htmlFor="logo-upload" className="w-full text-center cursor-pointer p-4 border-2 border-dashed border-gray-600 hover:border-cyan-500 hover:bg-gray-800 rounded-lg block text-sm text-gray-400">
                                            Click to upload logo
                                            <span className="block text-xs text-gray-500 mt-1">PNG or JPG, 500x500px recommended</span>
                                        </label>
                                         <input id="logo-upload" type="file" accept="image/jpeg, image/png" className="hidden" onChange={(e) => handleLogoUpload(e.target.files)} />
                                    </div>
                                )}
                            </div>
                        </ControlSection>

                        {/* Step 2 */}
                        <ControlSection number={2} title="Add Products" isEnabled={isStep2Enabled}>
                            <ImageUploader onUpload={(files) => addImages(files, 'product')} />
                            <Gallery images={products} type="product" onDelete={deleteImage} />
                        </ControlSection>

                        {/* Step 3 */}
                        <ControlSection number={3} title="Apply Effects" isEnabled={isStep3Enabled}>
                            <EffectsEditor 
                                shadingOptions={shadingOptions} 
                                onShadingChange={setShadingOptions}
                                lightingOptions={lightingOptions}
                                onLightingChange={setLightingOptions}
                            />
                        </ControlSection>

                        {/* Step 4 */}
                        <ControlSection number={4} title="Generate & Download" isEnabled={isStep4Enabled}>
                            <button onClick={handleGenerateMockups} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-4 rounded-lg transition-colors text-lg">
                                Generate All Mockups
                            </button>
                             {backgrounds.length > 0 && <button onClick={handleSaveTemplate} className="w-full mt-4 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-base">
                                Save Settings as Template
                            </button>}
                        </ControlSection>
                    </div>
                </div>
                <div className="lg:col-span-2 min-h-[60vh] lg:min-h-0">
                    {renderWorkspace()}
                </div>
            </main>
        </div>
    );
}

export default App;