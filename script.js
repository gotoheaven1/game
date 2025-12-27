const CONFIG = { tickRate: 800, maxPopulation: 25 };

// --- 데이터 정의 ---
const TRAITS = {
    WORKAHOLIC: { name: "💼 워커홀릭", weights: { work: 2.5, love: 0.5 }, desc: "일 중독" },
    ROMANTIC: { name: "💖 로맨틱", weights: { love: 3.0, social: 2.0 }, desc: "사랑꾼" },
    PSYCHO: { name: "🔪 사이코패스", weights: { crime: 3.0, moral: -2.0, love: -1.0 }, desc: "위험인물" },
    JUSTICE: { name: "⚖️ 정의의 사도", weights: { crime: -5.0, justice: 2.0 }, desc: "법 집행자" },
    FAMILY: { name: "👨‍👩‍👧‍👦 가정적", weights: { family: 3.0, work: 1.0 }, desc: "가족 우선" },
    LONER: { name: "🌑 아싸", weights: { social: 0.1, love: 0.5 }, desc: "혼자 놀기" }
};

const JOBS = {
    STUDENT: { name: "🎒 학생", salary: 0 },
    UNEMPLOYED: { name: "🛋️ 백수", salary: 0 },
    DEV: { name: "👨‍💻 개발자", salary: 35000 },
    POLICE: { name: "👮 경찰", salary: 35000 },
    MAFIA: { name: "🕶 마피아", salary: 60000 },
    JUDGE: { name: "👨‍⚖️ 판사", salary: 80000 },
    IDOL: { name: "🎤 아이돌", salary: 100000 },
    DOCTOR: { name: "👨‍⚕️ 의사", salary: 90000 }
};

const LOCATIONS = {
    HOME: "🏠 집", WORK: "🏢 회사", PARK: "🌳 공원", 
    STORE: "🏪 상점", SLUM: "💀 뒷골목", STATION: "🚓 경찰서", HOTEL: "🏩 호텔", HOSPITAL: "🏥 병원"
};

let POPULATION = [];
let FOCUSED_SIM_INDEX = 0;
let SIM_ID_COUNTER = 0;

// --- Sim Class ---
class Sim {
    constructor(name, traitKey, jobKey, parents = []) {
        this.id = SIM_ID_COUNTER++;
        this.name = name;
        this.age = parents.length > 0 ? 0 : 20 + Math.floor(Math.random()*10); 
        this.money = parents.length > 0 ? 0 : 30000;
        
        // 성격
        if (parents.length > 0) {
            this.traitKey = Math.random() > 0.5 ? parents[0].traitKey : parents[1].traitKey;
        } else {
            this.traitKey = traitKey || this.randomKey(TRAITS);
        }
        this.trait = TRAITS[this.traitKey];

        // 직업
        this.jobKey = jobKey || (parents.length > 0 ? 'STUDENT' : 'UNEMPLOYED');
        this.job = JOBS[this.jobKey];

        // 스탯
        this.stats = { hunger: 80, energy: 80, love: 50, social: 50, moral: 60 };
        this.location = 'HOME';
        this.isBusy = false;
        
        // 관계
        this.relationships = {}; // { id: score }
        this.spouseId = null;
        this.parentIds = parents.map(p => p.id);
        this.childrenIds = [];
    }

    randomKey(obj) { const k = Object.keys(obj); return k[Math.floor(Math.random() * k.length)]; }

    updateTick() {
        this.age += 0.05;
        if (this.jobKey === 'STUDENT' && this.age > 20) {
            this.jobKey = 'UNEMPLOYED'; 
            this.job = JOBS[this.jobKey]; // 직업 데이터 갱신
            addLog(`🎓 ${this.name} 성인이 되었습니다!`, 'log-highlight');
        }

        this.stats.hunger -= 0.5;
        this.stats.energy -= 0.3;
        this.stats.love -= 0.3;
        
        if (this.jobKey === 'MAFIA') this.stats.moral -= 0.1;
        else if (this.stats.moral < 100) this.stats.moral += 0.1;

        this.limitStats();
    }

    limitStats() {
        for (let k in this.stats) this.stats[k] = Math.max(0, Math.min(100, this.stats[k]));
    }

    decide() {
        if (this.isBusy) return;

        let needs = [
            { type: 'survival', val: (100 - this.stats.hunger) + (100 - this.stats.energy) },
            { type: 'romance', val: (100 - this.stats.love) * (this.spouseId ? 2 : 1.2) },
            { type: 'work', val: (this.money < 5000 ? 150 : 20) },
        ];

        needs.sort((a, b) => b.val - a.val);
        let top = needs[0];
        
        this.logThought(top);

        if (top.type === 'survival') {
            if (this.stats.hunger < 40) this.runAction('eat', 'HOME');
            else this.runAction('sleep', 'HOME');
        } else if (top.type === 'romance') {
            this.tryRomance();
        } else if (top.type === 'work' && this.jobKey !== 'UNEMPLOYED') {
            this.runAction('work', 'WORK');
        } else {
            this.runAction('idle', 'PARK');
        }
    }

