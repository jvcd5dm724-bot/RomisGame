import type { ChoiceStep, Episode, EpisodeStep, IntroStep, RiddleStep, UnlockStep, Word } from "../content/types";
import { getWord } from "../content/index";
import { withHintOverride } from "../content/overrides";
import { createHintButton, type HintButtonHandle } from "./hint-button";
import { speakEnglish } from "../audio/speech";
import { awardStars, getState, reviewWordResult, setEpisodeStepIndex, completeEpisode } from "../state/app-store";
import { todayIso } from "../util/date";
import { createHomeButton } from "./home-button";
import { createSayItRecorder } from "./say-it-recorder";
import { renderWordVisual } from "./word-visual";
import { playCorrectChime, playGentleBump } from "../audio/sfx";

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
  const wrapper = document.createElement("div");
  wrapper.className = "screen-shell";
  wrapper.appendChild(createHomeButton(navigate));

  const root = document.createElement("div");
  root.className = "mystery-player";
  wrapper.appendChild(root);

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
  return wrapper;
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
  card.appendChild(renderWordVisual(word, "word-choice-emoji"));
  card.addEventListener("click", onClick);
  return card;
}

function renderIntroStep(step: IntroStep, cb: StepCallbacks): HTMLElement {
  const word = getWord(step.wordId);
  cb.mountHint(step, step.wordId);

  const el = document.createElement("div");
  el.className = "step-panel intro-step";

  el.appendChild(renderWordVisual(word, "big-emoji"));

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

  const sayIt = createSayItRecorder(word);
  if (sayIt) el.appendChild(sayIt);

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
  const allCards: HTMLButtonElement[] = [];

  for (const word of choices) {
    const card = wordCard(word, () => {
      if (word.id === correctWord.id) {
        const result = hintWasUsed ? "hint" : missedOnce ? "incorrect" : "correct";
        reviewWordResult(correctWord.id, result, Date.now());
        const stars = awardStars(step.type, result);
        message.textContent = `Yes! +${stars} ⭐`;
        message.className = "feedback-message feedback-good celebrate";
        playCorrectChime();
        card.classList.add("correct-pop");
        for (const other of allCards) {
          other.disabled = true;
          if (other !== card) other.classList.add("dim");
        }
        window.setTimeout(cb.onAdvance, 900);
      } else {
        missedOnce = true;
        message.textContent = "🤔 Not quite — try again!";
        message.className = "feedback-message feedback-gentle";
        playGentleBump();
        card.classList.remove("wrong-shake");
        // Force a reflow so re-adding the class restarts the animation on a repeat tap.
        void card.offsetWidth;
        card.classList.add("wrong-shake");
        speakEnglish(step.prompt);
      }
    });
    allCards.push(card);
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
