const state = {subject:"Physics", questions:{}, answers:{}, user:null};
const letters=["A","B","C","D"];
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

function allQuestions(){return Object.entries(state.questions||{}).map(([id,q])=>({id,...q}))}
function subjectQuestions(){return allQuestions().filter(q=>q.subject===state.subject)}
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

function render(){
  $("#subjectTitle").textContent=state.subject;
  $$(".nav-subject").forEach(b=>b.classList.toggle("active",b.dataset.subject===state.subject));
  const qs=subjectQuestions();
  $("#emptyState").classList.toggle("d-none",qs.length!==0);
  $("#questionList").innerHTML=qs.map(renderQuestion).join("");
  bindQuestionButtons();
}

function renderQuestion(q,i){
  const a=state.answers[q.id];
  const revealed=!!a;
  return `<article class="question-card ${revealed?"answered":""}" id="question-${esc(q.id)}">
    <div class="q-head">
      <div><div class="q-title">${esc(q.title||`Question ${i+1}`)}</div><div class="q-meta">${esc(q.subject)}</div></div>
      <span class="q-number">Q${i+1}</span>
    </div>
    <div class="text-question">${esc(q.text||"")}</div>
    ${q.imageData?`<div class="diagram-public"><img src="${q.imageData}" alt="Question diagram"></div>`:""}
    <div class="options">${(q.options||[]).slice(0,4).map((o,j)=>`
      <button class="option-btn ${revealed?(a.selected===j?(j===+q.correct?"correct":"wrong"):""):""} ${revealed&&a.selected!==j&&j===+q.correct?"correct":""}"
        data-q="${esc(q.id)}" data-option="${j}" ${revealed?"disabled":""}>
        <span class="letter">${letters[j]}</span><span>${esc(o)}</span>
      </button>`).join("")}</div>
    <div class="feedback ${revealed?"show":""} ${revealed?(a.correct?"good":"bad"):""}">
      ${revealed?`<div class="result-title">${a.correct?"✓ Correct!":"✕ Incorrect"}</div>
      <div class="answer-line"><strong>Correct answer:</strong> ${letters[+q.correct]}. ${esc((q.options||[])[+q.correct]||"")}</div>
      ${q.explanation?`<div class="solution-box"><div class="solution-label"><i class="bi bi-lightbulb-fill"></i> Solution</div><div>${esc(q.explanation)}</div></div>`:""}`
      :""}
    </div>
    <div class="actions">
      <button class="share-btn" data-share="${esc(q.id)}"><i class="bi bi-share"></i> Share answer</button>
    </div>
  </article>`;
}

function bindQuestionButtons(){
  $$(".option-btn").forEach(b=>b.onclick=()=>{
    const q=state.questions[b.dataset.q];
    if(!q)return;
    const selected=Number(b.dataset.option);
    state.answers[q.id]={selected,correct:selected===Number(q.correct),subject:q.subject};
    render();
    requestAnimationFrame(()=>document.getElementById(`question-${q.id}`)?.scrollIntoView({behavior:"smooth",block:"center"}));
  });

  $$(".share-btn").forEach(b=>b.onclick=async()=>{
    const q=state.questions[b.dataset.share], a=state.answers[q.id];
    const url=location.href.split("#")[0]+"#q="+encodeURIComponent(q.id);
    const text=a
      ? `${q.title||"Question"} — My answer: ${letters[a.selected]}. ${a.correct?"Correct!":`Correct answer: ${letters[q.correct]}.`}`
      : `${q.title||"Question"} — Try this question!`;
    try{
      if(navigator.share) await navigator.share({title:"PCB Mock Arena",text,url});
      else {await navigator.clipboard.writeText(text+"\n"+url);showToast("Answer link copied!");}
    }catch(e){}
  });
}

function showToast(message){
  let t=$("#siteToast");
  if(!t){t=document.createElement("div");t.id="siteToast";t.className="site-toast";document.body.appendChild(t)}
  t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200);
}

$$(".nav-subject").forEach(b=>b.onclick=()=>{
  state.subject=b.dataset.subject;render();
  window.scrollTo({top:document.querySelector(".subject-strip").offsetTop-80,behavior:"smooth"});
});
$$("[data-scroll]").forEach(b=>b.onclick=()=>document.querySelector(b.dataset.scroll)?.scrollIntoView({behavior:"smooth"}));

