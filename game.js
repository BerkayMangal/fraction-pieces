let currentLevel = 0
let selectedTopping = "cheese"
let pizza = ["cheese","cheese","cheese","cheese"]

function showScreen(id){
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"))
  document.getElementById(id).classList.add("active")
}

function startGame(){
  showScreen("gameScreen")
  currentLevel = 0
  startLevel()
}

function showHow(){
  showScreen("howScreen")
}

function backToStart(){
  showScreen("startScreen")
}

function toppingEmoji(t){
  if(t === "cheese") return "🧀"
  if(t === "olive") return "🫒"
  if(t === "pepperoni") return "🍕"
  return ""
}

function startLevel(){
  let pizzaDiv = document.getElementById("pizza")
  pizzaDiv.innerHTML = ""

  pizza = ["cheese","cheese","cheese","cheese"]

  for(let i = 0; i < 4; i++){
    let slice = document.createElement("div")
    slice.className = "slice cheese"
    slice.innerHTML = `<div class="sliceImg">${toppingEmoji("cheese")}</div>`

    slice.onclick = function(){
      placeTopping(i)
    }

    pizzaDiv.appendChild(slice)
  }

  showOrder()

  document.getElementById("message").innerText = ""
  document.getElementById("stars").innerText = ""
}

function showOrder(){
  let order = levels[currentLevel].order
  let preview = document.getElementById("orderPreview")
  preview.innerHTML = ""

  order.forEach(t => {
    let s = document.createElement("div")
    s.className = "miniSlice " + t
    preview.appendChild(s)
  })
}

function selectTopping(t){
  selectedTopping = t

  const pop = document.getElementById("soundPop")
  if(pop){
    pop.currentTime = 0
    pop.play().catch(() => {})
  }
}

function placeTopping(i){
  pizza[i] = selectedTopping

  let slices = document.querySelectorAll(".slice")
  slices[i].className = "slice " + selectedTopping
  slices[i].innerHTML = `<div class="sliceImg">${toppingEmoji(selectedTopping)}</div>`

  slices[i].classList.add("sparkle")

  setTimeout(() => {
    slices[i].classList.remove("sparkle")
  }, 300)
}

function servePizza(){
  let correct = levels[currentLevel].order
  let correctCount = 0

  for(let i = 0; i < 4; i++){
    if(pizza[i] === correct[i]) correctCount++
  }

  let stars = "⭐"
  if(correctCount === 4) stars = "⭐⭐⭐"
  else if(correctCount === 3) stars = "⭐⭐"

  document.getElementById("stars").innerText = stars

  if(correctCount === 4){
    document.getElementById("message").innerText = "Perfect Pizza!"

    const success = document.getElementById("soundSuccess")
    if(success){
      success.currentTime = 0
      success.play().catch(() => {})
    }

    currentLevel++

    if(currentLevel >= levels.length){
      document.getElementById("message").innerText = "You finished the game!"
    } else {
      setTimeout(startLevel, 1200)
    }
  } else {
    document.getElementById("message").innerText = "Try Again"

    const fail = document.getElementById("soundFail")
    if(fail){
      fail.currentTime = 0
      fail.play().catch(() => {})
    }

    setTimeout(startLevel, 1200)
  }
}
