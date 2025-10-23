// experiment.js
import { POSITIONS, randomDigit, randomLetter } from "./utilities.js";

export class Experiment {
  constructor(o1, o2, collision_type, which_changes, lag, participant_id, is_training = false, burst = false, num_targets = 2) {
    this.o1 = o1;
    this.o2 = o2;

    this.o1.original_text = randomDigit();
    this.o2.original_text = randomDigit();
    this.o1.text = this.o1.original_text;
    this.o2.text = this.o2.original_text;

    this.collision_type = collision_type;          // "overtaking" | "fake_causal" | "true_causal"
    this.which_changes = which_changes;            // "o1_twice" | "o1_then_o2"
    this.lag = lag;                                 // ms
    this.change_duration = 94;                      // ms letter visibility
    this.collision_time = null;
    this.fake_causal_duration = 350;
    this.fake_causal_pause_ended = false;
    this.state = "running";
    this.t1_value = null;
    this.t2_value = null;
    this.score = 0;
    this.attention_prompt = false;
    this.burst = burst;
    this.burst_start = null;
    this.burst_duration = 200;
    this.num_targets = num_targets;



    this.t1_object = "O1";
    this.t2_object = which_changes === "o1_twice" ? "O1" : "O2";
    this.T1_response = "";
    this.T2_response = "";
    this.participant_id = participant_id;
    this.is_training = is_training;

    this._initPositionsAndTiming();
  }

  _initPositionsAndTiming() {
    // O1 starts at index 0 on the ring
    const startIndex = 0;
    this.o1.x = POSITIONS[startIndex][0];
    this.o1.y = POSITIONS[startIndex][1];
    this.o1.position_index = startIndex;

    // O2 initially static
    this.o2.is_moving = false;

    // Slow stream by 20% (as in python)
    this.o1.move_interval *= 1.2;
    this.o2.move_interval = this.o1.move_interval;

    // ensure no immediate collision before ~1s
    const min_collision_time_initial_placement = 1000;
    const min_steps = Math.floor(min_collision_time_initial_placement / this.o1.move_interval);

    const valid_indices = [];
    for (let i = 0; i < POSITIONS.length; i++) {
      const futureIndex = (this.o1.position_index + min_steps) % POSITIONS.length;
      const [fx, fy] = POSITIONS[futureIndex];
      const [cx, cy] = POSITIONS[i];
      const dx = fx - cx;
      const dy = fy - cy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const threshold = this.collision_type === "overtaking" ? 50 : 20;
      if (distance > threshold) valid_indices.push(i);
    }

    // set timing: T1 and T2 (collision between them)
    const max_stream_duration = 3500;
    const max_post_collision = 1000;
    const frame_duration = 31.25;

    const min_t1 = min_collision_time_initial_placement;
    const max_t1 = max_stream_duration - this.lag - this.change_duration - max_post_collision;
    const steps = Math.max(0, Math.floor((max_t1 - min_t1) / frame_duration));
    const t1_index_frame = steps > 0 ? Math.floor(Math.random() * (steps + 1)) : 0;
    this.t1_time = this.num_targets > 1 ? min_t1 + t1_index_frame * frame_duration : null;
    this.t2_time = (this.t1_time || min_t1 + t1_index_frame * frame_duration) + this.lag;

    // collision window between T1 end and T2 start
    const min_collision = (this.t1_time || this.t2_time - this.lag) + this.change_duration;
    const max_collision = this.t2_time - this.change_duration;

    let min_frames = Math.floor(min_collision / this.o1.move_interval);
    let max_frames = Math.floor(max_collision / this.o1.move_interval);
    if (min_frames >= max_frames) max_frames = min_frames + 5;

    const o1_frames_to_collision = Math.floor(
      min_frames + Math.random() * Math.max(1, max_frames - min_frames)
    );
    const colIndex = (this.o1.position_index + o1_frames_to_collision) % POSITIONS.length;
    this.o2.position_index = colIndex;
    this.o2.x = POSITIONS[colIndex][0];
    this.o2.y = POSITIONS[colIndex][1];

    // done
  }

