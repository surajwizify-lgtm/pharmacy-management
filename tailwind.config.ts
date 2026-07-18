import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
      },
      colors: {
        brand: {
          50: '#eefcf3',
          100: '#d6f7e2',
          200: '#b0edc9',
          300: '#7bdda9',
          400: '#43c584',
          500: '#1fa969',
          600: '#128a55',
          700: '#106e46',
          800: '#11573a',
          900: '#0f4831',
          950: '#06281b',
        },
      },
    },
  },
  plugins: [],
};

export default config;
