/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
      "./src/styles/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        backdropBlur: {
          lg: '10px',
        },
        colors: {
          indigo: {
            300: '#a5b4fc',
            400: '#818cf8',
            500: '#4f46e5',
            600: '#4338ca',
            700: '#3730a3',
          },
          emerald: {
            300: '#6ee7b7',
            400: '#34d399',
            500: '#059669',
            600: '#047857',
            700: '#065f46',
          },
          rose: {
            300: '#fda4af',
            400: '#fb7185',
            500: '#e11d48',
            600: '#be123c',
            700: '#9f1239',
          },
        },
      },
    },
    plugins: [
      
    ],
  }