/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['selector', 'class'],
	content: [
		"./pages/**/*.{js,ts,jsx,tsx}",
		"./components/**/*.{js,ts,jsx,tsx}",
	],
	safelist: [
		{ pattern: /p-\d+/ },
		{ pattern: /m-\d+/ },
	],
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					dark: 'var(--primary-dark)',
					light: 'var(--color-primary-light)',
					transparent: 'rgba(24, 107, 232, 0.2)',
					foreground: 'hsl(var(--primary-foreground))'
				},
				text: 'var(--color-gray-400)',
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				accentLight: 'var(--color-accent-light)',
				background: 'hsl(var(--background))',
				gray: {
					'100': 'var(--color-gray-100)',
					'200': 'var(--color-gray-200)',
					'300': 'var(--color-gray-300)',
					'400': 'var(--color-gray-400)',
					'500': 'var(--color-gray-500)',
					'600': 'var(--color-gray-600)',
					'700': 'var(--color-gray-700)',
					'800': 'var(--color-gray-800)',
					'900': 'var(--color-gray-900)',
					'1000': 'var(--color-gray-1000)',
					'1100': 'var(--color-gray-1100)'
				},
				warning: 'var(--color-warning)',
				success: 'var(--color-success)',
				danger: 'var(--color-danger)',
				info: 'var(--color-info)',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")]
}