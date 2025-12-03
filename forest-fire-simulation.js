// --- SECTION 1: GLOBAL VARIABLES & CONSTANTS ---
const GRID_SIZE = 256; 
const TOTAL_SITES = GRID_SIZE * GRID_SIZE;
const STATES = { VACANT: 0, TREE: 1, BURNING: 2 };
const FIRE_ANIMATION_SPEED = 1; 
const RECENTLY_BURNED_STATE = -1; 
const BURN_DECAY_FRAMES = 15; 

let grid; 
let isSimulating = false; 
let isFireActive = false;
let probabilityP, f_s, stepsPerFrame, seed, animateFires;
let N_s = 0; 
let treeCount = 0;
let fireQueue = []; 
let nextFireQueue = []; 
let currentFireSize = 0;
let fireStats = new Map(); 
let totalFires = 0;

const canvas = document.getElementById('forestCanvas');
const ctx = canvas.getContext('2d');
const logLogPlotCanvas = document.getElementById('logLogPlotCanvas');
let logLogChart; 

const pSlider = document.getElementById('pSlider'); 
const pValue = document.getElementById('pValue'); 
const fSlider = document.getElementById('fSlider');
const fValue = document.getElementById('fValue'); 
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue'); 
const startButton = document.getElementById('startButton');
const resetButton = document.getElementById('resetButton'); 
const seedBox = document.getElementById('seedBox');
const animateToggle = document.getElementById('animateToggle');

const timestepsReadout = document.getElementById('timesteps'); 
const treeCountReadout = document.getElementById('treeCount');
const treeDensityReadout = document.getElementById('treeDensity'); 
const totalFiresReadout = document.getElementById('totalFires');

let rng; // PRNG

// --- SECTION 2: PSEUDO-RANDOM NUMBER GENERATOR (PRNG) ---

function seedableRNG(seedStr) { 
    let s = cyrb128(seedStr); 
    let a = s[0], b = s[1], c = s[2], d = s[3]; 
    return function() { 
        a |= 0; b |= 0; c |= 0; d |= 0; 
        let t = (a + b | 0) + d | 0; 
        d = d + 1 | 0; 
        a = b ^ b >>> 9; 
        b = c + (c << 3) | 0; 
        c = (c << 21 | c >>> 11); 
        c = c + t | 0; 
        return (t >>> 0) / 4294967296; 
    }
}

function cyrb128(str) { 
    let h1=1779033703, h2=3144134277, h3=1013904242, h4=2773480762; 
    for (let i=0, k; i<str.length; i++) { 
        k=str.charCodeAt(i); 
        h1=h2^Math.imul(h1^k,597399067); 
        h2=h3^Math.imul(h2^k,2869860233); 
        h3=h4^Math.imul(h3^k,951274213); 
        h4=h1^Math.imul(h4^k,2716044179); 
    } 
    h1=Math.imul(h3^(h1>>>18),597399067); 
    h2=Math.imul(h4^(h2>>>22),2869860233); 
    h3=Math.imul(h1^(h3>>>17),951274213); 
    h4=Math.imul(h2^(h4>>>19),2716044179); 
    return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}

function getRandomInt(max) { 
    return Math.floor(rng() * max); 
}

// --- SECTION 3: EVENT LISTENERS ---

pSlider.oninput = function() { 
    probabilityP = parseFloat(this.value); 
    pValue.textContent = probabilityP.toFixed(4); 
    const max_f = probabilityP / 10.0; 
    fSlider.max = max_f; 
    if (f_s > max_f) { 
        f_s = max_f; 
        fSlider.value = f_s; 
    } 
    fValue.textContent = f_s.toExponential(2);
};

fSlider.oninput = function() { 
    f_s = parseFloat(this.value); 
    fValue.textContent = f_s.toExponential(2);
};

speedSlider.oninput = function() { 
    stepsPerFrame = parseInt(this.value, 10); 
    speedValue.textContent = stepsPerFrame;
};

