
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ImageItem, Placement } from '../types';
import { CheckIcon, CloseIcon } from './icons';

interface PlacementEditorProps {
    image: ImageItem;
    onClose: () => void;
    onSave: (id: string, placement: Placement) => void;
}

const PlacementEditor: React.FC<PlacementEditorProps> = ({ image, onClose, onSave }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const boxRef = useRef<HTMLDivElement>(null);

    const [box, setBox] = useState({ x: 15, y: 15, width: 70, height: 70 }); // in percentage
    const [action, setAction] = useState<{ type: 'move' | 'resize', corner?: string } | null>(null);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [startBox, setStartBox] = useState({ x: 0, y: 0, width: 0, height: 0 });

    useEffect(() => {
        if (image.placement) {
            setBox({
                x: image.placement.x * 100,
                y: image.placement.y * 100,
                width: image.placement.width * 100,
                height: image.placement.height * 100,
            });
        }
    }, [image.placement]);

    const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize', corner?: string) => {
        e.preventDefault();
        e.stopPropagation();
        setAction({ type, corner });
        setStartPos({ x: e.clientX, y: e.clientY });
        setStartBox(box);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!action || !containerRef.current) return;
        e.preventDefault();
        e.stopPropagation();

        const rect = containerRef.current.getBoundingClientRect();
        const dx = (e.clientX - startPos.x) / rect.width * 100;
        const dy = (e.clientY - startPos.y) / rect.height * 100;

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
        
        // boundary checks
        if (newBox.x < 0) newBox.x = 0;
        if (newBox.y < 0) newBox.y = 0;
        if (newBox.x + newBox.width > 100) newBox.x = 100 - newBox.width;
        if (newBox.y + newBox.height > 100) newBox.y = 100 - newBox.height;

        setBox(newBox);

    }, [action, startPos, startBox]);

    const handleMouseUp = useCallback(() => {
        setAction(null);
    }, []);
    
    useEffect(() => {
        if (action) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [action, handleMouseMove, handleMouseUp]);

    const handleSave = () => {
        const placement: Placement = {
            x: box.x / 100,
            y: box.y / 100,
            width: box.width / 100,
            height: box.height / 100,
        };
        onSave(image.id, placement);
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
                <img ref={imgRef} src={image.dataUrl} alt="background" className="max-w-full max-h-full object-contain select-none" />
                <div
                    ref={boxRef}
                    className="absolute border-2 border-cyan-400 border-dashed bg-cyan-400/20 cursor-move select-none"
                    style={{
                        left: `${box.x}%`,
                        top: `${box.y}%`,
                        width: `${box.width}%`,
                        height: `${box.height}%`,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'move')}
                >
                    {['tl', 'tr', 'bl', 'br', 't', 'b', 'l', 'r'].map(corner => {
                        const cursorMap: {[key: string]: string} = {
                            tl: 'cursor-nwse-resize', tr: 'cursor-nesw-resize',
                            bl: 'cursor-nesw-resize', br: 'cursor-nwse-resize',
                            t: 'cursor-ns-resize', b: 'cursor-ns-resize',
                            l: 'cursor-ew-resize', r: 'cursor-ew-resize',
                        }
                        const positionMap: {[key: string]: string} = {
                            tl: 'top-0 left-0', tr: 'top-0 right-0',
                            bl: 'bottom-0 left-0', br: 'bottom-0 right-0',
                            t: 'top-0 left-1/2 -translate-x-1/2', b: 'bottom-0 left-1/2 -translate-x-1/2',
                            l: 'left-0 top-1/2 -translate-y-1/2', r: 'right-0 top-1/2 -translate-y-1/2',
                        }
                         return (<div
                            key={corner}
                            className={`absolute w-3 h-3 bg-cyan-400 rounded-full -m-1.5 ${cursorMap[corner]}`}
                            style={{transform: positionMap[corner].includes('translate') ? 'translate(-50%, -50%)' : undefined, ...Object.fromEntries(positionMap[corner].split(' ').map(s => s.split('-')))}}
                            onMouseDown={(e) => handleMouseDown(e, 'resize', corner)}
                        />)
                    })}
                </div>
            </div>
        </div>
    );
};

export default PlacementEditor;
