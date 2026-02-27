/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'system-ui', 'sans-serif'],
            },
            colors: {
                brand: {
                    50: '#f4f5f9',
                    100: '#e5e8f0',
                    200: '#c7cede',
                    300: '#00D1FF', // Cyan accent
                    400: '#677db0',
                    500: '#0052FF', // Deep Blue Primary
                    600: '#34467c',
                    700: '#2c3a64',
                    800: '#253153',
                    900: '#0B0F19', // Midnight Background
                    950: '#070a12',
                },
                gold: {
                    400: '#FBBF24',
                    500: '#D4AF37', // Classic elegant gold
                    600: '#B8860B',
                }
            },
            boxShadow: {
                'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
                'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.4)',
                'glow': '0 0 20px rgba(0, 82, 255, 0.15)',
            }
        },
    },
    plugins: [],
}
