// Hämtar referenser från HTML till js
const startknapp = document.getElementById("startknapp");
const spelruta = document.getElementById("spelruta");
const context = spelruta.getContext("2d");

const poängElement = document.getElementById("poäng");
const speletÖverRektangel = document.querySelector(".speletÖverRektangel");
const speletÖverBild = document.getElementById("speletÖverBild");
const poängAvslut = document.getElementById("poängAvslut");

const figurBild = new Image();
const hinderBild = new Image();
const vulkanBild = new Image();

figurBild.src = "Bilder/baby_dragon.png"
hinderBild.src = "Bilder/hinder.png"
vulkanBild.src = "Bilder/vulkan.png"

window.onload = () => {
    vulkanBakgrund();
    context.drawImage(figurBild, fågel.x, fågel.y, fågel.width, fågel.height);
};

// Animation till startknappen 
startknapp.classList.add ("Blinka");

let animationId; 
let speletÄrIgång = false;

// spelrutans storlek
spelruta.height = 550;
spelruta.width = 800;


//fågel objektet
//använder en "hitbox", alltså en osynlig yta som krockar med hindren istället för en rektangel 
const fågel = {
    x : spelruta.width/10,
    y : spelruta.height/2,
    width : 70,
    height : 100,
    hitboxOffsetX : 15, 
    hitboxOffsetY : 20, 
    hitboxWidth : 35, 
    hitboxHeight : 50, 
    synlig: true
}

const gravitation = 0.5;
let fågelFlyg = 0;
let poäng = 0;


//stolparna (hinder) som fågeln ska undvika
let stolpar = []
const minMellanrum = 150; 
const maxMellanrum = 250;
const stolpBredd = 70; 
const hastighet = 2

//bakgrund i spelrutan (med volkaner)
//fylla hela canvas i bredd 
function vulkanBakgrund() {
    const vulkanHöjd = 400; 
    const sourceY = 300; 
    const scaleWidth = 300; 
    const scaleHeight = vulkanHöjd * 0.5; 

    for (let x = 0; x < spelruta.width; x += scaleWidth) {
        context.drawImage(
            vulkanBild,
            0, sourceY,                    
            vulkanBild.width, vulkanHöjd, 
            x, spelruta.height - scaleHeight,                       
            scaleWidth, scaleHeight
        );
    }
}

//en räknare som håller koll på antal "frames" (bilder)
// används för att veta när det behövs nya stolpar 
let frame = 0; 

//Uppåt-knappen och Space kan användas för att starta spelet samt röra fågeln
document.addEventListener ("keydown", (e) => {
    if((e.code == "ArrowUp" || e.code == "Space") && !speletÄrIgång) {
        startaSpelet();
    }else if ((e.code == "ArrowUp" || e.code == "Space") && speletÄrIgång) {
        fågelFlyg = -10;
    }
});

// spelet börjar när man klickar på startknappen
// startar spelets huvudslinga (update)
function startaSpelet() {
    fågel.y = spelruta.height / 2;
    fågelFlyg = 0; 
    speletÄrIgång = true;
    stolpar = [];
    frame = 0; 
    poäng = 0;

    poängElement.textContent = ("Poäng: " + poäng);
    poängElement.style.display = "block";
    startknapp.style.display = "none";
    speletÖverRektangel.style.display = "none";
    
    update();
}

//funktion som skapar nytt par av stolpar
function skapaStolpe() {

    const minStolpeHöjd = 50;
    const mellanrum = 200; 

    const maxÖppningPosition = spelruta.height - mellanrum - minStolpeHöjd;
    const öppningY = Math.floor(Math.random()* (maxÖppningPosition - minStolpeHöjd + 1)) + minStolpeHöjd;

    //övre stolpe
    stolpar.push ({
        x: spelruta.width, 
        y: 0,
        width: stolpBredd, 
        height: öppningY,
        passerad: false
    });

    //nedre stolpe 
    stolpar.push ({
        x: spelruta.width, 
        y: öppningY + mellanrum, 
        width: stolpBredd, 
        height: spelruta.height - öppningY - mellanrum,
        passerad: false
    });
}

//rörelse till stolparna
//går igenom alla stoplar och förflyttar de till vänster
function stolparRörelse() {
    for (let i = 0; i < stolpar.length; i++) {
        let stolpe = stolpar[i]
        stolpe.x -= hastighet;

        context.drawImage(hinderBild, stolpe.x, stolpe.y, stolpe.width, stolpe.height);

        if (!stolpe.passerad && fågel.x > stolpe.x + stolpe.width) {
            poäng += 0.5; // för det är två stolpar som räknas varje gång fågeln passerar 
            poängElement.textContent = ("Poäng: " + poäng);
            stolpe.passerad = true;
        }
    }
}


//Huvudslinga - körs om och om igen med requestAnimationFrame(update), man skulle nog även kunna använda setInterval
// rensar spelrutan, förflyttar fågeln
function update() {
    //om spelet inte är igång, stoppa allt direkt (canvas fryser) 
    if (!speletÄrIgång) {
        return;
    }
   
    context.clearRect(0,0,spelruta.width,spelruta.height);

    vulkanBakgrund();
    
    fågelFlyg += gravitation;
    fågel.y += fågelFlyg;

    if (fågel.synlig) {
        context.drawImage(figurBild, fågel.x, fågel.y, fågel.width, fågel.height);
    }

    //stolpar
    stolparRörelse();

    if (frame % 90 == 0) {
        skapaStolpe();
    }

    kollision();

    //om fågeln träffar spelrutans kanter
    if(speletÄrIgång) {
        if (fågel.y + fågel.hitboxOffsetY + fågel.hitboxHeight >= spelruta.height || fågel.y + fågel.hitboxOffsetY <= 0)  {
            gameOver();
            return; 
        }
    }

    frame++;
    animationId = requestAnimationFrame(update);
}

//Funktion som tittar om fågeln krockar in i stolparna
//om så är fallet tar spelet slut
function kollision() {

    for (let i = 0; i < stolpar.length; i++) {
        let stolpe = stolpar[i];
        if (
            //kollison test mellan fågeln och stolparna (AABB - Axis-Aligned Bounding Box)
            //hitbox 
            fågel.x + fågel.hitboxOffsetX < stolpe.x + stolpe.width &&
            fågel.x + fågel.hitboxOffsetX + fågel.hitboxWidth > stolpe.x &&
            fågel.y + fågel.hitboxOffsetY < stolpe.y + stolpe.height &&
            fågel.y + fågel.hitboxOffsetY + fågel.hitboxHeight > stolpe.y
        ) {
            gameOver();
            return;
        }
    }
}


//Funktion som körs om spelet är över 
// startknappen blir synlig
function gameOver() {
    speletÄrIgång = false;
    cancelAnimationFrame(animationId);
    speletÖverRektangel.style.display = "block";
    poängAvslut.textContent = poäng;

    //visa start knappen igen 
    poängElement.style.display = "none";
}

