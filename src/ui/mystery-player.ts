import type { ChoiceStep, Episode, EpisodeStep, IntroStep, RiddleStep, UnlockStep, Word } from "../content/types";
import { getWord } from "../content/index";
import { withHintOverride } from "../content/overrides";
import { createHintButton, type HintButtonHandle } from "./hint-button";
import { speakEnglish } from "../audio/speech";
import { canRecord, playBlob, startRecording, type Recorder } from "../audio/record";
import { saveRecording } from "../audio/recordings";
import { awardStars, getState, reviewWordResult, setEpisodeStepIndex, completeEpisode } from "../state/app-store";
import { todayIso } from "../util/date";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copy[i]!;
    const b = copy[j]!;
    copy[i] = b;
    copy[j] = a;
  }
  return copy;
}

export function renderMysteryPlayer(episode: Episode, navigate: (hash: string) => void): HTMLElement {
  const root = document.createElement("div");
  root.className = "mystery-player";

  const saved = getState().episodeProgress[episode.id];
  let stepIndex = saved && !saved.completed && saved.currentStepIndex >= 0 ? saved.currentStepIndex : 0;
  let currentHint: HintButtonHandle | null = null;

  function renderStep() {
    root.innerHTML = "";
    currentHint?.destroy();

    const dots = document.createElement("div");
    dots.className = "step-dots";
    episode.steps.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = i <= stepIndex ? "dot dot-done" : "dot";
      dots.appendChild(dot);
    });
    root.appendChild(dots);

    const step = episode.steps[stepIndex];
    if (!step) return;
    setEpisodeStepIndex(episode.id, stepIndex);

    const stepEl = renderStepByType(step, {
      onAdvance: () => {
        stepIndex += 1;
        if (stepIndex >= episode.steps.length) {
          navigate("#/");
        } else {
          renderStep();
        }
      },
      alreadyCompleted: getState().episodeProgress[episode.id]?.completed ?? false,
      onComplete: () => {
        completeEpisode(episode.id, episode.rewardCollectibleId, todayIso());
      },
      onBackHome: () => navigate("#/"),
      mountHint: (hint, wordId) => {
        currentHint = createHintButton(withHintOverride({ ...hint }), getState().hintMode, () => {
          if (wordId) reviewWordResult(wordId, "hint", Date.now());
        });
        root.appendChild(currentHint.el);
      },
    });

    root.appendChild(stepEl);
  }

  renderStep();
  return root;
}

interface StepCallbacks {
  onAdvance: () => void;
  onComplete: () => void;
  onBackHome: () => void;
  mountHint: (hint: EpisodeStep, wordId?: string) => void;
  alreadyCompleted: boolean;
}

function renderStepByType(step: EpisodeStep, cb: StepCallbacks): HTMLElement {
  switch (step.type) {
    case "intro":
      return renderIntroStep(step, cb);
    case "choice":
      return renderChoiceStep(step, cb);
    case "riddle":
      return renderChoiceStep(step, cb);
    case "unlock":
      return renderUnlockStep(step, cb);
  }
}

function wordCard(word: Word, onClick: () => void): HTMLButtonElement {
  const card = document.createElement("button");
  card.className = "word-choice";
  card.setAttribute("aria-label", word.en);
  const emoji = document.createElement("div");
  emoji.className = "word-choice-emoji";
  emoji.textContent = word.emoji;
  card.appendChild(emoji);
  card.addEventListener("click", onClick);
  return card;
}

