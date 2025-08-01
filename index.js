//Welcome to the code, its probably really gross
const canvas=document.querySelector("canvas")
const ctx=canvas.getContext("2d")
const beard=document.querySelector(".beard")
const pillowWall=document.querySelector(".pillowWall")
const title=document.querySelector(".title")
const end=document.querySelector(".end")
const startButton=document.querySelector(".start")
const retryButton=document.querySelector(".retry")
const highscoreSpan=document.querySelector(".high")
const menuButton=document.querySelector(".menu")
const tutorialButton=document.querySelector(".how")
const tutorialText=document.querySelector(".tutorial")
const bgmusic=document.querySelector(".bgmusic")
const crash=document.querySelector(".crash")
const pillow=document.querySelector(".pillow")
const mouthBounce=document.querySelector(".mouthBounce")
const roll=document.querySelector(".roll")
crash.volume=0.5
mouthBounce.volume=0.5
roll.volume=0.8
const tutorial={active:false,movement:false,ball:0,index:-1}
const dialogue=[
    "Ah, there you are! I'm afraid we don't have that much time. [Click to continue]",
    "That evil witch cursed my shop, and in a few moments all of my fragile eyeballs will start falling down.",
    "If the eyeballs hit the floor they'll shatter!",
    "Do you know how much it costs to secure those things?? I can't let them break!",
    "The only way to protect them is to redirect them into these pillows on my walls.",
    "I would try to do this myself, but, you see... well...",
    "...",
    "I'm blind! Ironic, isn't it?",
    "I actually founded this shop to ensure that no other monsters would have to suffer my fate.",
    "Of course, you're probably wondering why I can't use these eyeballs...",
    "I have my reasons, ok???",
    "Oh look, I'm rambling again. Back to the point...",
    "I hired you so you can direct me on where to go.",
    "~Use the mouse to move me around!",//unlock movement
    "Yes, just like that!", 
    "Just remember that I can only stretch up so high! My legs are not that long.", 
    "Moving on...",
    "~The eyeballs fall from too high up for me to catch them with my hands safely.", //lock movement
    "So we'll use my beard instead!.",
    "/If it rolls onto my beard from one side, then it'll loop around onto the pillows!", //example roll
    "/You can use my eye sockets to help line up the ball. Either side can be used to loop!", //example roll2
    "/If you miss and it lands on my mouth, then the eyeball will bounce right back up.", //example bounce
    "That fractures the eyeball though, so make sure not to bounce it too much!",
    "There's one more thing you need to know.",
    "That white bar up there keeps track of my inventory.",
    "When we save an eyeball, it increases, and when one breaks, it decreases.",
    "If it goes down to zero...",
    "YOU'RE FIRED!",
    "So make sure you get them all, ok?",
    "(Surely the witch didn't curse them to fall forever... right?)",
    "...",
    "Anyways, it looks like we're out of time— I hear them coming!",
    "Good luck!"//start
]
let height=window.innerHeight
let width=window.innerWidth
let health=15;
let highscore=localStorage.getItem('highscore') || 100
highscoreSpan.innerHTML=highscore
canvas.height=height
canvas.width=width
let floor=height
const mouse={x:width/2,y:height-(height/4),down:false}
const prevTime={init:Date.now(),frame:Date.now(),spawn:Date.now()};
const bowl={innerRadius:60,outerRadius:100}
const rate={ms:1000,max:5}
let audio=true;
document.addEventListener("mousemove",(e)=>{
    if(!tutorial.active||tutorial.movement){
    mouse.x=Math.max(100,Math.min(e.clientX,width-100))
    mouse.y=Math.max(e.clientY,height-(height/4))
    }
})
document.body.addEventListener("keydown",(key)=>{
    if(key.key=="m"&&!key.repeat){
        audio=!audio
        if(audio){
            roll.volume=0.8
            bgmusic.volume=1
            crash.volume=0.5
            pillow.volume=1
            mouthBounce.volume=0.5
        }else{
            roll.volume=0
            bgmusic.volume=0
            crash.volume=0
            pillow.volume=0
            mouthBounce.volume=0
        }
    }
})
document.body.addEventListener("click",(e)=>{
    bgmusic.play()
    if(tutorial.active){
        tutorial.index++
        if(tutorial.index>dialogue.length-1){
            tutorial.active=false;
            tutorialText.style.display="none"
            prevTime.init=Date.now()
            prevTime.frame=Date.now()
            prevTime.spawn=Date.now()
            balls.collection=[]
            health=15;
            rate.ms=1000;
            return;
        }
        if(dialogue[tutorial.index].charAt(0)=="~"){
            tutorial.movement=!tutorial.movement
            if(tutorial.movement){
                mouse.x=Math.max(100,Math.min(e.clientX,width-100))
                mouse.y=Math.max(e.clientY,height-(height/4))
            }else{
                mouse.x=width/2
                mouse.y=height-(height/4)
            }
        }
        if(dialogue[tutorial.index].charAt(0)=="/"){
            if(tutorial.ball==0){
            ballSpawn(true,width/2-100+15)
            }
            if(tutorial.ball==1){
            ballSpawn(true,width/2+100-15)
            }
            if(tutorial.ball==2){
            ballSpawn(true,width/2)
            }
            tutorial.ball++
        }
    }
})
startButton.addEventListener("click",reset)
retryButton.addEventListener("click",reset)
tutorialButton.addEventListener("click",()=>{
    tutorial.index=-1;
    tutorial.ball=0;
    tutorial.active=true;
    mouse.x=width/2
    mouse.y=height-(height/4)
    tutorialText.style.display="flex"
    reset()
})
menuButton.addEventListener("click",()=>{
    title.style.display="flex"
    end.style.display="none"
    pillowWall.style.display="none"
})
 class balls{
    static count=0
    static collection=[]
    static colorIndex=0;
    constructor(i,size,angle,xStart,yStart){
        balls.collection.push(this)
        this.color=60*i
        this.points=[]
        this.size=size
        this.angle=angle
        this.loop={active:false,left:false,done:false};
        this.vi=3 //INITIAL VELOCITY
        this.vel={x:(this.vi)*Math.cos(this.angle),y:(-this.vi*Math.sin(this.angle))}
        this.xStart=xStart
        this.yStart=yStart
        this.x=this.xStart
         this.y=this.yStart
         this.bounce=0;
    }
    finish=false
    physics(){

        if(this.loop.done){
            if(this.points.length>10){
                this.points.shift()
            }
            this.points.push({x:this.x,y:this.y})
        }
        const bound=30 //catch leniency
        //loop entrance
        if(!this.loop.active&&Math.abs(this.y-mouse.y)<bound&&this.vel.y>0){
            if(Math.abs(this.x-mouse.x+(bowl.innerRadius+20))<bound){
                 this.loop.active=true
                 roll.play()
                this.loop.done=true
                this.loop.left=true
                this.angle=Math.PI
            }else if(Math.abs(this.x-mouse.x-(bowl.innerRadius+20))<bound){
                this.loop.active=true
                roll.play()
                this.loop.left=false
                this.loop.done=true
             this.angle=2*Math.PI
            }else if(this.x>mouse.x-(bowl.innerRadius+20)&&this.x<mouse.x+(bowl.innerRadius+20)){
                this.vel.y=this.vel.y*-0.8
                this.bounce++
                if(this.bounce==5){
                    this.finish=true
                    health-=5
                    crash.pause()
                    crash.currentTime=0
                    crash.play()
                }else{
                    mouthBounce.pause()
                    mouthBounce.currentTime=0
                    mouthBounce.play()
                }
                //mouth
            }
        }
        //loop exit
        if(this.loop.left&&this.loop.active&&Math.abs(this.angle-(2*Math.PI+0.3))<0.3){
            this.loop.active=false
            roll.pause()
            roll.currentTime=0
            this.vel.y=this.vel.y*-1
            this.vel.x=-10
        }
        if(!this.loop.left&&this.loop.active&&Math.abs(this.angle-(Math.PI-0.3))<0.3){
            this.loop.active=false
            roll.pause()
            roll.currentTime=0
            this.vel.y=this.vel.y*-1
            this.vel.x=10
        }
        //loop physics
        if(this.loop.active){
            if(Math.abs(this.angle)>2*Math.PI||Math.abs(this.vel.y)<1){
                this.finish=true
            }
            this.x=mouse.x+(bowl.outerRadius-this.size-2)*Math.cos(this.angle)
            this.y=mouse.y-(bowl.outerRadius-this.size-2)*Math.sin(this.angle)
           if(this.loop.left){
            this.angle+=this.vel.y/100
           }else{
            this.angle-=this.vel.y/100
           }
        }else{
        this.vel.y+=this.vi/height*100 //GRAVITY
        this.x+=this.vel.x
        this.y+=this.vel.y
         if(health<0){
        health=0;
    }
    }
        if(this.x<0+this.size||this.x>width-this.size&&!this.loop.active){
             this.finish=true
             if(health<30){
             health++
            pillow.pause()
             pillow.currentTime=0
             pillow.play()
             }
             //side

        }
        if(this.y>floor-this.size&&!this.loop.active&&!this.loop.done){
            this.finish=true
            health-=10
            crash.pause()
            crash.currentTime=0
            crash.play()
            //floor
        }
  }
}
function reset(){
    roll.pause()
    roll.currentTime=0
    end.style.display="none"
    pillowWall.style.display="block"
    title.style.display="none"
    balls.collection=[]
    rate.ms=1000
    health=15;
    prevTime.init=Date.now()
     prevTime.frame=Date.now()
    prevTime.spawn=Date.now()
    requestAnimationFrame(update)
}
function update(){
    if(Date.now()-prevTime.frame>16){
        prevTime.frame=Date.now()
        if(draw()){
            end.style.display="flex"
            pillowWall.style.display="none"
            return
        }
    }
    requestAnimationFrame(update)
}
function draw(){
    let time=Math.floor((Date.now()-prevTime.init)/1000)
    ctx.lineWidth = 1;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle=`black`
    timeChecks(time)
     if(!tutorial.active){
        if(Date.now()-prevTime.spawn>rate.ms&&balls.collection.length<rate.max){
        prevTime.spawn=Date.now()
        ballSpawn(false,0)
        }
    }else{
        tutorialText.innerHTML=dialogue[tutorial.index].replace("~", "").replace("/", "") || "I'm old!"
        tutorialText.style.right=width-mouse.x+"px"
        tutorialText.style.top=mouse.y-300+"px"
    }
    drawFace()
    balls.collection.forEach((ball,i)=>drawBall(ball,i))
        if(!tutorial.active){
            drawTime(time,40,75)
         }
    drawHealth()
    if(health==0){
        roll.pause()
        roll.currentTime=0
        return true;
    }
    return false
}

