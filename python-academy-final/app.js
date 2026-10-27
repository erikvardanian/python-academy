
// Visibly distinguish programming terms in theory prose, including bare words
// such as print and Python (not just function calls). Preserve the original text.
function enhanceInlineCode(){
  const article=document.querySelector('.article');
  if(!article)return;
  const names=['Python','Pyodide','IDLE','VS Code','True','False','None','print','input','int','float','str','bool','list','tuple','dict','set','len','range','type','sum','min','max','sorted','round','abs','append','remove','pop','sort','strip','upper','lower','replace','split','items','get','sqrt','randint','if','elif','else','while','for','break','continue','return','def','import','from','as','try','except','finally','pass','and','or','not','in','is','class','global','lambda'];
  const nameSet=new Set(names);
  // ASCII token boundaries work beside Armenian characters, unlike JS \b.
  const matcher=/(?:[A-Za-z_]\w*\s*\([^()\n]{0,85}\)|[A-Za-z_]\w*\.[A-Za-z_]\w*|[A-Za-z_]\w*\.py|\.py|\b[A-Za-z_]\w*\b)/g;
  const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode()){
    const n=walker.currentNode;
    if(n.parentElement.closest('pre,code,.codebox,.inline-code-highlight,button,a,script,style'))continue;
    if(matcher.test(n.nodeValue))nodes.push(n);
    matcher.lastIndex=0;
  }
  for(const node of nodes){
    const txt=node.nodeValue,frag=document.createDocumentFragment();let last=0,changed=false;
    matcher.lastIndex=0;
    for(const m of txt.matchAll(matcher)){
      const token=m[0],head=token.match(/^[A-Za-z_]\w*/)?.[0];
      const codeCall=/^[A-Za-z_]\w*\s*\(/.test(token);
      const qualified=/^[A-Za-z_]\w*\.[A-Za-z_]\w*$/.test(token);
      const valid=nameSet.has(token)||token==='.py'||/^[A-Za-z_]\w*\.py$/.test(token)||(codeCall&&(nameSet.has(head)||/["'\d=]/.test(token)))||(qualified&&(nameSet.has(head)||['math','random','os','sys'].includes(head)));
      if(!valid)continue;
      if(m.index>last)frag.append(document.createTextNode(txt.slice(last,m.index)));
      const chip=document.createElement('code');chip.className='inline-code-highlight';chip.textContent=token;
      frag.append(chip);last=m.index+token.length;changed=true;
    }
    if(changed){if(last<txt.length)frag.append(document.createTextNode(txt.slice(last)));node.replaceWith(frag)}
  }
}

/* Python Academy — static, local-first learning platform */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=s=>String(s).replace(/[^a-zA-Z0-9.-]/g,'_');
// Preserve source line breaks in quiz prompts, answers and task statements.
// Keep consecutive Python lines in their own code block instead of collapsing into inline text.
function formattedText(value){
 const normalized=String(value??'').replace(/\r\n?/g,'\n');
 const lines=normalized.split('\n');
 const codeLike=line=>/^\s*(?:>>>\s*|(?:async\s+)?def\s+|class\s+|print\s*\(|input\s*\(|if\s+|elif\s+|else\s*:|for\s+|while\s+|try\s*:|except\b|return\b|break\b|continue\b|import\s+|from\s+|#|[a-zA-Z_][\w.]*\s*(?:=|\+=|-=)|[a-zA-Z_][\w.]*\s*\(|[\[\]{}()0-9*+\-=/%]+\s*$)/.test(line);
 let html='', buffer=[];
 const flush=()=>{if(buffer.length){html+='<pre class="embedded-code"><code>'+escapeHTML(buffer.join('\n'))+'</code></pre>';buffer=[]}};
 for(const line of lines){if(codeLike(line)){buffer.push(line)}else{flush();html+='<span class="formatted-line">'+(line?escapeHTML(line):'&nbsp;')+'</span>'}}flush();return html;
}

// Answers remain ordinary text, even when they contain Python syntax.
function plainQuizOption(value){
 return escapeHTML(String(value??'')).replace(/\r\n?/g,'\n').replace(/\n/g,'<br>');
}
// Detect Python fragments in questions, including code following a colon.
function quizQuestion(value){
 const raw=String(value??'').replace(/\r\n?/g,'\n');
 // Explicit code fences keep complete Python examples together, including indented lines.
 if(raw.includes('```python')){
  const pieces=raw.split(/```python\s*\n|\n```/);
  return pieces.map((piece,i)=>i%2===1
    ? '<div class="quiz-code-window"><div class="quiz-code-head"><span class="quiz-code-dot"></span><span>Python</span></div><pre><code>'+escapeHTML(piece.replace(/\n+$/,''))+'</code></pre></div>'
    : piece.split('\n').filter((line,j,arr)=>line||j<arr.length-1).map(line=>'<div class="quiz-question-line">'+(line?escapeHTML(line):'&nbsp;')+'</div>').join('')
  ).join('');
 }
 const lines=raw.split('\n');
 const looksCode=line=>!/[\u0530-\u058F]/.test(line.replace(/^\s*#.*$/,'')) && /^\s*(?:>>>|print\s*\(|input\s*\(|(?:async\s+)?def\s+|if\s+|elif\s+|else\s*:|for\s+|while\s+|return\b|import\s+|from\s+|#|[A-Za-z_]\w*\s*(?:=|\+=|-=)|[A-Za-z_]\w*\s*\(|[\[\]{}()0-9*+\-=/%]+\s*$)/.test(line);
 let out='',code=[];
 const flush=()=>{if(code.length){out+='<div class="quiz-code-window"><div class="quiz-code-head"><span class="quiz-code-dot"></span><span>Python</span></div><pre><code>'+escapeHTML(code.join('\n'))+'</code></pre></div>';code=[]}};
 for(let i=0;i<lines.length;i++){const line=lines[i];if(looksCode(line)){code.push(line)}else if(!line.trim()&&code.length&&lines.slice(i+1).some(next=>next.trim())){const nextNonblank=lines.slice(i+1).find(next=>next.trim());if(looksCode(nextNonblank)){code.push(line)}else{flush();out+='<div class="quiz-question-line">&nbsp;</div>'}}else{flush();out+='<div class="quiz-question-line">'+(line?escapeHTML(line):'&nbsp;')+'</div>'}}flush();
 return out;
}

let DATA={lessons:[],bugs:[],drag:[],flashcards:[],chat:[],closingSection:{body:''}};
const storageKey='python-academy-v1';
let progress;try{progress=JSON.parse(localStorage.getItem(storageKey))||{}}catch{progress={}};
progress.done??={};progress.theme??='dark';progress.drafts??={};progress.last??={route:'lessons',lesson:0,problemLesson:0,problemIndex:0};
let SOLUTIONS={};
let state={lesson:0,quizLesson:0,quizStep:0,quizAnswers:[],problemLesson:0,problemIndex:0,bug:0,drag:0,dragSelected:[],dragCheck:false,quizFinished:false,code:'',output:'',error:false,bugCode:'',bugOutput:'',bugChecked:false,solutionOpen:false,runStatus:'',inputText:'',pyReady:false};
const xpFor={lesson:20,quiz:30,problem:15,bug:10,drag:10};
const totalActions=()=>DATA.lessons.length*2+DATA.lessons.reduce((s,l)=>s+l.tasks.length,0)+DATA.bugs.length+DATA.drag.length;
const doneCount=()=>Object.keys(progress.done).filter(k=>progress.done[k]).length;
const totalXP=()=>Object.entries(progress.done).reduce((n,[key,done])=>n+(done?xpFor[key.split(':')[0]]||0:0),0);
const maxXP=()=>DATA.lessons.length*(20+30)+DATA.lessons.reduce((s,l)=>s+l.tasks.length*15,0)+DATA.bugs.length*10+DATA.drag.length*10;
const percent=()=>totalActions()?Math.min(100,Math.round(doneCount()/totalActions()*100)):0;
function save(){try{localStorage.setItem(storageKey,JSON.stringify(progress))}catch(e){console.warn('Storage unavailable',e)}updateHeader()}
function draftKey(){return state.problemLesson+'-'+state.problemIndex}
function storeDraft(){const el=$('#problemCode');if(el){state.code=el.value;progress.drafts[draftKey()]=state.code;save()}}
function loadDraft(){state.code=progress.drafts[draftKey()]||'';state.output='';state.error=false}
function remember(route){if(['lessons','playground','quizzes'].includes(route)){progress.last={route,lesson:state.lesson,problemLesson:state.problemLesson,problemIndex:state.problemIndex,quizLesson:state.quizLesson};save()}}
function earn(kind,id){const key=kind+':'+id;if(progress.done[key])return false;progress.done[key]=true;save();foxXP(xpFor[kind]);return true}
function foxXP(amount){
  const message=`+${amount} XP Շնորհավո՜ր`;
  // XP awards come from the fox, not the global toast.
  const bubble=document.getElementById('foxXpBubble');
  if(bubble){
    bubble.textContent=message;
    bubble.classList.remove('show');
    void bubble.offsetWidth;
    bubble.classList.add('show');
    clearTimeout(foxXP.timer);
    foxXP.timer=setTimeout(()=>bubble.classList.remove('show'),4000);
  }
}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),3000)}
function updateHeader(){$('#xpHeader').textContent=`${totalXP()} XP`}
function theme(){
  document.body.classList.toggle('light', progress.theme === 'light');
  const button = $('#themeBtn');
  if (!button) return;
  button.innerHTML = `<span class="theme-symbol" aria-hidden="true">${progress.theme === 'light' ? '☀' : '☾'}</span>`;
  button.setAttribute('aria-label', progress.theme === 'light' ? 'Միացնել մութ ռեժիմը' : 'Միացնել բաց ռեժիմը');
}
function section(title,desc='',extra=''){return `<div class="page-heading"><h1>${title}</h1><p>${desc}</p></div>`}
function lessonName(i){return DATA.lessons[i]?.title||''}
function lessonOptions(selected){return DATA.lessons.map((l,i)=>`<option value="${i}" ${i===selected?'selected':''}>${escapeHTML(l.id+' · '+l.title)}</option>`).join('')}
function headerLink(route,label,klass=''){return `<a class="btn ${klass}" href="#${route}">${label}</a>`}
function currentRank(){const p=percent();return Math.min(4,Math.floor(p/20))}
const ranks=['Սկսնակ','Հետազոտող','Գիտակ','Վարպետ','Լեգենդ'];
function home(){const last=progress.last||{};const resume=last.route==='playground'?`playground/${last.problemLesson||0}`:last.route==='quizzes'?`quizzes/${last.quizLesson||0}`:`lessons/${last.lesson||0}`;const stats=[['17','տեսական դաս'],['170','քուիզային հարց'],[String(DATA.lessons.reduce((a,l)=>a+l.tasks.length,0)),'գործնական խնդիր'],['110','ինտերակտիվ առաջադրանք']];const features=[['book-open','Lessons','Սովորի՛ր քայլ առ քայլ','lessons'],['code','Playground','Լուծի՛ր ծրագրավորման խնդիրներ','playground'],['list-checks','Quizzes','Ստուգի՛ր գիտելիքներդ թեստերով','quizzes'],['layers','Flashcards','48 շրջվող քարտ՝ արագ կրկնության համար','flashcards'],['bug','Find the Bug','Գտի՛ր և ուղղի՛ր կոդի սխալները','bugs'],['workflow','Drag & Drop','Դասավորի՛ր կոդի տողերը','drag'],['map','Roadmap','Հետևի՛ր քո առաջընթացին','roadmap']];return `<div class="hero"><div class="hero-copy"><h1>Բարի գալուստ <span class="gradient">Python Academy!</span></h1><p>Այստեղ միասին հաստատուն ու ամուր քայլեր կանենք ծրագրավորման աշխարհում, կբացահայտենք Python-ի գաղտնիքներն ու կսովորենք կոդի միջոցով կյանքի կոչել մեր գաղափարները։</p><div class="hero-buttons">${headerLink('lessons/0','Սկսել ուսուցումը <i data-lucide="arrow-right" class="ui-icon" aria-hidden="true"></i>')}</div></div><div class="hero-showcase" aria-label="Python Academy կոդի օրինակ"><div class="showcase-glow"></div><div class="showcase-window"><div class="showcase-title"><span class="mac-dots"><i></i><i></i><i></i></span><span>hello_python.py</span></div><div class="showcase-code"><div><em>01</em><span class="syntax-pink">name</span> = <span class="syntax-green">"Python Academy"</span></div><div><em>02</em><span class="syntax-purple">for</span> level <span class="syntax-purple">in</span> <span class="syntax-blue">range</span>(<span class="syntax-orange">1</span>, <span class="syntax-orange">4</span>):</div><div><em>03</em>    <span class="syntax-blue">print</span>(<span class="syntax-green">"Keep learning!"</span>)</div><div><em>04</em><span class="syntax-muted"># learn · code · create</span></div></div><div class="showcase-output"><span class="showcase-prompt">›</span> Keep learning!<br><span class="showcase-prompt">›</span> Keep learning!<br><span class="showcase-prompt">›</span> Keep learning!<span class="showcase-cursor"></span></div></div></div></div><div class="section-head"><div><h2>Ուսումնական հարթակը՝ թվերով</h2></div></div><div class="stats">${stats.map(([n,t])=>`<div class="card"><div class="stat-number">${n}</div><div class="stat-label">${t}</div></div>`).join('')}</div><div class="section-head"><div><h2>Ընտրի՛ր քո հաջորդ քայլը</h2></div></div><div class="feature-grid">${features.map(([icon,name,desc,route])=>`<a href="#${route}" class="card feature-card"><span class="feature-icon"><i data-lucide="${icon}"></i></span><h3>${name} <i data-lucide="arrow-up-right" class="ui-icon" aria-hidden="true"></i></h3><p>${desc}</p></a>`).join('')}</div>`}
function decorateArticle(raw){let html=window.marked?marked.parse(raw,{breaks:false}):escapeHTML(raw).replace(/\n\n/g,'<p></p>');if(window.DOMPurify)html=DOMPurify.sanitize(html);html=html.replace(/<pre><code(?: class="language-python")?>([\s\S]*?)<\/code><\/pre>/g,(_,code)=>`<div class="codebox"><div class="codebox-head"><span>Python</span></div><pre><code>${code}</code></pre></div>`);return html}
function lessons(){const l=DATA.lessons[state.lesson];let group='';const sidebar=DATA.lessons.map((item,i)=>{const g=item.id.split('.')[0];let h='';if(g!==group){group=g;h=`<div class="side-title">${['','01 · Python-ի հիմունքներ','02 · Ծրագրի ընթացքի կառավարում','03 · Տվյալների կառուցվածքներ','04 · Կոդի կազմակերպում','05 · Ալգորիթմներ'][+g]||'Թեմա '+g}</div>`}return h+`<a class="lesson-btn ${i===state.lesson?'active':''}" href="#lessons/${i}" data-lesson="${i}">${escapeHTML(item.id+' '+item.title)} ${progress.done['lesson:'+i]?'<span class="tick"><i data-lucide="check" class="ui-icon" aria-hidden="true"></i></span>':''}</a>`}).join('');const done=!!progress.done['lesson:'+state.lesson];if(state.lesson===17){return `${section('Տեսական դասեր')}<div class="workspace"><aside class="panel sidebar">${sidebar}<div class="side-title">06 · Ավարտական խոսք</div><a class="lesson-btn active" href="#lessons/17" data-lesson="17">6. Սա դեռ միայն սկիզբն է</a></aside><article class="panel closing-lesson"><span class="tag">Բաժին 6 · Ավարտական խոսք</span><h2>Սա դեռ միայն սկիզբն է</h2><div class="article closing-prose">${decorateArticle(DATA.closingSection.body)}</div><div class="closing-signature">Python Academy <span> - սովորի՛ր, փորձի՛ր, ստեղծի՛ր։</span></div><div class="actions"><button class="btn ghost" id="prevLesson"><i data-lucide="arrow-left" class="ui-icon" aria-hidden="true"></i> Նախորդ դաս</button>${headerLink('roadmap','Տեսնել ճանապարհային քարտեզը','secondary')}</div></article></div>`}return `${section('Տեսական դասեր')}<div class="workspace"><aside class="panel sidebar">${sidebar}<div class="side-title">06 · Ավարտական խոսք</div><a class="lesson-btn" href="#lessons/17" data-lesson="17">6. Սա դեռ միայն սկիզբն է</a></aside><article class="panel"><span class="tag">Դաս ${state.lesson+1} / 17</span><h2 style="margin:14px 0 25px">${escapeHTML(l.title)}</h2><div class="article">${decorateArticle(l.body)}</div><div class="article-end"><h3>${done?'<i data-lucide="check-circle-2" class="ui-icon" aria-hidden="true"></i> Դասն արդեն ավարտված է':'Ավարտեցի՞ր կարդալը'}</h3><p class="muted">${done?'Դու արդեն ստացել ես այս դասի XP-ն։ Հաջորդը՝ փորձարկում կամ քուիզ։':'Հաստատի՛ր, որ կարդացել ես նյութը, և ստացի՛ր +20 XP։'}</p><div class="actions"><button class="btn" id="completeLesson" ${done?'disabled':''}>${done?'Կարդացել եմ':'Կարդացել եմ'}</button>${headerLink('quizzes/'+state.lesson,'Անցնել թեմայի քուիզին','secondary')}${headerLink('playground/'+state.lesson,'Լուծել թեմայի խնդիրները','secondary')}</div></div><div class="actions"><button class="btn ghost" id="prevLesson" ${state.lesson===0?'disabled':''}><i data-lucide="arrow-left" class="ui-icon" aria-hidden="true"></i> Նախորդ դաս</button><button class="btn ghost" id="nextLesson" ${state.lesson===17?'disabled':''}>Հաջորդ դաս <i data-lucide="arrow-right" class="ui-icon" aria-hidden="true"></i></button></div></article></div>`}
function quiz(){const l=DATA.lessons[state.quizLesson],q=l.quiz;if(state.quizFinished){const score=state.quizAnswers.filter((a,i)=>a===q[i].correct).length;return `${section('Քուիզի արդյունքները','Տե՛ս՝ որ հարցերին ես ճիշտ պատասխանել, և որտեղ կարող ես բարելավել արդյունքդ։')}<div class="panel quiz-shell quiz-results"><div class="quiz-result-hero"><span class="eyebrow">${escapeHTML(l.title)}</span><div class="quiz-result-score" aria-label="${score} ճիշտ պատասխան 10-ից"><span>${score}</span><span class="quiz-result-divider">/</span><span>10</span></div><p class="muted">${score===10?'Հրաշալի է․ բոլոր պատասխանները ճիշտ են։':score>=7?'Շատ լավ արդյունք է։ Դիտարկի՛ր նաև սխալ պատասխանները։':'Յուրաքանչյուր փորձ քեզ օգնում է սովորել։'}</p><div class="quiz-result-progress" aria-hidden="true"><div style="--quiz-score:${score*10}%"></div></div></div><h3 class="quiz-result-heading">Քո պատասխանները</h3><div class="quiz-review-list">${q.map((x,i)=>{const selected=state.quizAnswers[i],correct=selected===x.correct;return `<div class="quiz-review-row ${correct?'is-correct':'is-wrong'}" style="--review-order:${i}" ><div class="quiz-review-top"><span class="quiz-review-number">${i+1}</span><span class="quiz-review-status">${correct?'✓ Ճիշտ':'✕ Սխալ'}</span></div><div class="quiz-review-question">${quizQuestion(x.text)}</div><div class="quiz-review-answers">${!correct?`<div class="quiz-review-selected">Քո պատասխանը՝ ${selected===undefined?'Չես պատասխանել':`${'ABCD'[selected]}) ${plainQuizOption(x.options[selected])}`}</div>`:''}<div class="quiz-review-right">Ճիշտ պատասխանը՝ ${'ABCD'[x.correct]}) ${plainQuizOption(x.options[x.correct])}</div></div></div>`}).join('')}</div><div class="actions"><button class="btn" id="retryQuiz">Կրկնել քուիզը</button>${state.quizLesson<DATA.lessons.length-1?`<button class="btn" id="nextTopicQuiz">Հաջորդ թեմայի քուիզը <i data-lucide="arrow-right" class="ui-icon" aria-hidden="true"></i></button>`:''}${headerLink('lessons/'+state.quizLesson,'Վերադառնալ դասին','secondary')}</div></div>`}const item=q[state.quizStep];return `${section('Quizzes','Կարդա՛ յուրաքանչյուր հարցը և ընտրի՛ր մեկ ճիշտ պատասխան։ Յուրաքանչյուր հարց ունի 4 տարբերակ։')}<div class="quiz-shell"><div class="panel"><div class="quiz-topic-field"><span class="eyebrow">Ընտրի՛ր թեման</span><button type="button" class="quiz-topic-trigger" id="quizTopicToggle" aria-expanded="false" aria-controls="quizTopicList"><span>${escapeHTML(l.id+" · "+l.title)}</span><i data-lucide="chevron-down" aria-hidden="true"></i></button><div class="quiz-topic-list" id="quizTopicList" hidden role="group" aria-label="Քուիզի թեմաներ">${DATA.lessons.map((topic,i)=>`<button type="button" class="quiz-topic-item ${i===state.quizLesson?"current":""}" data-quiz-topic="${i}" ${i===state.quizLesson?"aria-current":""}>${escapeHTML(topic.id+" · "+topic.title)}</button>`).join("")}</div></div><div style="display:flex;justify-content:space-between;margin-top:28px"><span class="pill">Հարց ${state.quizStep+1} / 10</span></div><div class="quiz-progress"><div style="width:${(state.quizStep+1)*10}%"></div></div><div class="quiz-question-content">${quizQuestion(item.text)}</div>${item.options.map((o,i)=>`<button class="option ${state.quizAnswers[state.quizStep]===i?'selected':''}" data-answer="${i}"><b>${'ABCD'[i]}</b><span>${plainQuizOption(o)}</span></button>`).join('')}<div class="actions" style="justify-content:space-between"><button class="btn ghost" id="quizPrev" ${state.quizStep===0?'disabled':''}><i data-lucide="arrow-left" class="ui-icon" aria-hidden="true"></i> Նախորդը</button><button class="btn" id="quizNext" ${state.quizAnswers[state.quizStep]===undefined?'disabled':''}>${state.quizStep===9?'Ավարտել և ստուգել':'Հաջորդ հարցը <i data-lucide="arrow-right" class="ui-icon" aria-hidden="true"></i>'}</button></div><div class="actions quiz-exit-actions"><a class="btn ghost" href="#lessons/${state.quizLesson}">Դուրս գալ թեստից</a></div></div></div>`}
function problem(){const l=DATA.lessons[state.problemLesson];const task=l.tasks[state.problemIndex];const key=`${state.problemLesson}-${state.problemIndex}`;return `${section('Python Playground','Լուծի՛ր առաջադրանքը Python-ով և անմիջապես այստեղ տես քո կոդի արդյունքը։')}<div class="workspace playground-workspace"><aside class="panel sidebar problem-sidebar" id="problemSidebar"><div class="problem-topic-field"><span class="eyebrow">Ընտրի՛ր թեման</span><button type="button" class="quiz-topic-trigger" id="problemTopicToggle" aria-expanded="false" aria-controls="problemTopicList"><span>${escapeHTML(l.id+" · "+l.title)}</span><i data-lucide="chevron-down" aria-hidden="true"></i></button><div class="quiz-topic-list" id="problemTopicList" hidden role="group" aria-label="Խնդիրների թեմաներ">${DATA.lessons.map((topic,i)=>`<button type="button" class="quiz-topic-item ${i===state.problemLesson?"current":""}" data-problem-topic="${i}" ${i===state.problemLesson?"aria-current":""}>${escapeHTML(topic.id+" · "+topic.title)}</button>`).join("")}</div></div><div class="side-title">ԽՆԴԻՐՆԵՐ</div><div class="task-list">${l.tasks.map((t,i)=>`<button class="task-btn ${i===state.problemIndex?'active':''}" data-problem="${i}">Խնդիր ${i+1}${progress.done['problem:'+state.problemLesson+'-'+i]?'<span class="task-complete-mark" aria-label="Ավարտված է"><i data-lucide="check" class="ui-icon" aria-hidden="true"></i></span>':''}</button>`).join('')}</div></aside><div><div class="panel"><div class="problem-heading-row"><div class="eyebrow">ԽՆԴԻՐ ${state.problemIndex+1} / ${l.tasks.length}</div><button type="button" class="btn ghost task-list-toggle" id="toggleTasks" aria-controls="problemSidebar" aria-expanded="false"><i data-lucide="list" class="ui-icon" aria-hidden="true"></i> Խնդիրների ցանկ</button></div><h2 style="font-size:21px;margin:10px 0">${escapeHTML(String(task??'')).replace(/\r\n?/g,'\n').replace(/\n/g,'<br>')}</h2></div><div class="panel" style="margin-top:16px"><div class="playground-panes"><div class="mac-window code-pane"><div class="mac-title"><span class="traffic"><i></i><i></i><i></i></span><span>main.py</span></div><textarea class="editor" id="problemCode" spellcheck="false" aria-label="Python կոդի խմբագրիչ" placeholder="# Գրի՛ր քո Python կոդը այստեղ">${escapeHTML(state.code)}</textarea></div><div class="mac-window output-pane"><div class="mac-title"><span class="traffic"><i></i><i></i><i></i></span><span>Output</span></div><pre class="output ${state.error?'error':''}" id="problemOutput">${escapeHTML(state.output||'Արդյունքը կհայտնվի այստեղ…')}</pre></div></div><div class="actions"><button class="btn" id="runProblem">▶ Գործարկել</button><button class="btn secondary" id="checkProblem" ${progress.done['problem:'+key]?'disabled':''}>${progress.done['problem:'+key]?'Լուծված է':'Լուծել եմ'}</button><button class="btn ghost" id="nextProblem">Հաջորդ խնդիրը →</button></div><div id="problemFeedback" class="mini-info" style="margin-top:10px">${escapeHTML(state.runStatus)}</div><div class="example-solution"><button type="button" class="btn ghost example-toggle" id="toggleExampleSolution" aria-expanded="${state.solutionOpen}" aria-controls="exampleSolutionPanel"><i data-lucide="code-2" class="ui-icon" aria-hidden="true"></i> ${state.solutionOpen?'Թաքցնել ճիշտ պատասխանը':'Տեսնել ճիշտ պատասխանը'} <i data-lucide="chevron-down" class="ui-icon" aria-hidden="true"></i></button><div class="example-solution-panel" id="exampleSolutionPanel" ${state.solutionOpen?'':'hidden'}><div class="example-solution-label">Python</div><pre class="example-solution-code"><code>${escapeHTML(SOLUTIONS[l.id]?.[state.problemIndex]||'Լուծումը հասանելի չէ։')}</code></pre><p class="muted example-solution-note">Սա հնարավոր ճիշտ լուծումներից մեկն է։ Փորձի՛ր նախ ինքնուրույն լուծել խնդիրը։</p></div></div></div></div></div>`}
function bugs(){const b=DATA.bugs[state.bug];return `${section('Find the Bug','Գտի՛ր սխալը և ուղղի՛ր այն անմիջապես կոդի մեջ։')}<div class="workspace"><aside class="panel sidebar"><div class="side-title">ԽՆԴԻՐՆԵՐ</div>${DATA.bugs.map((x,i)=>`<button class="task-btn ${i===state.bug?'active':''}" data-bug="${i}">Խնդիր ${i+1}${progress.done['bug:'+i]?'<span class="task-complete-mark" aria-label="Ավարտված է"><i data-lucide="check" class="ui-icon" aria-hidden="true"></i></span>':''}</button>`).join('')}</aside><div class="panel"><div class="eyebrow">BUG ${state.bug+1} / 30</div><h2 style="margin:10px 0 20px">Գտի՛ր և ուղղի՛ր սխալը</h2><textarea class="editor" id="bugCode" spellcheck="false">${escapeHTML(state.bugCode||b.code)}</textarea><div class="actions"><button class="btn secondary" id="checkBug"><i data-lucide="sparkles" class="ui-icon action-symbol" aria-hidden="true"></i> Ստուգել լուծումը</button><button class="btn ghost" id="resetBug"><i data-lucide="rotate-ccw" class="ui-icon action-symbol" aria-hidden="true"></i> Վերականգնել</button><button class="btn ghost" id="nextBug">Հաջորդ խնդիրը →</button></div><div id="bugFeedback" class="mini-info" style="margin-top:12px"></div></div></div>`}
function drag(){const d=DATA.drag[state.drag];const used=state.dragSelected;return `${section('Drag & Drop Syntax','Քաշի՛ր տողերը ներքևի դաշտ՝ ճիշտ հերթականությամբ։')}<div class="workspace"><aside class="panel sidebar"><div class="side-title">ԱՌԱՋԱԴՐԱՆՔՆԵՐ</div>${DATA.drag.map((x,i)=>`<button class="task-btn ${i===state.drag?'active':''}" data-drag="${i}">Առաջադրանք ${i+1}${progress.done['drag:'+i]?'<span class="task-complete-mark" aria-label="Ավարտված է"><i data-lucide="check" class="ui-icon" aria-hidden="true"></i></span>':''}</button>`).join('')}</aside><div class="panel"><span class="tag">Առաջադրանք ${state.drag+1} / 30</span><h3 style="margin:18px 0 8px">Խառնված տողեր</h3><div class="drag-source" data-drop-zone="source">${d.lines.map((line,i)=>`<div class="code-line drag-row ${used.includes(i)?'used':''}" draggable="false" data-drag-line="${i}" data-drag-from="source" ${used.includes(i)?'aria-disabled="true"':''}><span class="drag-handle" aria-hidden="true">⠿</span><span>${escapeHTML(line)}</span></div>`).join('')}</div><h3 style="margin:26px 0 12px">Քո հավաքած ծրագիրը <span class="muted" style="font-size:12px">${used.length}/${d.lines.length}</span></h3><div class="build-area drag-target" data-drop-zone="build">${used.length?used.map((idx,i)=>`<div class="code-line drag-row" draggable="false" data-drag-line="${idx}" data-drag-from="build" data-drag-position="${i}"><span class="drag-handle" aria-hidden="true">⠿</span><span>${escapeHTML(d.lines[idx])}</span><button class="drag-remove" data-remove="${i}" title="Հեռացնել տողը" aria-label="Հեռացնել տողը">×</button></div>`).join(''):'<div class="empty">Քաշի՛ր տողերն այստեղ</div>'}</div><div class="actions"><button class="btn" id="checkDrag" ${used.length!==d.lines.length?'disabled':''}><i data-lucide="sparkles" class="ui-icon action-symbol" aria-hidden="true"></i> Ստուգել</button><button class="btn secondary" id="resetDrag"><i data-lucide="rotate-ccw" class="ui-icon" aria-hidden="true"></i> Սկսել նորից</button><button class="btn ghost" id="nextDrag">Հաջորդը <i data-lucide="arrow-right" class="ui-icon" aria-hidden="true"></i></button></div><div id="dragFeedback" class="helper" style="${state.dragCheck?'':'display:none'}">${state.dragCheck==='correct'?'Ճիշտ է։ Ծրագիրը հավաքված է։':state.dragCheck==='checking'?'Ստուգվում է Python-ով…':state.dragCheck==='error'?'Չհաջողվեց ստուգել պատասխանը։ Փորձի՛ր կրկին։':'Հերթականությունը դեռ ճիշտ չէ։ Փորձի՛ր նորից։'}</div></div></div>`}
function moveDragLine(from,index,to,position){if(from==='source'){if(state.dragSelected.includes(index))return; if(to==='build')state.dragSelected.splice(position,0,index)}else{const current=state.dragSelected.indexOf(index);if(current<0)return;state.dragSelected.splice(current,1);if(to==='build'){if(current<position)position--;state.dragSelected.splice(Math.max(0,position),0,index)}}state.dragCheck=false;render()}
function dragInsertion(zone,y){const rows=[...zone.querySelectorAll('.drag-row:not(.dragging)')];for(let i=0;i<rows.length;i++){const r=rows[i].getBoundingClientRect();if(y<r.top+r.height/2)return i}return rows.length}
function setupDragInteractions(){
  // One pointer-driven implementation for mouse, trackpad, touch and pen.
  // Avoid native HTML5 drag events (notably unreliable for drop zones in Safari).
  let active=null, ghost=null;
  const cleanup=()=>{
    document.querySelectorAll('.drag-over,.dragging').forEach(el=>el.classList.remove('drag-over','dragging'));
    if(ghost){ghost.remove();ghost=null}
    active=null;
  };
  document.addEventListener('pointerdown',e=>{
    if(e.button!==0||e.target.closest('button'))return;
    const row=e.target.closest('[data-drag-line][draggable="false"]');
    if(!row||!row.closest('[data-drop-zone]'))return;
    active={id:e.pointerId,x:e.clientX,y:e.clientY,row,from:row.dataset.dragFrom,index:Number(row.dataset.dragLine),started:false};
  });
  document.addEventListener('pointermove',e=>{
    if(!active||e.pointerId!==active.id)return;
    if(!active.started&&Math.hypot(e.clientX-active.x,e.clientY-active.y)<6)return;
    if(!active.started){
      active.started=true;
      ghost=active.row.cloneNode(true);
      ghost.removeAttribute('draggable');
      ghost.classList.add('drag-touch-ghost');
      document.body.appendChild(ghost);
      active.row.classList.add('dragging');
    }
    e.preventDefault();
    ghost.style.left=(e.clientX+12)+'px';
    ghost.style.top=(e.clientY+12)+'px';
    document.querySelectorAll('.drag-over').forEach(el=>el.classList.remove('drag-over'));
    const zone=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-drop-zone]');
    if(zone)zone.classList.add('drag-over');
  },{passive:false});
  document.addEventListener('pointerup',e=>{
    if(!active||e.pointerId!==active.id)return;
    const info=active;
    const zone=info.started?document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-drop-zone]'):null;
    const position=zone?dragInsertion(zone,e.clientY):0;
    cleanup();
    if(zone)moveDragLine(info.from,info.index,zone.dataset.dropZone,position);
  });
  document.addEventListener('pointercancel',cleanup);
  document.addEventListener('dragstart',e=>{
    if(e.target.closest('[data-drag-line]'))e.preventDefault();
  });
}

function checkDragOrder(){const d=DATA.drag[state.drag];if(state.dragSelected.length!==d.lines.length)return false;return state.dragSelected.join(',')===d.order.join(',')}
// Each task now has a single intended ordering. No network or Python runtime required.
function checkDragSolution(taskIndex,selected){
 const d=DATA.drag[taskIndex];
 return selected.length===d.order.length && selected.every((line,i)=>line===d.order[i]);
}

function flashcards(){return `${section('Flashcards','Այստեղ ներկայացված են Python-ի հիմնական հասկացությունները։ Սեղմի՛ր քարտերից յուրաքանչյուրին բացատրությունը տեսնելու համար։')}<div class="flash-grid">${DATA.flashcards.map((c,i)=>`<div class="flash" tabindex="0" role="button" aria-label="Շրջել ${escapeHTML(c.term)} քարտը" data-flash="${i}"><div class="flash-inner"><div class="flash-face"><strong>${escapeHTML(c.term)}</strong></div><div class="flash-face flash-back"><span style="font-size:25px;margin-bottom:12px"></span><b>${escapeHTML(c.meaning)}</b></div></div></div>`).join('')}</div>`}

// Liquid trophy: water height follows earned XP, not only task count.
function liquidTrophySvg(level){
 const pct=Math.max(0,Math.min(100,Number(level)||0));
 const displayPct=Math.max(12,pct); // Visual minimum only; XP and displayed progress remain accurate.
 const y=218-1.34*displayPct;
 return `<svg class="liquid-trophy-svg" viewBox="0 0 380 400" role="img" aria-label="Գավաթը լցված է ${Math.round(pct)} տոկոսով" xmlns="http://www.w3.org/2000/svg">
 <defs>
 <linearGradient id="trophyMetal" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#636a79"/><stop offset=".19" stop-color="#edf3fa"/><stop offset=".46" stop-color="#929dad"/><stop offset=".7" stop-color="#f3f7fc"/><stop offset="1" stop-color="#596476"/></linearGradient>
 <linearGradient id="trophyWater" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#b8a8ee"/><stop offset="1" stop-color="#6d81b6"/></linearGradient>
 <clipPath id="trophyBowlClip"><path d="M112 85 Q111 179 171 222 H209 Q269 179 268 85 Q190 104 112 85Z"/></clipPath>
 </defs>
 <path d="M115 85 C60 62 49 121 86 158 C100 172 113 168 125 156 M265 85 C320 62 331 121 294 158 C280 172 267 168 255 156" fill="none" stroke="url(#trophyMetal)" stroke-width="16"/>
 <path d="M103 75 Q100 185 167 230 L213 230 Q280 185 277 75 Q190 95 103 75Z" fill="url(#trophyMetal)" stroke="#8994a5" stroke-width="4"/>
 <g clip-path="url(#trophyBowlClip)">
 <rect x="95" y="${y.toFixed(2)}" width="190" height="240" fill="url(#trophyWater)" opacity=".85"/>
 <g class="trophy-wave"><path d="M80 ${y.toFixed(2)} Q105 ${(y-7).toFixed(2)} 130 ${y.toFixed(2)} T230 ${y.toFixed(2)} T330 ${y.toFixed(2)} V${(y+24).toFixed(2)} H80Z" fill="#d7d0ff" opacity=".85"/></g>
 <g class="trophy-wave trophy-wave-back"><path d="M60 ${(y+3).toFixed(2)} Q85 ${(y+12).toFixed(2)} 110 ${(y+3).toFixed(2)} T210 ${(y+3).toFixed(2)} T310 ${(y+3).toFixed(2)} V${(y+30).toFixed(2)} H60Z" fill="#7b94c9" opacity=".4"/></g>
 </g>
 <ellipse cx="190" cy="75" rx="86" ry="16" fill="#dce5ee" stroke="#727d8b" stroke-width="4"/>
 <ellipse cx="190" cy="75" rx="78" ry="9" fill="#42495b" stroke="#e3ebf5" stroke-width="3"/>
 <path d="M181 230 L199 230 L203 275 Q208 284 229 290 L151 290 Q172 284 177 275Z" fill="url(#trophyMetal)" stroke="#727b88" stroke-width="3"/>
 <ellipse cx="190" cy="290" rx="56" ry="12" fill="#b2bbc8"/>
 <path d="M143 294 H237 L246 318 H134Z" fill="url(#trophyMetal)" stroke="#647083" stroke-width="3"/>
 <path d="M116 320 H264 L274 354 H106Z" fill="#5d6575" stroke="#434a57" stroke-width="4"/>
 <path d="M100 354 H280 L288 370 H92Z" fill="#303846" stroke="#687286" stroke-width="3"/>
 <rect x="146" y="329" width="88" height="24" rx="3" fill="#dce5f0" stroke="#7c8796" stroke-width="3"/>
 <path d="M125 104 Q129 170 167 199" fill="none" stroke="#fff" stroke-opacity=".42" stroke-width="8" stroke-linecap="round"/>
 </svg>`;
}

function roadmap(){const p=percent(),rank=currentRank(),max=maxXP(),waterPct=max?Math.min(100,totalXP()/max*100):0;const parts=[['Դասեր',DATA.lessons.length,DATA.lessons.filter((l,i)=>progress.done['lesson:'+i]).length,'lessons'],['Քուիզեր',DATA.lessons.length,DATA.lessons.filter((l,i)=>progress.done['quiz:'+i]).length,'quizzes'],['Գործնական խնդիրներ',DATA.lessons.reduce((n,l)=>n+l.tasks.length,0),Object.keys(progress.done).filter(k=>k.startsWith('problem:')).length,'playground'],['Find the Bug',30,Object.keys(progress.done).filter(k=>k.startsWith('bug:')).length,'bugs'],['Drag & Drop',30,Object.keys(progress.done).filter(k=>k.startsWith('drag:')).length,'drag']];return `${section('Roadmap to the Trophy','Յուրաքանչյուր ավարտված քայլ մոտեցնում է քեզ գլխավոր մրցանակին։')}<div class="roadmap-top"><div class="panel trophy-panel"><div class="trophy-icon ${p===100?'unlocked':''}">${liquidTrophySvg(waterPct)}</div><div class="big-percent">${p}%</div><p class="muted">${p===100?'Շնորհավորո՜ւմ ենք։':'Գավաթը լցվում է հավաքած XP-ին համընթաց։'}</p><div class="progress-track"><div style="width:${p}%"></div></div></div><div class="panel"><span class="eyebrow">ՔՈ ՁԵՌՔԲԵՐՈՒՄՆԵՐԸ</span><h2 style="margin:14px 0">${ranks[rank]}</h2><div class="big-percent" style="font-size:38px">${totalXP()} <span style="font-size:17px">XP</span></div><div class="rank-milestone-track" aria-label="Կոչումների առաջընթացի գիծ"><div class="progress-track"><div style="width:${Math.min(100,totalXP()/max*100)}%"></div></div>${ranks.slice(1).map((r,i)=>`<span class="rank-milestone ${p >= (i+1)*20 ? 'reached' : ''}" style="left:${(i+1)*20}%" title="${r} · ${(i+1)*20}%" aria-label="${r}՝ ${(i+1)*20}%"><span class="rank-milestone-arrow" aria-hidden="true"></span><span class="rank-milestone-name">${r}</span></span>`).join('')}</div><h3 style="margin:26px 0 14px">Կոչումներ</h3><div class="rank-grid" style="grid-template-columns:repeat(5,1fr);gap:7px">${ranks.map((r,i)=>`<div class="card rank ${i>rank?'locked':''} ${i===rank?'active':''}" style="padding:12px 4px"><div class="rank-roman" aria-label="Rank ${i+1}">${["I","II","III","IV","V"][i]}</div><div style="font-size:10px;font-weight:800">${r}</div></div>`).join('')}</div></div></div><div class="section-head"><h2>Քո ճանապարհային քարտեզը</h2></div><div class="panel">${parts.map(([label,total,done,route],i)=>`<a href="#${route}" class="road-step"><span class="step-circle ${done===total?'done':done>0?'current':''}">${done===total?'<i data-lucide="check" class="ui-icon" aria-hidden="true"></i>':i+1}</span><span style="flex:1"><b>${label}</b><span class="mini-info" style="display:block">${done} / ${total} ավարտված</span><div class="progress-track" style="margin:6px 0"><div style="width:${total?done/total*100:0}%"></div></div></span><span><i data-lucide="arrow-right" class="ui-icon" aria-hidden="true"></i></span></a>`).join('')}</div><p class="muted" style="margin-top:15px">Առաջընթացը պահվում է միայն այս բրաուզերում։ Եթե մաքրես կայքի տվյալները, այն կարող է կորչել։</p>`}
let pyPromise=null;
async function getPython(){if(!pyPromise){pyPromise=(async()=>{if(!window.loadPyodide)throw new Error('Python միջավայրի գրադարանը չի բեռնվել։ Ստուգի՛ր ինտերնետ կապը։');const py=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'});return py})()}return pyPromise}
async function runPython(code, inputs = '') {
  const py = await getPython();
  // Capture stdout in Python itself: Pyodide's batched stdout can omit
  // short/unterminated output, particularly when users run snippets repeatedly.
  py.globals.set('academy_user_code', String(code));
  py.globals.set('academy_input_json', JSON.stringify(String(inputs).split('\n')));
  const runner = `import io, json, traceback, contextlib, builtins
_output = io.StringIO()
_input_lines = iter(json.loads(academy_input_json))
_original_input = builtins.input
def _academy_input(prompt=''):
    print(prompt, end='')
    try:
        return next(_input_lines)
    except StopIteration:
        raise EOFError('Ծրագիրը պահանջում է լրացուցիչ input() տվյալներ։')
_result = {'ok': True, 'text': ''}
try:
    builtins.input = _academy_input
    with contextlib.redirect_stdout(_output), contextlib.redirect_stderr(_output):
        exec(compile(academy_user_code, '<student-code>', 'exec'), {'__name__': '__main__'})
except Exception:
    _result['ok'] = False
    _result['text'] = traceback.format_exc(limit=3).strip()[-1200:]
finally:
    builtins.input = _original_input
if _result['ok']:
    _result['text'] = _output.getvalue() or '(Ծրագիրն արտածում չունի)'
json.dumps(_result, ensure_ascii=False)`;
  try {
    const result = await py.runPythonAsync(runner);
    return JSON.parse(result);
  } catch (error) {
    return {ok: false, text: String(error.message || error)};
  } finally {
    py.globals.delete('academy_user_code');
    py.globals.delete('academy_input_json');
  }
}
function collectProgramInput(code){const count=(code.match(/\binput\s*\(/g)||[]).length;if(!count)return '';const response=window.prompt('Ծրագիրն օգտագործում է input()։ Մուտքագրի՛ր տվյալները՝ յուրաքանչյուրն առանձին տողով։',state.inputText||'');return response===null?'':response;}
function render(){const hash=decodeURIComponent(location.hash.replace(/^#/,''))||'home';const [route,arg]=hash.split('/');if(arg!==undefined&&/^\d+$/.test(arg)){const n=+arg;if(route==='lessons')state.lesson=Math.min(17,n);if(route==='quizzes'){const target=Math.min(16,n);if(target!==state.quizLesson){state.quizLesson=target;resetQuiz()}}if(route==='playground'){const target=Math.min(16,n);if(target!==state.problemLesson){state.problemLesson=target;state.problemIndex=0;loadDraft()}}}let html;switch(route){case'lessons':html=lessons();break;case'quizzes':html=quiz();break;case'playground':html=problem();break;case'flashcards':html=flashcards();break;case'bugs':html=bugs();break;case'drag':html=drag();break;case'roadmap':html=roadmap();break;default:html=home()}$('#view').innerHTML=html;enhanceInlineCode();if(window.lucide)lucide.createIcons();$$('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===route));document.body.classList.toggle('is-home',route==='home');$('#nav').classList.remove('open');const dropdown=$('#problemsDropdown');if(dropdown)dropdown.hidden=true;const lessonsDropdown=$('#lessonsDropdown');if(lessonsDropdown)lessonsDropdown.hidden=true;const toggle=$('#problemsNavToggle');if(toggle){toggle.setAttribute('aria-expanded','false');toggle.classList.toggle('active',['playground','quizzes','drag','bugs'].includes(route))}const lessonToggle=$('#lessonsNavToggle');if(lessonToggle){lessonToggle.setAttribute('aria-expanded','false');lessonToggle.classList.toggle('active',['lessons','flashcards'].includes(route))}if(route==='playground')getPython().then(()=>{const x=$('#pyStatus');if(x)x.textContent='Python պատրաստ է'}).catch(()=>{const x=$('#pyStatus');if(x)x.textContent='Պետք է ինտերնետ կապ'});}
function resetQuiz(){state.quizStep=0;state.quizAnswers=[];state.quizFinished=false}
function changeProblem(){loadDraft();state.runStatus='';state.inputText='';state.solutionOpen=false;remember('playground');render()}
function bugChange(){state.bugCode=DATA.bugs[state.bug].code;state.bugOutput='';state.bugChecked=false;render()}
function dragChange(){state.dragSelected=[];state.dragCheck=false;render()}
async function runAndShow(code,outputSelector,inputs=''){const out=$(outputSelector);out.textContent='⏳ Python կոդը գործարկվում է…';try{const r=await runPython(code,inputs);if(out){out.textContent=r.text;out.classList.toggle('error',!r.ok)}return r}catch(e){if(out){out.textContent=String(e);out.classList.add('error')}return{ok:false,text:String(e)}}}
function normalized(code){return code.replace(/\s+/g,' ').replace(/\s*([=+*(),:<>])\s*/g,'$1').trim()}
function checkBugCode(code,solution,index){if(index>=24){return normalized(code)===normalized(solution)}return normalized(code)===normalized(solution)}
function attachEvents(){setupDragInteractions();document.addEventListener('click',async e=>{const btn=e.target.closest('button,[data-flash]');if(!btn)return;const id=btn.id;if(btn.dataset.lesson!==undefined){state.lesson=+btn.dataset.lesson;remember('lessons');render();return}if(id==='completeLesson'){earn('lesson',state.lesson);render();return}if(id==='prevLesson'||id==='nextLesson'){const next=Math.max(0,Math.min(17,state.lesson+(id==='nextLesson'?1:-1)));if(location.hash!==`#lessons/${next}`){location.hash=`#lessons/${next}`}else{state.lesson=next;render()}return}if(btn.dataset.answer!==undefined){state.quizAnswers[state.quizStep]=+btn.dataset.answer;render();return}if(id==='quizPrev'){state.quizStep=Math.max(0,state.quizStep-1);render();return}if(id==='quizNext'){if(state.quizAnswers[state.quizStep]===undefined)return;if(state.quizStep<9)state.quizStep++;else{state.quizFinished=true;earn('quiz',state.quizLesson)}render();return}if(id==='nextTopicQuiz'){if(state.quizLesson<DATA.lessons.length-1){state.quizLesson++;resetQuiz();render()}return}if(id==='retryQuiz'){resetQuiz();render();return}if(id==='quizTopicToggle'){const list=$('#quizTopicList');const open=list.hidden;list.hidden=!open;btn.setAttribute('aria-expanded',String(open));return}if(btn.dataset.quizTopic!==undefined){state.quizLesson=+btn.dataset.quizTopic;resetQuiz();render();return}if(id==='problemTopicToggle'){const list=$('#problemTopicList');const open=list.hidden;list.hidden=!open;btn.setAttribute('aria-expanded',String(open));return}if(btn.dataset.problemTopic!==undefined){storeDraft();state.problemLesson=+btn.dataset.problemTopic;state.problemIndex=0;changeProblem();return}if(btn.dataset.problem!==undefined){storeDraft();state.problemIndex=+btn.dataset.problem;changeProblem();return}if(id==='nextProblem'){storeDraft();const len=DATA.lessons[state.problemLesson].tasks.length;state.problemIndex=(state.problemIndex+1)%len;changeProblem();return}if(id==='toggleExampleSolution'){state.solutionOpen=!state.solutionOpen;const panel=$('#exampleSolutionPanel');panel.hidden=!state.solutionOpen;btn.setAttribute('aria-expanded',String(state.solutionOpen));btn.innerHTML=state.solutionOpen?'Թաքցնել ճիշտ պատասխանը':'Տեսնել ճիշտ պատասխանը';return}if(id==='runProblem'){storeDraft();state.inputText=collectProgramInput(state.code);const r=await runAndShow(state.code,'#problemOutput',state.inputText);state.output=r.text;state.error=!r.ok;return}if(id==='checkProblem'){storeDraft();const awarded=earn('problem',state.problemLesson+'-'+state.problemIndex);const feedback=$('#problemFeedback');if(feedback)feedback.textContent=awarded?'Նշվեց որպես լուծված։ Ստացար +15 XP։':'Այս խնդրի XP-ն արդեն ստացել ես։';render();return}if(btn.dataset.bug!==undefined){state.bug=+btn.dataset.bug;bugChange();return}if(id==='resetBug'){bugChange();return}if(id==='nextBug'){state.bug=(state.bug+1)%30;bugChange();return}if(id==='checkBug'){if(btn.disabled)return;state.bugCode=$('#bugCode').value;const checkButton=$('#checkBug');checkButton.disabled=true;let r;try{r=await runPython(state.bugCode);}finally{if(checkButton.isConnected)checkButton.disabled=false;}state.bugOutput=r.text;{const correct=checkBugCode(state.bugCode,DATA.bugs[state.bug].solution,state.bug);$('#bugFeedback').textContent=correct&&r.ok?'Սխալը շտկված է։':r.ok?'Կոդն աշխատում է, բայց դեռ չի համապատասխանում սպասվող ուղղմանը։':'Դեռ սխալ կա։ Ստուգի՛ր կոդը և փորձի՛ր կրկին։';if(correct&&r.ok)earn('bug',state.bug)}return}if(btn.dataset.drag!==undefined){state.drag=+btn.dataset.drag;dragChange();return}if(btn.dataset.remove!==undefined){state.dragSelected.splice(+btn.dataset.remove,1);state.dragCheck=false;render();return}if(id==='checkDrag'){
  const taskIndex=state.drag, selected=[...state.dragSelected];
  state.dragCheck='checking';render();
  try{
    const correct=await checkDragSolution(taskIndex,selected);
    if(state.drag!==taskIndex||state.dragSelected.join(',')!==selected.join(','))return;
    state.dragCheck=correct?'correct':'incorrect';
    if(correct)earn('drag',taskIndex);
  }catch(err){
    console.error('Drag & Drop validation failed:',err);
    if(state.drag!==taskIndex)return;
    state.dragCheck='error';
  }
  render();return
}if(id==='resetDrag'){dragChange();return}if(id==='nextDrag'){state.drag=(state.drag+1)%30;dragChange();return}if(btn.dataset.flash!==undefined){btn.classList.toggle('flipped');return}if(btn.classList.contains('copy-code')){const s=decodeURIComponent(btn.dataset.code);try{await navigator.clipboard.writeText(s);toast('Պատճենված է')}catch{toast('Պատճենումը չհաջողվեց')}return}if(id==='toggleTasks'){const panel=$('#problemSidebar');panel.classList.toggle('mobile-open');btn.setAttribute('aria-expanded',panel.classList.contains('mobile-open'));return}if(id==='themeBtn'){progress.theme=progress.theme==='dark'?'light':'dark';save();theme();return}if(id==='lessonsNavToggle'){const m=$('#lessonsDropdown');const open=m.hasAttribute('hidden');m.toggleAttribute('hidden',!open);btn.setAttribute('aria-expanded',String(open));$('#problemsDropdown').hidden=true;$('#problemsNavToggle').setAttribute('aria-expanded','false');return}if(id==='problemsNavToggle'){$('#lessonsDropdown').hidden=true;$('#lessonsNavToggle').setAttribute('aria-expanded','false');const m=$('#problemsDropdown');const open=m.hasAttribute('hidden');m.toggleAttribute('hidden',!open);btn.setAttribute('aria-expanded',String(open));return}if(id==='foxToggle'){$('#chatWindow').classList.toggle('hidden');return}if(id==='closeChat'){$('#chatWindow').classList.add('hidden');return}if(btn.dataset.chat!==undefined){askFox(+btn.dataset.chat);return}});document.addEventListener('input',e=>{if(e.target.id==='problemCode'){state.code=e.target.value;progress.drafts[draftKey()]=state.code;save()}});document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter'&&e.target.id==='problemCode'){e.preventDefault();$('#runProblem')?.click();return}if((e.key==='Enter'||e.key===' ')&&e.target.dataset.flash!==undefined){e.preventDefault();e.target.classList.toggle('flipped')}if(e.key==='Tab'&&e.target.matches('textarea.editor')){e.preventDefault();const t=e.target,s=t.selectionStart;t.setRangeText('    ',s,t.selectionEnd,'end')}});document.addEventListener('change',e=>{if(e.target.id==='quizTopic'){state.quizLesson=+e.target.value;resetQuiz();render()}if(e.target.id==='problemTopic'){storeDraft();state.problemLesson=+e.target.value;state.problemIndex=0;changeProblem()}});}
let chatBusy=false;
function chatOptions(){const c=$('#chatOptions');c.innerHTML=DATA.chat.map((item,i)=>`<button data-chat="${i}">${escapeHTML(item.q)}</button>`).join('')}
function appendChat(text,klass){const div=document.createElement('div');div.className='bubble '+klass;div.textContent=text;$('#chatMessages').append(div);$('#chatMessages').scrollTop=$('#chatMessages').scrollHeight;return div}
async function askFox(i){
  if(chatBusy)return;
  chatBusy=true;
  appendChat(DATA.chat[i].q,'user-bubble');
  const bubble=appendChat('','fox-bubble fox-typing');
  bubble.setAttribute('aria-label','Աղվեսը գրում է');
  bubble.innerHTML='<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
  const options=$('#chatOptions');
  if(options){options.style.opacity='.45';options.style.pointerEvents='none'}
  try{
    await new Promise(resolve=>setTimeout(resolve,1100));
    bubble.classList.remove('fox-typing');
    bubble.removeAttribute('aria-label');
    bubble.textContent='';
    const answer=DATA.chat[i].a;
    for(let pos=0;pos<answer.length;pos+=2){
      bubble.textContent=answer.slice(0,pos+2);
      const messages=$('#chatMessages');
      if(messages)messages.scrollTop=messages.scrollHeight;
      await new Promise(resolve=>setTimeout(resolve,20));
    }
  }finally{
    if(options){options.style.opacity='1';options.style.pointerEvents=''}
    chatBusy=false;
  }
}
async function boot(){try{const response=await fetch('data/content.json');if(!response.ok)throw new Error('HTTP '+response.status);DATA=await response.json();const solutionsResponse=await fetch('data/solutions.json');if(!solutionsResponse.ok)throw new Error('Լուծումների ֆայլը չի բեռնվել');SOLUTIONS=await solutionsResponse.json();state.bugCode=DATA.bugs[0].code;updateHeader();theme();attachEvents();chatOptions();let previousRoute=(location.hash.slice(1).split('/')[0]||'home');window.addEventListener('hashchange',()=>{const route=location.hash.slice(1).split('/')[0]||'home';if(previousRoute==='quizzes'&&route!=='quizzes')resetQuiz();if(previousRoute!=='quizzes'&&route==='quizzes')resetQuiz();previousRoute=route;render();remember(route);window.scrollTo(0,0)});loadDraft();render()}catch(err){$('#view').innerHTML=`<div class="panel"><h2>Չհաջողվեց բեռնել նյութերը</h2><p>${escapeHTML(err.message)}</p><p>Բացի՛ր կայքը տեղային սերվերով կամ տեղակայի՛ր Netlify-ում։</p></div>`}}
boot();

// Close the Problems dropdown when the user clicks outside of it.
document.addEventListener('click',event=>{if(!event.target.closest('.problems-nav')){const menu=document.getElementById('problemsDropdown');if(menu)menu.hidden=true;const toggle=document.getElementById('problemsNavToggle');if(toggle)toggle.setAttribute('aria-expanded','false')}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){const menu=document.getElementById('problemsDropdown');if(menu)menu.hidden=true;document.getElementById('problemsNavToggle')?.setAttribute('aria-expanded','false')}});

// Close both header dropdowns when clicking elsewhere or pressing Escape.
document.addEventListener('click', e=>{if(!e.target.closest('.lessons-nav')){const d=document.getElementById('lessonsDropdown');if(d)d.hidden=true;const t=document.getElementById('lessonsNavToggle');if(t)t.setAttribute('aria-expanded','false')}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){for(const [d,t] of [['lessonsDropdown','lessonsNavToggle'],['problemsDropdown','problemsNavToggle']]){const menu=document.getElementById(d),toggle=document.getElementById(t);if(menu)menu.hidden=true;if(toggle)toggle.setAttribute('aria-expanded','false')}}});

/* Close open navigation/topic menus when clicking elsewhere, or pressing Escape. */
(() => {
  const groups = [
    ['lessonsDropdown','lessonsNavToggle','.lessons-nav'],
    ['problemsDropdown','problemsNavToggle','.problems-nav'],
    ['quizTopicList','quizTopicToggle','#quizTopicToggle, #quizTopicList'],
    ['problemTopicList','problemTopicToggle','#problemTopicToggle, #problemTopicList']
  ];
  function closeMenus(event, force=false) {
    for (const [menuId, toggleId, inside] of groups) {
      const menu=document.getElementById(menuId), toggle=document.getElementById(toggleId);
      if (!menu || menu.hidden) continue;
      if (!force && event.target.closest(inside)) continue;
      menu.hidden=true;
      toggle?.setAttribute('aria-expanded','false');
    }
    const mobile=document.getElementById('nav');
    if(mobile?.classList.contains('open') && (force || !event.target.closest('#nav'))) mobile.classList.remove('open');
  }
  document.addEventListener('click', event=>closeMenus(event));
  document.addEventListener('keydown', event=>{if(event.key==='Escape')closeMenus(event,true)});
})();


// Close Fox Assistant when the user clicks outside the chat and its toggle.
(() => {
  const chat = document.getElementById('chatWindow');
  const toggle = document.getElementById('foxToggle');
  if (!chat || !toggle) return;
  document.addEventListener('click', (event) => {
    if (chat.classList.contains('hidden')) return;
    if (chat.contains(event.target) || toggle.contains(event.target)) return;
    chat.classList.add('hidden');
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') chat.classList.add('hidden');
  });
})();
