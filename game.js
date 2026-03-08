let currentLevel=0
let selected="cheese"
let pizza=["cheese","cheese","cheese","cheese"]

const startScreen=document.getElementById("startScreen")
const howScreen=document.getElementById("howScreen")
const gameScreen=document.getElementById("gameScreen")

document.getElementById("playBtn").onclick=()=>{
startScreen.classList.remove("active")
gameScreen.classList.add("active")
startLevel()
}

document.getElementById("howBtn").onclick=()=>{
startScreen.classList.remove("active")
howScreen.classList.add("active")
}

document.getElementById("backBtn").onclick=()=>{
howScreen.classList.remove("active")
startScreen.classList.add("active")
}

document.getElementById("serveBtn").onclick=servePizza

document.querySelectorAll("#toppings button").forEach(btn=>{
btn.onclick=()=>{
selected=btn.dataset.top
}
})

function emoji(t){
if(t==="cheese")return"🧀"
if(t==="olive")return"🫒"
if(t==="pepperoni")return"🍕"
}

function startLevel(){

let pizzaDiv=document.getElementById("pizza")
pizzaDiv.innerHTML=""

pizza=["cheese","cheese","cheese","cheese"]

for(let i=0;i<4;i++){

let s=document.createElement("div")
s.className="slice cheese"
s.innerText="🧀"

s.onclick=()=>{
place(i)
}

pizzaDiv.appendChild(s)

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
let s=document.createElement("div")
s.className="miniSlice "+t
preview.appendChild(s)
})

}

function place(i){

pizza[i]=selected

let slices=document.querySelectorAll(".slice")

slices[i].className="slice "+selected
slices[i].innerText=emoji(selected)

}

function servePizza(){

let correct=levels[currentLevel].order
let good=0

for(let i=0;i<4;i++){
if(pizza[i]===correct[i])good++
}

let stars="⭐"

if(good===4)stars="⭐⭐⭐"
else if(good===3)stars="⭐⭐"

document.getElementById("stars").innerText=stars

if(good===4){

document.getElementById("message").innerText="Perfect!"

currentLevel++

if(currentLevel>=levels.length){
document.getElementById("message").innerText="You Win!"
}else{
setTimeout(startLevel,1000)
}

}else{

document.getElementById("message").innerText="Try Again"

setTimeout(startLevel,1000)

}

}
