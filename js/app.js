/**
 * لعبة تخمين الآيات القرآنية
 * محرك اللعبة الكامل في ملف واحد
 */

const TRANSITION_MS = 300;
const FADE_IN_DELAY_MS = 20;
const ANSWER_DELAY_MS = 1200;
const TIMER_SECONDS = 15;
const QUESTIONS_URL = 'data/questions.json';

const FEEDBACK_CLASSES = ['bg-emerald-600', 'bg-red-600', 'text-white'];

/**
 * خلط مصفوفة بخوارزمية Fisher-Yates (نسخة جديدة دون تعديل الأصل)
 * @param {Array} array
 * @returns {Array}
 */
function shuffleArray(array) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

const gameState = {
  currentQuestionIndex: 0,
  score: 0,
  timer: TIMER_SECONDS,
  questions: [],
  timerInterval: null,
};

let isProcessingAnswer = false;

const dom = {
  btnStart: document.getElementById('btn-start'),
  btnReplay: document.getElementById('btn-replay'),
  btnMainMenu: document.getElementById('btn-main-menu'),
  btnQuizBack: document.getElementById('btn-quiz-back'),
  ayahText: document.getElementById('ayah-text'),
  optionsContainer: document.getElementById('options-container'),
  questionNumber: document.getElementById('question-number'),
  questionTotal: document.getElementById('question-total'),
  scoreDisplay: document.getElementById('score-display'),
  timerBar: document.getElementById('timer-bar'),
  timerFill: document.getElementById('timer-fill'),
  resultScore: document.getElementById('result-score'),
  resultTotal: document.getElementById('result-total'),
  resultMessage: document.getElementById('result-message'),
};

function getCurrentQuestion() {
  return gameState.questions[gameState.currentQuestionIndex];
}

function getOptionButtons() {
  return dom.optionsContainer.querySelectorAll('.option-btn');
}

function disableOptions() {
  getOptionButtons().forEach((btn) => btn.classList.add('pointer-events-none'));
}

function resetOptionStyles() {
  getOptionButtons().forEach((btn) => {
    FEEDBACK_CLASSES.forEach((cls) => btn.classList.remove(cls));
    btn.classList.remove('pointer-events-none');
  });
}

function highlightCorrectAnswer(correctSurah) {
  getOptionButtons().forEach((btn) => {
    if (btn.textContent.trim() === correctSurah) {
      btn.classList.add('bg-emerald-600', 'text-white');
    }
  });
}

function showScreen(screen) {
  screen.classList.remove('hidden', 'pointer-events-none', 'opacity-0');
  screen.setAttribute('aria-hidden', 'false');

  if (screen.id !== 'start-screen') {
    screen.classList.add('flex');
  }

  setTimeout(() => {
    screen.classList.add('opacity-100');
  }, FADE_IN_DELAY_MS);
}

function hideScreen(screen) {
  return new Promise((resolve) => {
    screen.classList.remove('opacity-100');
    screen.classList.add('opacity-0', 'pointer-events-none');
    screen.setAttribute('aria-hidden', 'true');

    setTimeout(() => {
      screen.classList.add('hidden');
      resolve();
    }, TRANSITION_MS);
  });
}

async function switchScreen(fromScreenId, toScreenId) {
  const fromScreen = document.getElementById(fromScreenId);
  const toScreen = document.getElementById(toScreenId);

  if (fromScreen) {
    await hideScreen(fromScreen);
  }

  if (toScreen) {
    showScreen(toScreen);
  }
}

function stopTimer() {
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }
}

function updateTimerBar() {
  const percent = (gameState.timer / TIMER_SECONDS) * 100;
  dom.timerFill.style.width = percent + '%';

  if (dom.timerBar) {
    dom.timerBar.setAttribute('aria-valuenow', String(Math.max(gameState.timer, 0)));
  }
}

function startTimer() {
  stopTimer();
  gameState.timer = TIMER_SECONDS;
  dom.timerFill.style.width = '100%';

  if (dom.timerBar) {
    dom.timerBar.setAttribute('aria-valuemax', String(TIMER_SECONDS));
    dom.timerBar.setAttribute('aria-valuenow', String(TIMER_SECONDS));
  }

  gameState.timerInterval = setInterval(() => {
    gameState.timer -= 1;
    updateTimerBar();

    if (gameState.timer <= 0) {
      stopTimer();
      handleTimeout();
    }
  }, 1000);
}

function handleTimeout() {
  if (isProcessingAnswer) return;

  isProcessingAnswer = true;
  disableOptions();

  const question = getCurrentQuestion();
  highlightCorrectAnswer(question.correctSurah);

  setTimeout(() => {
    resetOptionStyles();
    isProcessingAnswer = false;
    nextQuestion();
  }, ANSWER_DELAY_MS);
}

