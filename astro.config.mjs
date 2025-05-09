// @ts-check
import { defineConfig } from "astro/config";

const runningOnGithub = process.env.GITHUB_ACTIONS === "true";

// https://astro.build/config
export default defineConfig({
	site: "https://rben01.github.io",
	// the github repo, twice
	base: runningOnGithub
		? "special-relativity-lessons/special-relativity-lessons"
		: "special-relativity-lessons",
	// second path component must also be the github repo
	outDir: "_output/special-relativity-lessons",
});
