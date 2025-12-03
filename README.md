# 🌲🔥 Forest Fire Model (Drossel–Schwabl)

An elegant, interactive simulation of the Drossel-Schwabl forest fire model demonstrating **self-organized criticality** and **power-law dynamics** in complex systems.

![Forest Fire Simulation](https://img.shields.io/badge/Model-Drossel--Schwabl-green) ![License](https://img.shields.io/badge/license-MIT-blue) ![Status](https://img.shields.io/badge/status-active-success)

---

## 📊 Overview

This simulation implements the **Drossel-Schwabl forest fire model**, a cellular automaton that exhibits **self-organized criticality** (SOC) — a phenomenon where a system naturally evolves toward a critical state without external tuning. The model produces scale-invariant behavior, manifesting as **power-law distributions** in fire sizes.

### Key Features

- Real-time visualization of forest growth and fire propagation
- Interactive parameter control with instant feedback
- Log-log plot showing power-law distribution of fire sizes
- Seedable random number generator for reproducibility
- Responsive, elegant dark-themed interface

---

## 🔬 Mathematical Foundation

### The Model

The Drossel-Schwabl model operates on a square lattice where each site can be in one of three states:

- **Empty** (0): Vacant ground
- **Tree** (1): Occupied by a tree
- **Burning** (2): Tree on fire

### Evolution Rules

At each discrete timestep, the system evolves according to these probabilistic rules:

1. **Tree Growth**: An empty site becomes a tree with probability **p**
   ```
   P(Empty → Tree) = p
   ```

2. **Lightning Strike**: A tree catches fire with probability **f**
   ```
   P(Tree → Burning) = f
   ```

3. **Fire Spread**: A burning tree ignites all neighboring trees (Moore neighborhood)
   ```
   If cell(i,j) = Burning, then ∀(x,y) ∈ N(i,j): cell(x,y) = Tree → Burning
   ```

4. **Burnout**: A burning tree becomes empty in the next timestep
   ```
   P(Burning → Empty) = 1
   ```

### Critical Regime

The model exhibits self-organized criticality when:

```
f << p << 1
```

Typically: **f/p ≈ 10⁻⁴ to 10⁻⁶**

In this regime, the system spontaneously organizes into a critical state where:
- Small fires occur frequently
- Large fires occur rarely
- Fire size distribution follows a **power law**

### Power-Law Distribution

The probability density of fire sizes follows:

```
P(s) ∝ s^(-τ)
```

Where:
- **s** = fire size (number of trees burned)
- **τ** = critical exponent (≈ 1.3 for 2D lattice)

This means:
- **Linear scale**: Exponential decay (curved)
- **Log-log scale**: Straight line with slope ≈ -1.3

---

## 🎯 Physical Interpretation

### Self-Organized Criticality

The model demonstrates how complex systems can naturally evolve to a critical state without fine-tuning:

1. **Growth Phase**: Trees grow randomly (probability p)
2. **Cluster Formation**: Connected clusters of trees form
3. **Critical State**: System reaches balance between growth and destruction
4. **Avalanche Dynamics**: Lightning triggers fires of all sizes

### Real-World Analogies

This model captures universal behavior seen in:

- **Forest fires**: Actual wildfire distributions
- **Earthquakes**: Gutenberg-Richter law (seismic energy)
- **Solar flares**: Energy release distribution
- **Stock market crashes**: Financial avalanches
- **Neuronal avalanches**: Brain activity patterns
- **Sandpile dynamics**: Classic SOC example

The key insight: **Scale-free behavior emerges spontaneously** without external control.

---

## 🎮 Using the Simulation

### Parameters

#### Tree Growth Probability (p)
- **Range**: 0.001 to 0.1
- **Physical meaning**: Rate of forest regeneration
- **Effect**: Higher values → denser forests → larger fires
- **Typical value**: 0.01 (1% per timestep)

#### Lightning Strike Probability (f)
- **Range**: 0.000001 to 0.001
- **Physical meaning**: Ignition rate
- **Effect**: Higher values → more frequent fires → sparser forests
- **Typical value**: 0.00001 (0.001% per timestep)
- **Critical constraint**: f << p (typically f/p ≈ 0.001)

#### Steps per Frame
- **Range**: 1 to 100,000
- **Physical meaning**: Simulation speed during growth phase
- **Effect**: Higher values → faster evolution → quicker data collection
- **Typical value**: 1,000 to 10,000

#### Seed
- **Purpose**: Reproducibility
- **Effect**: Same seed → identical simulation sequence
- **Use case**: Scientific verification and comparison

#### Animate Fires Toggle
- **On**: Visually beautiful, step-by-step fire propagation (slow)
- **Off**: Instantaneous fire spread (fast data collection)
- **Recommendation**: Off for statistical analysis, On for visualization

### Understanding the Visualization

#### Left Panel: Forest Grid
- **Black pixels**: Empty sites
- **Green pixels**: Trees
- **Orange/Yellow pixels**: Active fires
- **Amber glow**: Recently burned sites (decay effect)

#### Right Panel: Log-Log Plot
- **X-axis**: Fire size (logarithmic scale)
- **Y-axis**: Normalized frequency (logarithmic scale)
- **Yellow points**: Binned fire data
- **Straight line**: Indicates power-law behavior
- **Slope**: Critical exponent τ ≈ -1.3

### Optimal Settings for Criticality

```javascript
p = 0.01          // 1% tree growth
f = 0.00001       // 0.001% lightning (f/p = 0.001)
Steps = 10000     // Fast evolution
Animate = Off     // Collect data efficiently
```

Let the simulation run for several minutes to observe:
1. Dense forest formation
2. Large fire events
3. Forest recovery
4. Emergence of power-law distribution

---

## 📈 Expected Results

### Early Stage (t < 10⁴ steps)
- Sparse forest
- Small fires dominate
- No clear power law yet

### Transient (10⁴ < t < 10⁶ steps)
- Forest density increases
- Cluster sizes grow
- System approaches criticality
- Power law begins to emerge

### Critical State (t > 10⁶ steps)
- Tree density stabilizes at ρ_c ≈ 0.4 (40%)
- Clear power-law distribution
- Fires of all sizes observed
- System exhibits scale-free behavior

### Statistical Characteristics

At criticality, you should observe:

1. **Fire Size Distribution**:
   ```
   P(s) ∝ s^(-1.3±0.1)
   ```

2. **Tree Density**:
   ```
   ρ_c ≈ 0.4 (40% of sites occupied)
   ```

3. **Fire Frequency**:
   ```
   Large fires: Rare but catastrophic
   Small fires: Common but localized
   ```

4. **Log-Log Plot**:
   - Linear trend across 2-3 decades
   - Slope ≈ -1.3
   - Cutoff at maximum fire size (lattice size)

---

## 🧮 Mathematical Details

### Logarithmic Binning

To visualize power laws clearly, we use logarithmic binning:

```javascript
binEdges[i] = baseSize × (binBase)^i
```

Where `binBase = 1.5` provides good resolution while reducing noise.

### Normalization

The y-axis shows probability density:

```
P(s) = count(s) / binWidth
```

This normalization ensures:
- Comparable bins of different widths
- Proper probability density interpretation
- Scale-invariant visualization

### Grid Size Effects

- **Small grids** (64×64): Fast but finite-size effects
- **Medium grids** (256×256): Good balance (used here)
- **Large grids** (1024×1024): Best statistics but slower

The maximum observable fire size is limited by:
```
s_max ≤ N² (total lattice sites)
```

### Temporal Dynamics

The system evolves on two timescales:

1. **Fast**: Fire propagation (deterministic)
2. **Slow**: Tree growth and ignition (stochastic)

Separation of timescales:
```
t_fire << t_growth ~ 1/p
t_fire << t_ignition ~ 1/(f·ρ)
```

---

## 🏗️ Technical Implementation

### Architecture

```
ForestFire/
├── forest-fire-simulation.html    # Structure & UI
├── forest-fire-styles.css         # Elegant dark theme
├── forest-fire-simulation.js      # Simulation engine
└── README.md                      # This document
```

### Key Algorithms

#### Fire Spread (Breadth-First Search)
```javascript
while (fireQueue.length > 0) {
    for (cell in fireQueue) {
        for (neighbor in Moore neighborhood) {
            if (neighbor == TREE) {
                neighbor = BURNING
                nextQueue.push(neighbor)
            }
        }
        cell = VACANT
    }
    fireQueue = nextQueue
}
```

#### Random Number Generation
Uses **Mulberry32** PRNG for reproducibility:
```javascript
function mulberry32(a) {
    return function() {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        var t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}
```

### Performance

- **Grid size**: 256 × 256 = 65,536 sites
- **Update rate**: ~60 FPS (growth phase)
- **Fire animation**: ~30 FPS (visualization)
- **Memory**: < 5 MB
- **Rendering**: Canvas 2D with ImageData API

---

## 📚 Scientific Background

### Original Paper

**Drossel, B., & Schwabl, F. (1992)**  
*"Self-organized critical forest-fire model"*  
Physical Review Letters, 69(11), 1629.

### Key Concepts

#### Self-Organized Criticality (SOC)
First introduced by Bak, Tang, and Wiesenfeld (1987), SOC describes systems that naturally evolve to a critical state exhibiting:
- **Scale invariance**: No characteristic scale
- **Power laws**: P(x) ∝ x^(-α)
- **Fractals**: Self-similar structures
- **1/f noise**: Pink noise spectrum

#### Critical Exponents
Universal numbers characterizing critical behavior:
- **τ ≈ 1.3**: Fire size distribution exponent
- **β ≈ 0.4**: Order parameter (tree density)
- **ν ≈ 1.0**: Correlation length exponent

#### Universality Classes
The Drossel-Schwabl model belongs to the **directed percolation** universality class, sharing critical exponents with:
- Epidemic spreading
- Surface catalysis
- Contact processes

---

## 🎓 Educational Value

### Concepts Demonstrated

1. **Complexity Theory**: Emergent behavior from simple rules
2. **Statistical Mechanics**: Phase transitions and critical phenomena
3. **Stochastic Processes**: Probabilistic evolution
4. **Spatial Dynamics**: Cellular automata
5. **Data Analysis**: Log-log plots and power laws
6. **Computational Physics**: Monte Carlo simulation

### Learning Outcomes

Students will understand:
- How complexity emerges from simplicity
- The meaning of self-organization
- Power-law distributions in nature
- Critical phenomena without fine-tuning
- The connection between microscopic rules and macroscopic behavior

### Experiment Ideas

1. **Vary f/p ratio**: Observe transition from subcritical to supercritical
2. **Change lattice size**: Study finite-size scaling
3. **Modify neighborhoods**: Test 4-neighbor (von Neumann) vs 8-neighbor (Moore)
4. **Add barriers**: Introduce firebreaks and study percolation
5. **Measure correlation length**: Track spatial correlations in tree clusters

---

## 🚀 Getting Started

### Quick Start

1. Open `forest-fire-simulation.html` in a modern browser
2. Click **Start** to begin the simulation
3. Watch the forest grow and fires spread
4. Observe the power-law distribution emerge

### Recommended Workflow

1. **Reset** the simulation
2. Set parameters: `p = 0.01`, `f = 0.00001`
3. Turn off **Animate Fires** for faster data collection
4. Click **Start** and wait 5-10 minutes
5. Observe the log-log plot develop a linear trend
6. Experiment with different `p` and `f` values
7. Compare results with different seeds

---

## 🎨 Design Philosophy

### Aesthetic Choices

- **Dark theme**: Reduces eye strain during long observations
- **Minimalist UI**: Focus on the science, not the interface
- **Elegant typography**: Playfair Display for sophistication
- **Smooth animations**: Professional, polished experience
- **Responsive layout**: Works on all screen sizes

### Color Palette

- **Background**: Near-black (#0d0d0d) for contrast
- **Cards**: Dark gray (#1a1a1a) for depth
- **Accent**: Forest green (#6fb346) for thematic coherence
- **Fire**: Orange/yellow gradient for realism

---

## 📖 Further Reading

### Introductory

- Bak, P. (1996). *How Nature Works: The Science of Self-Organized Criticality*
- Turcotte, D. L. (1999). "Self-organized criticality." *Reports on Progress in Physics*

### Advanced

- Christensen, K., & Moloney, N. R. (2005). *Complexity and Criticality*
- Pruessner, G. (2012). *Self-Organised Criticality: Theory, Models and Characterisation*
- Jensen, H. J. (1998). *Self-Organized Criticality: Emergent Complex Behavior*

### Original Papers

- Bak, P., Tang, C., & Wiesenfeld, K. (1987). "Self-organized criticality." *Physical Review A*
- Drossel, B., & Schwabl, F. (1992). "Self-organized critical forest-fire model." *PRL*
- Grassberger, P. (2002). "Critical behaviour of the Drossel-Schwabl forest fire model." *New Journal of Physics*


---

## 🙏 Acknowledgments

- **Drossel & Schwabl**: For the original model
- **Per Bak**: For pioneering SOC
- **Chart.js**: For beautiful plotting
- **The complexity science community**: For decades of fascinating research

---

## 💡 Inspiration

> *"The most powerful force in the universe is compound interest."* — Often attributed to Einstein
>
> But in complex systems, the most powerful force is **self-organization**. This simulation shows how nature finds critical states without any external tuning, producing the scale-free distributions we observe throughout the natural world.

---

**Built with curiosity and a love for emergent complexity** 🌲🔥📊


