import { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const DEFAULT_SLIDES = [
    {
        id: 'slide-1',
        image: '/assets/flexi_hero_slider_1_1773016080155.png',
        alt: 'Catálogo mayoreo',
        titleKey: 'main',
        subtitle: 'Precios exclusivos para distribuidores y tiendas',
        buttonText: 'Ver Catálogo',
    },
    {
        id: 'slide-2',
        image: '/assets/flexi_hero_slider_2_1773016094060.png',
        alt: 'Nueva colección',
        titleKey: 'secondary',
        subtitle: 'Calidad y variedad en cada temporada',
        buttonText: 'Explorar',
    }
];

interface HeroSliderProps {
    companyName?: string;
}

export default function HeroSlider({ companyName }: HeroSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const SLIDES = DEFAULT_SLIDES;
    const titles: Record<string, string> = {
        main: companyName ? `Bienvenido a ${companyName}`.toUpperCase() : 'TU CATÁLOGO B2B MAYOREO',
        secondary: 'NUEVA TEMPORADA DISPONIBLE',
    };

    // Auto-advance
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

    return (
        <div className="relative w-full h-[50vh] sm:h-[60vh] lg:h-[70vh] min-h-[400px] overflow-hidden group bg-stone-100">
            {/* Slides */}
            {SLIDES.map((slide, index) => (
                <div
                    key={slide.id}
                    className="absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out"
                    style={{ opacity: index === currentIndex ? 1 : 0, zIndex: index === currentIndex ? 10 : 0 }}
                >
                    <img
                        src={slide.image}
                        alt={slide.alt}
                        className="w-full h-full object-cover object-center"
                    />

                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent flex flex-col justify-center px-8 sm:px-16 lg:px-24">
                        <div className={`transform transition-all duration-1000 delay-300 ${index === currentIndex ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} max-w-2xl`}>
                            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold text-white mb-4 leading-tight">
                                {titles[slide.titleKey] || titles.main}
                            </h2>
                            <p className="text-sm sm:text-lg text-white/90 mb-8 font-medium tracking-wide">
                                {slide.subtitle}
                            </p>
                            <button className="bg-white text-stone-900 px-8 py-3 rounded-none font-bold text-xs uppercase tracking-widest hover:bg-stone-200 transition-colors">
                                {slide.buttonText}
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {/* Nav Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/50 hover:bg-white text-stone-900 p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
            >
                <ChevronLeftIcon className="h-6 w-6" />
            </button>

            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/50 hover:bg-white text-stone-900 p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
            >
                <ChevronRightIcon className="h-6 w-6" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {SLIDES.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'}`}
                    />
                ))}
            </div>
        </div>
    );
}
