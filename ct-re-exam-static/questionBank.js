
window.CTRE = (() => {
  const CATEGORIES = [
    { key: "ownership", label: "Property Ownership" },
    { key: "landuse", label: "Land Use & Regulation" },
    { key: "valuation", label: "Valuation & Market Analysis" },
    { key: "financing", label: "Financing" },
    { key: "agency", label: "Agency" },
    { key: "disclosures", label: "Property Disclosures" },
    { key: "contracts", label: "Contracts" },
    { key: "leasing", label: "Leasing & Property Mgmt" },
    { key: "transfer", label: "Transfer of Title" },
    { key: "practice", label: "Practice of Real Estate" },
    { key: "math", label: "Real Estate Calculations" },
    { key: "ct_licensing", label: "CT Commission & Licensing" },
    { key: "ct_law", label: "CT Licensee Laws" },
    { key: "ct_agency", label: "CT Agency" },
    { key: "ct_practice", label: "CT Practice & Procedures" },
  ];
  const EXAMS = {
    national: { label: "National (80)", size: 80, minutes: 150, categories: [
      "ownership","landuse","valuation","financing","agency","disclosures","contracts","leasing","transfer","practice","math"
    ]},
    state: { label: "Connecticut State (30)", size: 30, minutes: 90, categories: [
      "ct_licensing","ct_law","ct_agency","ct_practice"
    ]},
  };
  const shuffle = (arr)=> arr.map(a=>[Math.random(),a]).sort((a,b)=>a[0]-b[0]).map(([,a])=>a);
  const sample = (arr,n)=> shuffle(arr).slice(0, Math.min(n, arr.length));
  const pick = (arr)=> arr[Math.floor(Math.random()*arr.length)];
  const num = (min,max)=> Math.floor(Math.random()*(max-min+1))+min;
  const money = (n)=> `$${n.toLocaleString()}`;
  const uniqueByStem = (arr)=>{ const s=new Set(), out=[]; for(const q of arr){ const k=`${q.category}|${q.stem}`; if(s.has(k))continue; s.add(k); out.push(q);} return out; };
  const buildSession = (poolAll, n)=>{
    const byStem = new Map();
    for(const q of poolAll){
      const k = `${q.category}|${q.stem}`;
      if(!byStem.has(k)) byStem.set(k, []);
      byStem.get(k).push(q);
    }
    const keys = shuffle([...byStem.keys()]);
    const take=[];
    for(const k of keys){ if(take.length>=n) break; take.push(pick(byStem.get(k))); }
    if(take.length < Math.min(n, poolAll.length)){
      const remaining = poolAll.filter(q=> !take.includes(q));
      take.push(...sample(remaining, Math.min(n - take.length, remaining.length)));
    }
    return take.slice(0, Math.min(n, poolAll.length));
  };
  function buildQuestionBank(){
    const bank=[];
    for(let i=0;i<30;i++){
      const stems = [
        { stem: 'Fee simple absolute is best described as:', choices: ['An estate that can be defeated upon an event','The most complete and indefinite form of ownership','A life estate measured by another\\'s life','A leasehold interest'], ans:1, ex:'Fee simple absolute conveys the maximum possible estate, of potentially infinite duration.' },
        { stem: 'Which tenancy includes right of survivorship for spouses in some states?', choices: ['Tenancy in common','Tenancy by the entirety','Periodic tenancy','Estate at sufferance'], ans:1, ex:'Tenancy by the entirety (where recognized) provides survivorship and protects against unilateral conveyance.' },
      ];
      const t = pick(stems);
      bank.push({ id:`own_${i}`, category:'ownership', stem:t.stem, choices:t.choices, answer:t.ans, explanation:t.ex });
    }
    for(let i=0;i<22;i++){
      const stems = [
        { stem:'A variance allows an owner to:', choices:['Change the zoning map','Deviate from a zoning requirement due to undue hardship','Ignore building codes','Create a new nonconforming use'], ans:1, ex:'A variance permits limited deviation from strict zoning due to hardship; it does not rezone the parcel.' },
        { stem:'A special use (conditional) permit is typically required for:', choices:['Prohibited uses','Uses compatible but needing additional review','Agricultural land only','Any residential remodel'], ans:1, ex:'Conditional uses fit the zoning\\'s intent but need conditions to mitigate impacts.' },
      ];
      const t = pick(stems);
      bank.push({ id:`land_${i}`, category:'landuse', stem:t.stem, choices:t.choices, answer:t.ans, explanation:t.ex });
    }
    for(let i=0;i<22;i++){
      const comp = num(280000,480000);
      const adjust = num(-20000,20000);
      const stem = `An appraiser uses the sales comparison approach. A comparable sold for ${money(comp)} and requires a net adjustment of ${adjust>0?'+':''}${money(adjust)}. What is the indicated value for the subject?`;
      const correct = comp + adjust;
      const wrong1 = correct + num(3000,8000);
      const wrong2 = correct - num(3000,8000);
      const wrong3 = comp;
      const choices = shuffle([money(correct), money(wrong1), money(wrong2), money(wrong3)]);
      bank.push({ id:`val_${i}`, category:'valuation', stem, choices, answer: choices.indexOf(money(correct)), explanation:'Sales comparison: start with the comparable\\'s price and apply net adjustments.' });
    }
    for(let i=0;i<25;i++){
      bank.push({ id:`fin_${i}`, category:'financing', stem:'Which mortgage clause lets a lender call the entire balance due upon default?', choices:['Defeasance','Acceleration','Alienation (due-on-sale)','Subordination'], answer:1, explanation:'Acceleration allows the lender to declare the full debt due after default.' });
    }
    for(let i=25;i<40;i++){
      const price = num(200000,600000);
      const rate = [4,4.5,5,5.5,6][i%5];
      const dpPct = [5,10,20][i%3];
      const dp = Math.round(price*dpPct/100);
      const loan = price - dp;
      const stem = `Buyer purchases at ${money(price)} with ${dpPct}% down, rate ${rate}%. Which figure is the loan amount used for financing disclosures?`;
      const choices = [money(loan), money(price), money(dp), money(Math.round(loan*0.97))].sort(()=>Math.random()-0.5);
      bank.push({ id:`fin_${i}`, category:'financing', stem, choices, answer: choices.indexOf(money(loan)), explanation:'Loan amount = price minus down payment.' });
    }
    for(let i=0;i<30;i++){
      const choices = ['Loyalty','Disclosure','Accounting','Reasonable care'];
      bank.push({ id:`ag_${i}`, category:'agency', stem:'Which fiduciary duty requires acting in the client\\'s best interests at all times, within the law?', choices, answer: choices.indexOf('Loyalty'), explanation:'Loyalty = putting the client\\'s interests above others within legal bounds.'});
    }
    for(let i=0;i<15;i++){
      bank.push({ id:`disc_${i}`, category:'disclosures', stem:'A latent defect is best described as a condition that is:', choices:['Obvious upon ordinary inspection','Hidden and not readily discoverable','Purely cosmetic','Exclusive to new construction'], answer:1, explanation:'Latent = hidden.'});
    }
    const contractStems = [
      {q:'A bilateral contract is formed when:',ch:['Only one party promises','Each party promises to perform','The agreement is notarized','There is no consideration'],ans:1,ex:'Bilateral = promise for a promise.'},
      {q:'Specific performance is:',ch:['Money damages','Court order to perform','Rescission','Novation'],ans:1,ex:'Specific performance compels performance when money is inadequate.'},
    ];
    for(let i=0;i<28;i++){ const t=pick(contractStems); bank.push({id:`con_${i}`,category:'contracts',stem:t.q,choices:t.ch,answer:t.ans,explanation:t.ex}); }
    for(let i=0;i<18;i++){
      bank.push({id:`lease_${i}`,category:'leasing',stem:'In a net lease, the tenant typically pays:',choices:['Base rent only','Some or all operating expenses','Principal and interest','A percentage of sales only'],answer:1,explanation:'NN/NNN pass expenses to tenant.'});
    }
    for(let i=0;i<20;i++){
      bank.push({id:`title_${i}`,category:'transfer',stem:'Which deed provides the broadest warranties to the grantee?',choices:['Quitclaim','General warranty','Special warranty','Bargain and sale'],answer:1,explanation:'General warranty offers the broadest warranties.'});
    }
    const practiceStems = [
      {q:'Steering is illegal because it:',ch:['Increases competition','Directs clients based on protected classes','Is price-fixing','Relates to appraisals'],ans:1,ex:'Steering channels buyers by protected class.'},
      {q:'Blockbusting refers to:',ch:['Price-fixing','Inducing sales by suggesting neighborhood decline due to protected classes','Tie-in agreements','Market allocation'],ans:1,ex:'Blockbusting is illegal.'}
    ];
    for(let i=0;i<25;i++){ const t=pick(practiceStems); bank.push({id:`prac_${i}`,category:'practice',stem:t.q,choices:t.ch,answer:t.ans,explanation:t.ex}); }
    for(let i=0;i<45;i++){
      const price = num(200000,800000);
      const comm = [5,5.5,6][i%3]/100;
      const side = [0.4,0.5,0.6][i%3];
      const totalComm = Math.round(price*comm);
      const sideAmt = Math.round(totalComm*side);
      const stem = `A property sells for ${money(price)} at a ${Math.round(comm*1000)/10}% commission split ${Math.round(side*100)}%/${Math.round((1-side)*100)}%. How much does the selling side receive before agent splits?`;
      const correct = sideAmt;
      const choices = [money(correct), money(totalComm), money(Math.round(correct*0.9)), money(Math.round(correct*1.1))].sort(()=>Math.random()-0.5);
      const answer = choices.indexOf(money(correct));
      bank.push({id:`math_${i}`,category:'math',stem,choices,answer,explanation:'Compute total commission then multiply by the selling-side split.'});
    }
    for(let i=0;i<70;i++){
      bank.push({id:`ctlic_${i}`,category:'ct_licensing',stem:'In Connecticut, licensing oversight and enforcement of real estate law is primarily conducted by the:',choices:['HUD','Connecticut Real Estate Commission','Fannie Mae','Local MLS'],answer:1,explanation:'CT Real Estate Commission oversees licensing and discipline.'});
    }
    const ctlawStems = [
      {q:'When must CT agency disclosures be presented to consumers?', ch:['At closing','Prior to substantive discussion about needs','Only for dual agency','After an offer is accepted'], ans:1, ex:'CT requires timely agency disclosure.'},
      {q:'In CT, commingling of client funds is:', ch:['Permitted with consent','Prohibited; client funds must be in a separate escrow account','Required for convenience','Only an issue for brokers'], ans:1, ex:'Client funds must be kept separate in escrow.'}
    ];
    for(let i=0;i<70;i++){ const t=pick(ctlawStems); bank.push({id:`ctlaw_${i}`,category:'ct_law',stem:t.q,choices:t.ch,answer:t.ans,explanation:t.ex}); }
    const ctagStems = [
      {q:'Dual agency in CT is:', ch:['Prohibited','Allowed only with informed written consent of all parties','Allowed without disclosure within the same firm','Only for commercial deals'], ans:1, ex:'Dual agency permitted with informed written consent.'},
      {q:'Designated agency in CT means:', ch:['No one is represented','Both clients are represented by the same individual agent','Different agents in the same brokerage are separately designated to represent each party','Only the broker of record is the agent'], ans:2, ex:'Different agents designated within one firm.'}
    ];
    for(let i=0;i<55;i++){ const t=pick(ctagStems); bank.push({id:`ctag_${i}`,category:'ct_agency',stem:t.q,choices:t.ch,answer:t.ans,explanation:t.ex}); }
    const ctpracStems = [
      {q:'CT residential property condition disclosures are:', ch:['Never required','Always required with no exemptions','Generally required with certain statutory exemptions (e.g., estates)','Only required for out-of-state owners'], ans:2, ex:'CT provides exemptions; otherwise disclosure applies.'},
      {q:'If a seller in CT refuses to provide a property condition disclosure, the buyer typically receives:', ch:['No remedy','A credit at closing as specified by statute','Seller financing','An automatic price reduction of 10%'], ans:1, ex:'CT statute provides a set credit if disclosure not delivered.'}
    ];
    for(let i=0;i<55;i++){ const t=pick(ctpracStems); bank.push({id:`ctprac_${i}`,category:'ct_practice',stem:t.q,choices:t.ch,answer:t.ans,explanation:t.ex}); }
    const nationalKeys = new Set(["ownership","landuse","valuation","financing","agency","disclosures","contracts","leasing","transfer","practice","math"]);
    const national = bank.filter(q=> nationalKeys.has(q.category));
    const state = bank.filter(q=> !nationalKeys.has(q.category));
    const balanceTo = (arr,target)=> arr.length>target? arr.slice(0,target): arr;
    const nat = balanceTo(national, 250);
    const st = balanceTo(state, 250);
    return [...nat, ...st].sort(()=>Math.random()-0.5).map((q,i)=> ({...q, id: q.id || `q_${i}`}));
  }
  const QUESTION_BANK = buildQuestionBank();

  function runSelfTests(){
    const errors=[];
    if (QUESTION_BANK.length !== 500) errors.push(`Bank should be 500, got ${QUESTION_BANK.length}`);
    const nationalKeys = new Set(["ownership","landuse","valuation","financing","agency","disclosures","contracts","leasing","transfer","practice","math"]);
    const nat = QUESTION_BANK.filter(q=> nationalKeys.has(q.category));
    const st = QUESTION_BANK.filter(q=> !nationalKeys.has(q.category));
    if (nat.length !== 250) errors.push(`National should be 250, got ${nat.length}`);
    if (st.length !== 250) errors.push(`State should be 250, got ${st.length}`);
    return { ok: errors.length===0, errors };
  }
  return { CATEGORIES, EXAMS, QUESTION_BANK, buildSession, runSelfTests };
})();
