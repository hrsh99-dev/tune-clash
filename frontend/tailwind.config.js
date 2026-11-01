/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAF5EE',
        surface: '#FFFFFF',
        'surface-muted': '#F4EFE6',
        'neo-black': '#000000',
        'neo-cream': '#FAF5EE',
        'neo-yellow': '#FFE600',
        'neo-yellow-light': '#FFF59D',
        'neo-green': '#4ADE80',
        'neo-green-light': '#DCFCE7',
        'neo-pink': '#FF6B8B',
        'neo-pink-light': '#FFE4E6',
        'neo-cyan': '#38BDF8',
        'neo-cyan-light': '#E0F2FE',
        'neo-purple': '#A78BFA',
        'neo-purple-light': '#EDE9FE',
        'neo-orange': '#FB923C',
        'neo-orange-light': '#FFEDD5',
        border: '#000000',
        'text-main': '#000000',
        'text-secondary': '#374151',
        primary: {
          DEFAULT: '#FFE600',
          hover: '#FACC15',
          dark: '#000000',
          light: '#FFFBEB',
        },
        teal: {
          DEFAULT: '#2DD4BF',
          light: '#CCFBF1',
        },
        accent: {
          DEFAULT: '#FFE600',
          light: '#FEF9C3',
        },
        positive: {
          DEFAULT: '#22C55E',
          light: '#DCFCE7',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
        },
      },
      boxShadow: {
        neo: '4px 4px 0px 0px #000000',
        'neo-sm': '2px 2px 0px 0px #000000',
        'neo-md': '3px 3px 0px 0px #000000',
        'neo-lg': '6px 6px 0px 0px #000000',
        'neo-xl': '8px 8px 0px 0px #000000',
      },
      borderRadius: {
        DEFAULT: '8px',
        card: '14px',
        pill: '9999px',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