function timeChecks(time){
 if(time>highscore){
        highscore=time
        localStorage.setItem('highscore',highscore.toString()); 
        highscoreSpan.innerHTML=highscore
    }
    if(time>20){
        rate.ms=750
    }
    if(time>50){
        rate.ms=500
    }
    if(time>100){
        rate.ms=300
    }
    if(time>150){
        rate.ms=200
    }
}
function drawStatic(){
    ctx.strokeStyle=`rgb(176, 220, 179);`
    ctx.beginPath();
    ctx.moveTo(0, height-(height/4)-10); 
    ctx.lineTo(width, height-(height/4)-10);
    ctx.stroke();
}

function ballSpawn(setLocation,location){
    let angle
            if(Math.random()<0.5){
                angle=-Math.PI/4
        }else{
            angle=-2.35619
        }
        angle=-Math.PI/2
        //size angle x y
        if(setLocation){
              new balls(balls.colorIndex,15,angle,location,0)
        }else{
            new balls(balls.colorIndex,15,angle,Math.floor(Math.floor(Math.random() * ((width-width/6) - (width/6) + 1) + (width/6))),0)
        }
    balls.colorIndex++
    balls.colorIndex=balls.colorIndex%5
}

function drawHealth(){
    ctx.fillStyle="black"
    ctx.fillRect(width/2-(width/5),10,(width/5)*2,30)
    ctx.fillStyle="white"
    ctx.fillRect(width/2-(width/5)+5,15,(width/5)*2-10,20)
    ctx.fillStyle="#250202ff"
    ctx.fillRect(width/2-(width/5)+5+(health*((width/5)*2-8)/30),15,(width/5)*2-8-(health*((width/5)*2-8)/30),20)
}//max=((width/5)*2-8)/30