    // --- Actions ---
    runAction(type, loc) {
        if (this.location !== loc) return this.moveTo(loc);
        this.isBusy = true;
        let t = "", d = 2000;
        switch(type) {
            case 'eat': t="식사 중"; this.stats.hunger=100; this.money-=500; break;
            case 'sleep': t="수면 중"; d=4000; this.stats.energy=100; break;
            case 'work': t="업무 처리"; d=3000; this.money+=this.job.salary/5; this.stats.energy-=20; break;
            case 'idle': t="산책"; this.stats.love+=5; break;
        }
        if(this.isFocused()) updateActionUI(t, d);
        setTimeout(()=>this.isBusy=false, d);
    }

    moveTo(loc) {
        this.isBusy = true;
        if(this.isFocused()) updateActionUI(`이동: ${LOCATIONS[loc]}`, 1000);
        setTimeout(() => { this.location = loc; this.isBusy = false; }, 1000);
    }

    tryRomance() {
        let target;
        if (this.spouseId !== null) target = POPULATION.find(s => s.id === this.spouseId);
        else target = POPULATION.find(s => s.id !== this.id && !s.spouseId && !this.isFamily(s) && Math.abs(s.age - this.age) < 15);

        if (!target) { this.runAction('idle', 'PARK'); return; }
        if (this.location !== target.location) return this.moveTo(target.location);

        this.isBusy = true;
        let event = "데이트";
        let score = 5;

        if (this.spouseId === target.id) {
            if (Math.random() < 0.2 && POPULATION.length < CONFIG.maxPopulation) {
                event = "2세 계획";
                setTimeout(() => this.reproduce(target), 3000);
            }
        } else if (this.getRel(target.id) > 70 && this.money > 20000) {
            event = "청혼";
            this.money -= 10000;
            setTimeout(() => this.marry(target), 2000);
        }

        if(this.isFocused()) updateActionUI(`${target.name}와 ${event}`, 2000);
        setTimeout(() => {
            this.modifyRel(target.id, score); target.modifyRel(this.id, score);
            this.stats.love = 100; this.isBusy = false;
        }, 2000);
    }

    marry(target) {
        this.spouseId = target.id; target.spouseId = this.id;
        addLog(`💒 ${this.name} ❤️ ${target.name} 결혼!`, 'log-highlight');
        updateUI();
    }

    reproduce(spouse) {
        let babyName = this.name[0] + spouse.name[0] + "베이비";
        let baby = new Sim(babyName, null, null, [this, spouse]);
        POPULATION.push(baby);
        this.childrenIds.push(baby.id); spouse.childrenIds.push(baby.id);
        addLog(`👶 ${babyName} 탄생! (${this.name}, ${spouse.name})`, 'log-highlight');
        renderSelector();
    }

    // Utils
    isFamily(t) { return this.parentIds.includes(t.id) || this.childrenIds.includes(t.id); }
    modifyRel(id, v) { this.relationships[id] = (this.relationships[id]||0) + v; }
    getRel(id) { return this.relationships[id] || 0; }
    isFocused() { return this.id === POPULATION[FOCUSED_SIM_INDEX].id; }
    logThought(n) { if(this.isFocused()) document.getElementById('thought-process').innerText = `💭 ${n.type} 필요`; }
}

// --- Save & Load System ---
function saveGame() {
    const saveData = {
        population: POPULATION,
        idCounter: SIM_ID_COUNTER,
        focusedIndex: FOCUSED_SIM_INDEX
    };
    localStorage.setItem('simWorldSave', JSON.stringify(saveData));
    addLog("💾 게임이 저장되었습니다.", "log-highlight");
    alert("게임 저장 완료!");
}

function loadGame() {
    const rawData = localStorage.getItem('simWorldSave');
    if (!rawData) return alert("저장된 데이터가 없습니다.");

    const data = JSON.parse(rawData);
    SIM_ID_COUNTER = data.idCounter;
    FOCUSED_SIM_INDEX = data.focusedIndex || 0;

    // 객체 복원 (Plain Object -> Sim Instance)
    POPULATION = data.population.map(pData => {
        // 더미로 생성 후 속성 덮어쓰기
        const sim = new Sim(pData.name, pData.traitKey, pData.jobKey);
        Object.assign(sim, pData);
        // 저장되지 않는 정적 데이터 재연결
        sim.trait = TRAITS[sim.traitKey];
        sim.job = JOBS[sim.jobKey];
        return sim;
    });

    renderSelector();
    updateUI();
    addLog("📂 게임을 불러왔습니다.", "log-highlight");
}

function resetGame() {
    if(confirm("모든 데이터가 삭제되고 초기화됩니다. 계속하시겠습니까?")) {
        localStorage.removeItem('simWorldSave');
        location.reload();
    }
}

