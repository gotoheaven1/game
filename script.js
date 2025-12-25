// 1. 설정 및 초기 데이터
let gameTime = { year: 1, month: 1, day: 1, hour: 0 };
let characters = [];
let selectedCharId = null;

const locations = {
    Home: { name: "집", desc: "개인 공간입니다. 휴식을 취하면 에너지가 회복됩니다.", events: ["도둑 침입", "불륜 발각"] },
    Hospital: { name: "병원", desc: "의료 서비스의 중심지입니다.", events: ["건강 회복", "의료사고", "출산"] },
    Court: { name: "법정", desc: "심판과 정치가 이루어지는 곳입니다.", events: ["재판", "벌금형"] },
    School: { name: "학교", desc: "지식을 쌓아 능력을 올립니다.", events: ["성적 향상", "왕따 발생"] },
    Park: { name: "공원", desc: "산책을 하며 사람들을 만납니다.", events: ["운명적 만남", "소매치기"] },
    Bar: { name: "식당/바", desc: "식사를 하거나 사교를 즐깁니다.", events: ["고백 성공", "난투극"] }
};

const jobs = {
    Hospital: { title: "의사", pay: 1200 }, Court: { title: "변호사", pay: 1500 },
    School: { title: "교사", pay: 900 }, Bar: { title: "요리사", pay: 800 },
    Park: { title: "조경사", pay: 600 }
};

// 2. 캐릭터 클래스
class Character {
    constructor(name, parents = null) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.name = name;
        this.age = parents ? 0 : Math.floor(Math.random() * 20) + 20;
        this.money = parents ? 5000 : 10000;
        this.location = "Home";
        this.isAlive = true;
        this.isJailed = false;
        this.isLeader = false;
        
        this.stats = { health: 100, morality: Math.floor(Math.random() * 100), intellect: Math.floor(Math.random() * 100) };
        this.needs = { hunger: 100, energy: 100, happiness: 100 };
        this.reputation = 50;
        this.job = { title: "무직", level: 1, exp: 0 };
        
        this.relations = {}; // {targetId: {intimacy: 50, isRival: false}}
        this.parents = parents;
    }

    updateRep(val) { this.reputation = Math.max(0, Math.min(100, this.reputation + val)); }
}

// 3. 핵심 시스템 엔진
function init() {
    createNewCharacter("주인공");
    setInterval(gameTick, 2000); // 2초 = 1시간
    render();
}

function gameTick() {
    gameTime.hour++;
    if (gameTime.hour >= 24) { gameTime.hour = 0; gameTime.day++; processDaily(); }
    
    // 시간당 욕구 감소 및 자동 회복
    characters.forEach(char => {
        if (!char.isAlive) return;
        char.needs.hunger -= 1.5;
        char.needs.energy -= 0.8;
        if (char.location === "Home") char.needs.energy = Math.min(100, char.needs.energy + 6);
        if (char.needs.hunger <= 0) char.stats.health -= 3;
        if (char.stats.health <= 0) killCharacter(char, "건강 악화");
    });

    // 매달 1일 선거 개최
    if (gameTime.day === 30 && gameTime.hour === 0) holdElection();

    updateUI();
}

function processDaily() {
    characters.forEach(char => {
        if (!char.isAlive) return;
        if (gameTime.day === 1) char.age++;
        if (char.stats.morality < 20 && Math.random() < 0.05) commitCrime(char);
        
        // 라이벌 체크: 평판이 높은 두 사람은 라이벌이 될 확률이 높음
        checkRivalries(char);
    });
}

// 4. 라이벌 시스템
function checkRivalries(char) {
    const others = characters.filter(c => c.id !== char.id && c.isAlive);
    others.forEach(other => {
        // 평판 차이가 적고 둘 다 평판이 높을 때 라이벌 경쟁 구도 형성
        if (char.reputation > 70 && other.reputation > 70 && !char.relations[other.id]) {
            if (Math.random() < 0.1) {
                char.relations[other.id] = { intimacy: 20, isRival: true };
                other.relations[char.id] = { intimacy: 20, isRival: true };
                addLog(`🔥 [라이벌] ${char.name}와 ${other.name}이 서로를 견제하기 시작했습니다!`, "warning");
            }
        }
    });
}

// 5. 정치 및 선거
function holdElection() {
    const candidates = characters.filter(c => c.isAlive && c.reputation > 60)
                                 .sort((a,b) => b.reputation - a.reputation).slice(0, 3);
    if (candidates.length < 1) return addLog("이장 후보가 없어 선거가 무산되었습니다.");

    const winner = candidates[Math.floor(Math.random() * candidates.length)];
    characters.forEach(c => c.isLeader = false);
    winner.isLeader = true;
    showModal("🗳️ 선거 종료", `새로운 마을 이장으로 ${winner.name}이 당선되었습니다!`);
}

// 6. 상호작용 및 행동
function work() {
    const char = getSelected();
    const jobInfo = jobs[char.location];
    if (!jobInfo) return alert("여기선 일할 수 없습니다.");
    
    char.job.title = jobInfo.title;
    char.money += jobInfo.pay * char.job.level;
    char.needs.energy -= 15;
    char.updateRep(2);
    addLog(`${char.name}(이)가 ${jobInfo.title}로 일하여 ${jobInfo.pay}원을 벌었습니다.`);
    render();
}

