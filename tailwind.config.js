/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#25D366',      // Verde Primário
        white: '#FFFFFF',        // Branco
        darkGray: '#128C7E',     // Cinza Escuro
        lightBlue: '#34B7F1',    // Azul Claro
        lightGray: '#ECE5DD',    // Cinza Claro
        mediumGray: '#3C3C3C',   // Cinza Médio
        error: '#FF4B4B',        // Vermelho
        success: '#00E676',      // Verde Claro
      },
    },
  },
  plugins: [],
}
