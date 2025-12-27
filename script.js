const CONFIG = { tickRate: 800, maxPopulation: 15 }; // 인구 과잉 방지

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
    STUDENT: { name: "🎒 학생", salary: 0, power: 0 }, // 신규 직업
    UNEMPLOYED: { name: "백수", salary: 0, power: 0 },
    DEV: { name: "👨‍💻 개발자", salary: 35000, power: 1 },
    POLICE: { name: "👮 경찰", salary: 35000, power: 5 },
    MAFIA: { name: "🕶 마피아", salary: 60000, power: 3 },
    JUDGE: { name: "👨‍⚖️ 판사", salary: 80000, power: 10 }
};

const LOCATIONS = {
    HOME: "🏠 집", WORK: "🏢 회사", PARK: "🌳 공원", 
    STORE: "🏪 상점", SLUM: "💀 뒷골목", STATION: "🚓 경찰서", COURT: "⚖️ 법원", PRISON: "🔒 감옥", HOTEL: "🏩 호텔"
};

const ITEMS = {
    COFFEE: { name: "☕ 커피", cost: 500, type: 'consumable', effect: { energy: 30 } },
    RING: { name: "💍 결혼반지", cost: 30000, type: 'gift', effect: { rel: 100 } }, // 청혼용
    FLOWER: { name: "💐 꽃다발", cost: 3000, type: 'gift', effect: { rel: 30 } }
};

let POPULATION = [];
let FOCUSED_SIM_INDEX = 0;
let SIM_ID_COUNTER = 0;

// --- 심 클래스 ---
class Sim {
    constructor(name, traitKey, jobKey, parents = []) {
        this.id = SIM_ID_COUNTER++;
        this.name = name;
        this.age = 0; // 나이 추가
        this.money = parents.length > 0 ? 0 : 20000; // 부모 있으면 0원 시작(용돈 받아야 함)
        
        // 유전 성격 (부모 중 하나 혹은 랜덤)
        if (parents.length > 0) {
            this.traitKey = Math.random() > 0.5 ? parents[0].traitKey : parents[1].traitKey;
        } else {
            this.traitKey = traitKey || this.randomTrait();
        }
        this.trait = TRAITS[this.traitKey];

        this.jobKey = jobKey || (parents.length > 0 ? 'STUDENT' : this.recommendJob());
        this.job = { ...JOBS[this.jobKey] };

        this.stats = { hunger: 80, energy: 80, hygiene: 80, love: 50, social: 50, moral: 60 };
        
        this.location = 'HOME';
        this.isBusy = false;
        this.criminalRecord = 0;
        this.jailTime = 0;
        this.inventory = [];
        
        // 인간관계 및 가족
        this.relationships = {}; 
        this.spouseId = null; // 배우자 ID
        this.parentIds = parents.map(p => p.id); // 부모 IDs
        this.childrenIds = []; // 자녀 IDs
    }

    randomTrait() { const k = Object.keys(TRAITS); return k[Math.floor(Math.random() * k.length)]; }
    
    recommendJob() {
        if (this.traitKey === 'PSYCHO') return 'MAFIA';
        return Math.random() > 0.4 ? 'DEV' : 'UNEMPLOYED';
    }

    updateTick() {
        if (this.jailTime > 0) return this.handleJail();

        // 틱마다 0.1세 증가 (빠른 진행)
        this.age += 0.05; 
        if (this.jobKey === 'STUDENT' && this.age > 20) {
            this.jobKey = this.recommendJob(); // 성인 되면 취업
            this.job = JOBS[this.jobKey];
            addLog(`🎓 ${this.name}이(가) 성인이 되어 ${this.job.name}이 되었습니다!`);
        }

        this.stats.hunger -= 0.5;
        this.stats.energy -= 0.3;
        this.stats.love -= 0.4; // 사랑 욕구 자연 감소
        
        if (this.jobKey === 'MAFIA') this.stats.moral -= 0.1;
        else if (this.stats.moral < 100) this.stats.moral += 0.1;

        this.limitStats();
    }

    handleJail() {
        this.jailTime--;
        this.stats.love -= 1.0;
        if (this.jailTime <= 0) {
            this.location = 'HOME';
            this.jailTime = 0;
            addLog(`🔓 ${this.name} 출소했습니다.`);
        }
    }

