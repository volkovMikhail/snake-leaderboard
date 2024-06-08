//config variables
const snakeSize = 25;
const snakeColor = 'olive';
const fruitColor = 'red';
const delay = 100;

const canv = document.getElementById('canvas');
const ctx = canv.getContext('2d');

// canv.width = Math.floor(window.innerWidth / snakeSize) * snakeSize;
// canv.height = Math.floor(window.innerHeight / snakeSize) * snakeSize;

canv.width = 25 * snakeSize;
canv.height = 25 * snakeSize;

const bgColor = window
  .getComputedStyle(document.body, null)
  .getPropertyValue('background-color');

Snake = [];
let Fruit;

const direction = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowRight: false,
  ArrowLeft: false,
};

const toggleDirection = (d) => {
  for (const key in direction) {
    direction[key] = key === d;
  }
};

class Chunk {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  Draw() {
    ctx.fillRect(this.x, this.y, snakeSize, snakeSize);
  }
}

function drawSnake() {
  clear();
  ctx.fillStyle = snakeColor;
  for (let i = 0; i < Snake.length; i++) {
    Snake[i].Draw();
  }
}

function clear() {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canv.width, canv.height);
}

let prevKey;
let canToggleDirection = true;

window.addEventListener('keydown', (e) => {
  if (!canToggleDirection) {
    return;
  }

  if (e.code === 'ArrowUp' && prevKey != 'ArrowDown' && e.code != prevKey) {
    toggleDirection(e.code);
  }
  if (e.code === 'ArrowDown' && prevKey != 'ArrowUp' && e.code != prevKey) {
    toggleDirection(e.code);
  }
  if (e.code === 'ArrowRight' && prevKey != 'ArrowLeft' && e.code != prevKey) {
    toggleDirection(e.code);
  }
  if (e.code === 'ArrowLeft' && prevKey != 'ArrowRight' && e.code != prevKey) {
    toggleDirection(e.code);
  }

  canToggleDirection = false;
  prevKey = e.code;
});

function drawNewFruit() {
  ctx.fillStyle = fruitColor;

  Fruit.x = Math.round(
    Math.floor((Math.random() * canv.width) / snakeSize) * snakeSize
  );
  Fruit.y = Math.round(
    Math.floor((Math.random() * canv.height) / snakeSize) * snakeSize
  );
  ctx.fillRect(Fruit.x, Fruit.y, snakeSize, snakeSize);
}

Snake.push(new Chunk(25, 25));
drawSnake();

Fruit = new Chunk(0, 0);

let head = Snake[Snake.length - 1];

function snakeEatFruit() {
  Snake.push(new Chunk(newHead.x, newHead.y));
  drawNewFruit();
  addScore();
}

function main() {
  head = Snake[Snake.length - 1];

  if (direction.ArrowUp) {
    Snake.push(new Chunk(head.x, head.y - snakeSize));
    Snake.splice(0, 1);
  }

  if (direction.ArrowDown) {
    Snake.push(new Chunk(head.x, head.y + snakeSize));
    Snake.splice(0, 1);
  }

  if (direction.ArrowRight) {
    Snake.push(new Chunk(head.x + snakeSize, head.y));
    Snake.splice(0, 1);
  }

  if (direction.ArrowLeft) {
    Snake.push(new Chunk(head.x - snakeSize, head.y));
    Snake.splice(0, 1);
  }

  newHead = Snake[Snake.length - 1];

  if (newHead.x === Fruit.x && newHead.y === Fruit.y) {
    snakeEatFruit();
  }

  if (newHead.x >= canv.width) newHead.x = 0;
  if (newHead.y >= canv.height) newHead.y = 0;
  if (newHead.x < 0) newHead.x = canv.width;
  if (newHead.y < 0) newHead.y = canv.height;

  drawSnake();

  for (let i = 0; i < Snake.length - 2; i++) {
    if (Snake[i].x === newHead.x && Snake[i].y === newHead.y) {
      Snake = [new Chunk(1, 1)]; //move this to game over function
      gameOver();
    }
  }

  canToggleDirection = true;
  ctx.fillStyle = fruitColor;
  Fruit.Draw();

  addTime();
}

let interval;

let initialTime = new Date().getTime();

function newGame() {
  toggleDirection('');
  clearInterval(interval);

  clearScores();
  clearTime();

  initialTime = new Date().getTime();

  drawNewFruit();
  Snake = [new Chunk(25, 25)];

  interval = setInterval(main, delay);
}

