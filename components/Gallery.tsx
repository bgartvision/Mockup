
import React from 'react';
import type { ImageItem, ResultItem } from '../types';
import { TrashIcon, EditIcon, CheckCircleIcon, ExclamationTriangleIcon } from './icons';

type GalleryProps = {
    type: 'background' | 'product' | 'result';
    images: (ImageItem | ResultItem)[];
    onDelete?: (id: string, type: 'background' | 'product') => void;
    onEditPlacement?: (id: string) => void;
    isLogoActive?: boolean;
};

const Gallery: React.FC<GalleryProps> = ({ images, type, onDelete, onEditPlacement, isLogoActive }) => {
    if (images.length === 0) {
        return null;
    }

    const isImageItem = (item: ImageItem | ResultItem): item is ImageItem => 'placement' in item || type !== 'result';

    return (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {images.map((item) => {
                const isItem = isImageItem(item);
                const isPlacementComplete = isItem && item.placement && (!isLogoActive || (isLogoActive && item.logoPlacement));

                return (
                    <div key={item.id} className="relative group aspect-square bg-gray-900 rounded-md overflow-hidden">
                        <img src={item.dataUrl} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex flex-col justify-between p-2">
                            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                {type !== 'result' && onDelete && (
                                    <button
                                        onClick={() => onDelete(item.id, type)}
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
                                {type === 'background' && isItem && (
                                    <div className="flex items-center gap-4 mt-1">
                                        <button
                                            onClick={() => onEditPlacement && onEditPlacement(item.id)}
                                            className="flex-1 text-xs bg-cyan-600/80 hover:bg-cyan-500 text-white font-semibold py-1 px-2 rounded-md transition-colors opacity-0 group-hover:opacity-100 duration-300 delay-200 flex items-center justify-center gap-1"
                                        >
                                           <EditIcon className="w-3 h-3"/> Edit Position
                                        </button>
                                    </div>
                                )}
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