/**
 * Dental Age Analysis - JavaScript Port
 * Ported from R analysis code for dental age estimation
 */

class DentalAnalysis {
  constructor(mfh2Data, musData, objData) {
    // These would normally be loaded from the .RData file
    // For now, they need to be provided as constructor parameters
    this.MFH2 = mfh2Data;
    this.MUS = musData;
    this.obj = objData;
    
    // Score descriptions for display
    this.scores = [
      'N/A', 'CI', 'COC', 'CUO', 'I1/2', 'CRC', 'RI', 'CLI',
      'RC', 'R1/4', 'R1/2', 'R3/4', 'RC', 'A1/2', 'AC', 'EWJ', 'CE'
    ];
  }

  /**
   * Trim whitespace from string
   */
  trim(str) {
    return str.replace(/^\s+|\s+$/g, '');
  }

  /**
   * Calculate cumulative normal distribution (CDF)
   */
  pnorm(x, mean = 0, sd = 1, lower = true) {
    const z = (x - mean) / sd;
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    
    if (z > 0) {
      return lower ? 1 - p : p;
    } else {
      return lower ? p : 1 - p;
    }
  }

  /**
   * Calculate normal density (PDF)
   */
  dnorm(x, mean = 0, sd = 1) {
    return (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / sd, 2));
  }

  /**
   * Calculate tooth probability
   */
  tooths(tt, teeth, integ) {
    let cum = 0;
    const logBase = Math.log(10);
    
    for (let j = 0; j < 13; j++) {
      const i = teeth[j];
      if (!isNaN(i) && i !== null) {
        let mu1 = this.MFH2[i - 1][j];
        let mu2 = this.MFH2[i][j];
        
        // Handle equal mu values
        let idx = i;
        while (mu1 === mu2 && idx < this.MFH2.length - 1) {
          idx++;
          mu2 = this.MFH2[idx][j];
        }
        
        const sto = Math.max(
          this.pnorm(tt, mu1, 0.042 * logBase) - this.pnorm(tt, mu2, 0.042 * logBase),
          1e-200
        );
        cum += Math.log(sto);
      }
    }
    
    return Math.exp(cum) / integ;
  }

  /**
   * Calculate tooth probability with variance
   */
  tooths2(tt, teeth, integ, mu) {
    let cum = 0;
    const logBase = Math.log(10);
    
    for (let j = 0; j < 13; j++) {
      const i = teeth[j];
      if (!isNaN(i) && i !== null) {
        let mu1 = this.MFH2[i - 1][j];
        let mu2 = this.MFH2[i][j];
        
        let idx = i;
        while (mu1 === mu2 && idx < this.MFH2.length - 1) {
          idx++;
          mu2 = this.MFH2[idx][j];
        }
        
        const sto = Math.max(
          this.pnorm(tt, mu1, 0.042 * logBase) - this.pnorm(tt, mu2, 0.042 * logBase),
          1e-200
        );
        cum += Math.log(sto);
      }
    }
    
    return Math.exp(cum) / integ * Math.pow(tt - mu, 2);
  }

  /**
   * Get most likely tooth score for a given age
   */
  tooths3(mu, iTooth) {
    const muTran = [-Infinity, ...this.MFH2.map(row => row[iTooth])];
    const logBase = Math.log(10);
    const stoArray = [];
    
    for (let i = 0; i < muTran.length; i++) {
      stoArray.push(this.pnorm(mu, muTran[i], 0.042 * logBase, false));
    }
    
    // Find maximum difference
    let maxDiff = 0;
    let maxIndex = 0;
    for (let i = 1; i < stoArray.length; i++) {
      const diff = stoArray[i - 1] - stoArray[i];
      if (diff > maxDiff) {
        maxDiff = diff;
        maxIndex = i - 1;
      }
    }
    
    return maxIndex === 0 ? 1 : maxIndex;
  }

  /**
   * Numerical integration using Simpson's rule
   */
  integrate(func, lower, upper, n = 1000) {
    const h = (upper - lower) / n;
    let sum = func(lower) + func(upper);
    
    for (let i = 1; i < n; i += 2) {
      sum += 4 * func(lower + i * h);
    }
    
    for (let i = 2; i < n - 1; i += 2) {
      sum += 2 * func(lower + i * h);
    }
    
    return (h / 3) * sum;
  }

  /**
   * Find maximum of function using golden section search
   */
  optimize(func, lower, upper, maxIterations = 100) {
    const phi = (1 + Math.sqrt(5)) / 2;
    const resphi = 2 - phi;
    const tol = 1e-5;
    
    let a = lower;
    let b = upper;
    
    let x1 = a + resphi * (b - a);
    let x2 = b - resphi * (b - a);
    let f1 = func(x1);
    let f2 = func(x2);
    
    for (let i = 0; i < maxIterations && Math.abs(b - a) > tol; i++) {
      if (f1 < f2) {
        b = x2;
        x2 = x1;
        f2 = f1;
        x1 = a + resphi * (b - a);
        f1 = func(x1);
      } else {
        a = x1;
        x1 = x2;
        f1 = f2;
        x2 = b - resphi * (b - a);
        f2 = func(x2);
      }
    }
    
    return (a + b) / 2;
  }

  /**
   * Calculate variance from array
   */
  variance(arr) {
    const filtered = arr.filter(x => !isNaN(x) && x !== null);
    if (filtered.length === 0) return NaN;
    
    const mean = filtered.reduce((a, b) => a + b, 0) / filtered.length;
    const squaredDiffs = filtered.map(x => Math.pow(x - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / (filtered.length - 1);
  }

  /**
   * Main analysis function
   */
  getAge(options = {}) {
    const defaults = {
      id: 1,
      lo: 0.75,
      hi: 25.75,
      left: 0,
      right: 25,
      defInt: 0.1,
      putPoints: false,
      putL: 0,
      putR: 20,
      drop: [],
      retain: [],
      knownAge: null,
      teeth: new Array(13).fill(null),
      lab: null,
      anote: ''
    };
    
    const params = { ...defaults, ...options };
    let teeth = [...params.teeth];
    
    // Handle dropped teeth
    params.drop.forEach(i => {
      if (i >= 0 && i < 13) teeth[i] = null;
    });
    
    // Handle retained teeth
    if (params.retain.length > 0) {
      const newTeeth = new Array(13).fill(null);
      params.retain.forEach(i => {
        if (i >= 0 && i < 13) newTeeth[i] = teeth[i];
      });
      teeth = newTeeth;
    }
    
    // Calculate denominator for normalization
    const denom = this.integrate(
      tt => this.tooths(tt, teeth, 1.0),
      Math.log(0.75),
      Math.log(25.75),
      100
    );
    
    // Find maximum likelihood age
    const mu = this.optimize(
      tt => this.tooths(tt, teeth, denom),
      Math.log(0.75),
      Math.log(25.75)
    );
    
    // Calculate between-tooth variance
    const mus = teeth.map((toothScore, i) => {
      if (toothScore !== null && !isNaN(toothScore)) {
        return this.MUS[toothScore - 1][i];
      }
      return null;
    });
    const between = this.variance(mus);
    
    // Calculate within-tooth variance
    const within = this.integrate(
      tt => this.tooths2(tt, teeth, denom, mu),
      Math.log(params.lo),
      Math.log(params.hi),
      100
    );
    
    // Calculate age probability distribution
    const ages = [];
    const probs = [];
    for (let age = 0; age <= 25; age += params.defInt) {
      const logAge = Math.log(age + 0.75);
      ages.push(age);
      probs.push(this.tooths(logAge, teeth, denom));
    }
    
    // Calculate most likely scores
    const newTeeth = teeth.map((_, i) => this.tooths3(mu, i));
    
    // Apply constraints for certain teeth
    if (newTeeth[0] === 8) newTeeth[0] = teeth[0];
    for (let i = 3; i <= 4; i++) {
      if (newTeeth[i] <= 8) newTeeth[i] = teeth[i];
    }
    for (let i = 5; i <= 6; i++) {
      if (newTeeth[i] <= 8) newTeeth[i] = teeth[i];
    }
    for (let i = 7; i <= 9; i++) {
      if (newTeeth[i] === 8) newTeeth[i] = teeth[i];
    }
    
    const objVal = this.tooths(mu, teeth, 1);
    const nuVal = this.tooths(mu, newTeeth, 1);
    
    // Calculate age values
    const ageVal = Math.exp(mu) - 0.75;
    const ageLower = Math.exp(mu - 2 * Math.sqrt(within + between)) - 0.75;
    const ageUpper = Math.exp(mu + 2 * Math.sqrt(within + between)) - 0.75;
    
    return {
      scores: teeth.map(s => s === null ? -1 : s),
      meanCorrectedAge: mu,
      withinVariance: within,
      betweenVariance: between,
      lowerLimit: params.lo,
      upperLimit: params.hi,
      likelyScores: newTeeth.map(s => s === null ? -1 : s),
      pSeq: isNaN(between) ? 'NA' : objVal / nuVal,
      knownAge: ageVal,
      knownAgeLower: ageLower,
      knownAgeUpper: ageUpper,
      ages: ages,
      probabilities: probs,
      maxProb: Math.max(...probs)
    };
  }

  /**
   * Plot teeth formation chart
   */
  plotTeeth(options = {}) {
    const defaults = {
      id: 1,
      knownL: -10,
      knownR: -10,
      teeth: new Array(13).fill(null),
      stoLab: 'Expected Formation at Age 10'
    };
    
    const params = { ...defaults, ...options };
    const teeth = params.teeth;
    
    // Check for root clefts in uniradicular teeth
    const testUni = [0, 3, 4, 5, 6, 7, 8, 9];
    for (const idx of testUni) {
      if (teeth[idx] === 8) {
        throw new Error('No root clefts for uniradicular tooth');
      }
    }
    
    const logAge = [];
    const toothData = [];
    
    // Generate age sequence
    for (let age = 0.75; age <= 20.75; age += 0.01) {
      logAge.push(Math.log(age));
    }
    
    // Calculate tooth formation data for each tooth
    for (let j = 0; j < 13; j++) {
      if (teeth[j] !== null && !isNaN(teeth[j])) {
        const toothScore = teeth[j];
        const maxVal = this.optimize(
          tt => this.tooths(tt, [toothScore], 1),
          Math.log(0.75),
          Math.log(25),
          50
        );
        
        const formation = logAge.map(age => {
          const val = this.tooths(age, [toothScore], 1);
          return val / (this.obj[toothScore - 1][j] || 1);
        });
        
        toothData.push({
          tooth: j,
          score: toothScore,
          formation: formation
        });
      }
    }
    
    return {
      logAge: logAge,
      ages: logAge.map(la => Math.exp(la) - 0.75),
      toothData: toothData,
      teethLabels: ['c', 'm1', 'm2', 'UI1', 'UI2', 'LI1', 'LI2', 'C', 'P3', 'P4', 'M1', 'M2', 'M3']
    };
  }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DentalAnalysis;
}