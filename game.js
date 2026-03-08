let currentLevel = 0
let selectedTopping = "cheese"
let pizza = ["cheese","cheese","cheese","cheese"]

function startLevel(){

let pizzaDiv=document.getElementById("pizza")
pizzaDiv.innerHTML=""

pizza=["cheese","cheese","cheese","cheese"]

for(let i=0;i<4;i++){

let slice=document.createElement("div")

slice.className="slice cheese"

slice.onclick=function(){
placeTopping(i)
}

pizzaDiv.appendChild(slice)

}

showOrder()

document.getElementById("message").innerText=""
document.getElementById("stars").innerText=""

}

function showOrder(){

let order=levels[currentLevel].order

let preview=document.getElementById("orderPreview")

preview.innerHTML=""

order.forEach(t=>{
let s=document.createElement("span")
s.innerText=t+" "
preview.appendChild(s)
})

}

function selectTopping(t){

selectedTopping=t

document.getElementById("soundPop").play()

}

function placeTopping(i){

pizza[i]=selectedTopping

let slices=document.querySelectorAll(".slice")

slices[i].className="slice "+selectedTopping

slices[i].style.transform="scale(1.2)"

setTimeout(()=>{
slices[i].style.transform="scale(1)"
},150)

}

function servePizza(){

let correct=levels[currentLevel].order

let correctCount=0

for(let i=0;i<4;i++){

if(pizza[i]===correct[i]) correctCount++

}

if(correctCount===4){

document.getElementById("message").innerText="Perfect Pizza!"

document.getElementById("soundSuccess").play()

document.getElementById("stars").innerText="⭐⭐⭐"

currentLevel++

if(currentLevel>=levels.length){

document.getElementById("message").innerText="You finished the game!"

}

else{

setTimeout(startLevel,1500)

}

}

else{

document.getElementById("message").innerText="Try Again"

document.getElementById("soundFail").play()

document.getElementById("stars").innerText="⭐"

setTimeout(startLevel,1500)

}

}

startLevel()
