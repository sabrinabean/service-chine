// @ts-check

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
	// TODO: 法语化后换成真实域名
	site: 'https://service-chine.pages.dev/',
	output: 'static',
	adapter: cloudflare({
		imageService: 'passthrough',
		// 预渲染用 Node 运行时,避免 workerd 下 CommonJS 依赖报错
		prerenderEnvironment: 'node',
	}),
	vite: {
		plugins: [tailwindcss()],
	},
	integrations: [
		react(),
		mdx(),
		sitemap(),
		icon(),
	],
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
