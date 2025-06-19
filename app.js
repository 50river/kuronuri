const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('downloadBtn');

let image = new Image();
let drawing = false;
let startX, startY;
let masks = [];

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
    masks.forEach(m => {
        ctx.fillStyle = 'black';
        ctx.fillRect(m.x, m.y, m.w, m.h);
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
    drawing = true;
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
});

canvas.addEventListener('mousemove', e => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    redraw();
    const w = x - startX;
    const h = y - startY;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(startX, startY, w, h);
});

canvas.addEventListener('mouseup', e => {
    if (!drawing) return;
    drawing = false;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = x - startX;
    const h = y - startY;
    masks.push({ x: startX, y: startY, w, h });
    redraw();
});

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'masked.png';
    link.click();
});
