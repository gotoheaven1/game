// 초기 상태 설정
let stats = {
    hunger: 100,
    energy: 100,
    fun: 100,
    money: 1000
};

// 로그 업데이트 함수
function addLog(message) {
    const logList = document.getElementById('game-log');
    const newLog = document.createElement('li');
    newLog.innerText = `[${new Date().toLocaleTimeString()}] ${message}`;
    logList.prepend(newLog); // 최신 로그가 위로 오게
}

// UI 업데이트 함수
function updateUI() {
    document.getElementById('hunger').innerText = Math.max(0, stats.hunger);
    document.getElementById('energy').innerText = Math.max(0, stats.energy);
    document.getElementById('fun').innerText = Math.max(0, stats.fun);
    document.getElementById('money').innerText = stats.money;

    // 사망 체크
    if (stats.hunger <= 0 || stats.energy <= 0) {
        addLog("💀 캐릭터가 너무 지쳐서 쓰러졌습니다! 게임 오버.");
        clearInterval(gameInterval);
        document.querySelectorAll('button').forEach(btn => btn.disabled = true);
    }
}

// 행동 수행 함수
function performAction(action) {
    switch(action) {
        case 'eat':
            if (stats.money >= 100) {
                stats.hunger = Math.min(100, stats.hunger + 30);
                stats.money -= 100;
                addLog("🍕 맛있는 피자를 먹었습니다. (-100§)");
            } else {
                addLog("❌ 돈이 부족해서 음식을 살 수 없습니다!");
            }
            break;
        case 'sleep':
            stats.energy = Math.min(100, stats.energy + 40);
            stats.hunger -= 10;
            addLog("🛌 푹 자고 일어났습니다. 에너지가 충전되었습니다.");
            break;
        case 'work':
            if (stats.energy >= 20) {
                stats.money += 200;
                stats.energy -= 20;
                stats.hunger -= 15;
                addLog("💼 열심히 일해서 200§을 벌었습니다!");
            } else {
                addLog("❌ 너무 지쳐서 일할 수 없습니다.");
            }
            break;
        case 'play':
            stats.fun = Math.min(100, stats.fun + 30);
            stats.energy -= 10;
            addLog("🎮 게임을 하며 즐거운 시간을 보냈습니다.");
            break;
    }
    updateUI();
}

// 시간에 따른 수치 감소 (6초마다 실행)
const gameInterval = setInterval(() => {
    stats.hunger -= 2;
    stats.energy -= 1;
    stats.fun -= 2;
    updateUI();
}, 6000);

updateUI(); // 초기 화면 업데이트