function interact(targetId) {
    const char = getSelected();
    const target = characters.find(c => c.id === targetId);
    const isRival = char.relations[targetId]?.isRival;

    if (isRival) {
        if (Math.random() < 0.5) {
            target.updateRep(-10);
            addLog(`⚡ [경쟁] ${char.name}이 라이벌 ${target.name}의 평판을 깎아내렸습니다!`, "warning");
        } else {
            char.updateRep(-5);
            addLog(`⚡ [경쟁] ${char.name}이 ${target.name}와 다투다 역풍을 맞았습니다.`);
        }
    } else {
        char.needs.happiness += 10;
        addLog(`${char.name}이 ${target.name}와 즐거운 시간을 보냈습니다.`);
    }
    render();
}

function commitCrime(char) {
    if (Math.random() < 0.4) {
        char.isJailed = true;
        char.location = "Court";
        char.updateRep(-30);
        showModal("⚖️ 구속", `${char.name}이 범죄 현장에서 검거되었습니다!`);
    } else {
        char.money += 3000;
        addLog(`${char.name}이 은밀하게 범죄에 성공했습니다.`, "critical");
    }
}

// 7. 유틸리티 및 UI
function createNewCharacter(name) {
    const newChar = new Character(name);
    characters.push(newChar);
    if (!selectedCharId) selectedCharId = newChar.id;
    addLog(`${newChar.name}(이)가 마을에 입주했습니다.`);
    render();
}

function travel(loc) {
    const char = getSelected();
    if (!char || !char.isAlive || char.isJailed) return;
    char.location = loc;
    render();
}

function killCharacter(char, reason) {
    char.isAlive = false;
    addLog(`[부고] ${char.name}이 ${reason}(으)로 별세했습니다.`, "critical");
    // 유산 상속 로직 (자녀에게)
    const children = characters.filter(c => c.parents && c.parents.includes(char.id));
    if (children.length > 0) children[0].money += char.money;
    render();
}

function getSelected() { return characters.find(c => c.id === selectedCharId); }

function render() {
    const list = document.getElementById('char-list');
    list.innerHTML = "";
    characters.forEach(char => {
        const div = document.createElement('div');
        div.className = `char-card ${char.id === selectedCharId ? 'active' : ''} ${!char.isAlive ? 'dead' : ''}`;
        
        // 라이벌 표시
        let rivalTag = "";
        for (let id in char.relations) if (char.relations[id].isRival) rivalTag = `<span class="rival-tag">RIVAL</span>`;

        div.innerHTML = `
            ${rivalTag}
            <strong>${char.isLeader ? '👑' : ''}${char.name}</strong> (${char.age}세) | 💰${char.money}<br>
            <small>${char.job.title} | ${locations[char.location].name}</small>
            <div class="stat-container">
                <div class="bar-bg"><div class="bar-fill hunger" style="width:${char.needs.hunger}%"></div></div>
                <div class="bar-bg"><div class="bar-fill energy" style="width:${char.needs.energy}%"></div></div>
                <div class="bar-bg"><div class="bar-fill reputation" style="width:${char.reputation}%"></div></div>
            </div>
        `;
        div.onclick = () => { selectedCharId = char.id; render(); updateLoc(); };
        list.appendChild(div);
    });
}

function updateLoc() {
    const char = getSelected();
    if (!char) return;
    document.getElementById('loc-name').innerText = locations[char.location].name;
    document.getElementById('loc-desc').innerText = locations[char.location].desc;

    const actionZone = document.getElementById('special-actions');
    actionZone.innerHTML = "";

    // 일하기 버튼
    if (jobs[char.location]) {
        const btn = document.createElement('button');
        btn.innerText = "💼 일하기";
        btn.onclick = work;
        actionZone.appendChild(btn);
    }

    // 상호작용 (같은 장소 주민)
    const others = characters.filter(c => c.location === char.location && c.id !== char.id && c.isAlive);
    others.forEach(o => {
        const btn = document.createElement('button');
        const isRival = char.relations[o.id]?.isRival;
        btn.innerText = isRival ? `⚡ ${o.name} 공격` : `💬 ${o.name} 대화`;
        btn.style.background = isRival ? "#c0392b" : "#27ae60";
        btn.onclick = () => interact(o.id);
        actionZone.appendChild(btn);
    });

    // 이장 전용 세금 징수
    if (char.isLeader) {
        const taxBtn = document.createElement('button');
        taxBtn.innerText = "💰 세금 징수 (평판 하락)";
        taxBtn.style.background = "#8e44ad";
        taxBtn.onclick = () => {
            characters.forEach(c => { if(c.id !== char.id) { c.money -= 500; char.money += 500; }});
            char.updateRep(-15);
            addLog("👑 이장이 세금을 걷었습니다!");
            render();
        };
        actionZone.appendChild(taxBtn);
    }
}

function addLog(msg, type = "") {
    const log = document.getElementById('event-log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerText = `[${gameTime.day}일 ${gameTime.hour}시] ${msg}`;
    log.prepend(entry);
}

function showModal(t, c) {
    document.getElementById('modal-title').innerText = t;
    document.getElementById('modal-content').innerText = c;
    document.getElementById('modal-overlay').style.display = 'flex';
}
function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; }
function updateUI() {
    document.getElementById('time-display').innerText = `${gameTime.year}년 ${gameTime.month}월 ${gameTime.day}일 ${gameTime.hour}시`;
    document.getElementById('village-info').innerText = `마을 인구: ${characters.filter(c=>c.isAlive).length}명 | 이장: ${characters.find(c=>c.isLeader)?.name || '없음'}`;
}

init();

