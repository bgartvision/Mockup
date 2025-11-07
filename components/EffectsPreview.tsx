import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { ImageItem, ShadingOptions, LightingOptions, Placement } from '../types';
import { drawMockupOnCanvas } from '../services/canvasService';

interface EffectsPreviewProps {
    background?: ImageItem;
    product?: ImageItem;
    logo?: ImageItem | null;
    shadingOptions: ShadingOptions;
    lightingOptions: LightingOptions;
    onPlacementChange: (id: string, placements: { product: Placement; logo?: Placement }) => void;
}

const PlacementBox = ({ box, color, label, onMouseDown }: { box: any, color: string, label: string, onMouseDown: (e: React.MouseEvent, type: 'move' | 'resize', corner?: string) => void }) => (
    <div
        className="absolute cursor-move select-none"
        style={{
            left: `${box.x}%`,
            top: `${box.y}%`,
            width: `${box.width}%`,
            height: `${box.height}%`,
            border: `2px dashed ${color}`,
        }}
        onMouseDown={(e) => onMouseDown(e, 'move')}
    >
        <div className="absolute -top-6 left-0 text-xs font-bold px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: color, color: 'black' }}>{label}</div>
        {['tl', 'tr', 'bl', 'br'].map(corner => (
            <div
                key={corner}
                className="absolute w-3 h-3 bg-white rounded-full -m-1.5 border-2"
                style={{
                    borderColor: color,
                    cursor: corner.includes('t') || corner.includes('b') ? (corner.includes('l') || corner.includes('r') ? (corner.startsWith('t') && corner.endsWith('l') || corner.startsWith('b') && corner.endsWith('r') ? 'nwse-resize' : 'nesw-resize') : 'ns-resize') : 'ew-resize',
                    top: corner.includes('t') ? 0 : 'auto',
                    bottom: corner.includes('b') ? 0 : 'auto',
                    left: corner.includes('l') ? 0 : 'auto',
                    right: corner.includes('r') ? 0 : 'auto',
                }}
                onMouseDown={(e) => onMouseDown(e, 'resize', corner)}
            />
        ))}
    </div>
);