const modal=new bootstrap.Modal("#adminModal");
function openAdmin(){modal.show()}
$("#adminBtn").onclick=openAdmin;
$("#heroAdmin").onclick=openAdmin;
$("#emptyAdmin").onclick=openAdmin;

$("#loginBtn").onclick=async()=>{
  if(!window.PCM?.firebaseReady){$("#loginMsg").textContent="Firebase is not configured.";return}
  try{
    await PCM.firebase.signIn($("#loginEmail").value.trim(),$("#loginPassword").value);
    $("#loginMsg").textContent="Logged in successfully.";
    $("#loginMsg").className="small mt-2 text-success";
  }catch(e){
    $("#loginMsg").textContent=e.message;
    $("#loginMsg").className="small mt-2 text-danger";
  }
};
$("#logoutBtn").onclick=()=>PCM.firebase.signOut();

$("#newQuestionBtn").onclick=clearForm;
$("#clearFormBtn").onclick=clearForm;

function clearForm(){
  $("#questionForm").reset();
  $("#questionId").value="";
  $("#qSubject").value=state.subject;
  $("#correct").value="0";
  $("#saveMsg").textContent="";
  $("#aiMsg").textContent="";
  $("#diagramPreview").innerHTML="";
  $("#removeDiagramBtn").classList.add("d-none");
  $("#questionForm").classList.remove("editing");
}

function fillForm(id){
  const q=state.questions[id];
  if(!q)return;
  $("#questionId").value=id;
  $("#qSubject").value=q.subject||state.subject;
  $("#qTitle").value=q.title||"";
  $("#qText").value=q.text||"";
  $("#optA").value=q.options?.[0]||"";
  $("#optB").value=q.options?.[1]||"";
  $("#optC").value=q.options?.[2]||"";
  $("#optD").value=q.options?.[3]||"";
  $("#correct").value=String(q.correct??0);
  $("#explanation").value=q.explanation||"";
  if(q.imageData){
    $("#diagramPreview").innerHTML=`<img src="${q.imageData}" alt="Diagram preview">`;
    $("#removeDiagramBtn").classList.remove("d-none");
  }else{
    $("#diagramPreview").innerHTML="";
    $("#removeDiagramBtn").classList.add("d-none");
  }
  $("#saveMsg").textContent="Editing existing question — make your corrections and save.";
  $("#saveMsg").className="small mt-2 text-primary";
  $("#questionForm").classList.add("editing");
  document.querySelector(".editor-card").scrollIntoView({behavior:"smooth"});
}

let diagramData=null;
$("#diagramImage").onchange=async e=>{
  const file=e.target.files[0];
  if(!file)return;
  try{
    diagramData=await compressImage(file,1200,0.72);
    $("#diagramPreview").innerHTML=`<img src="${diagramData}" alt="Diagram preview">`;
    $("#removeDiagramBtn").classList.remove("d-none");
  }catch(err){$("#saveMsg").textContent="Could not process the image.";$("#saveMsg").className="small mt-2 text-danger"}
};
$("#removeDiagramBtn").onclick=()=>{
  diagramData=null;$("#diagramImage").value="";$("#diagramPreview").innerHTML="";$("#removeDiagramBtn").classList.add("d-none");
};
function compressImage(file,maxWidth=1200,quality=.72){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        const scale=Math.min(1,maxWidth/img.width),c=document.createElement("canvas");
        c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);
        const ctx=c.getContext("2d");ctx.drawImage(img,0,0,c.width,c.height);
        resolve(c.toDataURL("image/jpeg",quality));
      };img.onerror=reject;img.src=reader.result;
    };reader.onerror=reject;reader.readAsDataURL(file);
  });
}

$("#questionForm").onsubmit=async e=>{
  e.preventDefault();
  if(!state.user||!window.PCM?.firebaseReady){$("#saveMsg").textContent="Please login as admin first.";return}
  const id=$("#questionId").value;
  const existing=id?state.questions[id]:{};
  const image=diagramData!==null?diagramData:(existing.imageData||"");
  const q={
    subject:$("#qSubject").value,
    title:$("#qTitle").value.trim(),
    text:$("#qText").value.trim(),
    options:[$("#optA").value.trim(),$("#optB").value.trim(),$("#optC").value.trim(),$("#optD").value.trim()],
    correct:Number($("#correct").value),
    explanation:$("#explanation").value.trim(),
    imageData:image
  };
  try{
    if(id) await PCM.dbFns.update(PCM.dbFns.ref(PCM.db,`questions/${id}`),q);
    else await PCM.dbFns.set(PCM.dbFns.push(PCM.dbFns.ref(PCM.db,"questions")),q);
    $("#saveMsg").textContent=id?"Question updated successfully!":"Question published successfully!";
    $("#saveMsg").className="small mt-2 text-success";
    clearForm();
  }catch(err){
    $("#saveMsg").textContent=err.message;
    $("#saveMsg").className="small mt-2 text-danger";
  }
};

