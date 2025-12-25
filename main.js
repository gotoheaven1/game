/* =========================================
   [THE ROOM: 1978] GAME ENGINE
   ========================================= */

// --- 1. Game State & Data ---
const state = {
    currentRoom: 'LOBBY', // LOBBY, CHAT_ROOM
    connectedChar: null, // 현재 대화 중인 상대
    inventory: [],
    cluesFound: [],
    affinity: { Arthur: 10, Daisy: 10, Victor: 10, Elena: 10 },
    miniGameActive: false,
    miniGameTarget: null, // 숫자야구 정답
    gameEnded: false
};

// 캐릭터 데이터베이스
const characters = {
    'Arthur': {
        job: '전직 군인',
        style: '[ . . ]',
        color: 'char-arthur',
        desc: '말투가 딱딱하고 군대 용어를 쓴다.',
        keywords: {
            '안녕': "신원 밝혀. [ . . ]",
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
        color: 'char-daisy',
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
        color: 'char-victor',
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
        color: 'char-elena',
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
        color: 'char-ghost',
        keywords: {} // Ghost는 별도 로직으로 처리
    }
};

// 인벤토리 아이템 DB
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

// 시계 기능
setInterval(() => {
    const now = new Date();
    clockSpan.innerText = now.toLocaleTimeString('en-US', { hour12: false });
}, 1000);

// 타이핑 효과 함수
async function typeWriter(text, className = '') {
    const p = document.createElement('div');
    if (className) p.classList.add(className);
    outputDiv.appendChild(p);
    
    // 자동 스크롤
    outputDiv.scrollTop = outputDiv.scrollHeight;

    for (let i = 0; i < text.length; i++) {
        p.innerHTML += text.charAt(i);
        // Beep 소리 시뮬레이션 (너무 시끄러울 수 있어 생략하거나 매우 짧게)
        await new Promise(r => setTimeout(r, 20)); 
    }
    outputDiv.scrollTop = outputDiv.scrollHeight;
}

// --- 3. Input Handling ---
inputField.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const val = this.value.trim();
        if (val) {
            typeWriter(`> ${val}`, 'user-msg'); // 내 입력 보여주기
            processInput(val);
        }
        this.value = '';
    }
});

// 입력 처리 메인 로직
async function processInput(input) {
    if (state.gameEnded) return;

    // 1. 미니게임 중일 때
    if (state.miniGameActive) {
        processMiniGame(input);
        return;
    }

    // 2. 명령어 처리
    if (input.startsWith('/')) {
        const parts = input.split(' ');
        const cmd = parts[0].toLowerCase();
        const arg = parts[1];

        switch (cmd) {
            case '/help':
                printSystem("명령어: /join, /connect [이름], /give [아이템], /inven, /accuse [이름]");
                break;
            case '/join':
                if (state.currentRoom === 'LOBBY') {
                    state.currentRoom = 'CHAT_ROOM';
                    printSystem("비밀 채팅방 #Lobby_78에 접속했습니다.");
                    printSystem("접속자: Arthur, Daisy, Victor, Elena, Ghost(Hidden)");
                } else {
                    printSystem("이미 접속 중입니다.");
                }
                break;
            case '/connect':
                if (state.currentRoom !== 'CHAT_ROOM') {
                    printError("먼저 채팅방에 입장하세요 (/join).");
                    return;
                }
                if (characters[arg] || arg === 'Ghost') {
                    state.connectedChar = arg;
                    updateUI();
                    if(arg === 'Ghost') {
                        printGhost("...데이터베이스 연결됨. 키워드를 입력하면 분석해 주지.");
                    } else {
                        const char = characters[arg];
                        await typeWriter(`${arg}: 연결되었습니다. ${char.style}`, char.color);
                    }
                } else {
                    printError("존재하지 않는 사용자입니다.");
                }
                break;
            case '/give':
                handleGift(arg);
                break;
            case '/inven':
                // 디버그용: 게임 시작 시 모든 아이템 지급 (테스트 편의성)
                if (state.inventory.length === 0) {
                    state.inventory = items.map(i => i.name);
                    printSystem("탐정 가방에서 물건들을 꺼냈습니다.");
                    updateUI();
                } else {
                    printSystem(`가방: ${state.inventory.join(', ')}`);
                }
                break;
            case '/accuse':
                handleAccusation(arg);
                break;
            default:
                printError("알 수 없는 명령어입니다.");
        }
        return;
    }

    // 3. 일반 대화 처리
    if (!state.connectedChar) {
        printSystem("대화할 상대를 먼저 선택하세요 (/connect [이름]).");
        return;
    }

    if (state.connectedChar === 'Ghost') {
        handleGhostLogic(input);
    } else {
        handleCharacterDialogue(state.connectedChar, input);
    }
}

// --- 4. Logic Functions ---