  update(current_time) {
    // advance O1 (and O2 when appropriate)
    if (!this.o1.stopped) this.o1.move(current_time);
    if (this.o2.is_moving && !this.o2.stopped) {
      if (current_time >= this.o2.last_move_time + this.o2.move_interval) {
        this.o2.move(current_time);
      }
    }

    const distance = this.o1.distance_to(this.o2);

    // T1 letter on O1
    if (this.num_targets > 1 && current_time >= this.t1_time && current_time < this.t1_time + this.change_duration) {
      if (!this.t1_value) {
        this.t1_value = randomLetter();
        this.o1.change(this.t1_value);
      }
    } else if (this.num_targets > 1 && current_time >= this.t1_time + this.change_duration && this.o1.is_target) {
      this.o1.reset();
      this.o1.text = this.o1.original_text;
    }

    // T2 letter on O1 or O2
    if (current_time >= this.t2_time && current_time < this.t2_time + this.change_duration) {
      if (!this.t2_value) {
        this.t2_value = randomLetter();
        if (this.which_changes === "o1_then_o2") {
          this.o2.change(this.t2_value);
        } else {
          this.o1.change(this.t2_value);
        }
      }
    } else if (current_time >= this.t2_time + this.change_duration) {
      if (this.which_changes === "o1_then_o2" && this.o2.is_target) {
        this.o2.reset();
        this.o2.text = this.o2.original_text;
      } else if (this.which_changes === "o1_twice" && this.o1.is_target) {
        this.o1.reset();
        this.o1.text = this.o1.original_text;
      }
    }

    // collisions
    if (this.collision_time == null) {
      let collision_detected = false;
      if (this.collision_type === "overtaking") {
        if (distance < 50) collision_detected = true;
      } else if (this.collision_type === "fake_causal" || this.collision_type === "true_causal") {
        if (distance < 20) collision_detected = true;
      }

      if (collision_detected) {
        this.collision_time = current_time;

        if (this.collision_type === "fake_causal") {
          this.o1.stopped = true;
          this.o2.stopped = true;
          this.o2.is_moving = false;
        } else if (this.collision_type === "true_causal") {
          this.o1.stopped = true;
          this.o2.is_moving = true;
          this.o2.position_index = this.o1.position_index;
          const [x, y] = POSITIONS[this.o2.position_index];
          this.o2.x = x; this.o2.y = y;
          this.o2.dx = 0; this.o2.dy = 0;
          this.o2.last_move_time = current_time;
          if (this.burst) {
            this.burst_start = current_time;
          }
        }
      }
    }

    // end of fake causal pause -> O2 starts moving from O1's last position
    if (this.collision_type === "fake_causal" &&
        this.collision_time != null &&
        !this.fake_causal_pause_ended &&
        current_time >= this.collision_time + this.fake_causal_duration) {
      this.o2.is_moving = true;
      this.o2.stopped = false;
      this.o2.position_index = this.o1.position_index;
      const [x, y] = POSITIONS[this.o2.position_index];
      this.o2.x = x; this.o2.y = y;
      this.o2.last_move_time = current_time;
      this.o1.stopped = true;
      this.o1.is_moving = false;
      this.fake_causal_pause_ended = true;
    }

    // ask for response 1s after T2
    if (current_time > this.t2_time + 1000 && this.state === "running") {
      this.state = "asking";
    }
  }

  submit_response(T1_response, T2_response) {
    this.T1_response = (T1_response || "").trim().toUpperCase();
    this.T2_response = (T2_response || "").trim().toUpperCase();
    this.check_response();
    this.state = "completed";
    return true;
  }

  check_response() {
    this.score = 0;
    if (this.num_targets > 1 && this.t1_value && this.T1_response === this.t1_value) this.score += 1;
    if (this.t2_value && this.T2_response === this.t2_value) this.score += 1;
  }

  get_results() {
    return {
      participant_id: this.participant_id,
      collision_type: this.collision_type,
      which_changes: this.which_changes,
      lag: this.lag,
      o1_start: this.o1.original_text,
      o2_start: this.o2.original_text,
      score: this.score,
      t1_value: this.t1_value,
      t2_value: this.t2_value,
      attention_prompt: this.attention_prompt,
      t1_object: this.t1_object,
      t2_object: this.t2_object,
      T1_response: this.T1_response,
      T2_response: this.T2_response,
      is_training: this.is_training,
      burst: this.burst,
      num_targets: this.num_targets
    };
  }
}