function renderAdminList(){
  const list=allQuestions();
  $("#adminQuestionList").innerHTML=list.length?list.map(q=>`
    <div class="admin-row">
      <div><b>${esc(q.title||"Untitled")}</b><div class="small text-muted">${esc(q.subject)} ${q.imageData?"• diagram":""}</div></div>
      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-outline-primary rounded-pill" data-edit="${q.id}"><i class="bi bi-pencil"></i> Edit</button>
        <button class="btn btn-sm btn-outline-danger rounded-pill" data-delete="${q.id}"><i class="bi bi-trash"></i> Delete</button>
      </div>
    </div>`).join(""):`<div class="text-muted small py-3">No questions in the database yet.</div>`;
  $$("[data-edit]").forEach(b=>b.onclick=()=>fillForm(b.dataset.edit));
  $$("[data-delete]").forEach(b=>b.onclick=async()=>{
    if(confirm("Delete this question permanently?")) await PCM.dbFns.remove(PCM.dbFns.ref(PCM.db,`questions/${b.dataset.delete}`));
  });
}

function setEditor(q){
  $("#qSubject").value=q.subject||state.subject;
  $("#qTitle").value=q.title||"";
  $("#qText").value=q.text||"";
  $("#optA").value=q.options?.[0]||"";
  $("#optB").value=q.options?.[1]||"";
  $("#optC").value=q.options?.[2]||"";
  $("#optD").value=q.options?.[3]||"";
  $("#correct").value=String(q.correct??0);
  $("#explanation").value=q.explanation||"";
  diagramData=null;
}

$("#extractBtn").onclick=async()=>{
  const file=$("#aiImage").files[0];
  if(!file){$("#aiMsg").textContent="Choose a question screenshot first.";return}
  $("#aiMsg").textContent="Reading image…";
  try{
    const q=await extractQuestionWithOCR(file);
    setEditor(q);
    $("#aiMsg").textContent="Text extracted. Now manually check/edit the question, all four options, correct answer and solution before saving.";
    $("#qText").focus();
  }catch(e){$("#aiMsg").textContent=e.message}
};

async function extractQuestionWithOCR(file){
  if(!window.Tesseract)throw new Error("OCR library is still loading. Try again in a few seconds.");
  const result=await Tesseract.recognize(file,"eng",{logger:m=>{
    if(m.status)$("#aiMsg").textContent=`Reading image… ${Math.round((m.progress||0)*100)}%`;
  }});
  const text=result.data.text.trim();
  const lines=text.split(/\n+/).map(s=>s.trim()).filter(Boolean);
  const opt=[];
  for(const line of lines){
    const m=line.match(/^\s*([A-D])[\).\:\-]\s*(.+)$/i);
    if(m)opt["ABCD".indexOf(m[1].toUpperCase())]=m[2].trim();
  }
  const questionLines=lines.filter(x=>!/^\s*[A-D][\).\:\-]\s*/i.test(x));
  return {
    subject:state.subject,
    title:"OCR imported question",
    text:questionLines.join(" "),
    options:[opt[0]||"",opt[1]||"",opt[2]||"",opt[3]||""],
    correct:0,
    explanation:""
  };
}

$("#seedBtn").onclick=async()=>{
  if(!state.user||!PCM?.db){alert("Login as admin first.");return}
  if(!confirm("Add the 5 starter Chemistry questions? They will be added to the shared database."))return;
  for(const q of (window.STARTER_QUESTIONS||[])){
    await PCM.dbFns.set(PCM.dbFns.push(PCM.dbFns.ref(PCM.db,"questions")),q);
  }
  showToast("Starter questions added.");
};

window.addEventListener("questionsUpdated",e=>{
  state.questions=e.detail||{};
  render();
  if(state.user)renderAdminList();
});
window.addEventListener("authChanged",e=>{
  state.user=e.detail;
  $("#loginPanel").classList.toggle("d-none",!!state.user);
  $("#editorPanel").classList.toggle("d-none",!state.user);
  if(state.user)renderAdminList();
});

render();
