import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ImageItem, Placement } from '../types';
import { CheckIcon, CloseIcon } from './icons';

interface PlacementEditorProps {
    background: ImageItem;
    logo: ImageItem | null;
    onClose: () => void;
    onSave: (id: string, placements: { product: Placement; logo?: Placement }) => void;
}

const PlacementBox = ({ box, setBox, action, setAction, setStartPos, setStartBox, target, color, label }: any) => {
    const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize', corner?: string) => {
        e.preventDefault();
        e.stopPropagation();
        setAction({ type, target, corner });
        setStartPos({ x: e.clientX, y: e.clientY });
        setStartBox(box);
    };

    return (
        <div
            className="absolute bg-opacity-20 cursor-move select-none"
            style={{
                left: `${box.x}%`,
                top: `${box.y}%`,
                width: `${box.width}%`,
                height: `${box.height}%`,
                border: `2px dashed ${color}`,
                backgroundColor: `${color}33`,
            }}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
        >
            <div className="absolute -top-6 left-0 text-xs font-bold px-1.5 py-0.5 rounded-sm" style={{backgroundColor: color, color: 'black' }}>{label}</div>
            {['tl', 'tr', 'bl', 'br'].map(corner => (
                <div
                    key={corner}
                    className={`absolute w-3 h-3 bg-white rounded-full -m-1.5 border-2`}
                    style={{
                        borderColor: color,
                        cursor: corner.includes('t') || corner.includes('b') ? (corner.includes('l') || corner.includes('r') ? (corner.startsWith('t') && corner.endsWith('l') || corner.startsWith('b') && corner.endsWith('r') ? 'nwse-resize' : 'nesw-resize') : 'ns-resize') : 'ew-resize',
                        top: corner.includes('t') ? 0 : 'auto',
                        bottom: corner.includes('b') ? 0 : 'auto',
                        left: corner.includes('l') ? 0 : 'auto',
                        right: corner.includes('r') ? 0 : 'auto',
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'resize', corner)}
                />
            ))}
        </div>
    );
};

const PlacementEditor: React.FC<PlacementEditorProps> = ({ background, logo, onClose, onSave }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [productBox, setProductBox] = useState({ x: 15, y: 15, width: 70, height: 70 });
    const [logoBox, setLogoBox] = useState({ x: 5, y: 5, width: 20, height: 20 });
    const [action, setAction] = useState<{ type: 'move' | 'resize', target: 'product' | 'logo', corner?: string } | null>(null);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [startBox, setStartBox] = useState({ x: 0, y: 0, width: 0, height: 0 });

    useEffect(() => {
        if (background.placement) {
            setProductBox({
                x: background.placement.x * 100,
                y: background.placement.y * 100,
                width: background.placement.width * 100,
                height: background.placement.height * 100,
            });
        }
        if (background.logoPlacement) {
            setLogoBox({
                x: background.logoPlacement.x * 100,
                y: background.logoPlacement.y * 100,
                width: background.logoPlacement.width * 100,
                height: background.logoPlacement.height * 100,
            });
        }
    }, [background.placement, background.logoPlacement]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!action || !containerRef.current) return;
        e.preventDefault();
        e.stopPropagation();

        const rect = containerRef.current.getBoundingClientRect();
        const dx = (e.clientX - startPos.x) / rect.width * 100;
        const dy = (e.clientY - startPos.y) / rect.height * 100;
        const currentBox = action.target === 'product' ? productBox : logoBox;
        const setBox = action.target === 'product' ? setProductBox : setLogoBox;
        
        let newBox = { ...startBox };

        if (action.type === 'move') {
            newBox.x = startBox.x + dx;
            newBox.y = startBox.y + dy;
        } else if (action.type === 'resize') {
            if (action.corner?.includes('r')) newBox.width = startBox.width + dx;
            if (action.corner?.includes('l')) {
                newBox.width = startBox.width - dx;
                newBox.x = startBox.x + dx;
            }
            if (action.corner?.includes('b')) newBox.height = startBox.height + dy;
            if (action.corner?.includes('t')) {
                newBox.height = startBox.height - dy;
                newBox.y = startBox.y + dy;
            }

            if (newBox.width < 5) newBox.width = 5;
            if (newBox.height < 5) newBox.height = 5;
        }
        
        if (newBox.x < 0) newBox.x = 0;
        if (newBox.y < 0) newBox.y = 0;
        if (newBox.x + newBox.width > 100) newBox.x = 100 - newBox.width;
        if (newBox.y + newBox.height > 100) newBox.y = 100 - newBox.height;

        setBox(newBox);
    }, [action, startPos, startBox, productBox, logoBox]);

    const handleMouseUp = useCallback(() => {
        setAction(null);
    }, []);
    
    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const handleSave = () => {
        const placements: { product: Placement; logo?: Placement } = {
            product: {
                x: productBox.x / 100,
                y: productBox.y / 100,
                width: productBox.width / 100,
                height: productBox.height / 100,
            }
        };
        if (logo) {
            placements.logo = {
                x: logoBox.x / 100,
                y: logoBox.y / 100,
                width: logoBox.width / 100,
                height: logoBox.height / 100,
            };
        }
        onSave(background.id, placements);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-40 flex items-center justify-center p-4">
            <div className="absolute top-4 right-4 flex gap-3">
                <button onClick={handleSave} className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 px-4 rounded-lg transition-colors">
                    <CheckIcon /> Save & Close
                </button>
                <button onClick={onClose} className="p-2.5 bg-gray-700 hover:bg-gray-600 rounded-full text-white transition-colors">
                    <CloseIcon />
                </button>
            </div>
            <div className="relative w-full h-full max-w-6xl max-h-[90vh] flex items-center justify-center" ref={containerRef}>
                <img src={background.dataUrl} alt="background" className="max-w-full max-h-full object-contain select-none" />
                
                <PlacementBox 
                    box={productBox} 
                    setBox={setProductBox} 
                    action={action} 
                    setAction={setAction} 
                    setStartPos={setStartPos} 
                    setStartBox={setStartBox}
                    target="product" 
                    color="#22d3ee"
                    label="Product"
                />

                {logo && (
                    <PlacementBox 
                        box={logoBox} 
                        setBox={setLogoBox} 
                        action={action} 
                        setAction={setAction} 
                        setStartPos={setStartPos} 
                        setStartBox={setStartBox}
                        target="logo" 
                        color="#34d399"
                        label="Logo"
                    />
                )}
            </div>
        </div>
    );
};

export default PlacementEditor;