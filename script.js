/* === 전역 설정 === */
const SPEED = 900; // 노트 속도 (조금 더 빠르게)
const HIT_bottom = window.innerHeight * 0.85; // 판정선 위치 (화면 하단 85%)
const TRAVEL_TIME = (HIT_bottom + 50) / SPEED * 1000;

const lanes = document.querySelectorAll('.lane');
const noteContainer = document.getElementById('noteContainer');
const bgm = document.getElementById('bgm');
const startBtn = document.getElementById('startBtn');
const loadingText = document.getElementById('loadingText');

let gameState = {
    score: 0,
    combo: 0,
    isPlaying: false,
    startTime: 0,
    notes: [],
    activeNotes: []
};

let noteIndex = 0;

/* === 1. 초기화 및 이벤트 리스너 === */

// 테마 변경
document.getElementById('themeSelect').addEventListener('change', (e) => {
    document.documentElement.setAttribute('data-theme', e.target.value);
});

// 게임 시작 버튼
startBtn.addEventListener('click', () => {
    const selectedSong = document.getElementById('songSelect').value;
    
    // UI 업데이트
    startBtn.style.display = 'none';
    loadingText.classList.remove('hidden');

    bgm.src = selectedSong;
    bgm.load();
});

// 오디오 로딩 완료 시 게임 시작
bgm.addEventListener('canplaythrough', () => {
    if (!gameState.isPlaying) {
        initGame();
    }
}, { once: true });

/* === 2. 게임 로직 === */

function initGame() {
    gameState.score = 0;
    gameState.combo = 0;
    gameState.isPlaying = true;
    gameState.activeNotes = [];
    noteIndex = 0;
    noteContainer.innerHTML = '';
    
    updateUI();
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('resultScreen').classList.add('hidden');

    // 맵 데이터 생성 (노래 길이에 맞춰서)
    const duration = bgm.duration;
    gameState.notes = generateAutoMap(duration);

    bgm.play().then(() => {
        gameState.startTime = performance.now();
        requestAnimationFrame(gameLoop);
    }).catch(e => {
        alert("오디오 재생 실패. 화면을 다시 터치해주세요.");
        console.error(e);
    });
}

function generateAutoMap(durationSec) {
    const notes = [];
    const bpm = 115; // Tyla 노래들의 평균 BPM
    const beatInterval = 60 / bpm * 1000; 
    
    // 첫 2초는 대기, 그 후 생성
    for (let t = 2000; t < durationSec * 1000; t += beatInterval) {
        // 랜덤 패턴 생성
        const r = Math.random();
        
        if (r < 0.7) { 
            // 단타 (70%)
            notes.push({ time: t, lane: Math.floor(Math.random() * 4) });
        } else if (r < 0.9) {
            // 동시 치기 (20%)
            const l1 = Math.floor(Math.random() * 4);
            const l2 = (l1 + 2) % 4; // 서로 떨어진 레인
            notes.push({ time: t, lane: l1 });
            notes.push({ time: t, lane: l2 });
        }
        // 10% 확률로 쉼표 (노트 생성 안 함)
    }
    return notes.sort((a, b) => a.time - b.time);
}

function gameLoop(time) {
    if (!gameState.isPlaying) return;

    const curTime = time - gameState.startTime;

    // 1. 노트 스폰
    while (noteIndex < gameState.notes.length) {
        const noteData = gameState.notes[noteIndex];
        if (noteData.time - TRAVEL_TIME <= curTime) {
            spawnNote(noteData);
            noteIndex++;
        } else {
            break;
        }
    }

    // 2. 노트 이동
    gameState.activeNotes.forEach((noteObj, idx) => {
        const timeUntilHit = noteObj.targetTime - curTime;
        const y = HIT_bottom - (timeUntilHit / 1000 * SPEED);
        
        noteObj.el.style.transform = `translateY(${y}px)`;

        // 미스 처리 (화면 밖으로 나감)
        if (y > window.innerHeight + 100) {
            gameState.activeNotes.splice(idx, 1);
            noteObj.el.remove();
            resetCombo();
            showJudge("MISS", "#555");
        }
    });

    // 3. 게임 종료 체크
    if (bgm.ended) {
        setTimeout(endGame, 1000);
        return;
    }

    requestAnimationFrame(gameLoop);
}

function spawnNote(noteData) {
    const el = document.createElement('div');
    el.className = 'note';
    el.style.left = `${noteData.lane * 25}%`; 
    noteContainer.appendChild(el);

    gameState.activeNotes.push({
        el: el,
        lane: noteData.lane,
        targetTime: noteData.time
    });
}

/* === 3. 입력 처리 === */

// 터치 & 마우스 공통 처리
function handleInput(laneIndex) {
    if (!gameState.isPlaying) return;

    const lane = lanes[laneIndex];
    lane.classList.add('active');
    setTimeout(() => lane.classList.remove('active'), 100);

    // 모바일 진동
    if (navigator.vibrate) navigator.vibrate(15);

    const curTime = performance.now() - gameState.startTime;
    
    // 판정
    const hitIndex = gameState.activeNotes.findIndex(note => 
        note.lane === laneIndex && 
        Math.abs(note.targetTime - curTime) < 350
    );

    if (hitIndex > -1) {
        const note = gameState.activeNotes[hitIndex];
        const diff = Math.abs(note.targetTime - curTime);
        
        note.el.remove();
        gameState.activeNotes.splice(hitIndex, 1);

        if (diff < 80) {
            showJudge("PERFECT", "#ff00ff");
            addScore(100);
        } else if (diff < 150) {
            showJudge("GREAT", "#00ffff");
            addScore(50);
        } else {
            showJudge("GOOD", "#ffff00");
            addScore(20);
        }
    }
}

// 이벤트 바인딩
lanes.forEach((lane, index) => {
    // 모바일 터치
    lane.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleInput(index);
    }, { passive: false });

    // PC 마우스
    lane.addEventListener('mousedown', () => handleInput(index));
});

// PC 키보드
document.addEventListener('keydown', (e) => {
    const keyMap = { 'd':0, 'f':1, 'j':2, 'k':3 };
    if (keyMap[e.key] !== undefined) handleInput(keyMap[e.key]);
});

function showJudge(text, color) {
    const j = document.getElementById('judgment');
    j.innerText = text;
    j.style.color = color;
    j.classList.remove('pop-anim');
    void j.offsetWidth;
    j.classList.add('pop-anim');
}

function addScore(points) {
    gameState.score += points + (gameState.combo * 5);
    gameState.combo++;
    updateUI();
}

function resetCombo() {
    gameState.combo = 0;
    updateUI();
}

function updateUI() {
    document.getElementById('scoreVal').innerText = gameState.score;
    document.getElementById('comboVal').innerText = gameState.combo;
}

function endGame() {
    gameState.isPlaying = false;
    document.getElementById('resultScreen').classList.remove('hidden');
    document.getElementById('finalScore').innerText = gameState.score;
    // UI 초기화
    startBtn.style.display = 'block';
    loadingText.classList.add('hidden');
}