animateToggle.onchange = function() { 
    animateFires = this.checked;
};

startButton.onclick = function() { 
    isSimulating = !isSimulating; 
    if (isSimulating) { 
        this.textContent = 'Stop'; 
        this.classList.add('running'); 
        requestAnimationFrame(mainLoop); 
    } else { 
        this.textContent = 'Start'; 
        this.classList.remove('running'); 
    }
};

resetButton.onclick = function() { 
    if (isSimulating) { 
        isSimulating = false; 
        startButton.textContent = 'Start'; 
        startButton.classList.remove('running'); 
    } 
    initializeSimulation();
};

// --- SECTION 4: SIMULATION INITIALIZATION ---

function initializeSimulation() {
    probabilityP = parseFloat(pSlider.value); 
    const max_f = probabilityP / 10.0; 
    fSlider.max = max_f;
    if (parseFloat(fSlider.value) > max_f) { 
        fSlider.value = max_f; 
    }
    f_s = parseFloat(fSlider.value); 
    stepsPerFrame = parseInt(speedSlider.value, 10);
    seed = seedBox.value; 
    animateFires = animateToggle.checked;

    pValue.textContent = probabilityP.toFixed(4); 
    fValue.textContent = f_s.toExponential(2);
    speedValue.textContent = stepsPerFrame;

    canvas.width = GRID_SIZE;
    canvas.height = GRID_SIZE;

    rng = seedableRNG(seed); 
    grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(STATES.VACANT));

    N_s = 0; 
    treeCount = 0; 
    totalFires = 0; 
    isFireActive = false;
    fireQueue = []; 
    nextFireQueue = []; 
    currentFireSize = 0; 
    fireStats.clear();

    drawGrid();
    initializeLogLogPlot(); 
}

/**
 * Initializes the Log-Log plot
 * - Points are yellow
 * - Axis ticks/gridlines are only shown for powers of 10
 * - Font sizes for title, legend, and axes are larger
 * - Axes min/max are fixed
 */
function initializeLogLogPlot() {
    if (logLogChart) { 
        logLogChart.destroy(); 
    }
    const plotCtx = logLogPlotCanvas.getContext('2d');
    
    // This function hides grid lines/ticks that aren't powers of 10
    const logTickCallback = function(value, index, ticks) {
        const logVal = Math.log10(value);
        // Check if it's a power of 10 (or very close due to floating point)
        if (Math.abs(logVal - Math.round(logVal)) < 1e-9) {
            return value.toLocaleString();
        }
        // Also explicitly show 1
        if (value === 1) {
            return "1";
        }
        return undefined; // Hide other labels and grid lines
    };
    
    logLogChart = new Chart(plotCtx, {
        type: 'scatter', 
        data: { 
            datasets: [
                { 
                    label: 'Log-Binned Data',
                    data: [], 
                    backgroundColor: 'rgba(255, 191, 0, 0.7)' // Fire-yellow color
                }
            ]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
                title: { 
                    display: true, 
                    text: 'Log-Log Plot (Binned)', 
                    color: '#e0e0e0', 
                    font: { size: 18 } 
                },
                legend: { 
                    labels: { 
                        color: '#e0e0e0',
                        font: { size: 16 } 
                    } 
                }
            },
            scales: { 
                x: { 
                    type: 'logarithmic', 
                    title: { 
                        display: true, 
                        text: 'Fire size (log scale)',
                        color: '#e0e0e0',
                        font: { size: 18 }
                    }, 
                    ticks: { 
                        color: '#c0c0c0',
                        font: { size: 14 },
                        callback: logTickCallback
                    }, 
                    grid: { 
                        color: '#444' 
                    },
                    min: 1,
                    max: 100000 
                }, 
                y: { 
                    type: 'logarithmic', 
                    title: { 
                        display: true, 
                        text: 'Normalized Fire count (log scale)',
                        color: '#e0e0e0',
                        font: { size: 18 }
                    }, 
                    ticks: { 
                        color: '#c0c0c0',
                        font: { size: 14 },
                        callback: logTickCallback
                    }, 
                    grid: { 
                        color: '#444' 
                    },
                    min: 0.000001, 
                    max: 1000000 
                }
            }
        }
    });
}

