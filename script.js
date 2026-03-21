let vocabList = [];
let studyQueue = [];
let currentQuestion = null;
let currentIndex = 0;
let sessionTarget = 20;
let correctCount = 0;
let totalAnswered = 0;
let wrongPool = [];
let reviewQueue = [];
let isReviewPhase = false;
let pendingReviewStart = false;

const wordEl = document.getElementById('word');
const posEl = document.getElementById('pos');
const choicesEl = document.getElementById('choices');
const feedbackEl = document.getElementById('feedback');
const progressEl = document.getElementById('progress');
const scoreEl = document.getElementById('score');
const nextBtn = document.getElementById('nextBtn');
const dailyCountEl = document.getElementById('dailyCount');
const startBtn = document.getElementById('startBtn');

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function clampDailyCount(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return 20;
  return Math.max(5, Math.min(100, number));
}

function getWrongOptions(answer, count) {
  const uniqueZh = [...new Set(vocabList.map(item => item.zh))].filter(zh => zh !== answer);
  return shuffle(uniqueZh).slice(0, count);
}

function updateStatus() {
  const activeQueue = isReviewPhase ? reviewQueue : studyQueue;
  const phaseLabel = isReviewPhase ? '错词复习' : '本轮';
  progressEl.textContent = `${phaseLabel} ${Math.min(currentIndex + 1, activeQueue.length)} / ${activeQueue.length} · 词库 ${vocabList.length} 词`;
  scoreEl.textContent = `答对 ${correctCount} / ${totalAnswered}`;
}

function renderCompletion() {
  currentQuestion = null;
  wordEl.textContent = '本轮完成';
  posEl.textContent = `你已经完成 ${studyQueue.length} 个单词。`;
  choicesEl.innerHTML = '';
  feedbackEl.textContent = '可以重新设定数量，再开始一轮。';
  feedbackEl.className = 'feedback correct';
  nextBtn.disabled = true;
  const finalQueue = isReviewPhase ? reviewQueue : studyQueue;
  const phaseLabel = isReviewPhase ? '错词复习' : '本轮';
  progressEl.textContent = `${phaseLabel} ${finalQueue.length} / ${finalQueue.length} · 词库 ${vocabList.length} 词`;
  scoreEl.textContent = `答对 ${correctCount} / ${totalAnswered}`;
}

function renderReviewTransition() {
  currentQuestion = null;
  wordEl.textContent = '本轮完成';
  posEl.textContent = `错词 ${reviewQueue.length} 个，准备复习。`;
  choicesEl.innerHTML = '';
  feedbackEl.textContent = '进入错词复习';
  feedbackEl.className = 'feedback wrong';
  nextBtn.disabled = false;
  progressEl.textContent = `本轮 ${studyQueue.length} / ${studyQueue.length} · 词库 ${vocabList.length} 词`;
  scoreEl.textContent = `答对 ${correctCount} / ${totalAnswered}`;
}

function renderQuestion() {
  if (!studyQueue.length) {
    renderCompletion();
    return;
  }

  if (pendingReviewStart) {
    renderReviewTransition();
    return;
  }

  const activeQueue = isReviewPhase ? reviewQueue : studyQueue;

  if (currentIndex >= activeQueue.length) {
    if (!isReviewPhase && wrongPool.length > 0) {
      reviewQueue = shuffle([...wrongPool]);
      isReviewPhase = true;
      pendingReviewStart = true;
      currentIndex = 0;
      renderReviewTransition();
      return;
    }
    renderCompletion();
    return;
  }

  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
  nextBtn.disabled = true;

  const item = activeQueue[currentIndex];
  const wrongOptions = getWrongOptions(item.zh, 3);
  const allOptions = shuffle([item.zh, ...wrongOptions]);

  currentQuestion = {
    word: item.word,
    pos: item.pos || item.n || '',
    answer: item.zh,
    options: allOptions
  };

  wordEl.textContent = item.word;
  posEl.textContent = item.pos || item.n || '';
  choicesEl.innerHTML = '';

  allOptions.forEach(option => {
    const button = document.createElement('button');
    button.className = 'choice-btn';
    button.textContent = option;
    button.addEventListener('click', () => handleAnswer(button, option));
    choicesEl.appendChild(button);
  });

  updateStatus();
}

function handleAnswer(button, selected) {
  if (!currentQuestion) return;

  const buttons = document.querySelectorAll('.choice-btn');
  buttons.forEach(btn => btn.disabled = true);

  totalAnswered += 1;

  if (selected === currentQuestion.answer) {
    correctCount += 1;
    button.classList.add('correct');
    feedbackEl.textContent = '答对了。';
    feedbackEl.className = 'feedback correct';
  } else {
    if (!isReviewPhase) {
      const alreadyInPool = wrongPool.some(item => item.word === currentQuestion.word && item.zh === currentQuestion.answer);
      if (!alreadyInPool) {
        wrongPool.push({
          word: currentQuestion.word,
          zh: currentQuestion.answer,
          pos: currentQuestion.pos
        });
      }
    }
    button.classList.add('wrong');
    buttons.forEach(btn => {
      if (btn.textContent === currentQuestion.answer) {
        btn.classList.add('correct');
      }
    });
    feedbackEl.textContent = `答错了，正确答案是：${currentQuestion.answer}`;
    feedbackEl.className = 'feedback wrong';
  }

  scoreEl.textContent = `答对 ${correctCount} / ${totalAnswered}`;
  nextBtn.disabled = false;
}

function startSession() {
  if (!vocabList.length) return;

  sessionTarget = clampDailyCount(dailyCountEl.value);
  dailyCountEl.value = sessionTarget;
  correctCount = 0;
  totalAnswered = 0;
  currentIndex = 0;
  wrongPool = [];
  reviewQueue = [];
  isReviewPhase = false;
  pendingReviewStart = false;
  studyQueue = shuffle(vocabList).slice(0, Math.min(sessionTarget, vocabList.length));
  renderQuestion();
}

async function init() {
  try {
    const dataSources = ['./data/pt-vocab.json', './data/vocab.json'];
    let loadedPath = '';

    for (const source of dataSources) {
      const response = await fetch(source, { cache: 'no-store' });
      if (!response.ok) continue;

      vocabList = await response.json();
      loadedPath = source;
      break;
    }

    if (!loadedPath) {
      throw new Error(`词库文件未找到：${dataSources.join(' 或 ')}`);
    }

    if (!Array.isArray(vocabList) || vocabList.length < 4) {
      throw new Error('词库数据不足');
    }

    sessionTarget = clampDailyCount(dailyCountEl.value);
    dailyCountEl.value = sessionTarget;
    startSession();
  } catch (error) {
    wordEl.textContent = '加载失败';
    posEl.textContent = '';
    choicesEl.innerHTML = '';
    feedbackEl.textContent = '请检查 data/pt-vocab.json（兼容 data/vocab.json）是否存在且格式正确。';
    feedbackEl.className = 'feedback wrong';
    progressEl.textContent = '加载失败';
    console.error(error);
  }
}

nextBtn.addEventListener('click', () => {
  if (pendingReviewStart) {
    pendingReviewStart = false;
    currentIndex = 0;
    renderQuestion();
    return;
  }
  currentIndex += 1;
  renderQuestion();
});

startBtn.addEventListener('click', startSession);
init();
