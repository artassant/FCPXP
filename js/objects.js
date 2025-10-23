// objects.js (unchanged)
import { POSITIONS, randomDigit } from "./utilities.js";

export class MovingObject {
  constructor(startPos, positions, size, color, text) {
    this.x = Array.isArray(startPos) ? startPos[0] : startPos;
    this.y = Array.isArray(startPos) ? startPos[1] : 0;
    this.size = size || 40;
    this.color = color;
    this.original_text = text;
    this.text = text;
    this.is_target = false;

    this.position_index = 0;
    this.dx = 0;
    this.dy = 0;
    this.is_moving = true;
    this.stopped = false;

    this.last_move_time = -Infinity;
    this.last_item_time = 0;

    // ~1800/128 in python → tuned for 32 fps loop (31.25 ms)
    this.move_interval = 3000 / 128; // ~14.06 ms per index / from 1800
    this.item_interval = 300; // change digit every 300ms
  }

  move(current_time) {
    if (this.stopped) return;

    // update digit if not currently a target
    if (!this.is_target && current_time >= this.last_item_time + this.item_interval) {
      this.text = randomDigit();
      this.last_item_time = current_time;
    }

    if (this.is_moving && this.position_index != null) {
      if (current_time >= this.last_move_time + this.move_interval) {
        this.position_index = (this.position_index + 1) % POSITIONS.length;
        const [nx, ny] = POSITIONS[this.position_index];
        this.x = nx;
        this.y = ny;
        this.last_move_time = current_time;
      }
    } else if (this.is_moving) {
      // linear movement mode (unused here, but kept for parity)
      this.x += this.dx;
      this.y += this.dy;
    }
  }

  change(letter) {
    this.text = letter;
    this.is_target = true;
  }

  reset() {
    this.text = this.original_text;
    this.is_target = false;
  }

  distance_to(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}