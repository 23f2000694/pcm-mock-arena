const state = {subject:"Chemistry", questions:{}, answers:{}, user:null};
const letters=["A","B","C","D"];
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function allQuestions(){return Object.entries(state.questions).map(([id,q])=>({id,...q}))}
function subjectQuestions(){return allQuestions().filter(q=>q.subject===state.subject)}
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

function render(){
  $("#subjectTitle").textContent=state.subject;
  $$(".nav-subject").forEach(b=>b.classList.toggle("active",b.dataset.subject===state.subject));
  const qs=subjectQuestions();
  const ans=Object.values(state.answers).filter(a=>a.subject===state.subject);
  $("#totalCount").textContent=allQuestions().length;
  $("#answeredCount").textContent=ans.length;
  $("#scoreCount").textContent=Object.values(state.answers).filter(a=>a.correct).length;
  const pct=qs.length?Math.round(ans.length/qs.length*100):0;
  $("#progressText").textContent=pct+"%"; $("#progressBar").style.width=pct+"%";
  $("#emptyState").classList.toggle("d-none",qs.length!==0);
  $("#questionList").innerHTML=qs.map(renderQuestion).join("");
  bindQuestionButtons();
}
function renderQuestion(q,i){
  const a=state.answers[q.id];
  return `<article class="question-card" id="question-${esc(q.id)}">
    <div class="q-head"><div><div class="q-title">${esc(q.title||`Question ${i+1}`)}</div></div><span class="q-number">Q${i+1}</span></div>
    <div class="text-question">${esc(q.text||"")}</div>
    <div class="options">${(q.options||[]).slice(0,4).map((o,j)=>`
      <button class="option-btn ${a?(a.selected===j?(j===q.correct?"correct":"wrong"):""):""} ${a&&a.selected!==j&&j===q.correct?"correct":""}"
      data-q="${esc(q.id)}" data-option="${j}" ${a?"disabled":""}><span class="letter">${letters[j]}</span>${esc(o)}</button>`).join("")}</div>
    <div class="feedback ${a?"show":""} ${a?.correct?"good":"bad"}">
      <b>${a?.correct?"Correct! 🎉":"Not quite."}</b>
      ${a&&!a.correct?` Correct answer: <b>${letters[q.correct]}</b>.`:""}
      ${q.explanation?`<div class="mt-1">${esc(q.explanation)}</div>`:""}
    </div>
    <div class="actions"><button class="share-btn" data-share="${esc(q.id)}"><i class="bi bi-share"></i> Share answer</button></div>
  </article>`;
}
function bindQuestionButtons(){
  $$(".option-btn").forEach(b=>b.onclick=()=>{
    const q=state.questions[b.dataset.q], selected=+b.dataset.option;
    state.answers[q.id]={selected,correct:selected===+q.correct,subject:q.subject}; render();
    document.getElementById(`question-${q.id}`)?.scrollIntoView({behavior:"smooth",block:"center"});
  });
  $$(".share-btn").forEach(b=>b.onclick=async()=>{
    const q=state.questions[b.dataset.share], a=state.answers[q.id];
    const url=location.href.split("#")[0]+"#q="+encodeURIComponent(q.id);
    const text=a?`${q.title||"Question"} — My answer: ${letters[a.selected]}. ${a.correct?"Correct!":`Correct answer: ${letters[q.correct]}.`}`:`${q.title||"Question"} — Try this question!`;
    try{if(navigator.share)await navigator.share({title:"PCM Mock Arena",text,url});else{await navigator.clipboard.writeText(text+"\n"+url);alert("Answer link copied!")}}catch(e){}
  });
}
$$(".nav-subject").forEach(b=>b.onclick=()=>{state.subject=b.dataset.subject;render();window.scrollTo({top:document.querySelector(".subject-strip").offsetTop-80,behavior:"smooth"})});

