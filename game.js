let currentLevel = 0;
let selectedTopping = "cheese";

let pizza = ["cheese", "cheese", "cheese", "cheese"];

function startLevel() {
  let pizzaDiv = document.getElementById("pizza");
  pizzaDiv.innerHTML = "";

  pizza = ["cheese", "cheese", "cheese", "cheese"];

  for (let i = 0; i < 4; i++) {
    let slice = document.createElement("div");
    slice.className = "slice cheese";
    slice.innerText = "";

    slice.onclick = function () {
      placeTopping(i);
    };

    pizzaDiv.appendChild(slice);
  }

  showOrder();
  document.getElementById("message").innerText = "";
}

function showOrder() {
  let order = levels[currentLevel].order;
  let preview = document.getElementById("orderPreview");
  preview.innerText = order.join(" | ");
}

function selectTopping(t) {
  selectedTopping = t;
}

function placeTopping(i) {
  pizza[i] = selectedTopping;

  let slices = document.querySelectorAll(".slice");
  slices[i].className = "slice " + selectedTopping;
  slices[i].style.transform = "scale(1.12)";

  setTimeout(() => {
    slices[i].style.transform = "scale(1)";
  }, 150);
}

function servePizza() {
  let correct = levels[currentLevel].order;
  let ok = true;

  for (let i = 0; i < 4; i++) {
    if (pizza[i] !== correct[i]) {
      ok = false;
    }
  }

  if (ok) {
    document.getElementById("message").innerText = "⭐ Great Pizza!";
    currentLevel++;

    if (currentLevel >= levels.length) {
      document.getElementById("message").innerText = "🏆 You finished the game!";
    } else {
      setTimeout(startLevel, 1000);
    }
  } else {
    document.getElementById("message").innerText = "❌ Try Again";
    setTimeout(startLevel, 1000);
  }
}

startLevel();
