// @ts-check

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import cloudflare from '@astrojs/cloudflare';
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
	// TODO: 法语化后换成真实域名(GitHub Action 部署的 Cloudflare Pages 域名)
	site: 'https://service-chine.pages.dev/',
	// Keystatic admin + 表单 Function 需要 on-demand 运行时;主体内容仍静态优先。
	// 注:imageServices 暂关掉,Cloudflare 上用客户端/构建期处理(按 Astro cloudflare adapter 建议)。
	output: 'static',
	adapter: cloudflare({
		imageService: 'passthrough',
		// 预渲染(静态)页用 Node 运行时构建/开发。
		// adapter v13 默认用 workerd 预渲染,但部分依赖(如 debug/swiper)是 CommonJS,
		// 在 workerd dev 下报 "module is not defined"。改用 node 运行时即可。
		// on-demand 路由(Keystatic admin / 表单)仍走 workerd,与生产一致。
		prerenderEnvironment: 'node',
	}),
	vite: {
		plugins: [tailwindcss()],
	},
	integrations: [
		keystatic(),
		react(),
		markdoc(),
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
