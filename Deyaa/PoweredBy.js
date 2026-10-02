// The supplied team.json remains the source of truth for names, roles and descriptions.
(async () => {
  const container=document.getElementById('teamContainer');
  try {
    const response=await fetch('team.json');
    if(!response.ok)throw new Error('Team data unavailable');
    const team=await response.json();
    for(const [index,member] of team.entries()){
      const card=document.createElement('article');card.className='team-card';
      const portrait=document.createElement('div');portrait.className='team-portrait';
      const initials=document.createElement('span');initials.textContent=member.name.split(/\s+/).map(part=>part[0]).slice(0,2).join('');initials.setAttribute('aria-hidden','true');portrait.append(initials);
      // The supplied portraits are not bundled. Set portraitAvailable after adding a photo.
      if(member.portraitAvailable && member.image){
        const image=new Image();image.alt=member.name;image.src=new URL('../'+member.image.replace(/^\//,''),location.href);image.loading='lazy';image.addEventListener('load',()=>portrait.replaceChildren(image));
      }
      const number=document.createElement('small');number.className='team-number';number.textContent=String(index+1).padStart(2,'0');portrait.append(number);
      const name=document.createElement('h2');name.textContent=member.name;
      const role=document.createElement('h3');role.textContent=member.role;
      const description=document.createElement('p');description.textContent=member.description;
      card.append(portrait,name,role,description);container.append(card);
    }
  }catch(error){container.textContent='Team details could not load. Please refresh and try again.';container.setAttribute('role','alert');}
})();
