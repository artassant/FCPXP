// utilities.js (added colors)
export const WIDTH = 900;
export const HEIGHT = 600;
export const BLACK = [0, 0, 0];
export const WHITE = [255, 255, 255];
export const GRAY = [128, 128, 128];
export const GREEN = [0, 128, 0]; // flashy green
export const BLUE = [0, 0, 255]; // flashy blue

export const POSITIONS = Array.from({ length: 128 }, (_, i) => [
  400 + 200 * Math.cos((2 * Math.PI * i) / 128),
  300 + 200 * Math.sin((2 * Math.PI * i) / 128)
]);

export function randomDigit() {
  return String(Math.floor(Math.random() * 9) + 1);
}

export function randomLetter() {
  const letters = "ABCDEFGHIJKLMNPQRSTUVWXYZ";
  return letters[Math.floor(Math.random() * letters.length)];
}

export function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}