function drawTime(time,size,y){
    ctx.font = `${size}px sans-serif`;
    ctx.fillStyle="white"
    let string=time.toString()
    let stringLength=string.length
    for(i=0;i<4-stringLength;i++){
        string="0"+string
    }
    ctx.fillText(string, width/2-(ctx.measureText(string).width/2), y);
}

function drawFace(){
    ctx.fillStyle=`black`
    //bowl
    ctx.beginPath();
        ctx.lineWidth = 10;
    ctx.arc(mouse.x, mouse.y, bowl.outerRadius, 0-0.5, Math.PI+0.55);
    ctx.stroke();
    //mouth
        ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, bowl.innerRadius, 0, Math.PI);
    ctx.fill();
    //beard
     ctx.drawImage(beard,mouse.x-140,mouse.y-58,280,345)
    //eyes
    ctx.fillStyle=`black`
    ctx.beginPath();
    ctx.arc(mouse.x-80, mouse.y-50, 20, 0, 2*Math.PI);
    ctx.arc(mouse.x+80, mouse.y-50, 20, 0, 2*Math.PI);
    ctx.fill();
        ctx.fillStyle=`white`
    ctx.beginPath();
    ctx.arc(mouse.x-80, mouse.y-50, 7, 0, 2*Math.PI);
    ctx.arc(mouse.x+80, mouse.y-50, 7, 0, 2*Math.PI);
    ctx.fill();
}

function drawBall(ball,i){
    ctx.beginPath();
    ctx.fillStyle=`white`
    if(!ball.finish){
        ball.physics()
    }else{
        balls.collection.splice(i,1)
    }
    ctx.arc(ball.x,ball.y,ball.size,0,2*Math.PI)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle=`oklch(100% 0.9 ${ball.color}deg / ${1-(ball.bounce/4)})`
    ctx.beginPath();
    ctx.arc(ball.x,ball.y,ball.size/1.5,0,2*Math.PI)
     ctx.fill()
    ball.points.forEach(ele=>{
            ctx.beginPath();
        ctx.arc(ele.x,ele.y,2,0,2*Math.PI)
            ctx.fill()
    })
    ctx.fillStyle=`black`
    ctx.beginPath();
    ctx.arc(ball.x,ball.y,ball.size/2.5,0,2*Math.PI)
     ctx.fill()
}

window.addEventListener("resize",()=>{
    height=window.innerHeight
    width=window.innerWidth
    canvas.height=height
    canvas.width=width
    floor=height;
    if(!tutorial.movement&&tutorial.active){
        mouse.x=width/2
        mouse.y=height-(height/4)
        }
})