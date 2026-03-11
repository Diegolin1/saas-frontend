import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSettings } from '../services/settings.service';

interface ThemeContextType {
    brandColor: string;
    logoUrl: string | null;
    companyName: string;
    loadTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper function to convert HEX to RGB for Tailwind opacity support
const hexToRgb = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : '28 25 23'; // Default to stone-900
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [brandColor, setBrandColor] = useState('#1c1917'); // stone-900 fallback
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState<string>('SaaS B2B');

    const loadTheme = async () => {
        try {
            const data = await getSettings();
            if (data.name) {
                setCompanyName(data.name);
            }
            if (data.settings) {
                const settings = data.settings as any;
                if (settings.brandColor) {
                    setBrandColor(settings.brandColor);
                    applyThemeColor(settings.brandColor);
                }
                if (settings.logoUrl) {
                    setLogoUrl(settings.logoUrl);
                }
            }
        } catch (error) {
            console.error('Error loading theme settings:', error);
        }
    };

    const applyThemeColor = (hexColor: string) => {
        const root = document.documentElement;
        const rgb = hexToRgb(hexColor);
        // Set CSS variables for Tailwind to consume
        root.style.setProperty('--color-brand-500', rgb);
        
        // Let's generate a slightly darker/lighter shade for hover states
        // In a real sophisticated setup we'd generate a full palette, 
        // but for now we'll rely on CSS opacity or a simple heuristic.
        // Tailwind forms use opacity, e.g., rgb(var(--color-brand-500) / <alpha-value>)
    };

    useEffect(() => {
        // Only load if we have a token (authenticated user in Admin)
        const token = localStorage.getItem('token');
        if (token) {
            loadTheme();
        }
    }, []);

    return (
        <ThemeContext.Provider value={{ brandColor, logoUrl, companyName, loadTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
