let currentLevel = 0;
let selectedTopping = "cheese";
let pizza = ["cheese", "cheese", "cheese", "cheese"];

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}

function showHow() {
  showScreen("howScreen");
}

function backToStart() {
  showScreen("startScreen");
}

function startGame() {
  currentLevel = 0;
  showScreen("gameScreen");
  startLevel();
}

function toppingEmoji(topping) {
  if (topping === "cheese") return "🧀";
  if (topping === "olive") return "🫒";
  if (topping === "pepperoni") return "🍕";
  return "";
}

function safePlay(audioId) {
  const el = document.getElementById(audioId);
  if (!el) return;
  el.currentTime = 0;
  el.play().catch(() => {});
}

function startLevel() {
  const pizzaDiv = document.getElementById("pizza");
  pizzaDiv.innerHTML = "";

  pizza = ["cheese", "cheese", "cheese", "cheese"];

  for (let i = 0; i < 4; i++) {
    const slice = document.createElement("div");
    slice.className = "slice cheese";
    slice.innerHTML = `<div class="sliceIcon">${toppingEmoji("cheese")}</div>`;
    slice.onclick = function () {
      placeTopping(i);
    };
    pizzaDiv.appendChild(slice);
  }

  showOrder();
  document.getElementById("message").innerText = "";
  document.getElementById("stars").innerText = "";
  document.getElementById("chefSpeech").innerText = "Let's make a pizza!";
  document.getElementById("sliceSpeech").innerText = "Copy the order!";
}

function showOrder() {
  const order = levels[currentLevel].order;
  const preview = document.getElementById("orderPreview");
  preview.innerHTML = "";

  order.forEach((topping) => {
    const piece = document.createElement("div");
    piece.className = "miniSlice " + topping;
    preview.appendChild(piece);
  });
}

function selectTopping(topping) {
  selectedTopping = topping;
  safePlay("soundPop");
  document.getElementById("sliceSpeech").innerText = "Great choice!";
}

function placeTopping(index) {
  pizza[index] = selectedTopping;

  const slices = document.querySelectorAll(".slice");
  slices[index].className = "slice " + selectedTopping;
  slices[index].innerHTML = `<div class="sliceIcon">${toppingEmoji(selectedTopping)}</div>`;
  slices[index].classList.add("sparkle");

  setTimeout(() => {
    slices[index].classList.remove("sparkle");
  }, 300);
}

function servePizza() {
  const correct = levels[currentLevel].order;
  let correctCount = 0;

  for (let i = 0; i < 4; i++) {
    if (pizza[i] === correct[i]) {
      correctCount++;
    }
  }

  let stars = "⭐";
  if (correctCount === 4) stars = "⭐⭐⭐";
  else if (correctCount === 3) stars = "⭐⭐";

  document.getElementById("stars").innerText = stars;

  if (correctCount === 4) {
    document.getElementById("message").innerText = "Perfect Pizza!";
    document.getElementById("chefSpeech").innerText = "Amazing work!";
    document.getElementById("sliceSpeech").innerText = "Yum! Next one!";
    safePlay("soundSuccess");

    currentLevel++;

    if (currentLevel >= levels.length) {
      document.getElementById("message").innerText = "You finished the game!";
      document.getElementById("chefSpeech").innerText = "You are a pizza star!";
      document.getElementById("sliceSpeech").innerText = "We did it!";
    } else {
      setTimeout(() => {
        startLevel();
      }, 1200);
    }
  } else {
    document.getElementById("message").innerText = "Try Again";
    document.getElementById("chefSpeech").innerText = "Almost!";
    document.getElementById("sliceSpeech").innerText = "Let's fix it!";
    safePlay("soundFail");

    setTimeout(() => {
      startLevel();
    }, 1200);
  }
}

window.showHow = showHow;
window.backToStart = backToStart;
window.startGame = startGame;
window.selectTopping = selectTopping;
window.servePizza = servePizza;
