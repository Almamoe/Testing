# Forest Hunger Snake

A forest-themed snake game built with HTML, CSS, and JavaScript.

## Features

- Forest-styled game visuals and HUD
- Hunger system (eat or die)
- Snake growth and score progression
- Boss phase unlocked at large size
- Spirit-fruit mechanic for boss damage
- Game over and victory restart flow

## How To Run

1. Open `index.html` in your web browser.
2. Click **Start Hunt**.

No build step or install is required.

## Controls

- `W`, `A`, `S`, `D`
- Arrow keys

## Gameplay

1. Eat red fruit to gain score, grow, and refill hunger.
2. Avoid starvation by keeping the hunger bar from reaching zero.
3. Reach snake length `22` to trigger the boss fight.
4. During boss fight:
   - Collect blue spirit fruit.
   - Strike the boss head while you have spirit charge.
5. Reduce boss HP to `0` to win.

## Files

- `index.html` - page structure and UI containers
- `style.css` - visual design and layout
- `game.js` - core game logic and rendering