// --- SECTION 5: CORE SIMULATION LOGIC ---

function runSimulationSteps() { 
    for (let i = 0; i < stepsPerFrame; i++) { 
        const x_g = getRandomInt(GRID_SIZE); 
        const y_g = getRandomInt(GRID_SIZE); 
        if (grid[y_g][x_g] === STATES.VACANT && rng() < probabilityP) { 
            grid[y_g][x_g] = STATES.TREE; 
            treeCount++; 
        } 
        const x_f = getRandomInt(GRID_SIZE); 
        const y_f = getRandomInt(GRID_SIZE); 
        if (grid[y_f][x_f] === STATES.TREE && rng() < f_s) { 
            startFire(x_f, y_f); 
            return; 
        } 
        N_s++; 
    }
}

function startFire(x, y) { 
    isFireActive = true; 
    grid[y][x] = STATES.BURNING; 
    treeCount--; 
    currentFireSize = 1; 
    fireQueue.push({x: x, y: y});
}

function runFireStepAnimated() { 
    for (let i = 0; i < FIRE_ANIMATION_SPEED && isFireActive; i++) {
        nextFireQueue = [];
        for (const cell of fireQueue) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = cell.x + dx; 
                    const ny = cell.y + dy;
                    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && grid[ny][nx] === STATES.TREE) {
                        grid[ny][nx] = STATES.BURNING; 
                        treeCount--; 
                        currentFireSize++;
                        nextFireQueue.push({x: nx, y: ny});
                    }
                }
            }
            grid[cell.y][cell.x] = RECENTLY_BURNED_STATE - BURN_DECAY_FRAMES + 1; 
        }
        fireQueue = nextFireQueue;
        if (fireQueue.length === 0) { 
            endFire(); 
        }
    }
}

function runFireInstantly() { 
    while (isFireActive) {
        nextFireQueue = [];
        for (const cell of fireQueue) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = cell.x + dx; 
                    const ny = cell.y + dy;
                    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && grid[ny][nx] === STATES.TREE) {
                        grid[ny][nx] = STATES.BURNING; 
                        treeCount--; 
                        currentFireSize++;
                        nextFireQueue.push({x: nx, y: ny});
                    }
                }
            }
            grid[cell.y][cell.x] = RECENTLY_BURNED_STATE - BURN_DECAY_FRAMES + 1; 
        }
        fireQueue = nextFireQueue;
        if (fireQueue.length === 0) { 
            endFire(); 
        }
    }
}

/** Cleans up after a fire is finished. */
function endFire() { 
    isFireActive = false; 
    recordFireStatistics(); 
    currentFireSize = 0;
}

// --- SECTION 6: STATISTICS & PLOTTING ---

function recordFireStatistics() { 
    if (currentFireSize === 0) return; 
    const currentCount = fireStats.get(currentFireSize) || 0; 
    fireStats.set(currentFireSize, currentCount + 1); 
    totalFires++;
}

function updateStatsReadouts() { 
    timestepsReadout.textContent = N_s.toLocaleString(); 
    treeCountReadout.textContent = treeCount.toLocaleString(); 
    totalFiresReadout.textContent = totalFires.toLocaleString(); 
    const density = (treeCount / TOTAL_SITES) * 100; 
    treeDensityReadout.textContent = `${density.toFixed(2)}%`;
}

/**
 * Performs logarithmic binning of fire statistics
 */
