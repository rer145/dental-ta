/**
 * Dental Analysis Visualization Module
 * Handles chart generation using Chart.js
 */

class DentalVisualization {
  constructor() {
    this.charts = {};
  }

  /**
   * Create age distribution chart (equivalent to first R plot)
   */
  createAgeDistributionChart(canvasId, analysisResult, options = {}) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    const { ages, probabilities, knownAge, knownAgeLower, knownAgeUpper, 
            meanCorrectedAge, withinVariance, betweenVariance } = analysisResult;
    
    // Calculate normal distributions
    const normalWithin = ages.map(age => {
      const logAge = Math.log(age + 0.75);
      return this.dnorm(logAge, meanCorrectedAge, Math.sqrt(withinVariance));
    });
    
    const normalBoth = ages.map(age => {
      const logAge = Math.log(age + 0.75);
      return this.dnorm(logAge, meanCorrectedAge, Math.sqrt(withinVariance + betweenVariance));
    });
    
    const datasets = [
      {
        label: 'Age Probability',
        data: ages.map((age, i) => ({ x: age, y: probabilities[i] })),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false,
        borderWidth: 2
      },
      {
        label: 'Within-tooth variance',
        data: ages.map((age, i) => ({ x: age, y: normalWithin[i] })),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: false,
        borderWidth: 2,
        borderDash: [5, 5]
      }
    ];
    
    if (!isNaN(betweenVariance)) {
      datasets.push({
        label: 'Between-tooth variance',
        data: ages.map((age, i) => ({ x: age, y: normalBoth[i] })),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: false,
        borderWidth: 2,
        borderDash: [5, 5]
      });
    }
    
    // Destroy existing chart if it exists
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }
    
    this.charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: options.title || 'Dental Age Distribution'
          },
          annotation: {
            annotations: {
              meanAge: {
                type: 'line',
                xMin: knownAge,
                xMax: knownAge,
                borderColor: 'rgb(0, 0, 0)',
                borderWidth: 2,
                label: {
                  content: knownAge.toFixed(4),
                  enabled: true,
                  position: 'start'
                }
              },
              lowerBound: {
                type: 'line',
                xMin: knownAgeLower,
                xMax: knownAgeLower,
                borderColor: 'rgb(255, 0, 0)',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                  content: knownAgeLower.toFixed(3),
                  enabled: true,
                  position: 'start',
                  color: 'red'
                }
              },
              upperBound: {
                type: 'line',
                xMin: knownAgeUpper,
                xMax: knownAgeUpper,
                borderColor: 'rgb(255, 0, 0)',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                  content: knownAgeUpper.toFixed(3),
                  enabled: true,
                  position: 'end',
                  color: 'red'
                }
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: {
              display: true,
              text: 'Age (years)'
            },
            min: options.left || 0,
            max: options.right || 25
          },
          y: {
            title: {
              display: true,
              text: 'Density'
            }
          }
        }
      }
    });
  }

  /**
   * Create teeth formation chart (equivalent to second R plot)
   */
  createTeethFormationChart(canvasId, plotData, options = {}) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    const { ages, toothData, teethLabels } = plotData;
    
    // Create datasets for each tooth
    const datasets = toothData.map((tooth, index) => {
      const colors = [
        'rgb(255, 99, 132)', 'rgb(54, 162, 235)', 'rgb(255, 206, 86)',
        'rgb(75, 192, 192)', 'rgb(153, 102, 255)', 'rgb(255, 159, 64)',
        'rgb(199, 199, 199)', 'rgb(83, 102, 255)', 'rgb(255, 99, 255)',
        'rgb(99, 255, 132)', 'rgb(132, 99, 255)', 'rgb(255, 200, 99)',
        'rgb(99, 200, 255)'
      ];
      
      return {
        label: `${teethLabels[tooth.tooth]} (Score: ${tooth.score})`,
        data: ages.map((age, i) => ({ 
          x: age, 
          y: tooth.formation[i] * (12 - tooth.tooth) + tooth.tooth
        })),
        borderColor: colors[tooth.tooth % colors.length],
        backgroundColor: colors[tooth.tooth % colors.length] + '33',
        fill: false,
        borderWidth: 2,
        pointRadius: 0
      };
    });
    
    // Destroy existing chart if it exists
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }
    
    this.charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: options.title || 'Tooth Formation Timeline'
          },
          legend: {
            position: 'right'
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: {
              display: true,
              text: 'Age (years)'
            },
            min: -1,
            max: 22
          },
          y: {
            title: {
              display: true,
              text: 'Tooth Position'
            },
            min: 0,
            max: 13,
            ticks: {
              callback: function(value, index) {
                if (value >= 0 && value < 13 && Number.isInteger(value)) {
                  return teethLabels[12 - value];
                }
                return '';
              }
            }
          }
        }
      }
    });
  }

  /**
   * Helper function: normal distribution density
   */
  dnorm(x, mean = 0, sd = 1) {
    return (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / sd, 2));
  }

  /**
   * Export chart as image
   */
  exportChart(canvasId, filename = 'chart.png') {
    const canvas = document.getElementById(canvasId);
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
  }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DentalVisualization;
}