    limitStats() {
        for (let k in this.stats) this.stats[k] = Math.max(0, Math.min(100, this.stats[k]));
    }

    decide() {
        if (this.isBusy || this.jailTime > 0) return;

        // 욕구 우선순위 계산
        let needs = [
            { type: 'survival', val: (100 - this.stats.hunger) + (100 - this.stats.energy) },
            { type: 'romance', val: (100 - this.stats.love) * (this.spouseId ? 2 : 1.5) }, // 배우자 있으면 더 중요
            { type: 'family', val: this.parentIds.length > 0 && this.money < 1000 ? 100 : 0 }, // 용돈 받기
            { type: 'work', val: (this.money < 5000 ? 150 : 0) },
            { type: 'crime', val: (100 - this.stats.moral) * (this.trait.weights.crime || 1) },
        ];

        needs.sort((a, b) => b.val - a.val);
        let top = needs[0];
        
        this.logThought(top);

        if (top.type === 'survival') {
            if (this.stats.hunger < 30) this.runAction('eat', 'HOME');
            else this.runAction('sleep', 'HOME');
        }
        else if (top.type === 'romance') {
            this.tryRomance();
        }
        else if (top.type === 'family') {
            this.askForMoney();
        }
        else if (top.type === 'work') {
            if(this.jobKey !== 'UNEMPLOYED' && this.jobKey !== 'STUDENT') this.runAction('work', 'WORK');
            else this.runAction('idle', 'PARK');
        }
        else if (top.type === 'crime' && top.val > 60) {
            this.tryCommitCrime();
        }
        else {
            this.runAction('idle', 'PARK');
        }
    }

    // --- 로맨스 & 가족 시스템 ---
    tryRomance() {
        // 대상: 배우자 우선, 없으면 호감도 높은 솔로
        let target;
        if (this.spouseId !== null) {
            target = POPULATION.find(s => s.id === this.spouseId);
        } else {
            let candidates = POPULATION.filter(s => s.id !== this.id && s.spouseId === null && !this.isFamily(s));
            target = candidates.sort((a, b) => this.getRel(b.id) - this.getRel(a.id))[0];
        }

        if (!target) { this.runAction('idle', 'PARK'); return; }

        if (this.location !== target.location) return this.moveTo(target.location);
        this.isBusy = true;

        // 관계 진전 로직
        let rel = this.getRel(target.id);
        let event = "데이트";
        let score = 10;
        let time = 2000;

        if (this.spouseId === target.id) {
            // 부부라면: 아기 만들기 시도
            if (Math.random() < 0.3 && POPULATION.length < CONFIG.maxPopulation) {
                event = "👩‍❤️‍👨 2세 계획";
                this.location = 'HOTEL';
                setTimeout(() => this.reproduce(target), 3000);
                time = 3000;
            } else {
                event = "💑 데이트";
                score = 5;
            }
        } else if (rel > 80 && this.money > 30000) {
            // 미혼 & 호감도 높음 & 돈 있음 -> 청혼
            event = "💍 청혼";
            this.money -= 30000; // 반지 값
            setTimeout(() => this.marry(target), 2000);
        } else {
            // 썸타기
            event = "💖 썸타기";
        }

        if(this.isFocused()) updateActionUI(`${target.name}와 ${event}`, time);
        
        setTimeout(() => {
            this.modifyRel(target.id, score);
            target.modifyRel(this.id, score);
            this.stats.love = 100;
            target.stats.love = 100;
            this.isBusy = false;
        }, time);
    }

    marry(target) {
        if (target.spouseId !== null) return; // 이미 결혼함
        this.spouseId = target.id;
        target.spouseId = this.id;
        addLog(`💒 [결혼] ${this.name} ❤️ ${target.name} 부부가 되었습니다!`, 'log-pink');
        updateUI();
    }

