function RNG(seed) {
    this.seed = seed;
    const m = 2 ** 31;
    this.next = function () {
        this.seed = (1103515245 * this.seed + 12345) % m;
        return (this.seed / m) * 2;
    };
}

function drawVertex(index, positions, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(positions[index].x, positions[index].y, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.font = '25px Times New Roman';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${index + 1}`, positions[index].x, positions[index].y);
}

function drawEdge(start, end, vertexPositions, adjMatrix, color, weights, lineWidth = 1) {
    if (adjMatrix[start][end] === 1 && start <= 10 && start <= end) {
        ctx.lineWidth = lineWidth;
        const { x: x1, y: y1 } = vertexPositions[start];
        const { x: x2, y: y2 } = vertexPositions[end];
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.fillStyle = 'white';
        ctx.font = '20px Times New Roman';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = color;
        if (start !== end) {
            ctx.fillText(`${weights[start][end]}`, midX, midY);
            ctx.lineTo(x1, y1);
        } else {
            selfLoop(start, x1, y1, color, weights[start][end]);
        }
        ctx.stroke();
    }
}


function selfLoop(index, x, y, color, weight) {
    ctx.strokeStyle = color;
    const offsetX = (x > canvas.width / 2) ? 32 : -32;
    x += offsetX;
    ctx.beginPath();
    ctx.arc(x, y - 15, 20, Math.PI / 1.3, Math.PI * 6.5 / 2);
    ctx.fillText(`${weight}`, x + offsetX, y - 15);
    ctx.stroke();
    ctx.closePath();
}

const rng = new RNG(3307);
const num1 = 3, num2 = 3, num3 = 0, num4 = 7;
const totalVertices = 10 + num3;
const factor = 1 - num3 * 0.01 - num4 * 0.005 - 0.05;

const randomMatrix = Array.from({ length: totalVertices }, () => Array.from({ length: totalVertices }, () => Math.floor(rng.next() * factor)));
const adjMatrix = randomMatrix.map((row, i) => row.map((val, j) => Math.max(val, randomMatrix[j][i])));

logToConsole('Undirected graph matrix:');
logToConsole(formatMatrix(adjMatrix));

const randomWeights = Array.from({ length: totalVertices }, () => Array.from({ length: totalVertices }, rng.next.bind(rng)));
const weightedMatrix = randomWeights.map((row, i) => row.map((val, j) => Math.ceil(val * 100 * adjMatrix[i][j])));
const binMatrix = weightedMatrix.map(row => row.map(val => (val > 0 ? 1 : 0)));
const asymMatrix = binMatrix.map((row, i) => row.map((val, j) => (val !== binMatrix[j][i] ? 1 : 0)));
const upperTriMatrix = Array.from({ length: totalVertices }, (_, i) => Array.from({ length: totalVertices }, (_, j) => (i < j ? 1 : 0)));

const weightMatrix = Array.from({ length: totalVertices }, () => Array(totalVertices).fill(0)); // Створення порожньої матриці

for (let i = 0; i < totalVertices; i++) {
    for (let j = 0; j < totalVertices; j++) {
        if (i <= j) {
            weightMatrix[i][j] = (binMatrix[i][j] + asymMatrix[i][j] * upperTriMatrix[i][j]) * weightedMatrix[i][j];
            weightMatrix[j][i] = weightMatrix[i][j];
        }
    }
}

logToConsole('Weight graph matrix:');
logToConsole(formatMatrix(weightMatrix));

class GraphNode {
    constructor(value, weight) {
        this.value = value;
        this.weight = weight;
        this.next = null;
    }
}

class NodeList {
    constructor() {
        this.head = null;
    }
    append(value, weight) {
        const newNode = new GraphNode(value, weight);
        if (!this.head) {
            this.head = newNode;
        } else {
            let current = this.head;
            while (current.next) current = current.next;
            current.next = newNode;
        }
    }
}

const nodeList = new NodeList();
const canvas = document.getElementById('graph');
const ctx = canvas.getContext('2d');
const radius = 300;
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const angleInc = (2 * Math.PI) / (totalVertices - 1);
const vertexCoords = Array.from({ length: totalVertices - 1 }, (_, i) => ({
    x: centerX - radius * Math.cos(i * angleInc),
    y: centerY - radius * Math.sin(i * angleInc)
}));

vertexCoords.push({ x: centerX, y: centerY });

const initialVertex = adjMatrix.findIndex(row => row.includes(1));

adjMatrix.forEach((row, i) => row.forEach((_, j) => drawEdge(i, j, vertexCoords, adjMatrix, 'green', weightMatrix)));
vertexCoords.forEach((_, i) => {
    nodeList.append(i, weightMatrix[i]);
    drawVertex(i, vertexCoords, '#FF5733');
});

logToConsole('Initial list of nodes:');
logToConsole(nodeList);

let visitedVertices = [[nodeList.head.value]];
let totalWeight = 0;

function nextStep() {
    let minWeight = Infinity;
    let startVertex, endVertex;
    let node = nodeList.head;
    while (node) {
        if (visitedVertices[0].includes(node.value)) {
            node.weight.forEach((w, i) => {
                if (w < minWeight && w !== 0 && !visitedVertices[0].includes(i)) {
                    minWeight = w;
                    startVertex = node.value;
                    endVertex = i;
                }
            });
        }
        node = node.next;
    }
    visitedVertices[0].push(endVertex);
    logToConsole('Visited vertices:');
    logToConsole(visitedVertices[0]);
    visitedVertices.push([startVertex, endVertex]);
    const [i, j] = startVertex > endVertex ? [endVertex, startVertex] : [startVertex, endVertex];
    drawEdge(i, j, vertexCoords, adjMatrix, 'white', weightMatrix, 2);
    drawVertex(i, vertexCoords, '#FF5733');
    drawVertex(j, vertexCoords, '#FF5733');
    totalWeight += minWeight;
    logToConsole(`Total weight: ${totalWeight}`);
}

function logToConsole(message) {
    const consoleDiv = document.getElementById('console');
    if (typeof message === 'object') {
        consoleDiv.innerText += JSON.stringify(message, null, 2) + '\n';
    } else {
        consoleDiv.innerText += message + '\n';
    }
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

function formatMatrix(matrix) {
    return matrix.map(row => row.join(' ')).join('\n');
}
