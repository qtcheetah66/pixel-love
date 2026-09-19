// Adapted from tweenjs/tween.js src/Easing.ts (MIT), Tween.js authors / Robert Penner.
export const easeOut = amount => --amount * amount * amount + 1;
export const easeInOut = amount => 0.5 * (1 - Math.sin(Math.PI * (0.5 - amount)));

