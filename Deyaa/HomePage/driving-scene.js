/* Original canvas scene: a luminous sports car following a winding night road. */
(() => {
  'use strict';
  const canvas = document.getElementById('hero-motion');
  const ctx = canvas.getContext('2d');
  const hero = document.getElementById('home');
  const button = document.getElementById('motion-toggle');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0, elapsed = 0, previous = 0, frame = 0;
  let paused = preference.matches, visible = true, scroll = 0;
  const seeds = Array.from({length:3800}, (_,i) => ({
    x: ((i * 7919) % 3821) / 3821,
    y: ((i * 3571) % 3833) / 3833,
    size: .45 + (i % 5) * .22
  }));

  function road(depth, time) {
    const horizon = height * .48;
    const bend = Math.sin(depth * 5.8 - time * .28) * .19;
    return {
      x: width * (.5 + bend * Math.sin(depth * Math.PI)),
      y: horizon + Math.pow(depth, 1.55) * height * .57,
      half: width * (.007 + Math.pow(depth, 1.65) * .39)
    };
  }
  function polygon(points, fill, stroke) {
    ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    ctx.closePath(); if(fill) {ctx.fillStyle=fill;ctx.fill();}
    if(stroke) {ctx.strokeStyle=stroke;ctx.stroke();}
  }
  function dot(x,y,r,color,alpha=1) {
    ctx.globalAlpha=alpha; ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  }
  function car(x,y,size,yaw) {
    ctx.save();ctx.translate(x,y);ctx.rotate(yaw);ctx.scale(size,size);
    // Light cast onto the asphalt, wheels, and a faceted rear three-quarter body.
    const glow=ctx.createRadialGradient(0,0,10,0,0,175);
    glow.addColorStop(0,'#3abfe14d');glow.addColorStop(1,'#18b8e000');
    ctx.fillStyle=glow;ctx.fillRect(-180,-180,360,360);
    ctx.fillStyle='#03080e';ctx.beginPath();ctx.ellipse(0,30,120,23,0,0,Math.PI*2);ctx.fill();
    polygon([[-106,-12],[-87,-25],[-83,35],[-105,32]],'#06080c','#4d7180');
    polygon([[87,-25],[106,-12],[105,32],[83,35]],'#06080c','#4d7180');
    ctx.lineWidth=1.4;ctx.shadowColor='#48d9ff';ctx.shadowBlur=12;
    polygon([[-103,9],[-90,-35],[-59,-76],[51,-76],[90,-37],[106,8],[92,31],[-90,31]],'#183440','#80e7fa');
    polygon([[-90,-35],[-59,-76],[51,-76],[90,-37],[55,-45],[-53,-45]],'#57939d','#b7f6fc');
    polygon([[-53,-69],[46,-69],[67,-39],[-70,-39]],'#071b28','#86dced');
    polygon([[-100,0],[-71,-34],[70,-34],[104,0],[87,16],[-85,16]],'#355566','#8adef2');
    polygon([[-102,7],[-84,17],[85,17],[105,7],[94,32],[-92,32]],'#10212d','#5ec2dd');
    // Rear wing and tail-light bar make the vehicle recognizable even on small screens.
    ctx.shadowBlur=0;ctx.fillStyle='#0b161e';ctx.fillRect(-80,-24,6,16);ctx.fillRect(73,-24,6,16);
    polygon([[-113,-28],[110,-28],[114,-20],[-115,-20]],'#2d5666','#a0f3ff');
    ctx.shadowColor='#ff4a53';ctx.shadowBlur=13;ctx.fillStyle='#ff5767';
    ctx.fillRect(-87,8,61,4);ctx.fillRect(26,8,61,4);
    ctx.shadowBlur=0;ctx.fillStyle='#fff2a9';ctx.fillRect(-19,20,38,9);
    ctx.fillStyle='#182831';ctx.font='bold 6px Arial';ctx.textAlign='center';ctx.fillText('WORKFORCE',0,27);
    // Dense points on the body echo the reference's luminous point-cloud treatment.
    for(let i=0;i<230;i++) {
      const px=((i*73)%181)-90, py=((i*37)%47)-16;
      dot(px,py,.55,'#b7f5ff',.2+(i%4)*.15);
    }
    ctx.restore();
  }
  function paint() {
    if(!width || !height) return;
    const time=elapsed + scroll*3;
    ctx.clearRect(0,0,width,height);
    const atmosphere=ctx.createRadialGradient(width*.6,height*.62,10,width*.6,height*.62,width*.6);
    atmosphere.addColorStop(0,'#12394d75');atmosphere.addColorStop(1,'#08111a00');
    ctx.fillStyle=atmosphere;ctx.fillRect(0,0,width,height);
    // Moving terrain particles stay outside the asphalt, producing clear road boundaries.
    for(const seed of seeds) {
      const d=(seed.y + time*.055)%1, r=road(d,time);
      const side=seed.x<.5?-1:1;
      const outside=((seed.x*2)%1);
      const x=r.x+side*(r.half+5+outside*width*.75);
      dot(x,r.y,seed.size*(.25+d),outside<.13?'#deea8a':'#7eab64',(.09+d*.65)*(1-outside*.55));
    }
    // Render far to near: asphalt, alternating kerbs, and travelling lane markers.
    for(let i=0;i<100;i++) {
      const d=i/100, a=road(d,time), b=road((i+1)/100,time);
      polygon([[a.x-a.half,a.y],[a.x+a.half,a.y],[b.x+b.half,b.y],[b.x-b.half,b.y]],'#0c121c');
      const curb=(Math.floor(d*42-time*5)%2+2)%2?'#ee6975':'#d9edf0';
      const edgeA=1+a.half*.055,edgeB=1+b.half*.055;
      for(const side of [-1,1]) {
        ctx.globalAlpha=.35+d*.65;
        polygon([[a.x+side*a.half,a.y],[a.x+side*(a.half+edgeA),a.y],[b.x+side*(b.half+edgeB),b.y],[b.x+side*b.half,b.y]],curb);
        ctx.globalAlpha=1;
      }
      if((Math.floor(d*28-time*5)%3+3)%3===0) {
        polygon([[a.x-1-d*2,a.y],[a.x+1+d*2,a.y],[b.x+1+d*2,b.y],[b.x-1-d*2,b.y]],'#91a4b347');
      }
    }
    // Reflectors and foreground dust move towards the camera with the road.
    for(let i=0;i<40;i++) {
      const d=(i/40+time*.045)%1,r=road(d,time);
      for(const side of [-1,1])dot(r.x+side*r.half*1.13,r.y,1+d*1.6,'#ddf7ff',.2+d*.6);
    }
    const depth=.73+Math.min(scroll,.8)*.055, r=road(depth,time);
    const scale=Math.min(width/1100,1.2)*(.83+Math.min(scroll,1)*.22);
    car(r.x+Math.sin(time*.75)*r.half*.09,r.y-15,Math.max(.47,scale),Math.sin(time*.28-1)*.045);
    // The top gradient protects the headline while leaving the entire road scene visible.
    const shade=ctx.createLinearGradient(0,height*.26,0,height*.68);
    shade.addColorStop(0,'#0b0d10f0');shade.addColorStop(1,'#0b0d1000');
    ctx.fillStyle=shade;ctx.fillRect(0,0,width,height*.68);
    canvas.dataset.scene='car-and-road';
  }
  function tick(now) {
    if(paused||!visible||document.hidden){frame=0;previous=0;return;}
    if(previous)elapsed+=Math.min(now-previous,50)/1000;
    previous=now;paint();frame=requestAnimationFrame(tick);
  }
  function sync() {
    button.textContent=paused?'Play motion ▷':'Pause motion Ⅱ';
    button.setAttribute('aria-pressed',String(paused));
    if(!frame&&!paused&&visible&&!document.hidden)frame=requestAnimationFrame(tick);
  }
  new ResizeObserver(()=>{
    width=canvas.clientWidth;height=canvas.clientHeight;
    const scale=Math.min(devicePixelRatio,1.75);canvas.width=width*scale;canvas.height=height*scale;
    ctx.setTransform(scale,0,0,scale,0,0);paint();
  }).observe(canvas);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();}).observe(canvas);
  addEventListener('scroll',()=>{
    if(paused||preference.matches)return;
    scroll=Math.max(0,Math.min(1,-hero.getBoundingClientRect().top/height));
  },{passive:true});
  document.addEventListener('visibilitychange',sync);
  button.addEventListener('click',()=>{paused=!paused;sync();});
  preference.addEventListener('change',event=>{paused=event.matches;scroll=0;paint();sync();});
  sync();
})();
