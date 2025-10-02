
(function(){
  const el = (tag, props={}, ...children)=>{
    const n = document.createElement(tag);
    for(const [k,v] of Object.entries(props||{})){
      if (k==="className") n.className=v;
      else if (k==="style") Object.assign(n.style, v);
      else if (k.startsWith("on") && typeof v==="function") n.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k==="html") n.innerHTML = v;
      else n.setAttribute(k, v);
    }
    (children||[]).flat().forEach(c=> n.appendChild(typeof c==="string"? document.createTextNode(c): c));
    return n;
  };
  const save=(k,v)=> localStorage.setItem(k, JSON.stringify(v));
  const load=(k,d)=>{ try{ const r=JSON.parse(localStorage.getItem(k)||"null"); return r??d }catch{return d} };
  const app = document.getElementById("app");

  let dark = load("ui.dark", true); document.body.classList.toggle("light", !dark);
  let mode = "home";
  let selectedCategory = load("practice.category", CTRE.CATEGORIES[0].key);
  let questionCount = load("practice.count", 20);
  let subMode = null;

  let questions=[]; let currentIndex=0; let responses={}; let deadline=null; let startedAt=null; let qStart=Date.now(); let timerId=null;

  const fmtTime = (sec)=> sec==null? "—" : `${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")}`;
  const remainingSec = ()=> deadline? Math.max(0, Math.round((deadline - Date.now())/1000)) : null;
  const startTicker = ()=>{ if(timerId) clearInterval(timerId); if(!deadline) return; timerId=setInterval(()=>{ if(remainingSec()===0) submit(); render(); }, 250); };

  function startPractice(){
    const pool = CTRE.QUESTION_BANK.filter(q=> q.category===selectedCategory);
    const count = Math.max(5, Math.min(60, Number(questionCount)||20));
    questions = CTRE.buildSession(pool, count); responses={}; currentIndex=0;
    startedAt = Date.now(); const minutes = Math.max(1, Math.ceil(questions.length*1.5));
    deadline = Date.now() + minutes*60*1000; qStart = Date.now(); mode="practice";
    startTicker(); save("practice.category", selectedCategory); save("practice.count", questionCount); render();
  }
  function startExam(which){
    const plan = CTRE.EXAMS[which]; subMode=which;
    const pool = CTRE.QUESTION_BANK.filter(q=> plan.categories.includes(q.category));
    questions = CTRE.buildSession(pool, Math.min(plan.size, pool.length)); responses={}; currentIndex=0;
    startedAt = Date.now(); deadline = Date.now() + plan.minutes*60*1000; qStart=Date.now(); mode="exam";
    startTicker(); render();
  }
  function handleAnswer(qid, idx){
    const prev = responses[qid] || {choice:null, timeSec:0};
    responses[qid] = { choice: idx, timeSec: prev.timeSec + Math.round((Date.now()-qStart)/1000) };
    qStart = Date.now(); render();
  }
  function submit(){
    if(timerId) clearInterval(timerId);
    const end = Date.now();
    const items = questions.map(q=> {
      const r = responses[q.id] || {choice:null, timeSec:0};
      return {...q, choice:r.choice, isCorrect: r.choice===q.answer, timeSec:r.timeSec};
    });
    const correct = items.filter(i=>i.isCorrect).length;
    const durationSec = startedAt? Math.round((end-startedAt)/1000) : 0;
    const modeLabel = mode==="practice" ? `Practice: ${(CTRE.CATEGORIES.find(c=>c.key===selectedCategory)||{}).label || selectedCategory}` : (subMode ? CTRE.EXAMS[subMode].label : "Exam");
    lastReport = { items, correct, durationSec, modeLabel }; save("ctre.lastReport", lastReport); mode="results"; render();
  }
  let lastReport = load("ctre.lastReport", null);

  function Header(){
    return el("div", {className:"row", style:{alignItems:"center", justifyContent:"space-between"}},
      el("div", null, el("h1", null, "CT Real Estate Exam Trainer"), el("small", null, "National + CT • Timed exams • AI-style analysis • Wrong-answers review")),
      el("div", {className:"row", style:{gap:"8px"}},
        el("button", {className:"ghost", onclick:()=>{mode="formulas"; render();}}, "Formulas"),
        el("button", {onclick:()=>{ dark=!dark; document.body.classList.toggle("light", !dark); save("ui.dark", dark); render(); }}, dark? "Light Mode":"Dark Mode")
      )
    );
  }
  function Home(){
    const self = CTRE.runSelfTests();
    const catSel = el("select", {onchange:(e)=>{selectedCategory=e.target.value; render();}});
    CTRE.CATEGORIES.forEach(c=> catSel.appendChild(el("option", {value:c.key}, c.label)));
    catSel.value = selectedCategory;
    const nInp = el("input", {type:"number", min:"5", max:"60", value:String(questionCount), oninput:(e)=>{questionCount=Math.max(5, Math.min(60, Number(e.target.value)||20));}});
    return el("div", {className:"row"},
      el("div", {className:"card", style:{flex:"2", minWidth:"320px"}},
        el("h2", null, "Start Practicing"),
        el("div", {className:"grid-2"},
          el("label", {className:"card"}, el("div", null, "Category"), catSel),
          el("label", {className:"card"}, el("div", null, "# Questions (5–60)"), nInp)
        ),
        el("div", {className:"row", style:{marginTop:"12px", gap:"8px"}}, el("button", {className:"primary", onclick:startPractice}, "Start Practice")),
        el("div", {className:"hr"}),
        el("h2", null, "Full Exams"),
        el("div", {className:"grid-2"},
          el("div", {className:"card"}, el("div", null, el("strong", null, CTRE.EXAMS.national.label)), el("small", null, `Timer: ${CTRE.EXAMS.national.minutes} min`), el("br"), el("small", null, "Includes National topics"), el("br"), el("button", {className:"primary", style:{marginTop:"10px"}, onclick:()=>startExam("national")}, "Start National Exam")),
          el("div", {className:"card"}, el("div", null, el("strong", null, CTRE.EXAMS.state.label)), el("small", null, `Timer: ${CTRE.EXAMS.state.minutes} min`), el("br"), el("small", null, "Connecticut law & practice"), el("br"), el("button", {className:"primary", style:{marginTop:"10px"}, onclick:()=>startExam("state")}, "Start State Exam"))
        )
      ),
      el("div", {className:"card", style:{flex:"1", minWidth:"280px"}},
        el("h2", null, "Status"),
        self.ok? el("div", {className:"badge good"}, "Question bank OK")
               : el("div", null, el("div", {className:"badge bad"}, "Question bank issues")),
        el("div", {style:{marginTop:"12px"}}, el("div", null, el("span", {className:"badge"}, "Bank Size"), " 500"), el("div", {style:{marginTop:"6px"}}, el("span", {className:"badge"}, "Dark/Light"), " Toggle top-right"))
      )
    );
  }
  function QA(){
    const q = questions[currentIndex]; const rem = remainingSec();
    const choices = q.choices.map((ch, idx)=>{
      const lab = el("label", {className:"choice"},
        (function(){ const inp = el("input", {type:"radio", name:"q_"+q.id}); inp.checked = (responses[q.id]?.choice===idx); inp.addEventListener("change", ()=> handleAnswer(q.id, idx)); return inp; })(),
        el("div", null, ch)
      );
      return lab;
    });
    const answered = Object.keys(responses).length;
    const prevBtn = el("button", {onclick:()=>{ currentIndex=Math.max(0,currentIndex-1); qStart=Date.now(); render(); }, disabled: currentIndex===0}, "Previous");
    const nextBtn = el("button", {onclick:()=>{ currentIndex=Math.min(questions.length-1,currentIndex+1); qStart=Date.now(); render(); }, disabled: currentIndex===questions.length-1}, "Next");
    return el("div", {className:"row"},
      el("div", {className:"card", style:{flex:"2", minWidth:"320px"}},
        el("div", {className:"row", style:{justifyContent:"space-between"}},
          el("div", null, el("strong", null, mode==="practice" ? `Practice: ${(CTRE.CATEGORIES.find(c=>c.key===selectedCategory)||{}).label}` : (subMode ? CTRE.EXAMS[subMode].label : "Exam"))),
          el("div", null, el("span", {className:"badge warn"}, "Time: ", fmtTime(rem)))
        ),
        el("div", {className:"hr"}),
        el("div", {style:{marginBottom:"8px"}}, el("small", null, `Question ${currentIndex+1} / ${questions.length}`)),
        el("div", {style:{fontSize:"18px", margin:"8px 0 12px"}}, q.stem),
        el("div", {className:"row", style:{flexDirection:"column", gap:"8px"}}, ...choices),
        el("div", {className:"row", style:{marginTop:"12px", justifyContent:"space-between"}}, prevBtn, el("div", null, el("small", null, `Answered: ${answered}/${questions.length}`)), nextBtn),
        el("div", {className:"row", style:{marginTop:"12px", justifyContent:"flex-end"}}, el("button", {className:"primary", onclick:submit}, "Submit"))
      ),
      (function(){
        const pct = questions.length? Math.round(Object.keys(responses).length / questions.length * 100) : 0;
        return el("div", {className:"card", style:{flex:"1", minWidth:"280px"}},
          el("h2", null, "Navigator"),
          (function(){ const grid=el("div", {className:"navgrid"}); questions.forEach((qq,i)=>{ const b=el("button", {onclick:()=>{ currentIndex=i; qStart=Date.now(); render(); }}, String(i+1)); if(responses[qq.id]) b.style.borderColor="var(--accent)"; grid.appendChild(b);}); return grid; })(),
          el("div", {className:"hr"}),
          el("div", null, el("span", {className:"badge"}, "Progress"), ` ${pct}%`),
          el("div", {className:"progress", style:{marginTop:"6px"}}, el("div", {style:{width: pct+'%'}}))
        );
      })()
    );
  }
  function Results(){
    const res = lastReport;
    const byCat = {};
    res.items.forEach(i=>{ byCat[i.category]=(byCat[i.category]||{total:0,correct:0,time:0}); byCat[i.category].total++; if(i.isCorrect) byCat[i.category].correct++; byCat[i.category].time += i.timeSec||0; });
    const rows = Object.entries(byCat).map(([cat,v])=>({ category: (CTRE.CATEGORIES.find(c=>c.key===cat)||{}).label || cat, accuracy: Math.round((v.correct/v.total)*100), avg_time: v.total? Math.round(v.time/v.total):0})).sort((a,b)=> a.accuracy-b.accuracy);
    const wrongs = res.items.filter(i=>!i.isCorrect);
    return el("div", {className:"row"},
      el("div", {className:"card", style:{flex:"2"}},
        el("h2", null, "Results"),
        el("div", {className:"row", style:{justifyContent:"space-between"}}, el("div", null, el("span", {className:"badge"}, res.modeLabel)), el("div", null, el("span", {className:"badge"}, "Time: ", fmtTime(res.durationSec)))),
        el("div", {className:"hr"}),
        el("div", {className:"row", style:{gap:"8px"}}, el("div", {className:"badge good"}, `Correct: ${res.correct}`), el("div", {className:"badge bad"}, `Incorrect: ${res.items.length-res.correct}`), el("div", {className:"badge"}, `Total: ${res.items.length}`)),
        el("details", {style:{marginTop:"12px"}}, el("summary", null, el("strong", null, "Show AI-style analysis")), el("div", {className:"hr"}), ...rows.map(r=> el("div", {style:{margin:"6px 0"}}, el("div", null, `${r.category} — ${r.accuracy}% (avg ${r.avg_time}s)`), el("div", {className:"bar", style:{width: Math.max(4,r.accuracy)+'%'}})))),
        el("details", {style:{marginTop:"12px"}}, el("summary", null, el("strong", null, "Review wrong answers only")), el("div", {className:"hr"}), ...wrongs.map((i,idx)=> el("div", {className:"card", style:{marginBottom:"8px"}}, el("div", null, el("small", null, (CTRE.CATEGORIES.find(c=>c.key===i.category)||{}).label || i.category)), el("div", {style:{margin:"6px 0 8px"}}, i.stem), el("div", {className:"row", style:{flexDirection:"column", gap:"6px"}}, ...i.choices.map((ch,j)=> el("div", {className: j===i.answer? "choice correct" : (j===i.choice? "choice wrong":"choice")}, el("div", null, ch)))), el("div", {style:{marginTop:"6px"}}, el("small", {className:"badge"}, "Explanation"), " ", el("div", {style:{marginTop:"6px"}}, i.explanation))))),
        el("div", {className:"row", style:{marginTop:"12px", justifyContent:"space-between"}}, el("button", {onclick:()=>{mode="home"; render();}}, "Back Home"), el("button", {className:"primary", onclick:()=>{ const blob=new Blob([JSON.stringify(res,null,2)], {type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='results.json'; a.click(); URL.revokeObjectURL(url);} }, "Export Results JSON"))
      ),
      el("div", {className:"card", style:{flex:"1"}}, el("h2", null, "Tips"), el("ul", null, el("li", null, "Pace yourself: ~1–2 minutes per question."), el("li", null, "Flag tough items and keep moving."), el("li", null, "Study lowest-scoring categories first.")))
    );
  }
  function Formulas(){
    return el("div", {className:"card"},
      el("h2", null, "Formulas & Math Notes"),
      el("ul", null,
        el("li", null, "Commission = Price × Commission%"),
        el("li", null, "Seller Net ≈ Price − (Commission + Closing Costs + Payoffs)"),
        el("li", null, "Loan Amount = Price − Down Payment"),
        el("li", null, "LTV = Loan ÷ Value"),
        el("li", null, "Debt Service = P&I; use mortgage factor tables or calc"),
        el("li", null, "Gross Rent Multiplier (GRM) = Price ÷ Gross Rent"),
        el("li", null, "Cap Rate = NOI ÷ Value"),
        el("li", null, "Value (Income approach) = NOI ÷ Cap Rate"),
        el("li", null, "Points ≈ Loan × 1%"),
        el("li", null, "Property tax ≈ Assessed Value × Mill Rate")
      ),
      el("div", {className:"row", style:{marginTop:"12px", justifyContent:"space-between"}},
        el("button", {onclick:()=>{ mode="home"; render();}}, "Back"),
        el("a", {className:"link", href:"https://portal.ct.gov/DCP/Real-Estate-Division/Real-Estate", target:"_blank", rel:"noreferrer"}, "CT RE Official Resources →")
      )
    );
  }
  function Layout(content){ return el("div", null, Header(), content); }
  function render(){ app.innerHTML=""; let c=null; if(mode==="home") c=Home(); else if((mode==="practice"||mode==="exam") && questions[currentIndex]) c=QA(); else if(mode==="results" && lastReport) c=Results(); else if(mode==="formulas") c=Formulas(); app.appendChild(Layout(c||el("div", null))); }

  render();
})();
