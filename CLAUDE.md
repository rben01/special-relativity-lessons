# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an educational project that creates interactive presentations about special relativity. It's a hybrid system combining:

- **Quarto** for generating static presentation slides in Reveal.js format
- **Astro** for building interactive visualizations and animations

The project generates educational content with interactive physics simulations to teach concepts like time dilation, length contraction, and relativistic effects.

## Development Commands

### Building and Development

- `npm run dev` - Start Astro development server for interactive components
- `npm run build` - Build Astro components for production
- `npm run preview` - Preview built Astro site
- `quarto render` - Build all lesson presentations (requires Quarto CLI)
- `quarto preview` - Preview lessons during development

### Key Dependencies

- **Astro 5.7.4** - Framework for interactive components
- **@svgdotjs/svg.js** - SVG manipulation library for animations
- **Quarto** - Static site generator for presentations (not in package.json, requires separate installation)

## Architecture

### Content Structure

- **`lessons/`** - Quarto markdown files (.qmd) for each lesson's presentation content
- **`src/`** - Astro components and interactive visualizations
  - `components/` - Reusable Astro components (LightClock, NumericInput, Slider, etc.)
  - `pages/` - Interactive pages organized by lesson
  - `scripts/common.ts` - Shared physics utilities and constants
  - `layouts/Layout.astro` - Base layout for interactive pages

### Build System Integration

- **Quarto** builds presentations to `_output/` directory using Reveal.js
- **Astro** builds interactive components to `_output/special-relativity-lessons/`
- Both systems share the `images/` directory for assets
- GitHub Actions deployment uses specific base paths for GitHub Pages

### Interactive Components

Interactive physics simulations are built as Astro components that can be embedded in lessons:

- Light clock animations demonstrating time dilation
- Train motion visualizations for length contraction
- Spacetime diagrams with light cones
- Velocity addition calculators

### Physics Implementation

Core physics calculations are centralized in `src/scripts/common.ts`:

- `getGamma(fracOfC)` - Calculates Lorentz factor γ
- Interpolation utilities for smooth animations
- Standard visual styling for physics elements (mirrors, photons, etc.)

## Configuration Files

- **`_quarto.yml`** - Quarto project configuration with Reveal.js theming
- **`astro.config.mjs`** - Astro configuration with GitHub Pages deployment settings
- **`tsconfig.json`** - TypeScript configuration extending Astro's strict preset
- **`custom.scss`** - Custom styling for Reveal.js presentations

## Development Workflow

1. Edit lesson content in `lessons/*.qmd` files for presentation material
2. Build interactive components in `src/` for physics visualizations
3. Use `quarto preview` to develop presentation content
4. Use `npm run dev` to develop interactive components
5. Both build systems output to `_output/` for deployment

## Project Structure Notes

- Lessons are numbered 0-7 covering progression from basic concepts to paradoxes
- Interactive components are organized by lesson in `src/pages/lesson-*/`
- Images are organized by lesson number in `images/[0-7]/`
- The project uses MathJax for mathematical notation in both Quarto and Astro
