let trial = 0;
let maxTrials = 2;
let maxRealCount = 2;
let isTrialPhase = true;

let ball1, ball2;
let state = 'waiting';
let results = [];
let currentTrialData = {};

function setup() {
  let canvas = createCanvas(600, 400);
  canvas.parent('sketch-holder');
  noLoop(); // Don't start looping until experiment begins
}

function draw() {
  background(0);
  if (state === 'trial') {
    fill(255);
    ellipse(ball1.x, ball1.y, ball1.r * 2);
    ellipse(ball2.x, ball2.y, ball2.r * 2);

    ball1.x += ball1.vx;
    ball2.x += ball2.vx;

    if (
      ball1.x > width || ball2.x < 0 ||
      dist(ball1.x, ball1.y, ball2.x, ball2.y) < ball1.r + ball2.r
    ) {
      state = 'response';
      document.getElementById('trial-status').innerText =
        `Trial ${trial + 1} of ${maxTrials}: Did the balls collide? (Y/N)`;
    }
  } else if (state === 'response') {
    textAlign(CENTER);
    textSize(20);
    fill(255);
    text('Did the balls collide? Press Y/N', width / 2, height / 2);
  }
}

function keyPressed() {
  if (state === 'response' && (key === 'Y' || key === 'N')) {
    results.push({
      trial: trial + 1,
      target1: `Ball1(${ball1.x0},${ball1.vx})`,
      target2: `Ball2(${ball2.x0},${ball2.vx})`,
      response1: key === 'Y' ? 'Yes' : 'No',
      response2: ''
    });

    trial++;
    if (trial >= maxTrials) {
      endExperiment();
      noLoop();
    } else {
      state = 'waiting';
      startTrial();
    }
  }
}

function showCountdown(callback) {
  setTimeout(callback, 1000); // 1-second delay
}

function startTrial() {
  ball1 = {
    x: random(50, 150),
    x0: random(50, 150),
    y: 200,
    vx: random(2, 5),
    r: 20
  };
  ball2 = {
    x: random(450, 550),
    x0: random(450, 550),
    y: 200,
    vx: random(-5, -2),
    r: 20
  };

  document.getElementById('trial-status').innerText = `Trial ${trial + 1} of ${maxTrials}`;
  showCountdown(() => {
    state = 'trial';
    loop();
  });
}

function startExperiment() {
  trial = 0;
  results = [];
  startTrial();
}

function endExperiment() {
  document.getElementById("download-section").style.display = "block";
  document.getElementById("trial-status").innerText = "Experiment complete.";
  console.log("Experiment Results:", results);
}

window.startExperiment = startExperiment;
