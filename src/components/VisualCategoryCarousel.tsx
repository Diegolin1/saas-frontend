import { useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface Props {
    selectedCategory: string;
    onSelect: (categoryName: string) => void;
    categories?: string[];  // Categorías dinámicas del catálogo
}

export default function VisualCategoryCarousel({ selectedCategory, onSelect, categories = [] }: Props) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Si no hay categorías dinámicas no renderizar nada
    if (categories.length === 0) return null;

    return (
        <div className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 group">

            {/* Nav Buttons (Desktop) */}
            <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-md p-2 rounded-full text-stone-600 hover:text-stone-900 hidden md:group-hover:flex transition-opacity opacity-0 group-hover:opacity-100"
            >
                <ChevronLeftIcon className="h-6 w-6" />
            </button>

            <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-md p-2 rounded-full text-stone-600 hover:text-stone-900 hidden md:group-hover:flex transition-opacity opacity-0 group-hover:opacity-100"
            >
                <ChevronRightIcon className="h-6 w-6" />
            </button>

            {/* Carousel Track */}
            <div
                ref={scrollContainerRef}
                className="flex items-center gap-4 sm:gap-8 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {/* Botón "Todos" */}
                <button
                    onClick={() => onSelect('')}
                    className="flex flex-col items-center gap-3 flex-shrink-0 snap-start group/item w-20 sm:w-28 focus:outline-none"
                >
                    <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full border-2 flex items-center justify-center bg-stone-50 transition-all ${!selectedCategory ? 'border-stone-900 scale-105' : 'border-transparent group-hover/item:border-stone-200'}`}>
                        <span className="text-xs sm:text-sm font-medium text-stone-600">Todos</span>
                    </div>
                    <span className={`text-[10px] sm:text-xs font-semibold tracking-wide uppercase transition-colors ${!selectedCategory ? 'text-stone-900' : 'text-stone-500 group-hover/item:text-stone-800'}`}>
                        Todo
                    </span>
                </button>

                {/* Categorías dinámicas */}
                {categories.map((cat) => {
                    const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                    // Genera un color de fondo único por categoría usando hash simple
                    const colors = ['bg-amber-50', 'bg-stone-100', 'bg-slate-100', 'bg-zinc-100', 'bg-neutral-100', 'bg-orange-50'];
                    const colorIdx = cat.charCodeAt(0) % colors.length;
                    return (
                        <button
                            key={cat}
                            onClick={() => onSelect(cat)}
                            className="flex flex-col items-center gap-3 flex-shrink-0 snap-start group/item w-20 sm:w-28 focus:outline-none"
                        >
                            <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full border-2 flex items-center justify-center transition-all ${colors[colorIdx]} ${isSelected ? 'border-stone-900 scale-105 shadow-md' : 'border-transparent group-hover/item:border-stone-200 group-hover/item:shadow-sm'}`}>
                                <span className={`text-center text-[10px] sm:text-xs font-bold px-1 leading-tight transition-colors ${isSelected ? 'text-stone-900' : 'text-stone-500 group-hover/item:text-stone-800'}`}>
                                    {cat}
                                </span>
                            </div>
                            <span className={`text-[10px] sm:text-xs font-semibold tracking-wide uppercase transition-colors ${isSelected ? 'text-stone-900' : 'text-stone-500 group-hover/item:text-stone-800'}`}>
                                {cat}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