function handleOptionClick(event) {
  const clickedButton = event.target.closest('.option-btn');

  if (!clickedButton || isProcessingAnswer) return;

  isProcessingAnswer = true;
  stopTimer();
  disableOptions();

  const question = getCurrentQuestion();
  const selectedSurah = clickedButton.textContent.trim();
  const isCorrect = selectedSurah === question.correctSurah;

  if (isCorrect) {
    clickedButton.classList.add('bg-emerald-600', 'text-white');
    gameState.score += 1;
    dom.scoreDisplay.textContent = String(gameState.score);
  } else {
    clickedButton.classList.add('bg-red-600', 'text-white');
    highlightCorrectAnswer(question.correctSurah);
  }

  setTimeout(() => {
    resetOptionStyles();
    isProcessingAnswer = false;
    nextQuestion();
  }, ANSWER_DELAY_MS);
}

async function nextQuestion() {
  gameState.currentQuestionIndex += 1;

  if (gameState.currentQuestionIndex < gameState.questions.length) {
    renderQuestion(gameState.currentQuestionIndex);
  } else {
    await showResults();
  }
}

function getResultMessage(score, total) {
  if (score === total) {
    return '\u0645\u0627 \u0634\u0627\u0621 \u0627\u0644\u0644\u0647! \u062d\u0641\u0638\u0643 \u0645\u0645\u062a\u0627\u0632 \u0648\u062b\u0627\u0628\u062a';
  }

  if (total > 0 && score / total >= 0.8) {
    return '\u0623\u062d\u0633\u0646\u062a! \u0645\u0633\u062a\u0648\u0649 \u0631\u0627\u0626\u0639 \u0642\u0627\u0631\u0628 \u0627\u0644\u0643\u0645\u0627\u0644';
  }

  return '\u0645\u062d\u0627\u0648\u0644\u0629 \u062c\u064a\u062f\u0629\u060c \u0627\u0633\u062a\u0645\u0631 \u0641\u064a \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629 \u0648\u062a\u062b\u0628\u064a\u062a \u0627\u0644\u0633\u0648\u0631';
}

async function showResults() {
  stopTimer();

  const total = gameState.questions.length;
  dom.resultScore.textContent = String(gameState.score);
  dom.resultTotal.textContent = String(total);
  dom.resultMessage.textContent = getResultMessage(gameState.score, total);

  await switchScreen('quiz-screen', 'result-screen');
}

async function loadQuestions() {
  const response = await fetch(QUESTIONS_URL);

  if (!response.ok) {
    throw new Error('\u0641\u0634\u0644 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0623\u0633\u0626\u0644\u0629: ' + response.status);
  }

  const data = await response.json();
  gameState.questions = data;

  if (dom.questionTotal) {
    dom.questionTotal.textContent = String(data.length);
  }

  if (dom.resultTotal) {
    dom.resultTotal.textContent = String(data.length);
  }
}

function renderQuestion(index, options = { startTimer: true }) {
  const question = gameState.questions[index];

  if (!question) return;

  resetOptionStyles();
  isProcessingAnswer = false;

  dom.ayahText.textContent = question.ayahText;
  dom.questionNumber.textContent = String(index + 1);
  dom.scoreDisplay.textContent = String(gameState.score);

  const optionButtons = getOptionButtons();
  const shuffledOptions = shuffleArray(question.options);

  shuffledOptions.forEach((surahName, i) => {
    if (optionButtons[i]) {
      optionButtons[i].textContent = surahName;
    }
  });

  if (options.startTimer) {
    startTimer();
  }
}

function setupEventListeners() {
  dom.btnStart.addEventListener('click', async () => {
    gameState.currentQuestionIndex = 0;
    gameState.score = 0;
    isProcessingAnswer = false;
    stopTimer();

    await switchScreen('start-screen', 'quiz-screen');
    renderQuestion(0);
  });

  dom.btnReplay.addEventListener('click', async () => {
    gameState.currentQuestionIndex = 0;
    gameState.score = 0;
    isProcessingAnswer = false;
    stopTimer();

    await switchScreen('result-screen', 'quiz-screen');
    renderQuestion(0);
  });


  dom.btnMainMenu.addEventListener('click', async () => {
    gameState.currentQuestionIndex = 0;
    gameState.score = 0;
    isProcessingAnswer = false;
    stopTimer();

    await switchScreen('result-screen', 'start-screen');
    renderQuestion(0, { startTimer: false });
  });


  dom.btnQuizBack.addEventListener('click', async () => {
    stopTimer();
    gameState.currentQuestionIndex = 0;
    gameState.score = 0;
    isProcessingAnswer = false;

    await switchScreen('quiz-screen', 'start-screen');
    renderQuestion(0, { startTimer: false });
  });

  dom.optionsContainer.addEventListener('click', handleOptionClick);
}

async function init() {
  try {
    await loadQuestions();
    renderQuestion(0, { startTimer: false });
    setupEventListeners();
  } catch (error) {
    console.error(error);

    if (dom.ayahText) {
      dom.ayahText.textContent =
        '\u062a\u0639\u0630\u0651\u0631 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0623\u0633\u0626\u0644\u0629. \u0627\u0641\u062a\u062d \u0627\u0644\u0635\u0641\u062d\u0629 \u0639\u0628\u0631 \u062e\u0627\u062f\u0645 \u0645\u062d\u0644\u064a (\u0645\u062b\u0644 Live Server).';
    }
  }
}

document.addEventListener('DOMContentLoaded', init);