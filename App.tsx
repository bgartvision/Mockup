import React, { useState, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import type { ImageItem, ShadingOptions, LightingOptions, WorkspaceView, Placement, ResultItem } from './types';
import Header from './components/Header';
import ControlSection from './components/ControlSection';
import ImageUploader from './components/ImageUploader';
import Gallery from './components/Gallery';
import GeminiBackgroundGenerator from './components/GeminiBackgroundGenerator';
import EffectsEditor from './components/EffectsEditor';
import EffectsPreview from './components/EffectsPreview';
import Welcome from './components/Welcome';
import { WelcomeIcon, DownloadIcon, RestartIcon, TrashIcon } from './components/icons';
import { drawMockupOnCanvas } from './services/canvasService';
import { createTemplate, loadTemplate } from './services/templateService';
import Toggle from './components/Toggle';
import LogoUploader from './components/LogoUploader';
import NamingModal from './components/NamingModal';

const DEFAULT_SHADING: ShadingOptions = { enabled: true, angle: 135, distance: 10, blur: 20, opacity: 50, previewVisible: true };
const initialDefaultColorId = uuidv4();
const DEFAULT_LIGHTING: LightingOptions = { enabled: false, intensity: 15, backgroundDarkness: 70, colors: [{ id: initialDefaultColorId, color: '#00ffff' }], activeColorId: initialDefaultColorId, previewVisible: false };

interface NamingModalConfig {
    title: string;
    inputLabel: string;
    defaultValue: string;
    buttonText: string;
    onSave: (name: string) => void;
}

function App() {
    const [appState, setAppState] = useState<'welcome' | 'editing'>('welcome');
    const [backgrounds, setBackgrounds] = useState<ImageItem[]>([]);
    const [products, setProducts] = useState<ImageItem[]>([]);
    const [logo, setLogo] = useState<ImageItem | null>(null);
    const [isLogoEnabled, setIsLogoEnabled] = useState(false);
    const [shadingOptions, setShadingOptions] = useState<ShadingOptions>(DEFAULT_SHADING);
    const [lightingOptions, setLightingOptions] = useState<LightingOptions>(DEFAULT_LIGHTING);
    
    const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('welcome');
    const [selectedPreviewBgId, setSelectedPreviewBgId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [results, setResults] = useState<ResultItem[]>([]);
    const [activeBgTab, setActiveBgTab] = useState<'upload' | 'ai' | 'template'>('upload');
    const [namingModalConfig, setNamingModalConfig] = useState<NamingModalConfig | null>(null);


    const allPlacementsSet = useMemo(() => 
        backgrounds.length > 0 && 
        backgrounds.every(bg => !!bg.placement && (!logo || !!bg.logoPlacement)), 
    [backgrounds, logo]);
    const isStep1Complete = backgrounds.length > 0 && allPlacementsSet;
    const isStep2Enabled = isStep1Complete;
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
                    placement: { x: 0.15, y: 0.15, width: 0.7, height: 0.7 },
                    logoPlacement: { x: 0.05, y: 0.05, width: 0.2, height: 0.2 },
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
            setBackgrounds(prev => {
                const updated = [...prev, ...newItems];
                if (!selectedPreviewBgId) {
                    setSelectedPreviewBgId(updated[0]?.id || null);
                }
                return updated;
            });
            setAppState('editing');
        } else {
            setProducts(prev => [...prev, ...newItems]);
        }
        if (workspaceView === 'welcome') setWorkspaceView('preview');
        setIsLoading(false);
    };

    const addAiBackground = (item: ImageItem) => {
        setBackgrounds(prev => {
            const updated = [...prev, item];
            if (!selectedPreviewBgId) {
                setSelectedPreviewBgId(updated[0]?.id || null);
            }
            return updated;
        });
        setAppState('editing');
    };

    const handleStartAi = () => {
        setAppState('editing');
        setActiveBgTab('ai');
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

    const handleLogoToggle = (enabled: boolean) => {
        setIsLogoEnabled(enabled);
        if (!enabled) {
            setLogo(null);
        }
    };

    const deleteImage = (id: string, type: 'background' | 'product') => {
        if (type === 'background') {
            const newBgs = backgrounds.filter(item => item.id !== id);
            setBackgrounds(newBgs);
            if(selectedPreviewBgId === id){
                setSelectedPreviewBgId(newBgs.length > 0 ? newBgs[0].id : null);
            }
            if(newBgs.length === 0) handleReset();

        } else {
            const newProducts = products.filter(item => item.id !== id);
            setProducts(newProducts);
        }
    };
    
    const handlePlacementChange = useCallback((id: string, placements: { product: Placement; logo?: Placement }) => {
        setBackgrounds(prev => prev.map(bg => {
            if (bg.id === id) {
                const newBg = { ...bg, placement: placements.product };
                if (placements.logo !== undefined) {
                    newBg.logoPlacement = placements.logo;
                }
                return newBg;
            }
            return bg;
        }));
    }, []);

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
            const dataUrl = await drawMockupOnCanvas(job.background, job.product, job.shading, job.lighting, job.lightColor, undefined, logo);
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

    const downloadAll = async (projectName: string) => {
        if (!projectName) return;
        const sanitizedFileName = projectName.replace(/[^a-z0-9_.-]/gi, '_').toLowerCase();

        setIsLoading(true);
        setLoadingMessage("Zipping files...");
        const zip = new JSZip();
        results.forEach(result => {
            const productFolder = result.productName.replace(/\.[^/.]+$/, "");
            const fileName = `${result.backgroundName.replace(/\.[^/.]+$/, "")}${result.lightColor ? `_${result.lightColor}`: ''}.jpg`;
            zip.folder(productFolder)?.file(fileName, result.dataUrl.split(',')[1], { base64: true });
        });
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${sanitizedFileName}.zip`);
        setIsLoading(false);
    };
    
    const handleDownloadAllClick = () => {
        setNamingModalConfig({
            title: 'Download All Mockups',
            inputLabel: 'Project Name',
            defaultValue: 'mockups',
            buttonText: 'Download (.zip)',
            onSave: downloadAll,
        });
    };

    const downloadProductZip = async (productId: string, zipName: string) => {
        if (!zipName) return;
        const sanitizedFileName = zipName.replace(/[^a-z0-9_.-]/gi, '_').toLowerCase();
        
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
        saveAs(content, `${sanitizedFileName}.zip`);
        setIsLoading(false);
    };

    const handleDownloadByProductClick = (productId: string) => {
        const productResults = results.filter(r => r.productId === productId);
        if (productResults.length === 0) return;
        const productName = productResults[0].productName.replace(/\.[^/.]+$/, "");

        setNamingModalConfig({
            title: `Download Mockups for "${productName}"`,
            inputLabel: 'File Name',
            defaultValue: `mockups_${productName}`,
            buttonText: 'Download (.zip)',
            onSave: (name) => downloadProductZip(productId, name),
        });
    };

    const handleReset = () => {
        setBackgrounds([]);
        setProducts([]);
        setLogo(null);
        setIsLogoEnabled(false);
        setShadingOptions(DEFAULT_SHADING);
        setLightingOptions(DEFAULT_LIGHTING);
        setResults([]);
        setWorkspaceView('welcome');
        setSelectedPreviewBgId(null);
        setActiveBgTab('upload');
        setAppState('welcome');
    };
    
     const handleBackClick = () => {
        if (workspaceView === 'results') {
            setWorkspaceView('preview');
        } else {
            handleReset();
        }
    };

    const saveTemplate = async (templateName: string) => {
        if (!templateName) return;
        const sanitizedFileName = templateName.replace(/[^a-z0-9_.-]/gi, '_').toLowerCase();

        setIsLoading(true);
        setLoadingMessage('Creating template...');
        try {
            const zipBlob = await createTemplate(templateName, backgrounds, shadingOptions, lightingOptions, logo);
            saveAs(zipBlob, `${sanitizedFileName}.zip`);
        } catch (error) {
            console.error('Failed to create template:', error);
            alert('Error creating template.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveTemplateClick = () => {
        if (!allPlacementsSet) {
            alert("Please set placement for all backgrounds before saving a template.");
            return;
        }
        setNamingModalConfig({
            title: 'Save Settings as Template',
            inputLabel: 'Template Name',
            defaultValue: 'My Mockup Template',
            buttonText: 'Save Template',
            onSave: saveTemplate,
        });
    };
    
    const handleLoadTemplate = async (file: File) => {
        setIsLoading(true);
        setLoadingMessage('Loading template...');
        try {
            const { backgrounds: loadedBgs, shadingOptions: loadedShading, lightingOptions: loadedLighting, logo: loadedLogo } = await loadTemplate(file);
            handleReset();
            setBackgrounds(loadedBgs);
            setShadingOptions(loadedShading);
            setLightingOptions(loadedLighting);
            if (loadedLogo) {
                setLogo(loadedLogo);
                setIsLogoEnabled(true);
            }
            setSelectedPreviewBgId(loadedBgs[0]?.id || null);
            setAppState('editing');
            setWorkspaceView('preview');
        } catch (error) {
            console.error('Failed to load template:', error);
            alert('Error loading template. Please check the file format.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderWorkspace = () => {
        const selectedBg = backgrounds.find(bg => bg.id === selectedPreviewBgId);

        switch (workspaceView) {
            case 'preview':
                return <EffectsPreview 
                            background={selectedBg} 
                            product={products[0]} 
                            logo={logo} 
                            shadingOptions={shadingOptions} 
                            lightingOptions={lightingOptions}
                            onPlacementChange={handlePlacementChange}
                        />;
            case 'results':
                const groupedResults = products.map(p => ({
                    ...p,
                    mockups: results.filter(r => r.productId === p.id)
                }));
                return (
                     <div className="h-full flex flex-col p-4 md:p-6 bg-slate-800 rounded-lg shadow-sm">
                        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                            <h2 className="text-2xl font-bold text-white">Generated Mockups</h2>
                            <div className="flex gap-2">
                                <button onClick={handleReset} className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                    <RestartIcon /> Start Over
                                </button>
                                <button onClick={handleDownloadAllClick} className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 px-4 rounded-lg transition-colors">
                                    <DownloadIcon /> Download All (.zip)
                                </button>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto custom-scrollbar -mr-2 pr-2">
                            {groupedResults.map(group => (
                                <div key={group.id} className="mb-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-semibold text-slate-200">{group.name}</h3>
                                        <button onClick={() => handleDownloadByProductClick(group.id)} className="flex items-center gap-2 text-sm bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-1 px-3 rounded-md transition-colors">
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
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-8 bg-slate-800 rounded-lg shadow-sm">
                        <WelcomeIcon className="w-32 h-32 mb-6 text-slate-600" />
                        <h2 className="text-3xl font-bold text-white mb-2">Welcome to BGArt Mockup</h2>
                        <p className="max-w-md">
                            Follow the steps on the left to upload your backgrounds and products, apply effects, and generate stunning mockups in seconds.
                        </p>
                    </div>
                );
        }
    };

    if (appState === 'welcome') {
        return (
            <Welcome 
                onUpload={(files) => addImages(files, 'background')}
                onAiGenerate={handleStartAi}
                onTemplateLoad={handleLoadTemplate}
            />
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-900 transition-colors duration-300">
            <Header 
                showNavButtons={appState === 'editing'}
                onHomeClick={handleReset}
                onBackClick={handleBackClick}
            />
            {isLoading && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="text-center">
                        <svg className="animate-spin h-10 w-10 text-cyan-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-xl text-white font-semibold">{loadingMessage}</p>
                    </div>
                </div>
            )}
             {namingModalConfig && (
                <NamingModal
                    isOpen={true}
                    title={namingModalConfig.title}
                    inputLabel={namingModalConfig.inputLabel}
                    defaultValue={namingModalConfig.defaultValue}
                    buttonText={namingModalConfig.buttonText}
                    onCancel={() => setNamingModalConfig(null)}
                    onSave={(name) => {
                        namingModalConfig.onSave(name);
                        setNamingModalConfig(null);
                    }}
                />
            )}
            <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
                <div className="lg:col-span-1 bg-slate-800 rounded-lg p-4 overflow-y-auto custom-scrollbar shadow-sm">
                    <div className="space-y-6">
                        {/* Step 1 */}
                        <ControlSection number={1} title="Add Backgrounds & Logo" isEnabled={true} isComplete={isStep1Complete}>
                             <div className="flex border-b border-slate-700 mb-4">
                                {(['upload', 'ai', 'template'] as const).map(tab => (
                                    <button key={tab} onClick={() => setActiveBgTab(tab)} className={`capitalize px-4 py-2 text-sm font-medium transition-colors ${activeBgTab === tab ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
                                        {tab === 'ai' ? 'AI Generate' : tab}
                                    </button>
                                ))}
                            </div>
                            {activeBgTab === 'upload' && <ImageUploader onUpload={(files) => addImages(files, 'background')} />}
                            {activeBgTab === 'ai' && <GeminiBackgroundGenerator onGenerationComplete={addAiBackground} setIsLoading={setIsLoading} setLoadingMessage={setLoadingMessage} />}
                            {activeBgTab === 'template' && <div className="p-4 bg-slate-900/50 rounded-lg"><label className="block text-sm font-medium text-slate-300 mb-2">Load from .zip template:</label><input type="file" accept=".zip" onChange={(e) => e.target.files && handleLoadTemplate(e.target.files[0])} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"/></div>}
                            <Gallery images={backgrounds} type="background" onDelete={deleteImage} selectedId={selectedPreviewBgId} onSelect={setSelectedPreviewBgId} isLogoActive={!!logo} />
                             <div className="mt-4 pt-4 border-t border-slate-700">
                                <Toggle label="Add Logo" enabled={isLogoEnabled} onChange={handleLogoToggle} />
                                {isLogoEnabled && (
                                    <div className="mt-4">
                                        {logo ? (
                                            <div className="flex items-center gap-3 p-2 bg-slate-900/50 rounded-lg">
                                                <img src={logo.dataUrl} alt={logo.name} className="w-12 h-12 object-cover rounded-md" />
                                                <div className="flex-grow text-sm text-slate-300 truncate">
                                                    {logo.name}
                                                </div>
                                                <button onClick={deleteLogo} className="p-1.5 bg-red-600/80 hover:bg-red-500 rounded-full text-white transition-colors">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <LogoUploader onUpload={handleLogoUpload} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </ControlSection>

                        {/* Step 2 */}
                        {isStep2Enabled && (
                            <ControlSection number={2} title="Add Products" isEnabled={isStep2Enabled}>
                                <ImageUploader onUpload={(files) => addImages(files, 'product')} />
                                <Gallery images={products} type="product" onDelete={deleteImage} />
                            </ControlSection>
                        )}

                        {/* Step 3 */}
                        {isStep3Enabled && (
                            <ControlSection number={3} title="Apply Effects" isEnabled={isStep3Enabled}>
                                <EffectsEditor 
                                    shadingOptions={shadingOptions} 
                                    onShadingChange={setShadingOptions}
                                    lightingOptions={lightingOptions}
                                    onLightingChange={setLightingOptions}
                                />
                            </ControlSection>
                        )}

                        {/* Step 4 */}
                        {isStep4Enabled && (
                            <ControlSection number={4} title="Generate & Download" isEnabled={isStep4Enabled}>
                                <button onClick={handleGenerateMockups} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-4 rounded-lg transition-colors text-lg">
                                    Generate All Mockups
                                </button>
                                {backgrounds.length > 0 && <button onClick={handleSaveTemplateClick} className="w-full mt-4 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-base">
                                    Save Settings as Template
                                </button>}
                            </ControlSection>
                        )}
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