    reproduce(spouse) {
        let babyName = this.name.charAt(0) + spouse.name.charAt(0) + "주니어";
        let baby = new Sim(babyName, null, null, [this, spouse]);
        
        this.childrenIds.push(baby.id);
        spouse.childrenIds.push(baby.id);
        POPULATION.push(baby);

        // UI 셀렉터 업데이트
        let sel = document.getElementById('sim-selector');
        let opt = document.createElement('option');
        opt.value = POPULATION.length - 1;
        opt.innerText = baby.name;
        sel.appendChild(opt);

        addLog(`👶 [탄생] ${this.name}와 ${spouse.name} 사이에서 ${babyName} 탄생!`, 'log-gold');
    }

    askForMoney() {
        let parent = POPULATION.find(s => this.parentIds.includes(s.id));
        if (!parent) return;
        
        if (this.location !== parent.location) return this.moveTo(parent.location);
        this.isBusy = true;
        
        if(this.isFocused()) updateActionUI(`부모님 용돈 주세요...`, 1500);
        setTimeout(() => {
            if (parent.money > 5000) {
                let amount = 2000;
                parent.money -= amount;
                this.money += amount;
                addLog(`💸 ${this.name}이(가) ${parent.name}에게 용돈을 받았습니다.`);
            } else {
                addLog(`💧 ${parent.name}: "나도 돈이 없다..."`);
            }
            this.isBusy = false;
        }, 1500);
    }

    // --- 유틸리티 ---
    isFamily(target) {
        return this.parentIds.includes(target.id) || 
               this.childrenIds.includes(target.id) || 
               (this.parentIds.length > 0 && this.parentIds.some(pid => target.parentIds.includes(pid))); // 형제
    }

    runAction(type, loc) {
        if (this.location !== loc) return this.moveTo(loc);
        this.isBusy = true;
        let t = "", d = 2000;
        switch(type) {
            case 'eat': t="식사 중"; this.stats.hunger=100; this.money-=500; break;
            case 'sleep': t="수면 중"; d=4000; this.stats.energy=100; break;
            case 'work': t="근무 중"; d=3000; this.money+=this.job.salary/5; this.stats.energy-=20; break;
            case 'idle': t="휴식 중"; this.stats.love+=5; break;
        }
        if(this.isFocused()) updateActionUI(t, d);
        setTimeout(()=>this.isBusy=false, d);
    }

    moveTo(loc) {
        this.isBusy = true;
        if(this.isFocused()) updateActionUI(`이동: ${LOCATIONS[loc]}`, 1000);
        setTimeout(() => { this.location = loc; this.isBusy = false; }, 1000);
    }

    tryCommitCrime() {
        // 기존 범죄 로직 간소화 유지
        if (this.location !== 'SLUM') return this.moveTo('SLUM');
        this.isBusy = true;
        let target = POPULATION.find(s => s.id !== this.id && s.jailTime===0 && !this.isFamily(s)); // 가족은 안 텀
        if (!target) { this.isBusy=false; return; }
        
        setTimeout(() => {
             if (Math.random() < 0.4) {
                this.location = 'PRISON'; this.jailTime = 10;
                addLog(`👮 ${this.name} 체포됨!`);
             } else {
                this.money += 3000; target.money -= 3000; this.stats.moral -= 10;
                addLog(`🦹 ${this.name} -> ${target.name} 지갑 털기 성공!`);
             }
             this.isBusy = false;
        }, 2000);
    }

    modifyRel(id, val) { 
        if(!this.relationships[id]) this.relationships[id]=0; 
        this.relationships[id] += val; 
    }
    getRel(id) { return this.relationships[id] || 0; }
    isFocused() { return this.id === POPULATION[FOCUSED_SIM_INDEX].id; }
    logThought(n) { 
        if(this.isFocused()) document.getElementById('thought-process').innerText = `💭 ${n.type} 욕구 강함`; 
    }
}

// --- 엔진 ---
function initWorld() {
    // 초기 아담과 이브 생성
    POPULATION.push(new Sim("아담", "WORKAHOLIC", "DEV"));
    POPULATION.push(new Sim("이브", "ROMANTIC", "DEV"));
    POPULATION.push(new Sim("조커", "PSYCHO", "MAFIA"));
    POPULATION.push(new Sim("배트맨", "JUSTICE", "POLICE"));

    // 아담과 이브 강제 결혼 설정 (테스트용)
    POPULATION[0].spouseId = 1;
    POPULATION[1].spouseId = 0;
    POPULATION[0].relationships[1] = 100;
    POPULATION[1].relationships[0] = 100;

    renderSelector();
}

