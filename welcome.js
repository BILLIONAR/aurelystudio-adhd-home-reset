/* Local name onboarding and device-local time-aware greetings. */
let welcomeEditing = false;
let welcomeEntering = false;
function cleanName(value) { return String(value || '').trim().replace(/\s+/g,' ').slice(0,30); }
function timeGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return {period:'morning',text:'Good morning',symbol:'☀',message:'Welcome home. A fresh start, at your own pace.'};
  if (hour >= 12 && hour < 17) return {period:'afternoon',text:'Good afternoon',symbol:'☀',message:'Welcome home. One small step at a time.'};
  if (hour >= 17 && hour < 22) return {period:'evening',text:'Good evening',symbol:'☾',message:'Welcome home. Make a little room to unwind.'};
  return {period:'night',text:'Good night',symbol:'☾',message:'Welcome home. A little is enough tonight.'};
}
function greetingTitle() {
  const time = timeGreeting();
  return `${time.text}${cleanName(state.name)?', <span class="greeting-name">'+esc(cleanName(state.name))+'.</span>':''} <span class="time-symbol ${time.period}" aria-hidden="true">${time.symbol}</span>`;
}
function refreshGreeting() {
  const title = document.querySelector('[data-greeting-title]');
  const description = document.querySelector('[data-greeting-description]');
  if (title) title.innerHTML = greetingTitle();
  if (description) description.textContent = timeGreeting().message;
  const period = document.querySelector('.welcome-time');
  if (period) period.textContent = timeGreeting().text.toUpperCase();
  const returningTitle = document.querySelector('#welcome-screen .returning-title');
  if (returningTitle) returningTitle.innerHTML = `${timeGreeting().text},<br><span>${esc(cleanName(state.name))}.</span>`;
}
function showWelcome(edit = false) {
  if (welcomeEntering) return;
  let dialog = document.getElementById('welcome-screen');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'welcome-screen';
    dialog.setAttribute('aria-labelledby','welcome-title');
    dialog.addEventListener('cancel',e=>{e.preventDefault();if(cleanName(state.name))enterHome();else dialog.querySelector('input')?.focus()});
    document.body.append(dialog);
  }
  welcomeEditing = edit || !cleanName(state.name);
  const name = cleanName(state.name);
  const time = timeGreeting();
  dialog.innerHTML = `<div class="welcome-layout"><div class="welcome-art"><img class="welcome-photo" src="assets__photos__welcome-luxury.png" alt="An elegant travertine entrance with a curved staircase, walnut walls and natural light"><div class="welcome-photo-note"><span class="welcome-note-rule"></span><p>A calmer home starts<br>with smaller steps.</p><span>ONE SPACE AT A TIME</span></div><div class="welcome-photo-tag">${icon('leaf')} Progress over perfection</div></div><section class="welcome-copy"><div class="welcome-brand"><img src="assets__logo.svg" alt="AurelyStudio logo"><div><strong>AurelyStudio</strong><small>ADHD Home Reset</small></div></div><div class="welcome-main"><span class="welcome-time">${time.text.toUpperCase()}</span><h1 id="welcome-title" tabindex="-1" autofocus ${welcomeEditing?'':'class="returning-title"'}>${welcomeEditing?'A little space.<br>A fresh start.':`${time.text},<br><span>${esc(name)}.</span>`}</h1><p class="welcome-description">${welcomeEditing?'Let’s make this space feel like yours.<br>What would you like us to call you?':'Your home, your pace.<br>Welcome back to your little place of calm.'}</p><form id="welcome-form" ${welcomeEditing?'':'class="returning-form"'}>${welcomeEditing?`<label for="welcome-name">Your name or nickname</label><input id="welcome-name" name="name" autocomplete="given-name" maxlength="30" placeholder="Your first name" value="${esc(name)}" required aria-describedby="welcome-privacy"><p class="welcome-name-preview" aria-live="polite">${name?'Your space, '+esc(name)+'.':'Just a name. No account needed.'}</p>`:''}<button class="welcome-enter primary" type="submit" ${welcomeEditing&&!name?'disabled':''}>${welcomeEditing?'Make yourself at home':'Enter my home'} ${icon('arrow')}</button></form>${welcomeEditing?'':'<button class="welcome-change" type="button" data-welcome-edit>Change name</button>'}<p id="welcome-privacy" class="welcome-privacy">Your name and plans stay in this browser.</p></div><div class="welcome-bottom"><span>${icon('heart')} Small resets still count.</span><label><input id="welcome-calm" type="checkbox" ${state.theme.calm?'checked':''}> Less motion</label></div></section></div>`;
  document.documentElement.classList.add('welcome-open');
  if (!dialog.open) dialog.showModal();
  // Keep first-use orientation visible on phones instead of opening the keyboard automatically.
  if (welcomeEditing && matchMedia('(min-width: 700px)').matches) dialog.querySelector('#welcome-name')?.focus({preventScroll:true});
  else dialog.querySelector('#welcome-title')?.focus({preventScroll:true});
  dialog.addEventListener('input',welcomeInput);
  dialog.addEventListener('change',welcomeChange);
  dialog.addEventListener('click',welcomeClick);
}
function welcomeInput(e) {
  if(e.target.id!=='welcome-name')return;
  const name = cleanName(e.target.value);
  const dialog = document.getElementById('welcome-screen');
  dialog.querySelector('.welcome-enter').disabled = !name;
  dialog.querySelector('.welcome-name-preview').textContent = name?`Your space, ${name}.`:'Just a name. No account needed.';
  e.target.setCustomValidity('');
}
function welcomeChange(e) {
  if(e.target.id!=='welcome-calm')return;
  state.theme.calm = e.target.checked;
  save();theme();
}
function welcomeClick(e) { if(e.target.closest('[data-welcome-edit]'))showWelcome(true); }
function enterHome() {
  if(welcomeEntering)return;
  const dialog = document.getElementById('welcome-screen');
  if(!cleanName(state.name))return;
  welcomeEntering = true;
  page = 'Home';shell();
  const noMotion = state.theme.calm || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const done = () => {
    dialog?.close();dialog?.remove();
    document.documentElement.classList.remove('welcome-open');
    welcomeEntering = false;
    const main = document.getElementById('main');
    main.classList.add('home-arrival');
    const title=document.querySelector('[data-greeting-title]');
    title?.setAttribute('tabindex','-1');title?.focus({preventScroll:true});
    setTimeout(()=>main.classList.remove('home-arrival'),700);
  };
  if(noMotion){done();return;}
  dialog.classList.add('welcome-leaving');
  setTimeout(done,300);
}
function submitWelcome(form) {
  if(welcomeEntering)return;
  if(welcomeEditing){
    const input=form.querySelector('[name="name"]');
    const name=cleanName(input.value);
    if(!name){input.setCustomValidity('Please enter your name or nickname.');input.reportValidity();return;}
    state.name=name;
    save();
  }
  enterHome();
}
setInterval(refreshGreeting,30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshGreeting()});
