/* eslint-disable @typescript-eslint/no-require-imports */
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}', // Note the addition of the `app` directory.
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',

    // Or if using `src` directory:
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  important: "html",
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
}
export default config