const opening = [
  {
    speaker: "ANDY",
    line: "It’s so late… I don’t know what to do after getting lost from my colony…",
  },
  {
    speaker: "ANDY",
    line: "I should try to find some other bugs to help me.",
  },
  {
    speaker: "ANDY",
    line: "Club Bug??? Maybe I can find my colony here!",
  },
  {
    speaker: "ANDY",
    line: "Let’s go!",
  },
];

const club = [
  {
    speaker: "ANDY",
    line: "Woah, this place is huge! How am I going to find anyone in here?",
  },
  {
    speaker: "ANDY",
    line: "Excuse me? Have you seen any ants around here?",
  },
  {
    speaker: "LUNA",
    line: "This isn’t the place for little ants like you. Better leave when you can, puny one.",
  },
  {
    speaker: "ANDY",
    line: "I’m… just trying to look for my colony…",
  },
  {
    speaker: "LUNA",
    line: "Stop disturbing me!",
  },
  {
    speaker: "ANDY",
    line: "Um-",
  },
  {
    speaker: "LUNA",
    line: "Okay little ant, if you can beat me in a fight, I’ll let you go easy.",
  },
  {
    speaker: "ANDY",
    line: "Oh… alright, I guess.",
  },
  {
    speaker: "LUNA",
    line: "Hah! You just made your worst mistake here.",
  },
  {
    speaker: "ANDY",
    line: "(gulp)",
  },
];

const MOTH_RING_EXIT_POSITION = 88;
const MOTH_FORWARD_STEP = 0.6;
const MOTH_RECOIL_STEP = 3.85;
const ANDY_COUNTER_PUSH = 3.5;
const ANDY_MISS_PUSH = 6.5;
const FIGHT_ROUNDS = 4;

const game = document.getElementById("game");
const menuScreen = document.getElementById("menuScreen");
const playButton = document.getElementById("playButton");
const storyScreen = document.getElementById("storyScreen");
const sceneBackground = document.getElementById("sceneBackground");
const andy = document.getElementById("andy");
const moth = document.getElementById("moth");
const fightUI = document.getElementById("fightUI");
const targetZone = document.getElementById("targetZone");
const roundLabel = document.getElementById("roundLabel");
const fightScore = document.getElementById("fightScore");
const textbox = document.getElementById("textbox");
const dialogueCopy = document.getElementById("dialogueCopy");
const speaker = document.getElementById("speaker");
const dialogueLine = document.getElementById("dialogueLine");
const fadeCurtain = document.getElementById("fadeCurtain");
const clubMusic = document.getElementById("clubMusic");

let phase = "menu";
let activeMusicTrack = clubMusic.getAttribute("src");
let dialogueIndex = 0;
let visibleCharacters = 0;
let typewriterTimer;
let finalDialogueTimer;
let transitioning = false;
let roundNumber = 1;
let andyPosition = 31;
let mothPosition = 76;
let roundTimers = [];
let gameComplete = false;
let hitLocked = false;
let successfulHits = 0;
let missedTargets = 0;

clubMusic.loop = true;
playMusic();

function playMusic(track = activeMusicTrack) {
  if (track !== activeMusicTrack) {
    activeMusicTrack = track;
    clubMusic.src = track;
    clubMusic.load();
  }
  clubMusic.volume = 0.14;
  clubMusic.play().catch(() => {
    // Playback is retried on the next user gesture.
  });
}

function startMusic() {
  playMusic();
}

function currentDialogue() {
  return (phase === "club" ? club : opening)[dialogueIndex];
}

function showDialogue() {
  window.clearInterval(typewriterTimer);
  window.clearTimeout(finalDialogueTimer);
  const dialogue = currentDialogue();
  if (!dialogue) return;

  if (phase === "club" && dialogue.speaker === "LUNA") {
    moth.classList.add("is-arriving");
  }

  speaker.textContent = dialogue.speaker;
  dialogueLine.textContent = "";
  visibleCharacters = 0;
  typewriterTimer = window.setInterval(() => {
    visibleCharacters += 1;
    dialogueLine.textContent = dialogue.line.slice(0, visibleCharacters);
    if (visibleCharacters >= dialogue.line.length) {
      window.clearInterval(typewriterTimer);
      if (phase === "club" && dialogueIndex === club.length - 1) {
        finalDialogueTimer = window.setTimeout(() => {
          if (phase === "club" && !transitioning) fadeTo("fight");
        }, 650);
      }
    }
  }, 28);
}

