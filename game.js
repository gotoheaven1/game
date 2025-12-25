
  /* =========================================
   [THE ROOM: 1978] GAME ENGINE v2.0
   ========================================= */

// --- 0. CSS Styles Injection (UI 업그레이드) ---
// 실제 채팅방 느낌을 내기 위해 스타일을 동적으로 추가합니다.
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    .chat-bubble {
        padding: 8px 12px;
        margin: 5px 0;
        border-radius: 4px;
        max-width: 80%;
        line-height: 1.4;
        display: inline-block;
        clear: both;
    }
    .chat-left { float: left; border-left: 3px solid var(--phosphor-green); background: rgba(0, 255, 0, 0.1); }
    .chat-right { float: right; border-right: 3px solid var(--phosphor-green); text-align: right; background: rgba(0, 255, 0, 0.2); }
    .sys-msg { color: #aaa; text-align: center; margin: 10px 0; font-style: italic; clear: both; display: block; }
    .error-msg { color: red; font-weight: bold; clear: both; display: block; }
    
    /* 캐릭터별 색상 강조 (이름표) */
    .name-tag { font-weight: bold; margin-bottom: 2px; display: block; font-size: 0.9em; opacity: 0.8; }
`;
document.head.appendChild(styleSheet);


// --- 1. Game State & Data ---
const state = {
    screen: 'BOOT', // BOOT, LOGIN, DESKTOP, PUBLIC_CHAT, PRIVATE_CHAT
    connectedChar: null, 
    inventory: [],
    cluesFound: [],
    affinity: { Arthur: 10, Daisy: 10, Victor: 10, Elena: 10 },
    miniGameActive: false,
    miniGameTarget: null,
    gameEnded: false,
    introWatched: false // 채팅방 입장 이벤트 봤는지 여부
};

// 캐릭터 데이터베이스
const characters = {
    'Arthur': {
        job: '전직 군인',
        style: '[ . . ]',
        color: '#aaffaa', // 연한 초록
        intro: "신입인가? 규율을 지키도록. 이상.",
        desc: '말투가 딱딱하고 군대 용어를 쓴다.',
        keywords: {
            '안녕': "충성. 용무 있나? [ . . ]",
            '피해자': "그 친구? 규율이 없었어. 언젠가 사고 칠 줄 알았지. [ . . ]",
            '훈장': "!! 자네 그걸 어디서... (감격) [ O . O ] 자네는 명예를 아는군.",
            '사건': "오후 10시. 나는 초소... 아니, 내 방에서 뉴스를 보고 있었다. [ . . ]"
        },
        gift: '훈장',
        weakness: '명예'
    },
    'Daisy': {
        job: '히피',
        style: '{~~✿~~}',
        color: '#ffccff', // 연한 핑크
        intro: "와우, 새로운 바이브네? 반가워 친구! 평화~",
        desc: '꽃과 평화를 사랑하는 자유로운 영혼.',
        keywords: {
            '안녕': "헤이~ 반가워 형제여! {~~✿~~}",
            '피해자': "그 사람은 항상 짙은 향수 냄새가 났어... 머리가 아플 정도로. {~~-_-~~}",
            'LP': "오 마이 갓! 비틀즈 초판?! 너 진짜 멋쟁이구나! {~~^!^~~}",
            '법': "우린 그런 거에 얽매이지 않아, man. 분위기 깨지 마. {~~;_;~~}"
        },
        gift: 'LP',
        weakness: '자유'
    },
    'Victor': {
        job: '공학도',
        style: '( ; _ ; )',
        color: '#ccccff', // 연한 파랑
        intro: "누.. 누구세요? 제 코드 건드리지 마세요..",
        desc: '숫자에 집착하며 항상 불안해 보인다.',
        keywords: {
            '안녕': "누... 누구세요? 해커? ( ; _ ; )",
            '피해자': "그 사람 돈 계산이... 3.14159... 아니, 좀 이상했어. ( O_O )",
            '계산기': "내... 내 텍사스 인스트루먼트! 찾아줬구나! ( ^_^ )",
            '알리바이': "난... 난 코딩 중이었어! 컴파일 로그 보여줄 수 있어!"
        },
        gift: '계산기',
        weakness: '논리'
    },
    'Elena': {
        job: '배우',
        style: '{* - *}',
        color: '#ffffcc', // 연한 노랑
        intro: "어머, 관객이 늘었네? 엘레나의 무대에 온 걸 환영해.",
        desc: '자신을 3인칭으로 부르는 허영심 많은 배우.',
        keywords: {
            '안녕': "어머, 엘레나를 보러 온 팬인가요? {* ^ *}",
            '피해자': "흥, 그 촌스러운 남자? 내 무대 의상을 밟았었지. {* - *}",
            '거울': "어머! 너무 예쁘다. 역시 엘레나에겐 최고급이 어울려. {* O *}",
            '흉': "데이지 걔는... 씻기는 하는지 몰라. 냄새나. {* > < *}"
        },
        gift: '거울',
        weakness: '칭찬'
    },
    'Ghost': {
        style: '< SYSTEM >',
        color: '#ffffff',
        intro: "...",
        keywords: {} 
    }
};

const items = [
    { name: '훈장', id: 'medal', desc: '녹이 슨 낡은 훈장.' },
    { name: 'LP', id: 'lp', desc: '비틀즈의 희귀 LP판.' },
    { name: '계산기', id: 'calc', desc: '공학용 계산기.' },
    { name: '거울', id: 'mirror', desc: '화려한 손거울.' },
    { name: '로그', id: 'log', desc: '서버 접속 기록 (결정적 증거).' }
];

// --- 2. DOM Elements & Utilities ---
const outputDiv = document.getElementById('game-output');
const inputField = document.getElementById('user-input');
const targetSpan = document.getElementById('current-target');
const affinitySpan = document.getElementById('affinity-score');
const invSpan = document.getElementById('inventory-list');
const clockSpan = document.getElementById('clock');

setInterval(() => {
    const now = new Date();
    clockSpan.innerText = now.toLocaleTimeString('en-US', { hour12: false });
}, 1000);

// 화면 클리어
function clearScreen() {
    outputDiv.innerHTML = '';
}

// 타이핑 효과 (HTML 태그 지원 + 스타일 적용)
async function typeWriter(text, type = 'system', charName = null) {
    const div = document.createElement('div');
    
    // 스타일 클래스 적용
    if (type === 'user-msg') {
        div.className = 'chat-bubble chat-right';
        div.innerHTML = text; // 유저는 이름표 없음
    } else if (type === 'char-msg') {
        div.className = 'chat-bubble chat-left';
        // 이름표 추가
        const nameTag = `<span class="name-tag" style="color:${characters[charName].color}">${charName}</span>`;
        div.innerHTML = nameTag + text;
    } else if (type === 'sys-msg') {
        div.className = 'sys-msg';
        div.innerHTML = text;
    } else if (type === 'error-msg') {
        div.className = 'error-msg';
        div.innerHTML = text;
    } else {
        // 일반 텍스트 (BIOS 등)
        div.innerHTML = text;
    }

    outputDiv.appendChild(div);
    outputDiv.scrollTop = outputDiv.scrollHeight;
    
    // 텍스트 출력 딜레이 시뮬레이션 (단순화)
    await new Promise(r => setTimeout(r, 50)); 
}

// --- 3. Input Handling ---
inputField.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const val = this.value.trim();
        if (val) {
            // 비밀번호 입력이나 시스템 입력은 말풍선 안 띄움
            if (state.screen !== 'LOGIN') {
                typeWriter(val, 'user-msg');
            }
            processInput(val);
        }
        this.value = '';
    }
});

document.addEventListener('click', () => { inputField.focus(); });

// 메인 입력 라우터
async function processInput(input) {
    // 0. 이스터 에그 (글로벌)
    if (['WHO ARE YOU', 'system32'].includes(input)) { triggerGlitchEffect('scary'); return; }
    if (['MATRIX', 'neo'].includes(input)) { triggerGlitchEffect('matrix'); return; }

    // 1. 화면 상태에 따른 처리
    switch (state.screen) {
        case 'LOGIN':
            handleLogin(input);
            break;
        case 'DESKTOP':
            handleDesktop(input);
            break;
        case 'PUBLIC_CHAT':
            handlePublicChat(input);
            break;
        case 'PRIVATE_CHAT':
            handlePrivateChat(input);
            break;
        default:
            break;
    }
}

// --- 4. Logic per Screen ---

// [화면 1] 로그인 처리
async function handleLogin(input) {
    if (input === '1234') {
        await typeWriter("[SUCCESS] 암호 확인됨. 메인프레임 접속 중...", 'sys-msg');
        await new Promise(r => setTimeout(r, 1000));
        transitionToDesktop();
    } else {
        await typeWriter("[ACCESS DENIED] 암호가 일치하지 않습니다.", 'error-msg');
    }
}

// [화면 2] 데스크탑 (로비)
function transitionToDesktop() {
    state.screen = 'DESKTOP';
    clearScreen();
    typeWriter("==========================================");
    typeWriter("      GOS (Ghost OS) v1.0 - 1978");
    typeWriter("==========================================");
    typeWriter("환영합니다, 탐정님.");
    typeWriter("최근 발생한 '살인사건'의 용의자들이 현재");
    typeWriter("비공개 채팅 서버 #78에 모여있습니다.");
    typeWriter("그들의 대화에 참여하여 증거를 수집하십시오.");
    typeWriter("");
    typeWriter("Available Commands:", 'sys-msg');
    typeWriter("- /join  : 채팅 서버 접속");
    typeWriter("- /help  : 도움말");
    typeWriter("- /readme: 사건 개요 및 매뉴얼 읽기");
}

async function handleDesktop(input) {
    if (input === '/join') {
        enterPublicChat();
    } else if (input === '/readme') {
        typeWriter("--- 사건 파일 #001 ---", 'sys-msg');
        typeWriter("피해자: 신원 미상의 남성");
        typeWriter("발견 장소: 78번지 아파트");
        typeWriter("목표: 채팅방의 인물들과 대화하여 진범을 찾아내라.");
        typeWriter("팁: 상대방의 말에서 '키워드'를 찾아 다시 질문하라.");
    } else if (input === '/help') {
        typeWriter("명령어: /join, /readme");
    } else {
        typeWriter("알 수 없는 명령어입니다. /help를 입력하세요.", 'error-msg');
    }
}

// [화면 3] 공개 채팅방 (인트로 연출)
async function enterPublicChat() {
    state.screen = 'PUBLIC_CHAT';
    clearScreen();
    updateUI();
    
    await typeWriter(">>> 보안 채널 #Lobby_78 접속 중...", 'sys-msg');
    await new Promise(r => setTimeout(r, 1000));
    
    if (!state.introWatched) {
        // 입장 이벤트 연출
        await typeWriter("새로운 사용자가 입장했습니다.", 'sys-msg');
        await new Promise(r => setTimeout(r, 800));
        
        await typeWriter(characters['Arthur'].intro, 'char-msg', 'Arthur');
        await new Promise(r => setTimeout(r, 1000));
        
        await typeWriter(characters['Daisy'].intro, 'char-msg', 'Daisy');
        await new Promise(r => setTimeout(r, 1000));
        
        await typeWriter(characters['Elena'].intro, 'char-msg', 'Elena');
        await new Promise(r => setTimeout(r, 1000));
        
        await typeWriter(characters['Victor'].intro, 'char-msg', 'Victor');
        await new Promise(r => setTimeout(r, 1000));
        
        state.introWatched = true;
    } else {
        await typeWriter("채팅방에 다시 입장했습니다.", 'sys-msg');
    }

    typeWriter("------------------------------------------------");
    typeWriter("[SYSTEM] 📩 새로운 개인 메시지(DM)가 도착했습니다.", 'sys-msg');
    typeWriter("확인하려면 '/dm [이름]'을 입력하세요.", 'sys-msg');
    typeWriter("(예: /dm Arthur, /dm Ghost)");
    typeWriter("------------------------------------------------");
}

async function handlePublicChat(input) {
    if (input.startsWith('/dm ')) {
        const targetName = input.split(' ')[1];
        if (characters[targetName] || targetName === 'Ghost') {
            startPrivateChat(targetName);
        } else {
            typeWriter("존재하지 않는 사용자입니다.", 'error-msg');
        }
    } else if (input === '/help') {
        typeWriter("공개 채팅방입니다. 용의자를 심문하려면 개인 메시지를 보내세요.");
        typeWriter("명령어: /dm [이름], /inven, /accuse [이름]");
    } else if (input.startsWith('/accuse ')) {
        handleAccusation(input.split(' ')[1]);
    } else if (input === '/inven') {
        showInventory();
    } else {
        typeWriter("이곳은 공개 채널입니다. 조사를 위해 1:1 대화(/dm)를 시도하세요.", 'sys-msg');
    }
}

// [화면 4] 1:1 개인 채팅 (심문 파트)
async function startPrivateChat(charName) {
    state.screen = 'PRIVATE_CHAT';
    state.connectedChar = charName;
    
    // 화면 전환 느낌
    clearScreen();
    updateUI();
    
    await typeWriter(`>>> ${charName}님과의 1:1 보안 세션이 연결되었습니다.`, 'sys-msg');
    typeWriter("대화를 종료하고 로비로 가려면 '/back' 입력.", 'sys-msg');
    
    if (charName === 'Ghost') {
        await typeWriter("...데이터베이스 연결됨. 수집한 키워드를 입력하면 분석해 주지.", 'char-msg', 'Ghost');
    } else {
        const char = characters[charName];
        await typeWriter(`무슨 일이지? ${char.style}`, 'char-msg', charName);
    }
}

async function handlePrivateChat(input) {
    // 1. 공통 명령어
    if (input === '/back') {
        enterPublicChat();
        return;
    }
    if (input === '/inven') {
        showInventory();
        return;
    }
    if (input.startsWith('/give ')) {
        handleGift(input.split(' ')[1]);
        return;
    }
    
    // 2. 미니게임
    if (state.miniGameActive) {
        processMiniGame(input);
        return;
    }

    // 3. 대화 로직
    const charName = state.connectedChar;
    if (charName === 'Ghost') {
        handleGhostLogic(input);
    } else {
        handleCharacterDialogue(charName, input);
    }
}

// --- 5. Core Game Logic (Dialogue, Gift, Game) ---

async function handleCharacterDialogue(charName, input) {
    const char = characters[charName];
    let response = "";
    
    if (charName === 'Victor' && (input.includes('게임') || input.includes('내기'))) {
        startMiniGame();
        return;
    }

    let matched = false;
    for (const key in char.keywords) {
        if (input.includes(key)) {
            response = char.keywords[key];
            matched = true;
            if (key === '피해자' || key === '사건') {
                if (!state.cluesFound.includes(`${charName}:${key}`)) {
                    state.cluesFound.push(`${charName}:${key}`);
                    typeWriter(`[단서 획득] ${key}에 대한 진술 확보.`, 'sys-msg');
                }
            }
            break;
        }
    }

    if (!matched) {
        const reactions = [
            `무슨 소리야? ${char.style}`,
            `관심 없어. ${char.style}`,
            `... (무시) ${char.style}`
        ];
        response = reactions[Math.floor(Math.random() * reactions.length)];
    }

    await typeWriter(response, 'char-msg', charName);
}

function handleGift(itemName) {
    if (!state.inventory.includes(itemName)) {
        typeWriter("그런 물건은 없습니다.", 'error-msg');
        return;
    }
    const char = characters[state.connectedChar];
    if (char.gift === itemName) {
        state.affinity[state.connectedChar] += 30;
        updateUI();
        typeWriter(`이거... 나한테 주는 거야? 고마워! ${char.style}`, 'char-msg', state.connectedChar);
        if(state.connectedChar === 'Victor' && state.affinity['Victor'] >= 40) {
             typeWriter("[SYSTEM] Victor가 '서버_로그.txt'를 전송했습니다.", 'sys-msg');
             state.inventory.push('로그');
             updateUI();
        }
    } else {
        state.affinity[state.connectedChar] -= 10;
        updateUI();
        typeWriter(`이게 뭐야? 필요 없어. ${char.style}`, 'char-msg', state.connectedChar);
    }
}

function handleGhostLogic(input) {
    if (input.includes('향수') && input.includes('피해자')) {
        typeWriter("분석: 향수는 Daisy가 언급했고, Victor는 냄새에 민감함. Victor를 의심해.", 'char-msg', 'Ghost');
    } else if (input.includes('로그')) {
        typeWriter("로그 파일이 있다면 범인의 접속 기록을 확인할 수 있어.", 'char-msg', 'Ghost');
    } else {
        typeWriter("데이터 부족. 더 많은 키워드를 던져줘.", 'char-msg', 'Ghost');
    }
}

// 미니게임 (숫자야구)
function startMiniGame() {
    state.miniGameActive = true;
    state.miniGameTarget = generateTargetNumber();
    typeWriter("=== [보안 프로토콜: CODE BREAKER] 시작 ===", 'sys-msg');
    typeWriter("내 암호를 맞춰봐! 3자리 숫자야. (중복 없음)", 'char-msg', 'Victor');
}

function generateTargetNumber() {
    let nums = [0,1,2,3,4,5,6,7,8,9];
    let result = "";
    for(let i=0; i<3; i++){
        let idx = Math.floor(Math.random() * nums.length);
        result += nums[idx];
        nums.splice(idx, 1);
    }
    return result;
}

function processMiniGame(input) {
    if (input === 'exit') {
        state.miniGameActive = false;
        typeWriter("미니게임을 종료합니다.", 'sys-msg');
        return;
    }
    if (!/^\d{3}$/.test(input)) {
        typeWriter("3자리 숫자를 입력하세요.", 'error-msg');
        return;
    }

    let strike = 0; ball = 0;
    const target = state.miniGameTarget;
    for (let i = 0; i < 3; i++) {
        if (input[i] === target[i]) strike++;
        else if (target.includes(input[i])) ball++;
    }

    if (strike === 3) {
        state.miniGameActive = false;
        state.affinity['Victor'] += 20;
        updateUI();
        typeWriter(`말도 안 돼... 내 코드를 뚫다니! ( ; O ; )`, 'char-msg', 'Victor');
        typeWriter("Victor의 신뢰도가 대폭 상승했습니다.", 'sys-msg');
    } else {
        typeWriter(`RESULT: ${strike}S ${ball}B`, 'sys-msg');
    }
}

// 엔딩 처리
async function handleAccusation(suspectName) {
    if (!characters[suspectName]) { typeWriter("존재하지 않는 용의자입니다.", 'error-msg'); return; }
    state.gameEnded = true;
    
    await typeWriter("\n>>> 체포 영장 발부 중...", "sys-msg");
    await new Promise(r => setTimeout(r, 1000));

    if (suspectName === 'Victor' && state.inventory.includes('로그')) {
        await typeWriter(`\n[SUCCESS] 범인 검거 성공!`, "sys-msg");
        await typeWriter(`젠장... 로그를 지웠어야 했는데! ( ; _ ; )`, "char-msg", 'Victor');
        await typeWriter(`탐정님, 완벽한 추리였습니다. ARPANET은 다시 평화를 되찾았습니다.`);
    } else if (suspectName === 'Daisy') {
        await typeWriter(`\n[FAILED] 오판입니다.`, "error-msg");
        await typeWriter(`뭐? 내가? 웃기지 마 man! 변호사 부를 거야! {~~!_!~~}`, "char-msg", 'Daisy');
        await typeWriter(`진범은 시스템 뒤에서 당신을 비웃고 있습니다... GAME OVER`);
    } else {
        await typeWriter(`\n[FAILED] 증거 불충분.`, "error-msg");
        await typeWriter(`${suspectName}는 알리바이가 확실했습니다. 당신은 해고되었습니다. GAME OVER`);
    }
}

// --- 6. Helper & Effects ---

function showInventory() {
    if (state.inventory.length === 0) {
        // [디버그/편의성] 테스트를 위해 초기 인벤토리 자동 지급
        state.inventory = items.map(i => i.name);
        typeWriter("탐정 가방에서 물건들을 꺼냈습니다.", 'sys-msg');
        updateUI();
    } else {
        typeWriter(`가방: ${state.inventory.join(', ')}`, 'sys-msg');
    }
}

function updateUI() {
    targetSpan.innerText = state.screen === 'PRIVATE_CHAT' ? state.connectedChar : 'LOBBY';
    if(state.connectedChar && state.connectedChar !== 'Ghost') {
        affinitySpan.innerText = state.affinity[state.connectedChar];
    } else {
        affinitySpan.innerText = '-';
    }
    invSpan.innerText = state.inventory.length > 0 ? state.inventory.join(', ') : 'EMPTY';
}

async function triggerGlitchEffect(type) {
    const body = document.body;
    if (type === 'scary') {
        body.classList.add('glitch-mode');
        await typeWriter("SYSTEM ERROR... I SEE YOU...", "error-msg");
        setTimeout(() => { body.classList.remove('glitch-mode'); }, 3000);
    } else if (type === 'matrix') {
        body.classList.add('invert-mode');
        typeWriter("The Matrix has you...", 'sys-msg');
        setTimeout(() => { body.classList.remove('invert-mode'); }, 3000);
    }
}

function resetEffects() {
    document.body.classList.remove('glitch-mode');
    document.body.classList.remove('invert-mode');
}

// --- 7. Intro Sequence (Boot) ---
window.onload = async () => {
    state.screen = 'BOOT';
    inputField.focus();
    
    // 부팅 시퀀스 연출
    await typeWriter("BIOS CHECKING...", 'sys-msg');
    await new Promise(r => setTimeout(r, 500));
    await typeWriter("RAM: 64KB OK.", 'sys-msg');
    await typeWriter("LOADING OS...", 'sys-msg');
    await new Promise(r => setTimeout(r, 800));
    
    clearScreen();
    await typeWriter("🔒 SYSTEM LOCKED", 'error-msg');
    await typeWriter("접속하려면 비밀번호(4자리)를 입력하세요.", 'sys-msg');
    state.screen = 'LOGIN';
};

// 초기 로드 시 바로 포커스 (New)
inputField.focus();
