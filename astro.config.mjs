// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://rben01.github.io",
	// the github repo
	base: "special-relativity-lessons",
	// second path component must match base
	outDir: "_output/special-relativity-lessons",
});