function fadeTo(nextPhase) {
  transitioning = true;
  window.clearInterval(typewriterTimer);
  window.clearTimeout(finalDialogueTimer);
  clearRoundTimers();
  fadeCurtain.classList.add("is-covering");

  window.setTimeout(() => {
    phase = nextPhase;
    dialogueIndex = 0;
    storyScreen.hidden = false;
    storyScreen.setAttribute("aria-hidden", "false");
    menuScreen.hidden = true;
    const backgrounds = {
      intro: "scene_1.png",
      club: "bar_bg.png",
      fight: "fight_bg.png",
      gameover: "game_over.png",
    };
    sceneBackground.style.backgroundImage = `url("images/${backgrounds[nextPhase]}")`;

    if (nextPhase === "club") {
      playMusic("music/party_at_club_bug.mp3");
    } else if (nextPhase === "gameover") {
      playMusic("music/i bet on losing dogs instrumental.mp3");
    }

    const inFight = nextPhase === "fight";
    const isGameOver = nextPhase === "gameover";
    fightUI.hidden = !inFight;
    textbox.hidden = inFight || isGameOver;
    dialogueCopy.hidden = inFight || isGameOver;
    andy.hidden = !inFight;
    moth.hidden = isGameOver;
    moth.classList.remove("is-arriving", "in-fight");
    andy.classList.remove("is-winning");

    if (inFight) {
      moth.classList.add("in-fight");
      resetFight();
    }

    fadeCurtain.classList.remove("is-covering");
    if (nextPhase === "intro" || nextPhase === "club") showDialogue();
    window.setTimeout(() => {
      transitioning = false;
      if (phase === "fight") beginRound();
    }, 560);
  }, 580);
}

function clearRoundTimers() {
  roundTimers.forEach((timer) => window.clearTimeout(timer));
  roundTimers = [];
  targetZone.replaceChildren();
}

function resetFight() {
  roundNumber = 1;
  andyPosition = 31;
  mothPosition = 76;
  gameComplete = false;
  hitLocked = false;
  successfulHits = 0;
  missedTargets = 0;
  andy.src = "images/sprites/andy_squareup.png";
  moth.src = "images/sprites/moth_squareup.png";
  andy.style.left = `${andyPosition}%`;
  moth.style.left = `${mothPosition}%`;
  roundLabel.textContent = `ROUND 1/${FIGHT_ROUNDS}`;
  updateFightScore();
}

function updateFightScore() {
  fightScore.textContent = `HITS ${successfulHits} · MISSES ${missedTargets}`;
}

