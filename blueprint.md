# Play Arcade - Tetris

## Overview
A web-based arcade platform starting with a classic Tetris game. The application features a neon-inspired, retro-modern design, providing an immersive gaming experience using modern web standards like Web Components, CSS Container Queries, and ES Modules.

## Application Architecture
- **Web Components:** The entire game is encapsulated within a `<tetris-game>` custom element.
- **State Management:** Reactive game state handling score, levels, and piece positioning.
- **Rendering:** Canvas-based rendering for high performance, wrapped inside the custom element's Shadow DOM.
- **Styling:** CSS Cascade Layers for base and component styles, using `oklch` for vibrant neon colors.

## Features implemented
### 1. Retro-Modern Arcade UI
- Neon aesthetic with glow effects using `oklch` colors.
- Responsive layout that fits both desktop and mobile screens.
- Score and level display with custom typography.
- Multi-layered drop shadows and neon "glow" effects.

### 2. Core Tetris Logic
- Random tetromino generation (I, J, L, O, S, T, Z).
- Collision detection and line clearing.
- Piece rotation and hard drop functionality.
- Game Over state with restart capability.

### 3. Responsive Controls
- Keyboard support (Arrow keys and Space).
- On-screen mobile controls with arcade-style buttons.
- Touch-friendly interface with neon feedback.

## Current State
The project has successfully transitioned from a Lotto generator to a fully functional Tetris arcade game. All core mechanics and visual styles are implemented and verified.