function renderIntroStep(step: IntroStep, cb: StepCallbacks): HTMLElement {
  const word = getWord(step.wordId);
  cb.mountHint(step, step.wordId);

  const el = document.createElement("div");
  el.className = "step-panel intro-step";

  const emoji = document.createElement("div");
  emoji.className = "big-emoji";
  emoji.textContent = word.emoji;
  el.appendChild(emoji);

  const target = document.createElement("div");
  target.className = "word-target";
  target.textContent = word.en;
  el.appendChild(target);

  const sentence = document.createElement("div");
  sentence.className = "sentence-line";
  sentence.textContent = step.sentenceTemplate.replace("___", word.en);
  el.appendChild(sentence);

  const hearBtn = document.createElement("button");
  hearBtn.className = "btn-secondary";
  hearBtn.textContent = "🔊 Hear it";
  hearBtn.addEventListener("click", () => speakEnglish(word.en, word.audio));
  el.appendChild(hearBtn);
  speakEnglish(word.en, word.audio);

  if (canRecord()) {
    const sayBtn = document.createElement("button");
    sayBtn.className = "btn-secondary";
    sayBtn.textContent = "🎤 Say it";
    let recorder: Recorder | null = null;

    sayBtn.addEventListener("click", async () => {
      if (!recorder) {
        sayBtn.textContent = "⏹ Stop";
        recorder = await startRecording().catch(() => null);
        if (!recorder) sayBtn.textContent = "🎤 Say it";
        return;
      }
      const blob = await recorder.stop();
      recorder = null;
      sayBtn.textContent = "🎤 Say it";
      await saveRecording(word.id, blob);
      playBlob(blob);
    });
    el.appendChild(sayBtn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.className = "btn-primary";
  nextBtn.textContent = "Continue ▶";
  nextBtn.addEventListener("click", () => {
    reviewWordResult(word.id, "correct", Date.now());
    awardStars(step.type, "correct");
    cb.onAdvance();
  });
  el.appendChild(nextBtn);

  return el;
}

function renderChoiceStep(step: ChoiceStep | RiddleStep, cb: StepCallbacks): HTMLElement {
  const correctWord = getWord(step.wordId);
  const decoys = step.decoyWordIds.map(getWord);
  const choices = shuffle([correctWord, ...decoys]);
  cb.mountHint(step, step.wordId);

  let hintWasUsed = false;
  let missedOnce = false;

  const el = document.createElement("div");
  el.className = "step-panel choice-step";

  const promptEl = document.createElement("div");
  promptEl.className = "clue-prompt";
  promptEl.textContent = step.prompt;
  el.appendChild(promptEl);
  speakEnglish(step.prompt);

  const message = document.createElement("div");
  message.className = "feedback-message";
  el.appendChild(message);

  const choiceGrid = document.createElement("div");
  choiceGrid.className = "choice-grid";

  for (const word of choices) {
    const card = wordCard(word, () => {
      if (word.id === correctWord.id) {
        const result = hintWasUsed ? "hint" : missedOnce ? "incorrect" : "correct";
        reviewWordResult(correctWord.id, result, Date.now());
        const stars = awardStars(step.type, result);
        message.textContent = `Yes! +${stars} ⭐`;
        message.className = "feedback-message feedback-good celebrate";
        card.disabled = true;
        window.setTimeout(cb.onAdvance, 700);
      } else {
        missedOnce = true;
        message.textContent = "Almost! Listen again.";
        message.className = "feedback-message feedback-gentle";
        speakEnglish(step.prompt);
      }
    });
    choiceGrid.appendChild(card);
  }
  el.appendChild(choiceGrid);

  return el;
}

function renderUnlockStep(step: UnlockStep, cb: StepCallbacks): HTMLElement {
  cb.mountHint(step);
  if (!cb.alreadyCompleted) {
    cb.onComplete();
    awardStars(step.type, "correct");
  }

  const el = document.createElement("div");
  el.className = "step-panel unlock-step celebrate";

  const trophy = document.createElement("div");
  trophy.className = "big-emoji";
  trophy.textContent = "🏆";
  el.appendChild(trophy);

  const reward = document.createElement("div");
  reward.className = "reward-text";
  reward.textContent = step.rewardText;
  el.appendChild(reward);

  const cliff = document.createElement("div");
  cliff.className = "cliffhanger-text";
  cliff.textContent = step.cliffhanger;
  el.appendChild(cliff);

  speakEnglish(`${step.rewardText} ${step.cliffhanger}`);

  const homeBtn = document.createElement("button");
  homeBtn.className = "btn-primary";
  homeBtn.textContent = "Back to TV 📺";
  homeBtn.addEventListener("click", cb.onBackHome);
  el.appendChild(homeBtn);

  return el;
}
