let vocabList = [];
let studyQueue = [];
let currentQuestion = null;
let currentIndex = 0;
let sessionTarget = 20;
let correctCount = 0;
let totalAnswered = 0;

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
  progressEl.textContent = `本轮 ${Math.min(currentIndex + 1, studyQueue.length)} / ${studyQueue.length} · 词库 ${vocabList.length} 词`;
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
  progressEl.textContent = `本轮 ${studyQueue.length} / ${studyQueue.length} · 词库 ${vocabList.length} 词`;
  scoreEl.textContent = `答对 ${correctCount} / ${totalAnswered}`;
}

function renderQuestion() {
  if (!studyQueue.length || currentIndex >= studyQueue.length) {
    renderCompletion();
    return;
  }

  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
  nextBtn.disabled = true;

  const item = studyQueue[currentIndex];
  const wrongOptions = getWrongOptions(item.zh, 3);
  const allOptions = shuffle([item.zh, ...wrongOptions]);

  currentQuestion = {
    answer: item.zh,
    options: allOptions
  };

  wordEl.textContent = item.word;
  posEl.textContent = item.pos || '';
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
  studyQueue = shuffle(vocabList).slice(0, Math.min(sessionTarget, vocabList.length));
  renderQuestion();
}

async function init() {
  try {
    const response = await fetch('./data/pt-vocab.json');
    vocabList = await response.json();

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
    feedbackEl.textContent = '请检查 data/pt-vocab.json 是否存在且格式正确。';
    feedbackEl.className = 'feedback wrong';
    progressEl.textContent = '加载失败';
    console.error(error);
  }
}

nextBtn.addEventListener('click', () => {
  currentIndex += 1;
  renderQuestion();
});

startBtn.addEventListener('click', startSession);
init();
