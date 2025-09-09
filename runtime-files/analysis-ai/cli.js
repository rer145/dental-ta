#!/usr/bin/env node

/**
 * Command-line interface for Dental Analysis
 * Usage: node cli.js <runtime_dir> <input_file> <output_file> <row_num>
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const DentalAnalysis = require('./dentalAnalysis');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 4) {
  console.error('Usage: node cli.js <runtime_dir> <input_file> <output_file> <row_num>');
  process.exit(1);
}

const runtimeDir = args[0].trim();
const inputFile = args[1].trim();
const outputFile = args[2].trim();
const rowNum = parseInt(args[3].trim()) - 1; // Convert to 0-based index

// File paths
const outputImage1 = path.join(runtimeDir, 'temp', 'output1.png');
const outputImage2 = path.join(runtimeDir, 'temp', 'output2.png');
const outputSchemaFile = path.join(runtimeDir, 'analysis', 'output-schema.txt');
const dataFile = path.join(runtimeDir, 'analysis', 'data.json');

/**
 * Read CSV file
 */
function readCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    data.push(row);
  }
  
  return data;
}

/**
 * Load analysis data (equivalent to .RData)
 */
function loadAnalysisData() {
  try {
    // In production, this would load converted .RData
    // For now, check if data.json exists
    if (fs.existsSync(dataFile)) {
      const jsonData = fs.readFileSync(dataFile, 'utf8');
      return JSON.parse(jsonData);
    } else {
      console.error('Data file not found. Please convert .RData to data.json first.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error loading data:', error);
    process.exit(1);
  }
}

/**
 * Save chart as PNG (simplified version)
 */
function saveChartAsPNG(chartData, filePath, options = {}) {
  // This is a simplified implementation
  // In production, you'd use a proper charting library for Node.js
  const canvas = createCanvas(1400, 1200);
  const ctx = canvas.getContext('2d');
  
  // Draw a placeholder chart
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 1400, 1200);
  
  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.fillText(options.title || 'Dental Analysis Chart', 50, 50);
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
}

/**
 * Main execution
 */
async function main() {
  try {
    // Load data
    const analysisData = loadAnalysisData();
    const csvData = readCSV(inputFile);
    
    if (rowNum >= csvData.length) {
      console.error(`Row ${rowNum + 1} not found in input file`);
      process.exit(1);
    }
    
    // Read output schema
    let outputTemplate = fs.readFileSync(outputSchemaFile, 'utf8');
    
    // Initialize analysis
    const analysis = new DentalAnalysis(
      analysisData.MFH2,
      analysisData.MUS,
      analysisData.obj
    );
    
    // Extract teeth scores from row
    const row = csvData[rowNum];
    const teeth = [];
    
    // Assuming columns are named tooth1, tooth2, etc. or just numbered
    for (let i = 1; i <= 13; i++) {
      const value = row[`tooth${i}`] || row[i.toString()];
      if (value === 'NA' || value === '' || value === undefined) {
        teeth.push(null);
      } else {
        teeth.push(parseInt(value));
      }
    }
    
    // Run analysis
    const results = analysis.getAge({
      teeth: teeth,
      id: rowNum + 1,
      lab: row.name || row[0] || `Sample ${rowNum + 1}`
    });
    
    // Replace placeholders in output template
    outputTemplate = outputTemplate
      .replace('[[SCORES]]', '[' + results.scores.join(',') + ']')
      .replace('[[MEAN_CORRECTED_AGE]]', results.meanCorrectedAge)
      .replace('[[WITHIN_VARIANCE]]', results.withinVariance)
      .replace('[[BETWEEN_VARIANCE]]', results.betweenVariance)
      .replace('[[LOWER_LIMIT]]', results.lowerLimit)
      .replace('[[UPPER_LIMIT]]', results.upperLimit)
      .replace('[[LIKELY_SCORES]]', '[' + results.likelyScores.join(',') + ']')
      .replace('[[P_SEQ]]', isNaN(results.betweenVariance) ? "'NA'" : results.pSeq)
      .replace('[[KNOWN_AGE_VAL]]', results.knownAge)
      .replace('[[KNOWN_AGE_LOWER]]', results.knownAgeLower)
      .replace('[[KNOWN_AGE_UPPER]]', results.knownAgeUpper);
    
    // Write output file
    fs.writeFileSync(outputFile, outputTemplate);
    
    // Generate charts
    // Chart 1: Age distribution
    saveChartAsPNG(results, outputImage1, {
      title: `Age Distribution - ${results.knownAge.toFixed(2)} years`
    });
    
    // Chart 2: Teeth formation
    try {
      const plotData = analysis.plotTeeth({
        teeth: results.scores.map(s => s === -1 ? null : s),
        id: rowNum + 1
      });
      
      saveChartAsPNG(plotData, outputImage2, {
        title: 'Tooth Formation Timeline'
      });
    } catch (error) {
      if (error.message.includes('root clefts')) {
        console.log('Warning: ' + error.message);
      } else {
        throw error;
      }
    }
    
    console.log('Analysis completed successfully');
    console.log('Output written to:', outputFile);
    console.log('Charts saved to:', outputImage1, outputImage2);
    
  } catch (error) {
    console.error('Error during analysis:', error);
    process.exit(1);
  }
}

// Run main function
main();