function randomize(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function beginRound() {
  if (phase !== "fight" || gameComplete || hitLocked) return;
  clearRoundTimers();
  roundLabel.textContent = `ROUND ${roundNumber}/${FIGHT_ROUNDS}`;

  const colors = randomize([
    "grey",
    "grey",
    "grey",
    "grey",
    "grey",
    "yellow",
    "yellow",
    "orange",
  ]);
  const spawnInterval = Math.max(90, 250 - (roundNumber - 1) * 18);
  const visibleDuration = Math.max(700, 1500 - (roundNumber - 1) * 65);
  const size = Math.min(68, Math.max(30, Math.round(window.innerWidth * 0.045)));

  colors.forEach((color, index) => {
    const spawnTimer = window.setTimeout(() => {
      if (phase !== "fight" || gameComplete || hitLocked) return;

      const target = document.createElement(color === "orange" ? "button" : "span");
      target.className = `target-circle is-${color}`;
      target.style.width = `${size}px`;
      target.style.height = `${size}px`;

      const maxLeft = Math.max(0, targetZone.clientWidth - size);
      const maxTop = Math.max(0, targetZone.clientHeight - size);
      target.style.left = `${Math.random() * maxLeft}px`;
      target.style.top = `${Math.random() * maxTop}px`;
      target.style.animationDuration = `${visibleDuration}ms`;

      if (color === "orange") {
        target.type = "button";
        target.setAttribute("aria-label", `Orange target, round ${roundNumber}`);
        target.addEventListener("click", (event) => {
          event.stopPropagation();
          landHit();
        });
      } else {
        target.setAttribute("aria-hidden", "true");
      }

      targetZone.append(target);
      const removeTimer = window.setTimeout(() => target.remove(), visibleDuration);
      roundTimers.push(removeTimer);
    }, index * spawnInterval);
    roundTimers.push(spawnTimer);
  });

  const roundDuration = 7 * spawnInterval + visibleDuration + 120;
  const endTimer = window.setTimeout(() => {
    if (phase !== "fight" || gameComplete || hitLocked) return;
    resolveMissedTarget();
  }, roundDuration);
  roundTimers.push(endTimer);
}

function resolveMissedTarget() {
  if (phase !== "fight" || gameComplete || hitLocked) return;
  hitLocked = true;
  missedTargets += 1;
  clearRoundTimers();
  updateFightScore();

  andy.src = "images/sprites/andy_squareup.png";
  moth.src = "images/sprites/moth_push.png";
  andyPosition -= ANDY_MISS_PUSH;
  mothPosition -= MOTH_FORWARD_STEP;
  andy.style.left = `${andyPosition}%`;
  moth.style.left = `${mothPosition}%`;

  window.setTimeout(() => {
    if (phase !== "fight" || gameComplete) return;
    moth.src = "images/sprites/moth_squareup.png";
    continueAfterExchange();
  }, 560);
}

function landHit() {
  if (phase !== "fight" || gameComplete || hitLocked) return;
  hitLocked = true;
  successfulHits += 1;
  clearRoundTimers();
  updateFightScore();

  andy.src = "images/sprites/andy_push.png";
  andyPosition += 1.5;
  andy.style.left = `${andyPosition}%`;

  window.setTimeout(() => {
    if (phase !== "fight" || gameComplete) return;
    andy.src = "images/sprites/andy_squareup.png";
    moth.src = "images/sprites/moth_push.png";
    andyPosition -= ANDY_COUNTER_PUSH;
    mothPosition -= MOTH_FORWARD_STEP;
    andy.style.left = `${andyPosition}%`;
    moth.style.left = `${mothPosition}%`;

    window.setTimeout(() => {
      if (phase !== "fight" || gameComplete) return;
      moth.src = "images/sprites/moth_squareup.png";
      mothPosition += MOTH_RECOIL_STEP;
      moth.style.left = `${mothPosition}%`;

      window.setTimeout(continueAfterExchange, 560);
    }, 560);
  }, 380);
}

function continueAfterExchange() {
  if (phase !== "fight" || gameComplete) return;

  const andyOut = andyPosition <= 19;
  const mothOut = mothPosition >= MOTH_RING_EXIT_POSITION;
  const perfectRun = missedTargets === 0 && successfulHits === FIGHT_ROUNDS;

  if (mothOut || perfectRun) {
    finishWithAndyWin();
    return;
  }
  if (andyOut) {
    finishWithAndyLoss();
    return;
  }
  if (roundNumber >= FIGHT_ROUNDS) {
    finishWithAndyLoss();
    return;
  }

  hitLocked = false;
  roundNumber += 1;
  beginRound();
}
function finishWithAndyLoss() {
  gameComplete = true;
  hitLocked = true;
  clearRoundTimers();
  andy.src = "images/sprites/andy_lose.png";
  window.setTimeout(() => {
    if (phase === "fight") fadeTo("gameover");
  }, 3000);
}

function finishWithAndyWin() {
  gameComplete = true;
  hitLocked = true;
  clearRoundTimers();
  andy.src = "images/sprites/andy_win.png";
  moth.src = "images/sprites/moth_squareup.png";
  andy.classList.add("is-winning");
}

function beginGame() {
  if (phase !== "menu" || transitioning) return;
  startMusic();
  playButton.disabled = true;
  fadeTo("intro");
}

function advanceDialogue() {
  if (phase === "menu" || phase === "fight" || phase === "gameover" || transitioning) return;

  const dialogue = currentDialogue();
  if (!dialogue) return;

  if (visibleCharacters < dialogue.line.length) {
    window.clearInterval(typewriterTimer);
    visibleCharacters = dialogue.line.length;
    dialogueLine.textContent = dialogue.line;
    return;
  }

  if (phase === "intro" && dialogueIndex === opening.length - 1) {
    fadeTo("club");
    return;
  }

  if (phase === "club" && dialogueIndex === club.length - 1) {
    fadeTo("fight");
    return;
  }

  dialogueIndex += 1;
  showDialogue();
}

playButton.addEventListener("click", (event) => {
  event.stopPropagation();
  beginGame();
});

game.addEventListener("click", advanceDialogue);

window.addEventListener("keydown", (event) => {
  if (event.code !== "Enter" && event.code !== "Space") return;
  event.preventDefault();
  if (phase === "menu") {
    beginGame();
  } else {
    advanceDialogue();
  }
});
