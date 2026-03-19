let vocabList = [];
let currentQuestion = null;
let correctCount = 0;
let totalAnswered = 0;

const wordEl = document.getElementById('word');
const posEl = document.getElementById('pos');
const choicesEl = document.getElementById('choices');
const feedbackEl = document.getElementById('feedback');
const progressEl = document.getElementById('progress');
const scoreEl = document.getElementById('score');
const nextBtn = document.getElementById('nextBtn');

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getRandomItems(array, count, excludeValue) {
  const filtered = array.filter(item => item.zh !== excludeValue);
  return shuffle(filtered).slice(0, count);
}

function renderQuestion() {
  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
  nextBtn.disabled = true;

  const randomItem = vocabList[Math.floor(Math.random() * vocabList.length)];
  const wrongOptions = getRandomItems(vocabList, 3, randomItem.zh).map(item => item.zh);
  const allOptions = shuffle([randomItem.zh, ...wrongOptions]);

  currentQuestion = {
    answer: randomItem.zh,
    options: allOptions
  };

  wordEl.textContent = randomItem.word;
  posEl.textContent = randomItem.pos || '';
  choicesEl.innerHTML = '';

  allOptions.forEach(option => {
    const button = document.createElement('button');
    button.className = 'choice-btn';
    button.textContent = option;
    button.addEventListener('click', () => handleAnswer(button, option));
    choicesEl.appendChild(button);
  });

  progressEl.textContent = `词库 ${vocabList.length} 词`;
  scoreEl.textContent = `答对 ${correctCount} / ${totalAnswered}`;
}

function handleAnswer(button, selected) {
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

async function init() {
  try {
    const response = await fetch('./data/vocab.json');
    vocabList = await response.json();

    if (!Array.isArray(vocabList) || vocabList.length < 4) {
      throw new Error('词库数据不足');
    }

    renderQuestion();
  } catch (error) {
    wordEl.textContent = '加载失败';
    posEl.textContent = '';
    choicesEl.innerHTML = '';
    feedbackEl.textContent = '请检查 data/vocab.json 是否存在且格式正确。';
    feedbackEl.className = 'feedback wrong';
    console.error(error);
  }
}

nextBtn.addEventListener('click', renderQuestion);
init();
