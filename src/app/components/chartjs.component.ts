import { Component, ElementRef, Input, OnDestroy, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartTypeRegistry } from 'chart.js/auto';
import { BenchmarkDataset } from '../services/time-series-data.service';
import { PerformanceService } from '../services/performance.service';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';

// Register zoom plugin
Chart.register(zoomPlugin);

@Component({
  selector: 'app-chartjs-benchmark',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <h3>Chart.js</h3>
      <div class="chart-info" *ngIf="lastMetrics">
        <span>Render Time: {{ performanceService.formatTime(lastMetrics.renderTime) }}</span>
        <span>Init Time: {{ performanceService.formatTime(lastMetrics.initTime) }}</span>
        <span *ngIf="lastMetrics.updateTime">Update Time: {{ performanceService.formatTime(lastMetrics.updateTime) }}</span>
      </div>
      <div class="chart-title" *ngIf="dataset">
        {{ dataset.name }} ({{ dataset.pointCount.toLocaleString() }} points)
      </div>
      <div style="position: relative; width: 100%; height: 400px;">
        <canvas #chartCanvas></canvas>
        <div class="zoom-control">
          <button (click)="resetZoom()" class="reset-zoom-btn">Reset View</button>
          <button (click)="resetToFullView()" class="full-view-btn">View All</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      margin: 0;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
      position: relative;
    }
    
    .chart-info {
      display: flex;
      gap: 15px;
      margin-bottom: 10px;
      font-size: 0.9em;
      color: #666;
    }
    
    .chart-title {
      text-align: center;
      font-size: 14px;
      margin-bottom: 10px;
      color: #333;
    }
    
    h3 {
      margin: 0 0 10px 0;
      color: #333;
    }
    
    .zoom-control {
      position: absolute;
      top: 5px;
      right: 5px;
      z-index: 10;
      display: flex;
      gap: 5px;
      flex-direction: column;
    }
    
    .reset-zoom-btn, .full-view-btn {
      background-color: #2196f3;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      opacity: 0.8;
      white-space: nowrap;
    }
    
    .reset-zoom-btn:hover, .full-view-btn:hover {
      opacity: 1;
    }
    
    .full-view-btn {
      background-color: #4caf50;
    }
  `]
})
export class ChartjsComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() dataset: BenchmarkDataset | null = null;
  @Input() height: number = 400;
  @Input() timeWindowMinutes: number = 30; // Default to 30 minutes
  
  private chart: Chart | null = null;
  lastMetrics: any = null;
  
  constructor(public performanceService: PerformanceService) {
  }
  
  ngOnInit(): void {
    this.initChart();
  }
  
  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataset'] && this.chart && this.dataset) {
      this.renderChart();
    }
    
    if (changes['timeWindowMinutes'] && this.chart && this.dataset) {
      // If time window changed, update the view
      this.resetZoom();
    }
  }
  
  private initChart(): void {
    const initStartTime = this.performanceService.startTimer();
    
    // Check if the canvas exists
    if (!this.chartCanvas) {
      console.error('Chart canvas not found');
      return;
    }
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      return;
    }
    
    // Create a simple chart using auto-registration
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Time Series Data',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1,
          pointRadius: 0,
          data: []
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: {
            type: 'time',
            time: {
              // Adapt time unit based on data range
              unit: 'day',
              // Allow auto-scaling of time units
              displayFormats: {
                millisecond: 'HH:mm:ss.SSS',
                second: 'HH:mm:ss',
                minute: 'HH:mm',
                hour: 'HH:mm',
                day: 'MMM d',
                week: 'MMM d',
                month: 'MMM yyyy',
                quarter: 'MMM yyyy',
                year: 'yyyy'
              }
            },
            ticks: {
              maxTicksLimit: 10, // Limit the number of ticks to prevent overcrowding
              source: 'auto',
              autoSkip: true,
              autoSkipPadding: 50
            },
            title: {
              display: true,
              text: 'Time'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Value'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'x'
            },
            zoom: {
              wheel: {
                enabled: true
              },
              pinch: {
                enabled: true
              },
              mode: 'x',
              onZoomComplete: function() {
                console.log('Zoom completed');
              }
            }
          }
        }
        }
      });
    
    const initTime = this.performanceService.endTimer(initStartTime);
    
    if (this.dataset) {
      this.renderChart(initTime);
    }
  }
  
  renderChart(initTime?: number): void {
    if (!this.chart || !this.dataset) {
      console.error('Chart or dataset is null', { chart: !!this.chart, dataset: !!this.dataset });
      return;
    }
    
    const renderStartTime = this.performanceService.startTimer();
    
    try {
      // Convert data to Chart.js format
      const data = this.dataset.points.map(point => ({
        x: point.time,
        y: point.value
      }));
      
      
      if (data.length > 0) {
        // Calculate time range and adjust scale options accordingly
        const firstTimestamp = data[0].x;
        const lastTimestamp = data[data.length - 1].x;
        const timeRangeMs = lastTimestamp - firstTimestamp;
        const timeRangeDays = timeRangeMs / (1000 * 60 * 60 * 24);
        
        // Adjust time unit based on data range
        let timeUnit = 'minute';
        if (timeRangeDays > 365) {
          timeUnit = 'year';
        } else if (timeRangeDays > 90) {
          timeUnit = 'month';
        } else if (timeRangeDays > 30) {
          timeUnit = 'week';
        } else if (timeRangeDays > 3) {
          timeUnit = 'day';
        } else if (timeRangeDays > 1) {
          timeUnit = 'hour';
        }
        
        // Update time unit
        if (this.chart.options.scales && 'x' in this.chart.options.scales) {
          const xScale = this.chart.options.scales['x'] as any;
          if (xScale && xScale.time) {
            xScale.time.unit = timeUnit;
          }
        }
        
        // Set the default view to show only the last timeWindowMinutes of data
        if (this.chart.options.scales && 'x' in this.chart.options.scales) {
          const timeWindowMs = this.timeWindowMinutes * 60 * 1000;
          const minTime = Math.max(lastTimestamp - timeWindowMs, firstTimestamp);
          
          const xScale = this.chart.options.scales['x'] as any;
          if (xScale) {
            xScale.min = minTime;
            xScale.max = lastTimestamp;
          }
        }
      }
      
      // Update chart data
      if (this.chart.data.datasets && this.chart.data.datasets.length > 0) {
        this.chart.data.datasets[0].data = data;
        
        // Use update with mode: 'none' for better performance
        this.chart.update('none');
      } else {
        console.error('Chart.js: No datasets available');
      }
    } catch (error) {
      console.error('Chart.js: Error rendering chart:', error);
    }
    
    const renderTime = this.performanceService.endTimer(renderStartTime);
    
    this.lastMetrics = {
      chartLibrary: 'Chart.js',
      pointCount: this.dataset.pointCount,
      renderTime,
      initTime: initTime || 0,
      memoryUsage: this.performanceService.getMemoryUsage(),
      timestamp: Date.now()
    };
    
    this.performanceService.recordMetrics(this.lastMetrics);
  }
  
  updateChart(newDataset: BenchmarkDataset): void {
    this.dataset = newDataset;
    
    if (this.chart) {
      const updateStartTime = this.performanceService.startTimer();
      
      // Check if we need to update the view window to keep showing the last 30 minutes
      if (this.dataset && this.dataset.points.length > 0) {
        const points = this.dataset.points;
        const lastTimestamp = points[points.length - 1].time;
        
        // Only auto-scroll if we're showing the most recent data
        // (meaning the right edge of the current view is close to the previous last timestamp)
        if (this.chart.options.scales && 'x' in this.chart.options.scales) {
          const xScale = this.chart.options.scales['x'] as any;
          if (xScale && xScale.max) {
            const currentMaxTime = xScale.max;
            const previousLastPoint = this.dataset.points[this.dataset.points.length - 2]; // Second to last point
            
            if (previousLastPoint && Math.abs(currentMaxTime - previousLastPoint.time) < 1000) {
              // We're viewing recent data, auto-scroll to keep showing the time window
              const timeWindowMs = this.timeWindowMinutes * 60 * 1000;
              const firstTimestamp = points[0].time;
              const minTime = Math.max(lastTimestamp - timeWindowMs, firstTimestamp);
              
              xScale.min = minTime;
              xScale.max = lastTimestamp;
            }
          }
        }
      }
      
      this.renderChart();
      const updateTime = this.performanceService.endTimer(updateStartTime);
      
      if (this.lastMetrics) {
        this.lastMetrics.updateTime = updateTime;
      }
    } else {
      console.error('Chart.js: No chart instance available for update');
    }
  }

  addPoint(point: { time: number, value: number }, redraw: boolean = true): void {
    if (!this.chart || !this.dataset) {
      return;
    }

    const startTime = this.performanceService.startTimer();
    
    // Add point to dataset
    this.dataset.points.push(point);
    this.dataset.pointCount = this.dataset.points.length;
    
    // Get the chart data
    const chartData = this.chart.data;
    if (chartData.datasets && chartData.datasets[0]) {
      // Add the new point to the chart data
      const newPoint = { x: point.time, y: point.value };
      (chartData.datasets[0].data as any[]).push(newPoint);
      
      // Update chart efficiently with minimal animation
      if (redraw) {
        // Auto-scroll the view to follow new data if we're viewing recent data
        if (this.chart.options.scales && 'x' in this.chart.options.scales) {
          const xScale = this.chart.options.scales['x'] as any;
          if (xScale && xScale.max) {
            const currentMaxTime = xScale.max;
            // If we're close to the current max time, auto-scroll
            if (Math.abs(currentMaxTime - point.time) < 5000) { // Within 5 seconds
              const timeWindowMs = this.timeWindowMinutes * 60 * 1000;
              const points = this.dataset.points;
              const firstTimestamp = points[0].time;
              const minTime = Math.max(point.time - timeWindowMs, firstTimestamp);
              
              xScale.min = minTime;
              xScale.max = point.time;
            }
          }
        }
        
        this.chart.update('none'); // Update without animation for better performance
      }
    }
    
    const endTime = this.performanceService.endTimer(startTime);
    
    // Update metrics with single point addition time
    if (this.lastMetrics) {
      this.lastMetrics.updateTime = endTime;
    }
  }
  
  // Reset zoom to initial view (based on timeWindowMinutes)
  resetZoom(): void {
    if (this.chart && this.dataset && this.dataset.points.length > 0) {
      // Get first and last timestamps
      const points = this.dataset.points;
      const firstTimestamp = points[0].time;
      const lastTimestamp = points[points.length - 1].time;
      
      // Calculate the time window
      const timeWindowMs = this.timeWindowMinutes * 60 * 1000;
      const minTime = Math.max(lastTimestamp - timeWindowMs, firstTimestamp);
      
      // Reset to the configured time window view instead of the full dataset
      if (this.chart.options.scales && 'x' in this.chart.options.scales) {
        const xScale = this.chart.options.scales['x'] as any;
        if (xScale) {
          xScale.min = minTime;
          xScale.max = lastTimestamp;
          this.chart.update('none');
          return;
        }
      }
      
      // Fallback to standard resetZoom if we can't set the specific time range
      this.chart.resetZoom();
    }
  }

  resetToFullView(): void {
    if (this.chart) {
      // Reset to show the complete dataset (full zoom out)
      // Remove any zoom constraints to show all data
      if (this.chart.options.scales && 'x' in this.chart.options.scales) {
        const xScale = this.chart.options.scales['x'] as any;
        if (xScale) {
          // Clear any min/max constraints to show all data
          delete xScale.min;
          delete xScale.max;
          this.chart.update('none');
          return;
        }
      }
      
      // Fallback to standard resetZoom
      this.chart.resetZoom();
    }
  }
}
