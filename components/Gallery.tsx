
import React from 'react';
import type { ImageItem, ResultItem } from '../types';
import { TrashIcon, CheckCircleIcon, ExclamationTriangleIcon } from './icons';

type GalleryProps = {
    type: 'background' | 'product' | 'result';
    images: (ImageItem | ResultItem)[];
    onDelete?: (id: string, type: 'background' | 'product') => void;
    onSelect?: (id: string) => void;
    selectedId?: string | null;
    isLogoActive?: boolean;
};

const Gallery: React.FC<GalleryProps> = ({ images, type, onDelete, onSelect, selectedId, isLogoActive }) => {
    if (images.length === 0) {
        return null;
    }

    const isImageItem = (item: ImageItem | ResultItem): item is ImageItem => 'placement' in item || type !== 'result';

    return (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {images.map((item) => {
                const isItem = isImageItem(item);
                const isPlacementComplete = isItem && item.placement && (!isLogoActive || (isLogoActive && item.logoPlacement));
                const isSelected = type === 'background' && item.id === selectedId;

                return (
                    <div 
                        key={item.id} 
                        className={`relative group aspect-square bg-[#1A0F2D] rounded-md overflow-hidden transition-all duration-200 ${type === 'background' ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-[#F4B83A]' : ''}`}
                        onClick={() => type === 'background' && onSelect && onSelect(item.id)}
                    >
                        <img src={item.dataUrl} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex flex-col justify-between p-2">
                            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                {type !== 'result' && onDelete && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent onSelect from firing
                                            onDelete(item.id, type);
                                        }}
                                        className="p-1.5 bg-red-600/80 hover:bg-red-500 rounded-full text-white transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="text-white">
                                <p className="text-xs font-medium truncate opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                    {isItem ? item.name : (item as ResultItem).backgroundName}
                                </p>
                            </div>
                        </div>
                         {type === 'background' && isItem && (
                            <div className={`absolute top-1.5 left-1.5 p-1 rounded-full ${isPlacementComplete ? 'bg-green-500/80' : 'bg-yellow-500/80'} group-hover:opacity-0 transition-opacity`}>
                                {isPlacementComplete ? <CheckCircleIcon className="w-4 h-4 text-white" /> : <ExclamationTriangleIcon className="w-4 h-4 text-white" />}
                            </div>
                         )}
                    </div>
                );
            })}
        </div>
    );
};

export default Gallery;