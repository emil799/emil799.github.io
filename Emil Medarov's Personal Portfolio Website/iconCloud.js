const canvasParticle = document.getElementById('icon-cloud');
const ctx2 = canvasParticle.getContext('2d');
const icons = document.querySelectorAll('#icon-list li img');
const iconObjects = [];
let rotationX = 0;
let rotationY = 0;
let zoomLevel = 1;
let rotationSpeedX = 0; // Скорост на ротация по X
let rotationSpeedY = 0; // Скорост на ротация по Y
let isMouseInside = false;

// Задаване на икони в 3D пространство като сфера
function setupIcons() {
    const radius = 200; // Радиусът на сферичния облак

    icons.forEach((icon, index) => {
        const phi = Math.acos(-1 + (2 * index) / icons.length);
        const theta = Math.sqrt(icons.length * Math.PI) * phi;

        const x = radius * Math.cos(theta) * Math.sin(phi);
        const y = radius * Math.sin(theta) * Math.sin(phi);
        const z = radius * Math.cos(phi);

        iconObjects.push({
            element: icon,
            x: x,
            y: y,
            z: z,
            size: 50,
        });
    });
}

// Обновяване на позициите и рендериране на иконите с въртене
function render() {
    ctx2.clearRect(0, 0, canvasParticle.width, canvasParticle.height);

    iconObjects.forEach(icon => {
        // Приложение на ротационни трансформации
        const cosY = Math.cos(rotationY);
        const sinY = Math.sin(rotationY);
        const cosX = Math.cos(rotationX);
        const sinX = Math.sin(rotationX);

        const x = icon.x * cosY - icon.z * sinY;
        const z = icon.x * sinY + icon.z * cosY;
        const y = icon.y * cosX - z * sinX;

        // Приложение на зуум
        const scale = 1 / zoomLevel;
        const x2d = canvasParticle.width / 2 + x * scale;
        const y2d = canvasParticle.height / 2 + y * scale;

        // Рендериране на иконата
        const img = new Image();
        img.src = icon.element.src;

        ctx2.save(); // Запазваме състоянието на контекста
        ctx2.filter = 'drop-shadow(1px 2px 2.5px rgba(200, 200, 200, 0.5))'; // Светлосива сянка с лек offset
        ctx2.drawImage(img, x2d - icon.size / 2, y2d - icon.size / 2, icon.size * scale, icon.size * scale);
        ctx2.restore(); // Възстановяваме състоянието на контекста
        // ctx2.drawImage(img, x2d - icon.size / 2, y2d - icon.size / 2, icon.size * scale, icon.size * scale);
    });

    // Обновяване на ротацията с инерция
    rotationX += rotationSpeedX;
    rotationY += rotationSpeedY;

    requestAnimationFrame(render);
}

// Събитие за движение на мишката за задаване на посоката на ротация
canvasParticle.addEventListener('mousemove', (event) => {
    if (!isMouseInside) return;

    const rect = canvasParticle.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Изчисляване на нова скорост на ротация в зависимост от позицията на мишката
    rotationSpeedY = ((mouseX - canvasParticle.width / 2) / canvasParticle.width) * 0.03;
    rotationSpeedX = ((mouseY - canvasParticle.height / 2) / canvasParticle.height) * 0.03;
});

// Следене дали курсорът е вътре в канваса, за да активира ротацията
canvasParticle.addEventListener('mouseenter', () => {
    isMouseInside = true;
});

canvasParticle.addEventListener('mouseleave', () => {
    isMouseInside = false;
    // Поддържаме текущата посока на въртене, без промяна на скоростта
});

// Събитие за въртене на колелото на мишката за зуум
canvasParticle.addEventListener('wheel', (event) => {
    // Увеличаване на зуум нивото при scroll up и намаляване при scroll down
    zoomLevel -= event.deltaY * 0.001;
    zoomLevel = Math.min(Math.max(0.5, zoomLevel), 2); // Ограничаване на зуум нивото
    event.preventDefault(); // Предотвратяване на скролиране на страницата
});

setupIcons();
render();
