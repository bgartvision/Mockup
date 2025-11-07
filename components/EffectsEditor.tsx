import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ShadingOptions, LightingOptions, LightingColor } from '../types';
import { TrashIcon, EyeIcon, EyeOffIcon } from './icons';
import Toggle from './Toggle';

interface EffectsEditorProps {
    shadingOptions: ShadingOptions;
    onShadingChange: (options: ShadingOptions) => void;
    lightingOptions: LightingOptions;
    onLightingChange: (options: LightingOptions) => void;
}

const Slider = ({ label, value, min, max, onChange, unit = '' }: { label: string, value: number, min: number, max: number, onChange: (value: number) => void, unit?: string }) => (
    <div>
        <label className="flex justify-between text-sm font-medium text-slate-300">
            <span>{label}</span>
            <span>{value}{unit}</span>
        </label>
        <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer range-thumb"
            style={{
                '--thumb-color': '#06b6d4',
            } as React.CSSProperties}
        />
        <style>{`
            .range-thumb::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: var(--thumb-color);
                cursor: pointer;
                transition: transform 0.1s ease-in-out;
            }
            .range-thumb:active::-webkit-slider-thumb {
                transform: scale(1.2);
            }
            .range-thumb::-moz-range-thumb {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: var(--thumb-color);
                cursor: pointer;
            }
        `}</style>
    </div>
);

const EffectsEditor: React.FC<EffectsEditorProps> = ({ shadingOptions, onShadingChange, lightingOptions, onLightingChange }) => {

    const handleLightingColorChange = (id: string, newColor: string) => {
        onLightingChange({ ...lightingOptions, colors: lightingOptions.colors.map(c => c.id === id ? { ...c, color: newColor } : c) });
    };

    const addLightingColor = () => {
        const newColor: LightingColor = { id: uuidv4(), color: '#ff00ff' };
        const newColors = [...lightingOptions.colors, newColor];
        onLightingChange({
            ...lightingOptions,
            colors: newColors,
            activeColorId: lightingOptions.activeColorId ?? newColor.id,
        });
    };

    const removeLightingColor = (id: string) => {
        const newColors = lightingOptions.colors.filter(c => c.id !== id);
        let newActiveId = lightingOptions.activeColorId;
        if (newActiveId === id) {
            newActiveId = newColors.length > 0 ? newColors[0].id : null;
        }
        onLightingChange({ ...lightingOptions, colors: newColors, activeColorId: newActiveId });
    };

    const setActiveLightingColor = (id: string) => {
        onLightingChange({ ...lightingOptions, activeColorId: id });
    };

    const handleShadingEnableChange = (enabled: boolean) => {
        onShadingChange({
            ...shadingOptions,
            enabled,
            previewVisible: enabled,
        });
    };

    const handleLightingEnableChange = (enabled: boolean) => {
        onLightingChange({
            ...lightingOptions,
            enabled,
            previewVisible: enabled,
        });
    };

    return (
        <div className="space-y-6">
            {/* Shading Effect */}
            <div className="p-4 bg-slate-900/50 rounded-lg space-y-4">
                <Toggle 
                    label="Shading Effect" 
                    enabled={shadingOptions.enabled} 
                    onChange={handleShadingEnableChange}
                    previewVisible={shadingOptions.previewVisible}
                    onPreviewToggle={(visible) => onShadingChange({ ...shadingOptions, previewVisible: visible })}
                />
                {shadingOptions.enabled && (
                    <div className="space-y-3 pt-2 border-t border-slate-700/50 mt-4">
                        <Slider label="Angle" value={shadingOptions.angle} min={0} max={360} onChange={(v) => onShadingChange({ ...shadingOptions, angle: v })} unit="°" />
                        <Slider label="Distance" value={shadingOptions.distance} min={0} max={50} onChange={(v) => onShadingChange({ ...shadingOptions, distance: v })} unit="px" />
                        <Slider label="Blur" value={shadingOptions.blur} min={0} max={100} onChange={(v) => onShadingChange({ ...shadingOptions, blur: v })} unit="px" />
                        <Slider label="Opacity" value={shadingOptions.opacity} min={0} max={100} onChange={(v) => onShadingChange({ ...shadingOptions, opacity: v })} unit="%" />
                    </div>
                )}
            </div>

            {/* Lighting Effect */}
            <div className="p-4 bg-slate-900/50 rounded-lg space-y-4">
                <Toggle 
                    label="Neon Glow Effect" 
                    enabled={lightingOptions.enabled} 
                    onChange={handleLightingEnableChange}
                    previewVisible={lightingOptions.previewVisible}
                    onPreviewToggle={(visible) => onLightingChange({ ...lightingOptions, previewVisible: visible })}
                />
                {lightingOptions.enabled && (
                    <div className="space-y-4 pt-2 border-t border-slate-700/50 mt-4">
                        <Slider label="Intensity" value={lightingOptions.intensity} min={1} max={50} onChange={(v) => onLightingChange({ ...lightingOptions, intensity: v })} unit="px" />
                        <Slider label="BG Darkness" value={lightingOptions.backgroundDarkness} min={0} max={100} onChange={(v) => onLightingChange({ ...lightingOptions, backgroundDarkness: v })} unit="%" />
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Glow Colors</label>
                            <div className="space-y-2">
                                {lightingOptions.colors.map(c => (
                                    <div key={c.id} className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setActiveLightingColor(c.id)}
                                            className={`p-1 rounded-full transition-colors ${lightingOptions.activeColorId === c.id ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                                            aria-label={lightingOptions.activeColorId === c.id ? 'Active preview color' : 'Set as preview color'}
                                        >
                                            {lightingOptions.activeColorId === c.id ? <EyeIcon className="w-5 h-5" /> : <EyeOffIcon className="w-5 h-5" />}
                                        </button>
                                        <input type="color" value={c.color} onChange={(e) => handleLightingColorChange(c.id, e.target.value)} className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent" />
                                        <input type="text" value={c.color} onChange={(e) => handleLightingColorChange(c.id, e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-sm text-white focus:ring-cyan-500 focus:border-cyan-500"/>
                                        <button onClick={() => removeLightingColor(c.id)} className="p-1.5 text-slate-400 hover:text-white hover:bg-red-500 rounded-full transition-colors">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <button onClick={addLightingColor} className="w-full text-sm mt-2 py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-md transition-colors">
                                    Add Color
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Each color will generate a separate mockup version.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EffectsEditor;