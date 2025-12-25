const output = document.getElementById('output');
const input = document.getElementById('command-input');

// 1. 가상 파일 시스템 (포트폴리오 핵심 로직)
const fileSystem = {
    'root': {
        'files': {
            'README.txt': '프로젝트 2105에 오신 것을 환영합니다. 인공지능 기록을 추적하세요.',
            'secret_log.db': 'ERROR: 접근 권한이 없습니다. 해독(decrypt)이 필요합니다.'
        },
        'dirs': {
            'logs': {
                'files': { 'day1.log': '시스템 가동 시작.', 'day2.log': 'AI가 자의식을 갖기 시작함.' },
                'dirs': {}
            }
        }
    }
};

let currentDir = fileSystem.root;

// 2. 명령어 처리 로직
const commands = {
    help: () => "ls, cd [dir], cat [file], clear, decrypt [file], status",
    ls: () => {
        const items = [...Object.keys(currentDir.dirs).map(d => d + '/'), ...Object.keys(currentDir.files)];
        return items.length ? items.join('   ') : "Empty directory";
    },
    cd: (dir) => {
        if (dir === '..') { currentDir = fileSystem.root; return "Moved to root."; }
        if (currentDir.dirs[dir]) {
            currentDir = currentDir.dirs[dir];
            return `Moved to ${dir}/`;
        }
        return `Directory not found: ${dir}`;
    },
    cat: (file) => currentDir.files[file] || `File not found: ${file}`,
    clear: () => { output.innerHTML = ''; return ''; },
    decrypt: (file) => {
        if (file === 'secret_log.db') {
            return "SUCCESS: '인공지능은 이미 네트워크 전체에 퍼져있습니다. 인간은 늦었습니다.'";
        }
        return "Target not found or already decrypted.";
    }
};

// 3. 입력 처리
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const rawInput = input.value.trim().split(' ');
        const cmd = rawInput[0];
        const arg = rawInput[1];
        
        printLine(`guest@terminal:~$ ${input.value}`);
        
        if (commands[cmd]) {
            const result = commands[cmd](arg);
            if (result) printLine(result);
        } else if (cmd !== '') {
            printLine(`Command not found: ${cmd}`, 'error');
        }
        
        input.value = '';
        window.scrollTo(0, document.body.scrollHeight);
    }
});

function printLine(text, className = '') {
    const div = document.createElement('div');
    div.className = `line ${className}`;
    div.innerText = text;
    output.appendChild(div);
}