async function handleCharacterDialogue(charName, input) {
    const char = characters[charName];
    let response = "";
    
    // 미니게임 트리거 (Victor 전용)
    if (charName === 'Victor' && (input.includes('게임') || input.includes('내기'))) {
        startMiniGame();
        return;
    }

    // 키워드 매칭
    let matched = false;
    for (const key in char.keywords) {
        if (input.includes(key)) {
            response = char.keywords[key];
            matched = true;
            
            // 정보 수집 로직
            if (key === '피해자' || key === '사건') {
                if (!state.cluesFound.includes(`${charName}:${key}`)) {
                    state.cluesFound.push(`${charName}:${key}`);
                    printSystem(`[단서 획득] ${key}에 대한 ${charName}의 진술.`);
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

    await typeWriter(`${charName}: ${response}`, char.color);
}

function handleGift(itemName) {
    if (!state.connectedChar) {
        printError("누구에게 줄지 선택하지 않았습니다.");
        return;
    }
    if (!state.inventory.includes(itemName)) {
        printError("그런 물건은 없습니다.");
        return;
    }

    const char = characters[state.connectedChar];
    if (char.gift === itemName) {
        state.affinity[state.connectedChar] += 30;
        printSystem(`${state.connectedChar}의 신뢰도가 상승했습니다!`);
        updateUI();
        typeWriter(`${state.connectedChar}: 이거... 나한테 주는 거야? 고마워! ${char.style}`, char.color);
        
        // 특정 신뢰도 달성 시 보상 (예: Victor에게 로그 받기)
        if(state.connectedChar === 'Victor' && state.affinity['Victor'] >= 40) {
             printSystem("Victor가 '서버_로그.txt'를 전송했습니다.");
             state.inventory.push('로그');
             updateUI();
        }
    } else {
        state.affinity[state.connectedChar] -= 10;
        updateUI();
        typeWriter(`${state.connectedChar}: 이게 뭐야? 필요 없어. ${char.style}`, char.color);
    }
}

function handleGhostLogic(input) {
    // Ghost는 정보를 조합해줌
    if (input.includes('향수') && input.includes('피해자')) {
        printGhost("분석 결과: 향수는 Daisy가 언급했고, Victor는 냄새에 민감함. Victor를 의심해봐.");
    } else if (input.includes('로그')) {
        printGhost("로그 파일이 있다면 범인의 접속 기록을 확인할 수 있어.");
    } else {
        printGhost("데이터가 부족해. 더 많은 키워드를 던져줘.");
    }
}

// --- 5. Mini Game: 숫자 야구 (Code Breaker) ---
function startMiniGame() {
    state.miniGameActive = true;
    state.miniGameTarget = generateTargetNumber();
    printSystem("=== [보안 프로토콜: CODE BREAKER] 시작 ===");
    printSystem("Victor: 내 암호를 맞춰봐! 3자리 숫자야. (중복 없음)");
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
        printSystem("미니게임을 종료합니다.");
        return;
    }
    if (!/^\d{3}$/.test(input)) {
        printError("3자리 숫자를 입력하세요.");
        return;
    }

    let strike = 0;
    let ball = 0;
    const target = state.miniGameTarget;

    for (let i = 0; i < 3; i++) {
        if (input[i] === target[i]) strike++;
        else if (target.includes(input[i])) ball++;
    }

    if (strike === 3) {
        state.miniGameActive = false;
        state.affinity['Victor'] += 20;
        updateUI();
        typeWriter(`Victor: 말도 안 돼... 내 코드를 뚫다니! ( ; O ; )`, 'char-victor');
        printSystem("Victor의 신뢰도가 대폭 상승했습니다.");
    } else {
        printSystem(`RESULT: ${strike}S ${ball}B`);
    }
}

// --- 6. Ending System ---
async function handleAccusation(suspectName) {
    if (!characters[suspectName]) {
        printError("존재하지 않는 용의자입니다.");
        return;
    }

    state.gameEnded = true;
    await typeWriter("\n>>> 체포 영장 발부 중...", "sys-msg");
    await new Promise(r => setTimeout(r, 1000));

    if (suspectName === 'Victor' && state.inventory.includes('로그')) {
        // 진엔딩
        await typeWriter(`\n[SUCCESS] 범인 검거 성공!`, "sys-msg");
        await typeWriter(`Victor: 젠장... 로그를 지웠어야 했는데! ( ; _ ; )`, "char-victor");
        await typeWriter(`탐정님, 완벽한 추리였습니다. ARPANET은 다시 평화를 되찾았습니다.`);
    } else if (suspectName === 'Daisy') {
        // 배드엔딩
        await typeWriter(`\n[FAILED] 오판입니다.`, "error-msg");
        await typeWriter(`Daisy: 뭐? 내가? 웃기지 마 man! 변호사 부를 거야! {~~!_!~~}`, "char-daisy");
        await typeWriter(`진범은 시스템 뒤에서 당신을 비웃고 있습니다...`);
    } else {
        // 노말 배드엔딩
        await typeWriter(`\n[FAILED] 증거 불충분.`, "error-msg");
        await typeWriter(`${suspectName}는 알리바이가 확실했습니다. 당신은 해고되었습니다.`);
    }
}


// --- Utility Helpers ---
function printSystem(msg) { typeWriter(`[SYSTEM] ${msg}`, 'sys-msg'); }
function printError(msg) { typeWriter(`[ERROR] ${msg}`, 'error-msg'); }
function printGhost(msg) { typeWriter(`Ghost: ${msg}`, 'char-ghost'); }

function updateUI() {
    targetSpan.innerText = state.connectedChar || 'NONE';
    if(state.connectedChar && state.connectedChar !== 'Ghost') {
        affinitySpan.innerText = state.affinity[state.connectedChar];
    } else {
        affinitySpan.innerText = '-';
    }
    invSpan.innerText = state.inventory.length > 0 ? state.inventory.join(', ') : 'EMPTY';
}

// Intro
window.onload = async () => {
    await typeWriter("접속 중... 1978 ARPANET NODE #78...");
    await new Promise(r => setTimeout(r, 500));
    await typeWriter("사립 탐정 모듈 로드 완료.");
    await typeWriter("의뢰: 채팅방의 비밀을 밝혀라. 명령어 목록은 /help");
    await typeWriter("시작하려면 /join 명령어를 입력하세요.");
};
