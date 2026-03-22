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
let reviewRound = 0;

const wordEl = document.getElementById('word');
const posEl = document.getElementById('pos');
const choicesEl = document.getElementById('choices');
const feedbackEl = document.getElementById('feedback');
const progressEl = document.getElementById('progress');
const scoreEl = document.getElementById('score');
const nextBtn = document.getElementById('nextBtn');
const dailyCountEl = document.getElementById('dailyCount');
const startBtn = document.getElementById('startBtn');
const posFilterEl = document.getElementById('posFilter');

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

function getNormalizedPos(item) {
  return item.pos || item.n || '';
}

function getFilteredList() {
  const selectedPos = posFilterEl.value;
  if (selectedPos === 'all') return vocabList;
  return vocabList.filter(item => getNormalizedPos(item) === selectedPos);
}

function getWrongOptions(answer, count) {
  const sourceList = getFilteredList().length >= 4 ? getFilteredList() : vocabList;
  const uniqueZh = [...new Set(sourceList.map(item => item.zh))].filter(zh => zh !== answer);
  return shuffle(uniqueZh).slice(0, count);
}

function updateStatus() {
  const activeQueue = isReviewPhase ? reviewQueue : studyQueue;
  const phaseLabel = isReviewPhase ? `错词复习 第${reviewRound}轮` : '本轮';
  progressEl.textContent = `${phaseLabel} ${Math.min(currentIndex + 1, activeQueue.length)} / ${activeQueue.length} · 词库 ${vocabList.length} 词`;
  scoreEl.textContent = `答对 ${correctCount} / ${totalAnswered}`;
}

function renderCompletion() {
  currentQuestion = null;
  wordEl.textContent = '本轮完成';
  posEl.textContent = `你已经完成 ${studyQueue.length} 个单词。`;
  choicesEl.innerHTML = '';
  feedbackEl.textContent = '已完成并全部答对。可以重新设定条件，再开始一轮。';
  feedbackEl.className = 'feedback correct';
  nextBtn.disabled = true;
  const finalQueue = isReviewPhase ? reviewQueue : studyQueue;
  const phaseLabel = isReviewPhase ? `错词复习 第${reviewRound}轮` : '本轮';
  progressEl.textContent = `${phaseLabel} ${finalQueue.length} / ${finalQueue.length} · 词库 ${vocabList.length} 词`;
  scoreEl.textContent = `答对 ${correctCount} / ${totalAnswered}`;
}

function renderReviewTransition() {
  currentQuestion = null;
  wordEl.textContent = `第${reviewRound}轮错词复习`;
  posEl.textContent = `仍有 ${reviewQueue.length} 个错词，继续练习直到全部答对。`;
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
    if (wrongPool.length > 0) {
      reviewQueue = shuffle([...wrongPool]);
      wrongPool = [];
      isReviewPhase = true;
      pendingReviewStart = true;
      reviewRound += 1;
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
    pos: getNormalizedPos(item),
    answer: item.zh,
    options: allOptions
  };

  wordEl.textContent = item.word;
  posEl.textContent = getNormalizedPos(item);
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
    const alreadyInPool = wrongPool.some(item => item.word === currentQuestion.word && item.zh === currentQuestion.answer);
    if (!alreadyInPool) {
      wrongPool.push({
        word: currentQuestion.word,
        zh: currentQuestion.answer,
        pos: currentQuestion.pos
      });
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

  const filteredList = getFilteredList();
  if (filteredList.length < 4) {
    wordEl.textContent = '词量不足';
    posEl.textContent = '当前词性可用单词少于 4 个，无法生成选择题。';
    choicesEl.innerHTML = '';
    feedbackEl.textContent = '请切换词性，或先补充该词性的词库。';
    feedbackEl.className = 'feedback wrong';
    progressEl.textContent = `当前筛选 ${filteredList.length} 词 · 总词库 ${vocabList.length} 词`;
    scoreEl.textContent = '答对 0 / 0';
    nextBtn.disabled = true;
    return;
  }

  if (filteredList.length < sessionTarget) {
    sessionTarget = filteredList.length;
    dailyCountEl.value = sessionTarget;
  }

  correctCount = 0;
  totalAnswered = 0;
  currentIndex = 0;
  wrongPool = [];
  reviewQueue = [];
  isReviewPhase = false;
  pendingReviewStart = false;
  reviewRound = 0;
  studyQueue = shuffle(filteredList).slice(0, sessionTarget);
  renderQuestion();
}

async function init() {
  try {
    const dataSources = ['./data/pt-vocab.json', './data/vocab.json'];
    let loadedPath = '';

    for (const source of dataSources) {
      const response = await fetch(source, { cache: 'no-store' });
      if (!response.ok) continue;
      const rawList = await response.json();
      if (!Array.isArray(rawList)) continue;
      vocabList = rawList.map(item => ({
        ...item,
        pos: getNormalizedPos(item)
      }));
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
