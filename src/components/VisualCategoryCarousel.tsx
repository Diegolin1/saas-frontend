import { useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CategoryItem {
    id: string;
    name: string;
    image: string;
}

export const VISUAL_CATEGORIES: CategoryItem[] = [
    { id: 'sandalias', name: 'Sandalias', image: '/assets/cat_sandalias_1773016112214.png' },
    { id: 'sneakers', name: 'Sneakers', image: '/assets/cat_sneakers_1773016129635.png' },
    { id: 'botas', name: 'Botas', image: '/assets/cat_botas_1773016141794.png' },
    { id: 'vestir', name: 'Vestir', image: '/assets/cat_vestir_1773016159245.png' },
    { id: 'casual', name: 'Casual', image: '/assets/cat_casual_1773016172471.png' },
    { id: 'accesorios', name: 'Accesorios', image: '/assets/cat_accesorios_1773016185023.png' },
];

interface Props {
    selectedCategory: string;
    onSelect: (categoryName: string) => void;
}

export default function VisualCategoryCarousel({ selectedCategory, onSelect }: Props) {
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
                <button
                    onClick={() => onSelect('')}
                    className="flex flex-col items-center gap-3 flex-shrink-0 snap-start group/item w-20 sm:w-28 focus:outline-none"
                >
                    <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full border-2 flex items-center justify-center bg-stone-50 transition-all ${!selectedCategory ? 'border-stone-900 scale-105' : 'border-transparent group-hover/item:border-stone-200'}`}>
                        <span className="text-xs sm:text-sm font-medium text-stone-600">Todos</span>
                    </div>
                </button>

                {VISUAL_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                    return (
                        <button
                            key={cat.id}
                            onClick={() => onSelect(cat.name)}
                            className="flex flex-col items-center gap-3 flex-shrink-0 snap-start group/item w-20 sm:w-28 focus:outline-none"
                        >
                            <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 bg-stone-50 transition-all ${isSelected ? 'border-stone-900 scale-105 shadow-md' : 'border-transparent group-hover/item:border-stone-200 group-hover/item:shadow-sm'}`}>
                                <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className="w-full h-full object-cover object-center group-hover/item:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <span className={`text-[10px] sm:text-xs font-semibold tracking-wide uppercase transition-colors ${isSelected ? 'text-stone-900' : 'text-stone-500 group-hover/item:text-stone-800'}`}>
                                {cat.name}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