function performLogBinning(fireStats, binBase = 1.5) {
    if (fireStats.size === 0) return [];

    const sortedSizes = Array.from(fireStats.keys()).sort((a, b) => a - b);
    if (sortedSizes.length === 0) return [];
    
    const maxFire = sortedSizes[sortedSizes.length - 1];
    
    let binEdges = [1];
    let currentEdge = 1;
    while (currentEdge <= maxFire) {
        currentEdge *= binBase;
        binEdges.push(Math.round(currentEdge));
    }
    binEdges.push(Math.round(currentEdge * binBase));

    const binnedData = [];
    let dataIndex = 0; 

    for (let i = 0; i < binEdges.length - 1; i++) {
        const binMin = binEdges[i];
        const binMax = binEdges[i+1]; 
        
        if (binMin >= binMax) continue; 
        
        const binWidth = binMax - binMin;
        
        let totalCount = 0;    
        let weightedSizeSum = 0;  

        while (dataIndex < sortedSizes.length && sortedSizes[dataIndex] < binMin) {
            dataIndex++;
        }

        let k = dataIndex;
        while (k < sortedSizes.length && sortedSizes[k] < binMax) {
            const size = sortedSizes[k];
            const count = fireStats.get(size);
            totalCount += count;
            weightedSizeSum += size * count;
            k++;
        }

        if (totalCount > 0) {
            binnedData.push({
                x: weightedSizeSum / totalCount, // Average size in bin
                y: totalCount / binWidth         // Normalized count (probability density P(s))
            });
        }
    }
    return binnedData;
}

/** Updates the log-log plot */
function updatePlots() {
    if (totalFires < 2) return;

    // Log-binned data for log-log plot
    const binnedLogData = performLogBinning(fireStats, 1.5);
    if (logLogChart) {
        logLogChart.data.datasets[0].data = binnedLogData;
        logLogChart.update('none'); 
    }
}

// --- SECTION 7: RENDERING & MAIN LOOP ---

const COLORS = { 
    [STATES.VACANT]: { r: 30, g: 30, b: 30 },   
    [STATES.TREE]:   { r: 34, g: 139, b: 34 },  
    AMBER: { r: 255, g: 191, b: 0 } 
};

function drawGrid() { 
    const imageData = ctx.createImageData(GRID_SIZE, GRID_SIZE);
    const data = imageData.data; 
    let dataIndex = 0;
    
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const state = grid[y][x];
            let r, g, b;

            if (state === STATES.BURNING) {
                const flicker = 150 + getRandomInt(105);
                r = 255; 
                g = flicker; 
                b = 0;
            } else if (state <= RECENTLY_BURNED_STATE) { 
                const decayProgress = (state - RECENTLY_BURNED_STATE + 1) / BURN_DECAY_FRAMES; 
                const intensity = 1.0 - decayProgress; 
                r = COLORS.AMBER.r * intensity;
                g = COLORS.AMBER.g * intensity;
                b = COLORS.AMBER.b * intensity;
            } else { 
                const color = (state === STATES.TREE) ? COLORS[STATES.TREE] : COLORS[STATES.VACANT];
                r = color.r; 
                g = color.g; 
                b = color.b;
            }

            data[dataIndex]     = r;
            data[dataIndex + 1] = g;
            data[dataIndex + 2] = b;
            data[dataIndex + 3] = 255; 
            dataIndex += 4;
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

function decayRecentlyBurned() { 
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (grid[y][x] <= RECENTLY_BURNED_STATE) {
                grid[y][x]++; 
                if (grid[y][x] > RECENTLY_BURNED_STATE) {
                    grid[y][x] = STATES.VACANT;
                }
            }
        }
    }
}

/** The main animation loop. */
function mainLoop(timestamp) {
    if (!isSimulating) return;
    
    decayRecentlyBurned();
    
    if (isFireActive) {
        if (animateFires) { 
            runFireStepAnimated(); 
        } else { 
            runFireInstantly(); 
        }
    } else {
        runSimulationSteps();
    }
    
    drawGrid();
    updateStatsReadouts();
    updatePlots();
    requestAnimationFrame(mainLoop);
}

// --- SECTION 8: STARTUP ---
initializeSimulation();