const EffectsPreview: React.FC<EffectsPreviewProps> = ({ background, product, logo, shadingOptions, lightingOptions, onPlacementChange }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [productBox, setProductBox] = useState<Placement | null>(null);
    const [logoBox, setLogoBox] = useState<Placement | null>(null);
    const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});

    const [action, setAction] = useState<{ type: 'move' | 'resize', target: 'product' | 'logo', corner?: string } | null>(null);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [startBox, setStartBox] = useState<Placement | null>(null);

    useEffect(() => {
        if (background?.placement) {
            setProductBox(background.placement);
        }
    
        if (logo) {
            if (background?.logoPlacement) {
                setLogoBox(background.logoPlacement);
            } else {
                const defaultLogoPlacement: Placement = { x: 0.05, y: 0.05, width: 0.2, height: 0.2 };
                setLogoBox(defaultLogoPlacement);
                if (background && background.placement) {
                    onPlacementChange(background.id, {
                        product: background.placement,
                        logo: defaultLogoPlacement
                    });
                }
            }
        } else {
            setLogoBox(null);
        }
    }, [background, logo]);
    
    const updateOverlayStyle = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (canvas && container) {
            const { offsetLeft, offsetTop, clientWidth, clientHeight } = canvas;
            setOverlayStyle({
                position: 'absolute',
                left: `${offsetLeft}px`,
                top: `${offsetTop}px`,
                width: `${clientWidth}px`,
                height: `${clientHeight}px`,
            });
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || !background || !product) {
            setOverlayStyle({ display: 'none' });
            return;
        }

        let isMounted = true;

        const drawAndUpdate = async () => {
            const effectiveShadingOptions = { ...shadingOptions, enabled: shadingOptions.enabled && shadingOptions.previewVisible };
            const effectiveLightingOptions = { ...lightingOptions, enabled: lightingOptions.enabled && lightingOptions.previewVisible };
            const activeColor = effectiveLightingOptions.enabled && effectiveLightingOptions.activeColorId
                ? effectiveLightingOptions.colors.find(c => c.id === effectiveLightingOptions.activeColorId)
                : undefined;
            
            await drawMockupOnCanvas(background, product, effectiveShadingOptions, effectiveLightingOptions, activeColor?.color, canvas, logo, productBox || undefined, logoBox || undefined);
            
            if (isMounted) {
                updateOverlayStyle();
            }
        };
        
        drawAndUpdate();
        
        const resizeObserver = new ResizeObserver(drawAndUpdate);
        resizeObserver.observe(container);

        return () => {
            isMounted = false;
            resizeObserver.disconnect();
        };

    }, [background, product, logo, shadingOptions, lightingOptions, productBox, logoBox, updateOverlayStyle]);

    const handleMouseDown = (e: React.MouseEvent, target: 'product' | 'logo', type: 'move' | 'resize', corner?: string) => {
        e.preventDefault();
        e.stopPropagation();
        setAction({ type, target, corner });
        setStartPos({ x: e.clientX, y: e.clientY });
        setStartBox(target === 'product' ? productBox : logoBox);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!action || !canvasRef.current || !startBox) return;
        e.preventDefault();
        e.stopPropagation();

        const rect = canvasRef.current.getBoundingClientRect();
        const setBox = action.target === 'product' ? setProductBox : setLogoBox;
        
        let newBox: Placement = { ...startBox };

        if (action.type === 'move') {
            const dx = (e.clientX - startPos.x) / rect.width;
            const dy = (e.clientY - startPos.y) / rect.height;
            newBox.x = startBox.x + dx;
            newBox.y = startBox.y + dy;
        } else if (action.type === 'resize' && action.corner) {
            const dx = (e.clientX - startPos.x) / rect.width;
            const dy = (e.clientY - startPos.y) / rect.height;

            let newX = startBox.x;
            let newY = startBox.y;
            let newWidth = startBox.width;
            let newHeight = startBox.height;

            if (action.corner.includes('r')) newWidth = startBox.width + dx;
            if (action.corner.includes('l')) {
                newWidth = startBox.width - dx;
                newX = startBox.x + dx;
            }
            if (action.corner.includes('b')) newHeight = startBox.height + dy;
            if (action.corner.includes('t')) {
                newHeight = startBox.height - dy;
                newY = startBox.y + dy;
            }
            
            if (e.shiftKey) {
                const aspectRatio = startBox.width / startBox.height;
                 if (Math.abs(newWidth - startBox.width) > Math.abs(newHeight - startBox.height) * aspectRatio) {
                    const changedHeight = newWidth / aspectRatio;
                    if (action.corner.includes('t')) {
                        newY = startBox.y - (changedHeight - startBox.height);
                    }
                    newHeight = changedHeight;
                } else {
                    const changedWidth = newHeight * aspectRatio;
                     if (action.corner.includes('l')) {
                        newX = startBox.x - (changedWidth - startBox.width);
                    }
                    newWidth = changedWidth;
                }
            }
            
            newBox = { x: newX, y: newY, width: newWidth, height: newHeight };
        }
        
        if (newBox.width < 0.02) newBox.width = 0.02;
        if (newBox.height < 0.02) newBox.height = 0.02;
        if (newBox.x < 0) newBox.x = 0;
        if (newBox.y < 0) newBox.y = 0;
        if (newBox.x + newBox.width > 1) newBox.x = 1 - newBox.width;
        if (newBox.y + newBox.height > 1) newBox.y = 1 - newBox.height;

        setBox(newBox);
    }, [action, startPos, startBox]);

    const handleMouseUp = useCallback(() => {
        if (action && background && productBox) {
            onPlacementChange(background.id, {
                product: productBox,
                logo: logoBox || undefined
            });
        }
        setAction(null);
    }, [action, background, productBox, logoBox, onPlacementChange]);
    
    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);


    if (!background || !product) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-800 rounded-lg text-slate-400 shadow-sm">
                Select a background and product to see a preview.
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-4 bg-slate-800 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-white mb-4">Live Preview & Position Editor</h2>
            <div ref={containerRef} className="flex-grow flex items-center justify-center bg-slate-900/50 rounded-md overflow-hidden p-2 relative">
                 <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
                 <div style={overlayStyle}>
                    {productBox && (
                         <PlacementBox
                            box={{x: productBox.x * 100, y: productBox.y * 100, width: productBox.width * 100, height: productBox.height * 100}}
                            color="#06b6d4" // cyan-500
                            label="Product"
                            onMouseDown={(e, type, corner) => handleMouseDown(e, 'product', type, corner)}
                        />
                    )}
                    {logo && logoBox && (
                        <PlacementBox
                            box={{x: logoBox.x * 100, y: logoBox.y * 100, width: logoBox.width * 100, height: logoBox.height * 100}}
                            color="#10b981" // emerald-500
                            label="Logo"
                             onMouseDown={(e, type, corner) => handleMouseDown(e, 'logo', type, corner)}
                        />
                    )}
                 </div>
            </div>
        </div>
    );
};

export default EffectsPreview;