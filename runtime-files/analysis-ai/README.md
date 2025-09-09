# Dental Age Analysis - JavaScript Port

This is a JavaScript port of the R-based dental age analysis tool. The code has been restructured into modular components for better maintainability and web integration.

## Files Overview

- **dentalAnalysis.js** - Core analysis engine with all statistical functions
- **dentalVisualization.js** - Chart generation using Chart.js
- **dataLoader.js** - Data loading and formatting utilities
- **cli.js** - Command-line interface (Node.js)
- **example.html** - Interactive web demo

## Key Differences from R Version

1. **Modular Architecture**: Code is split into logical modules (analysis, visualization, data loading)
2. **Object-Oriented**: Uses ES6 classes for better code organization
3. **Browser-Compatible**: Can run in both Node.js and web browsers
4. **Interactive UI**: HTML example provides a user-friendly interface
5. **Modern Charting**: Uses Chart.js instead of R's plotting functions

## Usage

### Web Browser

1. Open `example.html` in a modern web browser
2. Enter tooth formation scores (2-17) for each tooth
3. Click "Run Analysis" to see results and charts
4. Export results as JSON or save charts as images

### Command Line (Node.js)

```bash
# Install dependencies (if using CLI)
npm install canvas

# Run analysis
node cli.js <runtime_dir> <input_file> <output_file> <row_num>
```

### Integration in Web App

```javascript
// Load required modules
import DentalAnalysis from './dentalAnalysis.js';
import DentalVisualization from './dentalVisualization.js';
import DataLoader from './dataLoader.js';

// Initialize with data
const analysis = new DentalAnalysis(MFH2_data, MUS_data, obj_data);

// Run analysis
const results = analysis.getAge({
    teeth: [null, 15, 14, null, 5, null, null, 9, 6, 5, null, null, null]
});

// Create visualizations
const viz = new DentalVisualization();
viz.createAgeDistributionChart('canvasId', results);
```

## Data Requirements

The analysis requires three data matrices from the original R .RData file:
- **MFH2**: Mean formation times matrix (17x13)
- **MUS**: MUS values matrix
- **obj**: Objective function values

These need to be converted from .RData format to JSON or provided directly to the DentalAnalysis constructor.

## API Reference

### DentalAnalysis Class

#### Constructor
```javascript
new DentalAnalysis(mfh2Data, musData, objData)
```

#### Main Methods
- `getAge(options)` - Run age estimation analysis
- `plotTeeth(options)` - Generate tooth formation data for visualization

#### Options for getAge()
- `teeth`: Array of 13 tooth scores (2-17 or null)
- `lo`, `hi`: Integration limits (default: 0.75, 25.75)
- `drop`: Array of tooth indices to exclude
- `retain`: Array of tooth indices to keep (exclusive)
- `knownAge`: Known age for comparison (optional)

### DentalVisualization Class

- `createAgeDistributionChart(canvasId, results, options)` - Create age probability chart
- `createTeethFormationChart(canvasId, plotData, options)` - Create formation timeline
- `exportChart(canvasId, filename)` - Export chart as PNG

### DataLoader Class

- `loadData(source)` - Load analysis data from JSON or object
- `parseCSV(text, hasHeader)` - Parse CSV input data
- `exportResults(analysisResult)` - Format results per output schema

## Converting .RData to JSON

To use this JavaScript version, you'll need to convert the .RData file to JSON:

```r
# In R
load("path/to/.RData")
library(jsonlite)

data_list <- list(
  MFH2 = MFH2,
  MUS = MUS,
  obj = obj
)

write_json(data_list, "data.json", pretty = TRUE)
```

## Browser Compatibility

- Modern browsers with ES6 support
- Chart.js requires Canvas API support
- Tested on Chrome, Firefox, Safari, Edge

## Performance Notes

- JavaScript numerical integration may be slightly less accurate than R
- For large datasets, consider using Web Workers
- Chart rendering is optimized for web performance

## Future Improvements

- Add WebAssembly module for faster calculations
- Support for batch processing
- Additional statistical visualizations
- Direct .RData file reading in browser