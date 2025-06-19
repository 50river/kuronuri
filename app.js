const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('downloadBtn');


// 画像オブジェクト
let image = new Image();
// 現在の操作モード: draw/move/resize/null
let mode = null;
// ドラッグ開始座標
let startX, startY;
// 選択中のマスク index
let selectedMask = -1;
// サイズ変更時のハンドル識別
let resizeHandle = null;
// すべてのマスク領域
let masks = [];

const HANDLE_SIZE = 6;

// 座標がマスク内か判定
function inMask(x, y, m) {
    return x >= m.x && x <= m.x + m.w && y >= m.y && y <= m.y + m.h;
}

// 選択されたマスクのハンドルを取得
function getHandle(x, y, m) {
    const handles = [
        { x: m.x, y: m.y },
        { x: m.x + m.w, y: m.y },
        { x: m.x, y: m.y + m.h },
        { x: m.x + m.w, y: m.y + m.h },
    ];
    for (let i = 0; i < handles.length; i++) {
        const hx = handles[i].x;
        const hy = handles[i].y;
        if (Math.abs(x - hx) <= HANDLE_SIZE && Math.abs(y - hy) <= HANDLE_SIZE) {
            return i;
        }
    }
    return null;
}


function loadImage(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        image.onload = () => {
            canvas.width = image.width;
            canvas.height = image.height;
            redraw();
        };
        image.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (image.src) {
        ctx.drawImage(image, 0, 0);
    }

    masks.forEach((m, i) => {
        ctx.fillStyle = 'black';
        ctx.fillRect(m.x, m.y, m.w, m.h);
        if (i === selectedMask) {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(m.x, m.y, m.w, m.h);
            const handles = [
                { x: m.x, y: m.y },
                { x: m.x + m.w, y: m.y },
                { x: m.x, y: m.y + m.h },
                { x: m.x + m.w, y: m.y + m.h },
            ];
            ctx.fillStyle = 'white';
            handles.forEach(h => {
                ctx.fillRect(h.x - HANDLE_SIZE, h.y - HANDLE_SIZE, HANDLE_SIZE * 2, HANDLE_SIZE * 2);
                ctx.strokeRect(h.x - HANDLE_SIZE, h.y - HANDLE_SIZE, HANDLE_SIZE * 2, HANDLE_SIZE * 2);
            });
        }

    });
}

dropZone.addEventListener('dragover', e => {
    e.preventDefault();
});

dropZone.addEventListener('drop', e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) loadImage(file);
});

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) loadImage(file);
});

canvas.addEventListener('mousedown', e => {
    if (!image.src) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    selectedMask = -1;
    resizeHandle = null;
    for (let i = masks.length - 1; i >= 0; i--) {
        const m = masks[i];
        const handle = getHandle(x, y, m);
        if (handle !== null) {
            selectedMask = i;
            resizeHandle = handle;
            mode = 'resize';
            startX = x;
            startY = y;
            redraw();
            return;
        }
        if (inMask(x, y, m)) {
            selectedMask = i;
            mode = 'move';
            startX = x;
            startY = y;
            redraw();
            return;
        }
    }
    mode = 'draw';
    startX = x;
    startY = y;
});

canvas.addEventListener('mousemove', e => {
    if (!mode) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === 'draw') {
        redraw();
        const w = x - startX;
        const h = y - startY;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(startX, startY, w, h);
    } else if (mode === 'move' && selectedMask >= 0) {
        const m = masks[selectedMask];
        m.x += x - startX;
        m.y += y - startY;
        startX = x;
        startY = y;
        redraw();
    } else if (mode === 'resize' && selectedMask >= 0) {
        const m = masks[selectedMask];
        if (resizeHandle === 0) {
            m.w += m.x - x;
            m.h += m.y - y;
            m.x = x;
            m.y = y;
        } else if (resizeHandle === 1) {
            m.w = x - m.x;
            m.h += m.y - y;
            m.y = y;
        } else if (resizeHandle === 2) {
            m.w += m.x - x;
            m.x = x;
            m.h = y - m.y;
        } else if (resizeHandle === 3) {
            m.w = x - m.x;
            m.h = y - m.y;
        }
        redraw();
    }
});

canvas.addEventListener('mouseup', e => {
    if (!mode) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (mode === 'draw') {
        const w = x - startX;
        const h = y - startY;
        masks.push({ x: startX, y: startY, w, h });
    }
    mode = null;
    redraw();
});

window.addEventListener('keydown', e => {
    if (e.key === 'Delete' && selectedMask >= 0) {
        masks.splice(selectedMask, 1);
        selectedMask = -1;
        redraw();
    }
});


downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'masked.png';
    link.click();
});