function renderSelector() {
    const sel = document.getElementById('sim-selector');
    sel.innerHTML = "";
    POPULATION.forEach((p, i) => {
        let opt = document.createElement('option');
        opt.value = i;
        opt.innerText = p.name;
        if(i === FOCUSED_SIM_INDEX) opt.selected = true;
        sel.appendChild(opt);
    });
}

document.getElementById('sim-selector').addEventListener('change', (e) => {
    FOCUSED_SIM_INDEX = parseInt(e.target.value);
    updateUI();
});

function updateUI() {
    const sim = POPULATION[FOCUSED_SIM_INDEX];
    if (!sim) return;

    document.getElementById('sim-name').innerText = sim.name;
    document.getElementById('sim-age').innerText = `${Math.floor(sim.age)}세`;
    document.getElementById('sim-trait').innerText = sim.trait.name;
    document.getElementById('sim-job').innerText = sim.job.name;
    document.getElementById('money-text').innerText = Math.floor(sim.money).toLocaleString() + "원";
    document.getElementById('current-location').innerText = LOCATIONS[sim.location];

    // 가족 관계 표시
    const famList = document.getElementById('family-list');
    famList.innerHTML = '';
    
    // 배우자
    if (sim.spouseId !== null) {
        let sp = POPULATION.find(s => s.id === sim.spouseId);
        famList.innerHTML += `<span class="fam-tag ft-spouse">💍 ${sp.name}</span>`;
    }
    // 부모
    sim.parentIds.forEach(pid => {
        let p = POPULATION.find(s => s.id === pid);
        if(p) famList.innerHTML += `<span class="fam-tag ft-parent">👪 ${p.name}</span>`;
    });
    // 자녀
    sim.childrenIds.forEach(cid => {
        let c = POPULATION.find(s => s.id === cid);
        if(c) famList.innerHTML += `<span class="fam-tag ft-child">👶 ${c.name}</span>`;
    });
    if(famList.innerHTML === '') famList.innerHTML = "독신";

    // 스탯바
    const bars = ['hunger', 'energy', 'hygiene', 'love', 'social', 'moral'];
    bars.forEach(k => document.getElementById(`${k}-bar`).style.width = `${sim.stats[k]}%`);

    // 관계 리스트
    const list = document.getElementById('relationship-list');
    list.innerHTML = '';
    POPULATION.forEach(target => {
        if (target.id === sim.id) return;
        const score = sim.getRel(target.id);
        
        let badgeClass = 'rb-friend';
        let badgeText = '지인';

        if (sim.spouseId === target.id) { badgeClass = 'rb-spouse'; badgeText = '💍 배우자'; }
        else if (sim.isFamily(target)) { badgeClass = 'rb-family'; badgeText = '🩸 가족'; }
        else if (score > 60) { badgeClass = 'rb-love'; badgeText = '❤️ 절친'; }
        else if (score < -30) { badgeClass = 'rb-enemy'; badgeText = '⚔️ 원수'; }
        
        let li = document.createElement('li');
        li.className = 'rel-card';
        li.innerHTML = `<div><span class="rel-name">${target.name}</span><span class="rel-badge ${badgeClass}">${badgeText}</span></div><span style="font-size:0.8em; color:#8b949e">${Math.floor(score)}</span>`;
        list.appendChild(li);
    });
}

function updateActionUI(text, duration) {
    document.getElementById('action-text').innerText = text;
    const loader = document.getElementById('action-loader');
    loader.style.width = '0%';
    loader.style.transition = 'none';
    requestAnimationFrame(() => {
        loader.style.transition = `width ${duration}ms linear`;
        loader.style.width = '100%';
    });
}

function addLog(msg, cls) {
    const list = document.getElementById('event-log');
    const li = document.createElement('li');
    if (cls) li.className = cls;
    li.innerText = `[${new Date().toLocaleTimeString().split(' ')[0]}] ${msg}`;
    list.prepend(li);
    if (list.children.length > 20) list.lastChild.remove();
}

initWorld();
setInterval(() => {
    POPULATION.forEach(sim => { sim.updateTick(); sim.decide(); });
    updateUI();
}, CONFIG.tickRate);
