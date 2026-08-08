const state={
  subject:"Physics",questions:{},answers:{},bookmarks:JSON.parse(localStorage.getItem("pcbBookmarks")||"[]"),
  user:null,home:true,activeIndex:0
};
const letters=["A","B","C","D"];
const SUBJECTS=["Physics","Chemistry","Biology"];
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function allQuestions(){return Object.entries(state.questions||{}).map(([id,q])=>({id,...q}))}
function subjectQuestions(){return allQuestions().filter(q=>String(q.subject||"").toLowerCase()===state.subject.toLowerCase()).sort((a,b)=>(Number(a.questionId)||999999)-(Number(b.questionId)||999999))}
function currentQuestion(){return subjectQuestions()[state.activeIndex]||null}
function questionNumber(q,i){return q.questionId!=null?String(q.questionId):String(i+1)}
function nextId(){return Math.max(0,...allQuestions().map(q=>Number(q.questionId)||0))+1}
function mergedQuestions(dbData){
  const merged={};
  (window.STARTER_QUESTIONS||[]).forEach((q,i)=>{merged[`sample-${i+1}`]={...q,isSample:true,questionId:q.questionId??i+1}});
  Object.entries(dbData||{}).forEach(([id,q])=>{merged[id]={...q,questionId:q.questionId||null}});
  return merged;
}
function setHomeMode(home){
  state.home=home;document.body.classList.toggle("home-mode",home);
  $("#homeHero").classList.toggle("d-none",!home);
  $("#subjectBar").classList.toggle("d-none",home);
  $(".nav-subject").forEach(b=>b.classList.toggle("d-none",home));
  $("#navHome").classList.toggle("d-none",home);
  if(home)window.scrollTo({top:0,behavior:"smooth"});
}
function updateStats(){
  const counts={Physics:0,Chemistry:0,Biology:0};
  allQuestions().forEach(q=>{if(counts[q.subject]!=null)counts[q.subject]++});
  $("#statPhysics").textContent=counts.Physics;$("#statChemistry").textContent=counts.Chemistry;$("#statBiology").textContent=counts.Biology;
  $("#statTotal").textContent=Object.values(counts).reduce((a,b)=>a+b,0);
  $("#heroPhysicsCount").textContent=`${counts.Physics} Questions`;$("#heroChemistryCount").textContent=`${counts.Chemistry} Questions`;$("#heroBiologyCount").textContent=`${counts.Biology} Questions`;
}
function render(){
  updateStats();$("#subjectTitle").textContent=state.subject;
  $$(".nav-subject").forEach(b=>b.classList.toggle("active",b.dataset.subjectKey===state.subject));
  const qs=subjectQuestions();
  if(state.activeIndex>=qs.length)state.activeIndex=Math.max(0,qs.length-1);
  $("#emptyState").classList.toggle("d-none",qs.length!==0);
  $("#questionList").innerHTML=qs.length?renderQuestion(qs[state.activeIndex],state.activeIndex):"";
  $("#questionCounter").textContent=qs.length?`Question ${state.activeIndex+1} of ${qs.length}`:"No questions";
  bindQuestionButtons();
}
function renderQuestion(q,i){
  const a=state.answers[q.id],revealed=!!a,bookmarked=state.bookmarks.includes(q.id);
  const opts=(q.options||[]).map(x=>String(x??"").trim());
  const hasOptions=q.questionType!=="subjective" && opts.some(Boolean);
  const correctIdx=Number(q.correct);
  const correctText=q.correctText||opts[correctIdx]||"Not provided";
  let optionsHtml="";
  if(hasOptions){
    optionsHtml=opts.slice(0,4).map((o,j)=>{
      if(!o)return "";
      let cls="";
      if(revealed && a.selected===j)cls=a.correct?"correct":"wrong";
      return `<button class="option-btn ${cls}" data-q="${esc(q.id)}" data-option="${j}" ${revealed?"disabled":""}><span class="letter">${letters[j]}</span><span>${esc(o)}</span></button>`;
    }).join("");
  }else{
    optionsHtml=`<div class="subjective-answer"><label class="form-label fw-bold">Your answer</label><div class="d-flex gap-2 flex-wrap"><input class="form-control subjective-input" data-subjective="${esc(q.id)}" placeholder="Type your answer" ${revealed?"disabled":""}><button class="btn btn-primary rounded-pill subjective-submit" data-submit-subjective="${esc(q.id)}" ${revealed?"disabled":""}>Submit answer</button></div></div>`;
  }
  let feedback="";
  if(revealed){
    feedback=`<div class="feedback show ${a.correct?"good":"bad"}">
      <div class="result-title">${a.correct?"✓ Correct!":"✕ Incorrect Answer"}</div>
      ${a.correct?`<div class="answer-line"><strong>Correct answer:</strong> ${esc(correctText)}</div>`:`<div class="answer-line"><strong>Incorrect answer.</strong> The correct answer is: ${esc(correctText)}</div>`}
      ${q.explanation?`<div class="solution-box"><div class="solution-label"><i class="bi bi-lightbulb-fill"></i> Explanation</div><div>${esc(q.explanation)}</div></div>`:""}
    </div>`;
  }
  const isLast=i>=subjectQuestions().length-1;
  return `<article class="question-card ${revealed?"answered":""}" id="question-${esc(q.id)}">
    <div class="q-head"><div><div class="q-title">${esc(q.title||`Question ${i+1}`)}</div><div class="q-meta">${esc(q.subject)} • ID ${esc(questionNumber(q,i))}</div></div><span class="q-number">Q${esc(questionNumber(q,i))}</span></div>
    <div class="text-question">${esc(q.text||"")}</div>
    ${q.imageData?`<div class="diagram-public"><img src="${q.imageData}" alt="Question diagram"></div>`:""}
    <div class="options ${hasOptions?"":"subjective-wrap"}">${optionsHtml}</div>
    ${feedback}
    <div class="actions">
      <button class="bookmark-btn ${bookmarked?"bookmarked":""}" data-bookmark="${esc(q.id)}"><i class="bi ${bookmarked?"bi-bookmark-fill":"bi-bookmark"}"></i> ${bookmarked?"Bookmarked":"Bookmark"}</button>
      <button class="share-btn" data-share="${esc(q.id)}"><i class="bi bi-share"></i> Share answer</button>
      <button class="next-btn" data-next="${esc(q.id)}" ${isLast?"disabled":""}><i class="bi bi-arrow-right-circle"></i> ${isLast?"Last question":"Next question"}</button>
    </div>
  </article>`;
}
function submitAnswer(q,selected){
  const correct=Number(selected)===Number(q.correct);
  state.answers[q.id]={selected:Number(selected),correct,subject:q.subject};
  render();
}
function submitSubjective(q,text){
  const expected=String(q.correctText||"").trim().toLowerCase();
  const got=String(text||"").trim().toLowerCase();
  const correct=!!expected && got===expected;
  state.answers[q.id]={text:got,correct,subject:q.subject};render();
}
function goNext(){
  const qs=subjectQuestions();if(state.activeIndex<qs.length-1){state.activeIndex++;render();window.scrollTo({top:document.querySelector("main")?.offsetTop||0,behavior:"smooth"})}
}
function bindQuestionButtons(){
  $$(".option-btn").forEach(b=>b.onclick=()=>{const q=state.questions[b.dataset.q];if(q)submitAnswer(q,Number(b.dataset.option))});
  $$(".subjective-submit").forEach(b=>b.onclick=()=>{const q=state.questions[b.dataset.submitSubjective];const input=document.querySelector(`[data-subjective="${CSS.escape(q.id)}"]`);if(input&&input.value.trim())submitSubjective(q,input.value)});
  $$('[data-next]').forEach(b=>b.onclick=()=>goNext());
  $$('[data-bookmark]').forEach(b=>b.onclick=()=>{const id=b.dataset.bookmark;state.bookmarks=state.bookmarks.includes(id)?state.bookmarks.filter(x=>x!==id):[...state.bookmarks,id];localStorage.setItem("pcbBookmarks",JSON.stringify(state.bookmarks));render()});
  $$(".share-btn").forEach(b=>b.onclick=async()=>{const q=state.questions[b.dataset.share],a=state.answers[q.id],url=location.href.split("#")[0]+"#q="+encodeURIComponent(q.id),text=a?`${q.title||"Question"} — ${a.correct?"Correct!":"Incorrect. Correct answer: "+(q.correctText||letters[q.correct]||"")}`:`${q.title||"Question"} — Try this question!`;try{if(navigator.share)await navigator.share({title:"PCB Mock Arena",text,url});else{await navigator.clipboard.writeText(text+"\n"+url);showToast("Answer link copied!")}}catch(e){}});
}
function showToast(message){let t=$("#siteToast");if(!t){t=document.createElement("div");t.id="siteToast";t.className="site-toast";document.body.appendChild(t)}t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function chooseSubject(s){
  const subject=String(s||"").trim();
  if(!SUBJECTS.includes(subject)){console.warn("Unknown subject:",subject);return;}
  state.subject=subject;
  state.activeIndex=0;
  state.answers={};
  setHomeMode(false);
  render();
  window.history.replaceState(null,"",`#${encodeURIComponent(subject.toLowerCase())}`);
  window.scrollTo({top:document.querySelector("main")?.offsetTop||0,behavior:"smooth"});
}
// Event delegation makes subject buttons reliable even after the page re-renders.
document.querySelectorAll(".subject-select").forEach(button=>{
  button.addEventListener("click", e=>{
    e.preventDefault();
    e.stopPropagation();
    const subject=button.getAttribute("data-subject-key");
    chooseSubject(subject);
  });
});
$("#navHome").onclick=()=>{setHomeMode(true);state.activeIndex=0;render()};
$$("[data-scroll]").forEach(b=>b.onclick=()=>document.querySelector(b.dataset.scroll)?.scrollIntoView({behavior:"smooth"}));
const modal=new bootstrap.Modal("#adminModal");function openAdmin(){modal.show()}$("#adminBtn").onclick=openAdmin;$("#heroAdmin").onclick=openAdmin;$("#emptyAdmin").onclick=openAdmin;
$("#loginBtn").onclick=async()=>{if(!window.PCM?.firebaseReady){$("#loginMsg").textContent="Firebase is not configured.";return}try{await PCM.firebase.signIn($("#loginEmail").value.trim(),$("#loginPassword").value);$("#loginMsg").textContent="Logged in successfully.";$("#loginMsg").className="small mt-2 text-success"}catch(e){$("#loginMsg").textContent=e.message;$("#loginMsg").className="small mt-2 text-danger"}};
$("#logoutBtn").onclick=()=>PCM.firebase.signOut();$("#newQuestionBtn").onclick=clearForm;$("#clearFormBtn").onclick=clearForm;
$("#questionType").onchange=toggleQuestionType;function toggleQuestionType(){const sub=$("#questionType").value==="subjective";["#optA","#optB","#optC","#optD","#correct"].forEach(s=>$(s).closest(".col-md-6")?.classList.toggle("d-none",sub));$("#correctText").classList.toggle("d-none",!sub)}
function clearForm(){$("#questionForm").reset();$("#questionId").value="";$("#qSubject").value=state.subject;$("#correct").value="0";$("#correctText").value="";$("#saveMsg").textContent="";$("#aiMsg").textContent="";$("#diagramPreview").innerHTML="";$("#removeDiagramBtn").classList.add("d-none");$("#questionForm").classList.remove("editing");diagramData=null;toggleQuestionType()}
function fillForm(id){const q=state.questions[id];if(!q)return;$("#questionId").value=id;$("#qSubject").value=q.subject||state.subject;$("#qTitle").value=q.title||"";$("#qText").value=q.text||"";$("#questionType").value=q.questionType||((q.options||[]).some(Boolean)?"mcq":"subjective");$("#optA").value=q.options?.[0]||"";$("#optB").value=q.options?.[1]||"";$("#optC").value=q.options?.[2]||"";$("#optD").value=q.options?.[3]||"";$("#correct").value=String(q.correct??0);$("#correctText").value=q.correctText||"";$("#explanation").value=q.explanation||"";diagramData=q.imageData||null;toggleQuestionType();if(q.imageData){$("#diagramPreview").innerHTML=`<img src="${q.imageData}" alt="Diagram preview">`;$("#removeDiagramBtn").classList.remove("d-none")}else{$("#diagramPreview").innerHTML="";$("#removeDiagramBtn").classList.add("d-none")}$("#saveMsg").textContent="Editing existing question — make your corrections and save.";$("#saveMsg").className="small mt-2 text-primary";$("#questionForm").classList.add("editing");document.querySelector(".editor-card").scrollIntoView({behavior:"smooth"})}
let diagramData=null;
$("#diagramImage").onchange=async e=>{const file=e.target.files[0];if(!file)return;try{diagramData=await compressImage(file,1200,.72);$("#diagramPreview").innerHTML=`<img src="${diagramData}" alt="Diagram preview">`;$("#removeDiagramBtn").classList.remove("d-none")}catch(err){$("#saveMsg").textContent="Could not process the image."}};
$("#removeDiagramBtn").onclick=()=>{diagramData=null;$("#diagramImage").value="";$("#diagramPreview").innerHTML="";$("#removeDiagramBtn").classList.add("d-none")};
function compressImage(file,maxWidth=1200,quality=.72){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const scale=Math.min(1,maxWidth/img.width),c=document.createElement("canvas");c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext("2d").drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL("image/jpeg",quality))};img.onerror=reject;img.src=reader.result};reader.onerror=reject;reader.readAsDataURL(file)})}
$("#questionForm").onsubmit=async e=>{e.preventDefault();if(!state.user||!window.PCM?.firebaseReady){$("#saveMsg").textContent="Please login as admin first.";return}const id=$("#questionId").value,existing=id?state.questions[id]:{},type=$("#questionType").value;const q={questionId:existing.questionId||nextId(),subject:$("#qSubject").value,title:$("#qTitle").value.trim(),text:$("#qText").value.trim(),questionType:type,options:type==="mcq"?[$("#optA").value.trim(),$("#optB").value.trim(),$("#optC").value.trim(),$("#optD").value.trim()]:[],correct:type==="mcq"?Number($("#correct").value):null,correctText:type==="subjective"?$("#correctText").value.trim():"",explanation:$("#explanation").value.trim(),imageData:diagramData!==null?diagramData:(existing.imageData||"")};try{if(id)await PCM.dbFns.update(PCM.dbFns.ref(PCM.db,`questions/${id}`),q);else await PCM.dbFns.set(PCM.dbFns.push(PCM.dbFns.ref(PCM.db,"questions")),q);$("#saveMsg").textContent=id?"Question updated successfully!":"Question published successfully!";$("#saveMsg").className="small mt-2 text-success";clearForm()}catch(err){$("#saveMsg").textContent=err.message;$("#saveMsg").className="small mt-2 text-danger"}};
function renderAdminList(){
  let list=allQuestions().filter(q=>!q.id.startsWith("sample-"));
  const term=($("#adminSearch")?.value||"").trim().toLowerCase(),filter=$("#adminSubjectFilter")?.value||"All";
  if(filter!=="All")list=list.filter(q=>q.subject===filter);if(term)list=list.filter(q=>[q.title,q.text,q.subject,String(q.questionId)].join(" ").toLowerCase().includes(term));
  list.sort((a,b)=>(Number(a.questionId)||999999)-(Number(b.questionId)||999999));
  const answerFor=q=>q.questionType==="subjective"?(q.correctText||"Not set"):((q.options||[])[Number(q.correct)]||"Not set");
  $("#adminQuestionList").innerHTML=list.length?list.map(q=>`<div class="admin-row admin-question-row"><div class="admin-q-main"><div class="d-flex flex-wrap align-items-center gap-2"><b>Q${esc(q.questionId||"—")} · ${esc(q.title||"Untitled")}</b><span class="badge rounded-pill text-bg-light">${esc(q.subject)}</span>${q.questionType==="subjective"?'<span class="badge rounded-pill text-bg-warning">Subjective</span>':''}</div><div class="small text-muted mt-1">${esc(q.text||"").slice(0,180)}${(q.text||"").length>180?'…':''}</div><div class="admin-answer mt-2"><i class="bi bi-check-circle-fill"></i> <strong>Correct:</strong> ${esc(answerFor(q))}</div>${q.explanation?`<div class="small mt-1"><i class="bi bi-lightbulb"></i> ${esc(q.explanation).slice(0,160)}${q.explanation.length>160?'…':''}</div>`:""}</div><div class="d-flex flex-wrap gap-2 admin-row-actions"><button class="btn btn-sm btn-outline-primary rounded-pill" data-edit="${q.id}"><i class="bi bi-pencil"></i> Edit</button><button class="btn btn-sm btn-outline-secondary rounded-pill" data-duplicate="${q.id}"><i class="bi bi-copy"></i> Duplicate</button><button class="btn btn-sm btn-outline-danger rounded-pill" data-delete="${q.id}"><i class="bi bi-trash"></i> Delete</button></div></div>`).join(""):`<div class="text-muted small py-3">No matching questions. Use <b>New question</b> or publish the starter set.</div>`;
  $$('[data-edit]').forEach(b=>b.onclick=()=>fillForm(b.dataset.edit));
  $$('[data-delete]').forEach(b=>b.onclick=async()=>{if(confirm("Delete this question permanently?"))await PCM.dbFns.remove(PCM.dbFns.ref(PCM.db,`questions/${b.dataset.delete}`))});
  $$('[data-duplicate]').forEach(b=>b.onclick=async()=>{const original=state.questions[b.dataset.duplicate];if(!original)return;const copy={...original,questionId:nextId(),title:(original.title||"Question")+" — Copy"};delete copy.id;delete copy.isSample;await PCM.dbFns.set(PCM.dbFns.push(PCM.dbFns.ref(PCM.db,"questions")),copy);showToast("Question duplicated.")});
}
function setEditor(q){$("#qSubject").value=q.subject||state.subject;$("#qTitle").value=q.title||"";$("#qText").value=q.text||"";$("#questionType").value=q.questionType||"mcq";$("#optA").value=q.options?.[0]||"";$("#optB").value=q.options?.[1]||"";$("#optC").value=q.options?.[2]||"";$("#optD").value=q.options?.[3]||"";$("#correct").value=String(q.correct??0);$("#correctText").value=q.correctText||"";$("#explanation").value=q.explanation||"";toggleQuestionType()}
$("#extractBtn").onclick=async()=>{const file=$("#aiImage").files[0];if(!file){$("#aiMsg").textContent="Choose a question screenshot first.";return}$("#aiMsg").textContent="Reading image…";try{const q=await extractQuestionWithOCR(file);setEditor(q);$("#aiMsg").textContent="Question and options extracted. Verify everything manually before saving.";$("#qText").focus()}catch(e){$("#aiMsg").textContent=e.message}};
async function extractQuestionWithOCR(file){
  if(!window.Tesseract)throw new Error("OCR library is still loading. Try again in a few seconds.");
  const result=await Tesseract.recognize(file,"eng",{logger:m=>{if(m.status)$("#aiMsg").textContent=`Reading image… ${Math.round((m.progress||0)*100)}%`}});
  const raw=(result.data.text||"").replace(/\r/g,"").trim();if(!raw)throw new Error("No readable text was detected. Try a clearer screenshot.");
  const lines=raw.split(/\n+/).map(s=>s.replace(/\s+/g," ").trim()).filter(Boolean),opts=["","","",""];const questionLines=[];let current=-1;
  const marker=/^\s*(?:\(?([1-4])\)?|([A-Da-d]))\s*[\.\)\:\-]\s*(.+)$/;
  for(const line of lines){const m=line.match(marker);if(m){const idx=m[1]?Number(m[1])-1:"ABCD".indexOf(m[2].toUpperCase());if(idx>=0&&idx<4){opts[idx]=m[3].trim();current=idx;continue}}if(current>=0&&opts[current]&&!/^\s*(?:[A-Da-d][\.\)]|[1-4][\.\)])/.test(line)){opts[current]+=" "+line;continue}questionLines.push(line)}
  const joined=questionLines.join(" ");const inline=joined.match(/(?:^|\s)(?:1|A)[\.\)]\s*(.*?)\s+(?:2|B)[\.\)]\s*(.*?)\s+(?:3|C)[\.\)]\s*(.*?)\s+(?:4|D)[\.\)]\s*(.*)$/i);if(inline){opts[0]=opts[0]||inline[1];opts[1]=opts[1]||inline[2];opts[2]=opts[2]||inline[3];opts[3]=opts[3]||inline[4]}
  const hasOpts=opts.some(Boolean);return{subject:state.subject,title:"OCR imported question",text:questionLines.join(" ").replace(/\s{2,}/g," "),questionType:hasOpts?"mcq":"subjective",options:opts,correct:0,correctText:"",explanation:""};
}
$("#adminSearch").oninput=()=>renderAdminList();$("#adminSubjectFilter").onchange=()=>renderAdminList();$("#adminPdfBtn").onclick=()=>createPDF();
$("#seedBtn").onclick=async()=>{if(!state.user||!PCM?.db){alert("Login as admin first.");return}const already=allQuestions().filter(q=>q.isSeeded).length;if(already){showToast("Starter set is already published.");return}if(!confirm("Publish the 30 NEET PYQ-based practice questions to the shared database?"))return;let id=nextId();for(const q of (window.STARTER_QUESTIONS||[])){await PCM.dbFns.set(PCM.dbFns.push(PCM.dbFns.ref(PCM.db,"questions")),{...q,questionId:id++,isSeeded:true})}showToast("30 NEET PYQ-based practice questions published.")};
$("#pdfBtn").onclick=()=>createPDF(state.subject);$("#pdfPhysics").onclick=()=>createPDF("Physics");$("#pdfChemistry").onclick=()=>createPDF("Chemistry");$("#pdfBiology").onclick=()=>createPDF("Biology");
function createPDF(subject="All"){
  const {jsPDF}=window.jspdf||{};if(!jsPDF){showToast("PDF library is loading. Try again.");return}
  const doc=new jsPDF();let y=18;doc.setFontSize(18);doc.text(`PCB Mock Arena — ${subject} Questions`,14,y);y+=12;doc.setFontSize(10);
  const qs=(subject==="All"?allQuestions():allQuestions().filter(q=>q.subject===subject)).sort((a,b)=>(Number(a.questionId)||999999)-(Number(b.questionId)||999999));
  if(!qs.length){doc.text("No questions available.",14,y)}
  qs.forEach((q,i)=>{const ans=q.questionType==="subjective"?q.correctText:(q.options||[])[Number(q.correct)]||"";const answerLabel=q.questionType==="subjective"?ans:`${letters[Number(q.correct)]||""}. ${ans}`;const lines=doc.splitTextToSize(`Q${q.questionId||i+1}. ${q.text||q.title||""}\nCorrect option: ${answerLabel}`,180);if(y+lines.length*5>282){doc.addPage();y=18}doc.text(lines,14,y);y+=lines.length*5+6});
  doc.save(`PCB-Mock-Arena-${subject.replace(/\s+/g,"-")}.pdf`);showToast(`${subject} PDF created.`)
}
window.addEventListener("questionsUpdated",e=>{state.questions=mergedQuestions(e.detail||{});render();if(state.user)renderAdminList()});
window.addEventListener("authChanged",e=>{state.user=e.detail;$("#loginPanel").classList.toggle("d-none",!!state.user);$("#editorPanel").classList.toggle("d-none",!state.user);if(state.user)renderAdminList()});
window.addEventListener("firebaseReadError",e=>{console.error(e.detail);showToast("Live database could not be read. Check Firebase Rules.")});
const initialHash=decodeURIComponent(location.hash.replace(/^#/,"")).toLowerCase();
if(SUBJECTS.some(s=>s.toLowerCase()===initialHash)){state.subject=SUBJECTS.find(s=>s.toLowerCase()===initialHash);state.home=false;}
state.questions=mergedQuestions({});toggleQuestionType();setHomeMode(state.home);render();
