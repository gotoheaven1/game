
  /* =========================================
   [THE ROOM: 1978] GAME ENGINE v3.0
   - Improved NLP (Smart Dialogue)
   - Archive Search System
   - Hint UI System
   ========================================= */

// --- 0. CSS Styles Injection (말풍선 및 UI 개선) ---
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    .chat-bubble { padding: 8px 12px; margin: 6px 0; border-radius: 4px; max-width: 85%; line-height: 1.4; display: table; clear: both; position: relative; }
    .chat-left { float: left; border-left: 4px solid var(--phosphor-main); background: rgba(51, 255, 51, 0.1); margin-right: 20%; }
    .chat-right { float: right; border-right: 4px solid var(--phosphor-main); text-align: right; background: rgba(51, 255, 51, 0.2); margin-left: 20%; color: #ccffcc; }
    .sys-msg { color: #ffff33; text-align: center; margin: 15px 0; font-style: italic; display: block; clear: both; border-top: 1px dashed #444; border-bottom: 1px dashed #444; padding: 5px 0; }
    .hint-box { border: 1px solid #1a551a; background: #051505; color: #88ff88; padding: 10px; margin: 10px 0; font-size: 0.9em; display: block; clear: both; }
    .error-msg { color: #ff5555; font-weight: bold; display: block; clear: both; text-align: center;}
    .name-tag { font-size: 0.8em; display: block; margin-bottom: 4px; opacity: 0.9; font-weight: bold; letter-spacing: 1px; }
`;
document.head.appendChild(styleSheet);

// --- 1. Game State & Data ---
const state = {
    screen: 'BOOT', 
    connectedChar: null, 
    inventory: [],
    cluesFound: [], // 발견한 단서들
    memo: [], // 유저 메모
    affinity: { Arthur: 20, Daisy: 20, Victor: 10, Elena: 10 }, // 초기 호감도 소폭 상승
    failCount: 0, // 대화 실패 카운트 (힌트 제공용)
    introWatched: false
};

// [스마트 대화 데이터베이스]
// keywords 배열 안에 있는 단어 중 하나라도 포함되면 해당 반응을 보임
const characters = {
    'Arthur': {
        job: '전직 군인',
        color: '#aaffaa',
        style: '[ . . ]',
        topics: ['알리바이', '피해자', '훈장', '목격자'], // 유저에게 보여줄 힌트 주제
        dialogue: [
            {
                keys: ['안녕', '반가워', 'ㅎㅇ', 'hello'],
                text: "충성. 용무가 없다면 통신 보안을 유지하도록. [ . . ]"
            },
            {
                keys: ['알리바이', '어디', '장소', '시간', '10시'],
                text: "그날 밤 10시? 내 방에서 뉴스를 보고 있었다. 독신남의 밤은 조용하지. 증인은... 뉴스 앵커뿐이다. [ . . ]",
                clue: "Arthur:뉴스시청"
            },
            {
                keys: ['피해자', '죽은', '사람', '관계', '그 녀석'],
                text: "그 친구? 규율이라곤 없는 녀석이었지. 언젠가 사고 칠 줄 알았다. 하지만 죽을 죄를 지었는지는... 모르겠군. [ . . ]"
            },
            {
                keys: ['훈장', '가슴', '배지', '명예'],
                text: "!! 자네 이걸 알아보나? (감격) [ O . O ] 1950년 겨울, 혹한 속에서 얻은 훈장이다. 자네는 '명예'를 아는군."
            },
            {
                keys: ['목격', '본거', '수상', '누구'],
                text: "수상한 점이라... 글쎄, 옆방의 Daisy가 그날따라 조용하더군. 평소엔 음악을 크게 틀어놓는데 말이야. [ . . ]",
                clue: "Daisy:조용함"
            }
        ],
        default: [
            "질문이 명확하지 않군. 다시 말해봐. [ . . ]",
            "군대에서는 용건만 간단히 한다. [ . . ]"
        ]
    },
    'Daisy': {
        job: '히피',
        color: '#ffccff',
        style: '{~~✿~~}',
        topics: ['음악', '향수', '평화', '사건 당일'],
        dialogue: [
            {
                keys: ['안녕', 'hi', '반가워'],
                text: "헤이~ 새로운 바이브네? 사랑과 평화, 형제여! {~~✿~~}"
            },
            {
                keys: ['알리바이', '어디', '뭐했어', '당일', '조용'],
                text: "난 그냥 명상 중이었어... 우주의 기운을 느끼고 있었지. Arthur 아저씨는 내가 조용해서 이상했대? 풋, 명상은 원래 조용한 거야. {~~-_-~~}"
            },
            {
                keys: ['향수', '냄새', '피해자', '관계'],
                text: "그 남자는 항상 짙은 코롱 냄새가 났어. 자연의 향기가 아니야. 화학 물질 냄새... 머리가 아플 정도였다고. {~~>_<~~}",
                clue: "피해자:화학냄새"
            },
            {
                keys: ['lp', '음악', '비틀즈', '노래'],
                text: "오 마이 갓! 너 음악 좀 아는구나? 비틀즈 초판이 있어? 그거라면 내 영혼도 팔 수 있어! {~~^!^~~}"
            }
        ],
        default: [
            "무슨 말인지 모르겠어 man, 좀 더 feel을 담아서 말해봐. {~~?~~}",
            "네 오라(Aura)가 좀 탁한데? 다시 말해줄래?"
        ]
    },
    'Victor': {
        job: '공학도',
        color: '#ccccff',
        style: '( ; _ ; )',
        topics: ['계산기', '로그', '돈', '서버'],
        dialogue: [
            {
                keys: ['안녕', '누구'],
                text: "히익! 제... 제 코드 건드리지 마세요... 전 그냥 엔지니어라구요... ( ; _ ; )"
            },
            {
                keys: ['알리바이', '어디', '작업', '컴파일'],
                text: "난 밤새 코딩 중이었어! 컴파일 로그 보여줄 수 있어! 34번 라인에서 에러가 나서... 멘붕이었다고! ( O_O )"
            },
            {
                keys: ['돈', '채무', '피해자', '관계'],
                text: "그 사람이랑은... 그냥... 숫자 계산 좀 도와준 것뿐이야. 그 사람, 돈 계산이 3.14159... 아니, 좀 이상했어. ( ._. )",
                clue: "피해자:돈문제"
            },
            {
                keys: ['로그', '서버', '기록', '해킹'],
                text: "서버 로그? 그건 1급 기밀인데... 하지만 계산기를 찾아준다면 보여줄 수도 있어... ( ^_^ )"
            },
            {
                keys: ['계산기', 'ti-80', '물건'],
                text: "내 텍사스 인스트루먼트!! 잃어버려서 아무것도 못 하고 있었는데... 찾아주면 정말 고마울 거야! ( ㅠ_ㅠ )"
            }
        ],
        default: [
            "Syntax Error... 무슨 말인지 해석이 안 돼요. ( ; _ ; )",
            "입력값이 잘못되었습니다. 다시 시도하세요."
        ]
    },
    'Elena': {
        job: '배우',
        color: '#ffffcc',
        style: '{* - *}',
        topics: ['거울', '무대', '의상', '피해자'],
        dialogue: [
            {
                keys: ['안녕', '팬'],
                text: "어머, 엘레나를 보러 온 관객인가요? 사인은 나중에 해줄게요. {* ^ *}"
            },
            {
                keys: ['피해자', '남자', '관계', '죽음'],
                text: "흥, 그 촌스러운 남자? 내 소중한 무대 의상을 밟았었지. 사과도 제대로 안 했다니까? {* - *}",
                clue: "Elena:원한"
            },
            {
                keys: ['거울', '예쁘다', '미모', '아름'],
                text: "어머! 역시 보는 눈이 있네. 엘레나는 이 거울 없이는 연기에 집중할 수가 없어. {* O *}"
            },
            {
                keys: ['알리바이', '어디', '연기'],
                text: "난 내 방에서 대본 연습 중이었어. '죽느냐 사느냐 그것이 문제로다...' 완벽했지. {* ~ *}"
            }
        ],
        default: [
            "그런 재미없는 얘기는 대본에 없는데? {* - *}",
            "엘레나는 지루한 건 딱 질색이야."
        ]
    }
};

// [아카이브 데이터] - /search 명령어로 검색 가능
const archives = {
    '피해자': "신원: 존 도(John Doe), 35세. 직업 불명. 최근 도박 빚이 있었다는 소문이 있음.",
    '78번지': "사건 발생 장소. 낡은 아파트로 방음이 잘 되지 않음.",
    '훈장': "1950년 한국 전쟁 참전 용사에게 수여된 명예로운 훈장.",
    '비틀즈': "영국의 록 밴드. 1960년대 전설적인 인기를 끌었다. Daisy가 좋아한다.",
    '로그': "시스템 접속 기록 파일. Victor가 관리 권한을 가지고 있는 것으로 보임."
};

// --- 2. DOM Elements & Utilities ---
const outputDiv = document.getElementById('game-output');
const inputField = document.getElementById('user-input');
const targetSpan = document.getElementById('current-target');
const affinitySpan = document.getElementById('affinity-score');
const invSpan = document.getElementById('inventory-list');
const clockSpan = document.getElementById('clock');

// 시계 가동
setInterval(() => {
    const now = new Date();
    clockSpan.innerText = now.toLocaleTimeString('en-US', { hour12: false });
}, 1000);

function clearScreen() { outputDiv.innerHTML = ''; }

// 텍스트 출력 엔진
async function typeWriter(text, type = 'system', charName = null) {
    const div = document.createElement('div');
    
    if (type === 'user-msg') {
        div.className = 'chat-bubble chat-right';
        div.innerHTML = text;
    } else if (type === 'char-msg') {
        div.className = 'chat-bubble chat-left';
        const nameTag = `<span class="name-tag" style="color:${characters[charName].color}">${charName}</span>`;
        div.innerHTML = nameTag + text;
    } else if (type === 'sys-msg') {
        div.className = 'sys-msg';
        div.innerHTML = text;
    } else if (type === 'hint') {
        div.className = 'hint-box';
        div.innerHTML = `[HINT] ${text}`;
    } else if (type === 'error-msg') {
        div.className = 'error-msg';
        div.innerHTML = `[ERROR] ${text}`;
    } else {
        div.innerHTML = text; // 일반 텍스트
    }

    outputDiv.appendChild(div);
    outputDiv.scrollTop = outputDiv.scrollHeight;
    
    // 비동기 딜레이 (읽는 속도 고려)
    await new Promise(r => setTimeout(r, 20)); 
}

// --- 3. Input Handling ---
inputField.addEventListener('keydown', function (e) { // keypress 대신 keydown (한글 호환성)
    if (e.key === 'Enter') {
        const val = this.value.trim();
        if (val) {
            if (state.screen !== 'LOGIN') { // 로그인 아닐때만 말풍선 표시
                typeWriter(val, 'user-msg');
            }
            processInput(val);
        }
        this.value = '';
    }
});
document.addEventListener('click', () => inputField.focus());

// --- 4. Main Logic Router ---
async function processInput(input) {
    // 공통 명령어
    if (input === '/help') {
        showGlobalHelp();
        return;
    }
    if (input.startsWith('/memo ')) {
        const memoText = input.replace('/memo ', '');
        state.memo.push(memoText);
        typeWriter(`[메모 저장됨] ${memoText}`, 'sys-msg');
        return;
    }
    if (input === '/memo') {
        typeWriter(`=== 📝 탐정 수첩 ===<br>${state.memo.length ? state.memo.join('<br>') : '(비어있음)'}`, 'sys-msg');
        return;
    }
    if (input.startsWith('/search ')) {
        handleSearch(input.replace('/search ', ''));
        return;
    }

    // 화면별 분기
    switch (state.screen) {
        case 'LOGIN': handleLogin(input); break;
        case 'DESKTOP': handleDesktop(input); break;
        case 'PUBLIC_CHAT': handlePublicChat(input); break;
        case 'PRIVATE_CHAT': handlePrivateChat(input); break;
    }
}

// --- 5. Screen Handlers ---

// [LOGIN]
async function handleLogin(input) {
    if (input === '1234') {
        await typeWriter("[SUCCESS] 인증 성공. ARPANET 노드 #78에 접속합니다.", 'sys-msg');
        await new Promise(r => setTimeout(r, 800));
        transitionToDesktop();
    } else {
        await typeWriter("비밀번호가 일치하지 않습니다.", 'error-msg');
    }
}

// [DESKTOP]
function transitionToDesktop() {
    state.screen = 'DESKTOP';
    clearScreen();
    typeWriter("==========================================");
    typeWriter("    GHOST OS v3.0 - INTELLIGENT TERMINAL");
    typeWriter("==========================================");
    typeWriter("환영합니다. 현재 '78번지 살인사건' 수사가 진행 중입니다.");
    typeWriter("용의자들과 대화하여 모순을 찾아내고 범인을 지목하십시오.");
    typeWriter("");
    typeWriter("COMMANDS:", 'sys-msg');
    typeWriter("- /join  : 용의자들이 있는 채팅방 접속");
    typeWriter("- /search [키워드] : 경찰 데이터베이스 검색 (예: /search 피해자)");
    typeWriter("- /memo [내용] : 수첩에 메모");
}

async function handleDesktop(input) {
    if (input === '/join') {
        enterPublicChat();
    } else {
        typeWriter("알 수 없는 명령어입니다. '/join'을 입력하여 수사를 시작하세요.", 'error-msg');
    }
}

// [PUBLIC CHAT]
async function enterPublicChat() {
    state.screen = 'PUBLIC_CHAT';
    state.connectedChar = null;
    clearScreen();
    updateUI();
    
    await typeWriter(">>> 공개 채널 #LOBBY 접속 완료", 'sys-msg');
    if (!state.introWatched) {
        await typeWriter("Arthur, Daisy, Victor, Elena가 접속해 있습니다.", 'sys-msg');
        state.introWatched = true;
    }
    
    typeWriter("누구에게 말을 걸까요? (명령어: /dm [이름])", 'sys-msg');
    typeWriter("예: /dm Arthur, /dm Daisy");
}

async function handlePublicChat(input) {
    if (input.startsWith('/dm ')) {
        const target = input.split(' ')[1];
        // 첫 글자 대문자 변환 처리
        const formattedTarget = target.charAt(0).toUpperCase() + target.slice(1).toLowerCase();
        
        if (characters[formattedTarget]) {
            startPrivateChat(formattedTarget);
        } else {
            typeWriter("그런 사람은 이 방에 없습니다. (철자를 확인하세요)", 'error-msg');
        }
    } else if (input.startsWith('/accuse ')) {
        handleAccusation(input.split(' ')[1]);
    } else {
        typeWriter("공개 채널에서는 대화가 불가능합니다. '/dm [이름]'으로 귓속말을 하세요.", 'sys-msg');
    }
}

// [PRIVATE CHAT] - 핵심 로직
async function startPrivateChat(charName) {
    state.screen = 'PRIVATE_CHAT';
    state.connectedChar = charName;
    state.failCount = 0; // 힌트 카운트 초기화
    
    clearScreen();
    updateUI();
    
    const char = characters[charName];
    await typeWriter(`>>> ${charName}님과 암호화된 채널 연결됨`, 'sys-msg');
    
    // [UI 개선] 대화 가능한 주제 보여주기
    let topicList = char.topics.map(t => `[${t}]`).join(' ');
    typeWriter(`💡 대화 주제: ${topicList}`, 'hint');
    
    await typeWriter(`무슨 일이죠? ${char.style}`, 'char-msg', charName);
}

async function handlePrivateChat(input) {
    if (input === '/back') {
        enterPublicChat();
        return;
    }
    if (input.startsWith('/give ')) {
        handleGift(input.split(' ')[1]);
        return;
    }
    
    const char = characters[state.connectedChar];
    const userText = input.toLowerCase(); // 소문자로 통일하여 비교
    
    // 1. 대화 매칭 알고리즘
    let bestMatch = null;
    
    for (const logic of char.dialogue) {
        // keys 배열의 단어 중 하나라도 포함되어 있는지 확인
        const isMatch = logic.keys.some(key => userText.includes(key));
        if (isMatch) {
            bestMatch = logic;
            break;
        }
    }
    
    // 2. 응답 처리
    if (bestMatch) {
        state.failCount = 0; // 성공하면 실패 카운트 초기화
        await typeWriter(bestMatch.text, 'char-msg', state.connectedChar);
        
        // 단서 발견 처리
        if (bestMatch.clue && !state.cluesFound.includes(bestMatch.clue)) {
            state.cluesFound.push(bestMatch.clue);
            await new Promise(r => setTimeout(r, 500));
            typeWriter(`🔍 [단서 획득] 수첩에 기록됨: ${bestMatch.clue}`, 'hint');
        }
    } else {
        // 매칭 실패 시
        state.failCount++;
        const randomDefault = char.default[Math.floor(Math.random() * char.default.length)];
        await typeWriter(randomDefault, 'char-msg', state.connectedChar);
        
        // 3. 힌트 시스템 (3번 이상 못 알아들으면)
        if (state.failCount >= 2) {
            const randomTopic = char.topics[Math.floor(Math.random() * char.topics.length)];
            await new Promise(r => setTimeout(r, 500));
            typeWriter(`(시스템 힌트: '${randomTopic}'에 대해 물어보세요.)`, 'sys-msg');
            state.failCount = 0;
        }
    }
}

// --- 6. Features (Search, Gift, Ending) ---

function handleSearch(keyword) {
    typeWriter(`🔍 아카이브 검색 중: '${keyword}'...`, 'sys-msg');
    
    // 정확한 매칭 or 포함된 키워드 찾기
    const resultKey = Object.keys(archives).find(k => keyword.includes(k));
    
    if (resultKey) {
        typeWriter(`[RESULT] ${archives[resultKey]}`);
    } else {
        typeWriter("[NULL] 해당 키워드에 대한 데이터가 없습니다.", 'error-msg');
    }
}

function handleGift(item) {
    // 인벤토리 구현은 다음 단계에 (현재는 텍스트만 처리)
    typeWriter("현재 버전에서는 아이템을 건네줄 수 없습니다. (업데이트 예정)", 'sys-msg');
}

async function handleAccusation(name) {
    // 범인 지목 로직 (Victor가 범인)
    if (name === 'Victor') {
        clearScreen();
        await typeWriter("체포 영장 발부 중... [██████████] 100%", 'sys-msg');
        await typeWriter("Victor: 말도 안 돼... 내 알리바이 코드가 틀렸을 리 없어...!", 'char-msg', 'Victor');
        await typeWriter("축하합니다! 진범을 검거했습니다.", 'sys-msg');
        await typeWriter("THE ROOM: 1978 - CASE CLOSED");
    } else {
        typeWriter("증거 불충분. 그 사람은 범인이 아닙니다. 다시 조사하세요.", 'error-msg');
    }
}

function showGlobalHelp() {
    typeWriter("--- 명령어 리스트 ---", 'sys-msg');
    typeWriter("/dm [이름] : 해당 캐릭터와 대화");
    typeWriter("/back : 로비로 나가기");
    typeWriter("/search [단어] : 정보 검색");
    typeWriter("/memo [내용] : 메모하기");
    typeWriter("/accuse [이름] : 범인 지목 (신중하세요)");
}

function updateUI() {
    targetSpan.innerText = state.screen === 'PRIVATE_CHAT' ? state.connectedChar : 'LOBBY';
    affinitySpan.innerText = state.connectedChar ? state.affinity[state.connectedChar] : '-';
    invSpan.innerText = state.inventory.length || 'EMPTY';
}

// --- 7. Boot Sequence ---
window.onload = async () => {
    state.screen = 'BOOT';
    inputField.focus();
    
    // 초기 인벤토리 (테스트용)
    state.inventory = ['경찰 배지'];
    
    await typeWriter("GHOST OS v3.0 BOOTING...", 'sys-msg');
    await new Promise(r => setTimeout(r, 500));
    
    clearScreen();
    await typeWriter(" ACCESS RESTRICTED", 'error-msg');
    await typeWriter("보안 암호(1234)를 입력하세요.", 'sys-msg');
    state.screen = 'LOGIN';
};
// 초기 로드 시 바로 포커스 (New)
inputField.focus();