// --- Initialization & UI ---
function initWorld() {
    // 저장된 데이터 확인 없이 일단 기본 실행 (유저가 Load 버튼 눌러야 함)
    // 만약 자동 로드를 원하면 여기서 loadGame() 호출
    POPULATION.push(new Sim("아담", "WORKAHOLIC", "DEV"));
    POPULATION.push(new Sim("이브", "ROMANTIC", "IDOL"));
    POPULATION[0].money = 50000;
    
    // 모달 옵션 세팅
    const tSel = document.getElementById('new-sim-trait');
    for(let k in TRAITS) tSel.innerHTML += `<option value="${k}">${TRAITS[k].name}</option>`;
    
    const jSel = document.getElementById('new-sim-job');
    for(let k in JOBS) {
        if(k === 'STUDENT') continue;
        jSel.innerHTML += `<option value="${k}">${JOBS[k].name}</option>`;
    }

    renderSelector();
}

function renderSelector() {
    const sel = document.getElementById('sim-selector');
    sel.innerHTML = "";
    POPULATION.forEach((p, i) => {
        let opt = document.createElement('option');
        opt.value = i;
        opt.innerText = `${p.name} (${Math.floor(p.age)}세)`;
        if(i == FOCUSED_SIM_INDEX) opt.selected = true;
        sel.appendChild(opt);
    });
}

document.getElementById('sim-selector').addEventListener('change', (e) => {
    FOCUSED_SIM_INDEX = parseInt(e.target.value);
    updateUI();
});

function toggleCreator() {
    const modal = document.getElementById('creator-modal');
    modal.classList.toggle('hidden');
    if(!modal.classList.contains('hidden')) document.getElementById('new-sim-name').value = '';
}

function createNewSim() {
    const name = document.getElementById('new-sim-name').value;
    const trait = document.getElementById('new-sim-trait').value;
    const job = document.getElementById('new-sim-job').value;

    if(!name) return alert("이름을 입력해주세요!");

    const newSim = new Sim(name, trait, job);
    POPULATION.push(newSim);
    
    addLog(`✨ [창조] 플레이어가 ${name}을(를) 추가했습니다!`, 'log-highlight');
    renderSelector();
    toggleCreator();
    
    FOCUSED_SIM_INDEX = POPULATION.length - 1;
    document.getElementById('sim-selector').value = FOCUSED_SIM_INDEX;
    updateUI();
}

function updateUI() {
    const sim = POPULATION[FOCUSED_SIM_INDEX];
    if (!sim) return;

    document.getElementById('sim-name').innerText = sim.name;
    document.getElementById('sim-age').innerText = `${Math.floor(sim.age)}세`;
    document.getElementById('sim-job').innerText = sim.job.name;
    document.getElementById('sim-trait').innerText = sim.trait.name;
    document.getElementById('money-text').innerText = Math.floor(sim.money).toLocaleString() + " ₩";
    document.getElementById('current-location').innerText = LOCATIONS[sim.location];

    // Family UI
    const fList = document.getElementById('family-list');
    fList.innerHTML = '';
    if(sim.spouseId !== null) {
        let sp = POPULATION.find(s=>s.id===sim.spouseId);
        if(sp) fList.innerHTML += `<span class="fam-badge rel-spouse">💍 ${sp.name}</span>`;
    }
    sim.childrenIds.forEach(id => {
        let c = POPULATION.find(s=>s.id===id);
        if(c) fList.innerHTML += `<span class="fam-badge">👶 ${c.name}</span>`;
    });
    if(fList.innerHTML === '') fList.innerText = "가족 없음";

    // Bars
    document.getElementById('hunger-bar').style.width = `${sim.stats.hunger}%`;
    document.getElementById('energy-bar').style.width = `${sim.stats.energy}%`;
    document.getElementById('love-bar').style.width = `${sim.stats.love}%`;
    document.getElementById('moral-bar').style.width = `${sim.stats.moral}%`;

    // Relations
    const list = document.getElementById('relationship-list');
    list.innerHTML = '';
    POPULATION.forEach(t => {
        if(t.id === sim.id) return;
        const score = sim.getRel(t.id);
        if(score === 0 && !sim.isFamily(t)) return;

        let badge = '😐';
        if(score > 50) badge = '❤️';
        if(t.id === sim.spouseId) badge = '💍';

        let li = document.createElement('li');
        li.className = 'rel-card';
        li.innerHTML = `<span>${t.name} ${badge}</span> <span style="font-size:0.8em; color:#888">${Math.floor(score)}</span>`;
        list.appendChild(li);
    });
}

function updateActionUI(text, d) {
    document.getElementById('action-text').innerText = text;
    const l = document.getElementById('action-loader');
    l.style.width = '0%'; l.style.transition = 'none';
    requestAnimationFrame(() => { l.style.transition = `width ${d}ms linear`; l.style.width = '100%'; });
}

function addLog(msg, cls) {
    const list = document.getElementById('event-log');
    const li = document.createElement('li');
    if (cls) li.className = cls;
    li.innerText = `[${new Date().toLocaleTimeString().split(' ')[0]}] ${msg}`;
    list.prepend(li);
    if (list.children.length > 15) list.lastChild.remove();
}

// Start
initWorld();
setInterval(() => {
    POPULATION.forEach(sim => { sim.updateTick(); sim.decide(); });
    updateUI();
}, CONFIG.tickRate);
