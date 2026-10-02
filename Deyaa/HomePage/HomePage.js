(() => {
  const icons=['M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2M8 14h3v3H8z','M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M17 4a4 4 0 0 1 0 7M22 21v-2a4 4 0 0 0-3-4','M14 2H5v20h14V7zM14 2v6h5M8 12h8M8 16h6','M9 6h12M9 12h12M9 18h12M2 5l2 2 3-4M2 11l2 2 3-4M2 17l2 2 3-4','M21 15a3 3 0 0 1-3 3H8l-5 4V5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3zM7 7h10M7 11h7','M3 5h12v14H3zM15 10l6-4v12l-6-4'];
  document.querySelectorAll('#services .icon').forEach((icon,i)=>{icon.innerHTML=`<svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[i]}"></path></svg>`;});
  const canvas=document.getElementById('hero-motion'), context=canvas.getContext('2d'), button=document.getElementById('motion-toggle');
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  let paused=preference.matches,frame=0,width=0,height=0,visible=true,elapsed=0,previous=0;
  const particles=Array.from({length:2600},(_,i)=>({x:((i*7919)%2609)/2609,band:i%3,spread:Math.sin(i*137.5),size:.5+(i%5)*.28}));
  function paint(time=0){context.clearRect(0,0,width,height);for(const p of particles){const u=(p.x+time*.015*(p.band+1))%1;const x=u*width;const wave=Math.sin(u*5.5+time*.3+p.band*.8)*height*.115;const y=height*.77+wave+p.spread*(18+65*Math.sin(u*Math.PI)**2)+p.band*25;context.fillStyle=['#ffe45c','#b5ce76','#f29978'][p.band];context.globalAlpha=.2+.65*(1-Math.abs(p.spread));context.beginPath();context.arc(x,y,p.size,0,Math.PI*2);context.fill();}context.globalAlpha=1;}
  function tick(now){if(paused||!visible||document.hidden){frame=0;previous=0;return;}if(previous)elapsed+=Math.min(now-previous,50)/1000;previous=now;paint(elapsed);frame=requestAnimationFrame(tick);}
  function sync(){button.textContent=paused?'Play motion ▷':'Pause motion Ⅱ';button.setAttribute('aria-pressed',String(paused));if(!frame&&!paused&&visible&&!document.hidden)frame=requestAnimationFrame(tick);}
  new ResizeObserver(()=>{width=canvas.clientWidth;height=canvas.clientHeight;const scale=Math.min(devicePixelRatio,2);canvas.width=width*scale;canvas.height=height*scale;context.setTransform(scale,0,0,scale,0,0);paint(elapsed);}).observe(canvas);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();}).observe(canvas);
  document.addEventListener('visibilitychange',sync);button.addEventListener('click',()=>{paused=!paused;sync();});preference.addEventListener('change',event=>{paused=event.matches;sync();});sync();
})();