const modal=new bootstrap.Modal("#adminModal");
$("#adminBtn").onclick=()=>modal.show();
$("#loginBtn").onclick=async()=>{
  if(!PCM.firebaseReady){$("#loginMsg").textContent="Firebase is not configured yet. Follow the setup guide in README.";return}
  try{await PCM.firebase.signIn($("#loginEmail").value.trim(),$("#loginPassword").value);$("#loginMsg").textContent=""}
  catch(e){$("#loginMsg").textContent=e.message;$("#loginMsg").className="small mt-2 text-danger"}
};
$("#logoutBtn").onclick=()=>PCM.firebase.signOut();
$("#newQuestionBtn").onclick=clearForm; $("#clearFormBtn").onclick=clearForm;
function clearForm(){ $("#questionForm").reset();$("#questionId").value="";$("#qSubject").value=state.subject;$("#correct").value="0";$("#saveMsg").textContent=""}
function fillForm(id){
  const q=state.questions[id];$("#questionId").value=id;$("#qSubject").value=q.subject;$("#qTitle").value=q.title||"";
  $("#qText").value=q.text||"";$("#optA").value=q.options?.[0]||"";$("#optB").value=q.options?.[1]||"";
  $("#optC").value=q.options?.[2]||"";$("#optD").value=q.options?.[3]||"";$("#correct").value=String(q.correct??0);
  $("#explanation").value=q.explanation||"";document.querySelector(".editor-card").scrollIntoView({behavior:"smooth"});
}
$("#questionForm").onsubmit=async e=>{
  e.preventDefault();if(!state.user||!PCM.firebaseReady)return;
  const id=$("#questionId").value,q={subject:$("#qSubject").value,title:$("#qTitle").value.trim(),text:$("#qText").value.trim(),
    options:[$("#optA").value.trim(),$("#optB").value.trim(),$("#optC").value.trim(),$("#optD").value.trim()],correct:+$("#correct").value,explanation:$("#explanation").value.trim()};
  try{if(id)await PCM.dbFns.update(PCM.dbFns.ref(PCM.db,`questions/${id}`),q);else await PCM.dbFns.set(PCM.dbFns.push(PCM.dbFns.ref(PCM.db,"questions")),q);
    $("#saveMsg").textContent="Saved successfully.";$("#saveMsg").className="small mt-2 text-success";clearForm();
  }catch(err){$("#saveMsg").textContent=err.message;$("#saveMsg").className="small mt-2 text-danger"}
};
function renderAdminList(){
  $("#adminQuestionList").innerHTML=allQuestions().map(q=>`<div class="admin-row"><div><b>${esc(q.title||"Untitled")}</b><div class="small text-muted">${esc(q.subject)}</div></div>
  <div class="d-flex gap-2"><button class="btn btn-sm btn-outline-primary" data-edit="${q.id}">Edit</button><button class="btn btn-sm btn-outline-danger" data-delete="${q.id}">Delete</button></div></div>`).join("");
  $$("[data-edit]").forEach(b=>b.onclick=()=>fillForm(b.dataset.edit));
  $$("[data-delete]").forEach(b=>b.onclick=async()=>{if(confirm("Delete this question?"))await PCM.dbFns.remove(PCM.dbFns.ref(PCM.db,`questions/${b.dataset.delete}`))});
}

function setEditor(q){
  $("#qSubject").value=q.subject||state.subject;$("#qTitle").value=q.title||"";
  $("#qText").value=q.text||"";$("#optA").value=q.options?.[0]||"";$("#optB").value=q.options?.[1]||"";
  $("#optC").value=q.options?.[2]||"";$("#optD").value=q.options?.[3]||"";$("#correct").value=String(q.correct??0);
  $("#explanation").value=q.explanation||"";
}
$("#extractBtn").onclick=async()=>{
  const file=$("#aiImage").files[0];
  if(!file){$("#aiMsg").textContent="Choose a question screenshot first.";return}
  $("#aiMsg").textContent="Reading image…";
  try{
    const q=await extractQuestionWithOCR(file);
    setEditor(q);
    $("#aiMsg").textContent="Text extracted. Please verify the options and correct answer before saving.";
  }catch(e){$("#aiMsg").textContent=e.message}
};
async function extractQuestionWithOCR(file){
  // Free browser-only OCR using Tesseract.js. No API key.
  if(!window.Tesseract)throw new Error("OCR library is still loading. Try again in a few seconds.");
  const result=await Tesseract.recognize(file,"eng",{logger:m=>{
    if(m.status)$("#aiMsg").textContent=`Reading image… ${Math.round((m.progress||0)*100)}%`;
  }});
  const text=result.data.text.trim();
  const lines=text.split(/\n+/).map(s=>s.trim()).filter(Boolean);
  // Lightweight heuristic parser. User must verify answer because OCR cannot reliably infer the correct answer.
  const opt=[];
  for(const line of lines){
    const m=line.match(/^\s*([A-D])[\).\:\-]\s*(.+)$/i);
    if(m)opt["ABCD".indexOf(m[1].toUpperCase())]=m[2].trim();
  }
  const questionLines=lines.filter(x=>!/^\s*[A-D][\).\:\-]\s*/i.test(x));
  return {subject:state.subject,title:"AI/OCR imported question",text:questionLines.join(" "),options:[opt[0]||"",opt[1]||"",opt[2]||"",opt[3]||""],correct:0,explanation:"Verify the extracted text and select the correct option before saving."};
}
window.addEventListener("questionsUpdated",e=>{state.questions=e.detail||{};render();renderAdminList()});
window.addEventListener("authChanged",e=>{state.user=e.detail;$("#loginPanel").classList.toggle("d-none",!!state.user);$("#editorPanel").classList.toggle("d-none",!state.user);if(state.user)renderAdminList()});
render();
