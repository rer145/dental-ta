/**
 * Data Loader for Dental Analysis
 * Handles loading and parsing data from various sources
 */

class DataLoader {
  constructor() {
    this.data = {
      MFH2: null,
      MUS: null,
      obj: null
    };
  }

  /**
   * Load data from JSON files or embedded data
   */
  async loadData(dataSource) {
    if (typeof dataSource === 'string') {
      // Load from URL
      try {
        const response = await fetch(dataSource);
        const jsonData = await response.json();
        this.data = jsonData;
        return this.data;
      } catch (error) {
        console.error('Error loading data:', error);
        throw error;
      }
    } else if (typeof dataSource === 'object') {
      // Use provided data object
      this.data = dataSource;
      return this.data;
    }
  }

  /**
   * Parse CSV data
   */
  parseCSV(csvText, hasHeader = true) {
    const lines = csvText.trim().split('\n');
    const startIndex = hasHeader ? 1 : 0;
    const headers = hasHeader ? lines[0].split(',').map(h => h.trim()) : null;
    
    const data = [];
    for (let i = startIndex; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (hasHeader) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      } else {
        data.push(values);
      }
    }
    
    return data;
  }

  /**
   * Convert R-style data to JavaScript format
   * This is a placeholder for the actual .RData conversion
   */
  static getSampleData() {
    // This would normally be extracted from the .RData file
    // For demonstration, returning sample structure
    return {
      MFH2: [
        // 17x13 matrix of tooth formation means
        // Each row represents a formation stage
        // Each column represents a tooth type
        // These are placeholder values - actual values would come from .RData
        new Array(13).fill(0).map(() => Math.random() * 3 - 1.5),
        // ... more rows
      ],
      MUS: [
        // Similar structure for MUS data
        new Array(13).fill(0).map(() => Math.random() * 3 - 1.5),
        // ... more rows
      ],
      obj: [
        // Objective function values
        new Array(13).fill(0).map(() => Math.random()),
        // ... more rows
      ]
    };
  }

  /**
   * Format input data for analysis
   */
  formatInputData(rowData) {
    // Convert row data to teeth array
    // Assuming rowData has columns for each tooth score
    const teeth = [];
    for (let i = 1; i <= 13; i++) {
      const value = rowData[`tooth${i}`] || rowData[i];
      teeth.push(value === 'NA' || value === '' ? null : parseInt(value));
    }
    return teeth;
  }

  /**
   * Export results to JSON format matching the output schema
   */
  exportResults(analysisResult) {
    return {
      output: {
        scores: analysisResult.scores,
        mean_corrected_age: analysisResult.meanCorrectedAge,
        within_variance: analysisResult.withinVariance,
        between_variance: analysisResult.betweenVariance,
        lower_limit: analysisResult.lowerLimit,
        upper_limit: analysisResult.upperLimit,
        likely_scores: analysisResult.likelyScores,
        p_seq: analysisResult.pSeq,
        known_age: analysisResult.knownAge,
        known_age_lower: analysisResult.knownAgeLower,
        known_age_upper: analysisResult.knownAgeUpper
      }
    };
  }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataLoader;
}