const gameOverDialog = document.querySelector('#game-over-dialog');

function gameOver() {
  clearInterval(interval);

  gameOverDialog.style.display = 'flex';
}

let userScores = 0;
let userTime = 0;
const scoreElem = document.querySelector('#score');

function addScore() {
  userScores++;
  scoreElem.innerHTML = userScores;
}

function clearScores() {
  userScores = 0;
  scoreElem.innerHTML = 0;
}

const timeElem = document.querySelector('#time');

function formatTime(sec) {
  const mins = Math.floor(sec / 60);

  const secsInMinute = sec - mins * 60;

  const displaySecs = secsInMinute < 10 ? `0${secsInMinute}` : secsInMinute;
  const displayMins = mins < 10 ? `0${mins}` : mins;

  return `${displayMins}:${displaySecs}`;
}

function addTime() {
  const time = new Date().getTime();

  const gameTime = time - initialTime;

  const sec = Math.round(gameTime / 1000);

  const timeElem = document.querySelector('#time');

  timeElem.innerHTML = formatTime(sec);

  userTime = sec;
}

function clearTime() {
  userTime = 0;
  timeElem.innerHTML = `00:00`;
}

const startButtons = document.querySelectorAll('.start-button');
const leaderboardDialog = document.querySelector('#leaderboard');

function hideAllDialogs() {
  gameOverDialog.style.display = 'none';
  leaderboardDialog.style.display = 'none';
}

startButtons.forEach((startButton) => {
  startButton.addEventListener('click', () => {
    hideAllDialogs();

    newGame();
  });
});

const resultsButton = document.querySelector('#add-results-button');
const userNameInput = document.querySelector('#username-input');

resultsButton.addEventListener('click', async () => {
  resultsButton.disabled = true;

  const requestBody = {
    username: userNameInput.value,
    score: userScores,
    time: userTime,
  };

  const res = await fetch('/result', {
    method: 'POST',
    body: JSON.stringify(requestBody),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 200) {
    hideAllDialogs();
    resultsButton.disabled = false;

    showLeaderboard(leaderboardLimit, 0);
    currentSkip = 0;
  } else {
    resultsButton.innerHTML = 'Something wrong, reload page please';
  }
});

const leaderboardBody = document.querySelector('.leaderboard > table > tbody');
const loader = document.querySelector('.loader');

const leaderboardLimit = 20;

showLeaderboard(leaderboardLimit, 0);

async function showLeaderboard(limit, skip) {
  loader.style.display = 'block';
  leaderboardDialog.style.display = 'flex';

  leaderboardBody.innerHTML = '';

  const data = await fetch(`/leaderboard?limit=${limit}&skip=${skip}`, {
    method: 'GET',
  });

  const leaderboardRows = (await data.json()).data;

  leaderboardRows.forEach((row) => {
    const tableRowElement = document.createElement('tr');

    const placeDataElement = document.createElement('td');
    const usernameDataElement = document.createElement('td');
    const scoreDataElement = document.createElement('td');
    const timeDataElement = document.createElement('td');

    placeDataElement.innerHTML = row.place;
    usernameDataElement.innerHTML = row.username;
    scoreDataElement.innerHTML = row.score;
    timeDataElement.innerHTML = formatTime(Number(row.time));

    tableRowElement.appendChild(placeDataElement);
    tableRowElement.appendChild(usernameDataElement);
    tableRowElement.appendChild(scoreDataElement);
    tableRowElement.appendChild(timeDataElement);

    leaderboardBody.appendChild(tableRowElement);
  });

  loader.style.display = 'none';

  return leaderboardRows.length;
}

let currentSkip = 0;

const nextPage = document.querySelector('.paginator-next');
const prevPage = document.querySelector('.paginator-prev');

let prevResDataLength = leaderboardLimit;

nextPage.addEventListener('click', async () => {
  if (prevResDataLength < leaderboardLimit) {
    return;
  }

  currentSkip += 20;

  prevResDataLength = await showLeaderboard(leaderboardLimit, currentSkip);
});

prevPage.addEventListener('click', async () => {
  if (currentSkip !== 0) {
    currentSkip -= 20;

    prevResDataLength = await showLeaderboard(leaderboardLimit, currentSkip);
  }
});
