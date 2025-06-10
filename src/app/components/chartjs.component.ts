import { Component, ElementRef, Input, OnDestroy, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js/auto';
import { BenchmarkDataset } from '../services/time-series-data.service';
import { PerformanceService } from '../services/performance.service';
import 'chartjs-adapter-date-fns';

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
  `]
})
export class ChartjsComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() dataset: BenchmarkDataset | null = null;
  @Input() height: number = 400;
  
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
      this.renderChart();
      const updateTime = this.performanceService.endTimer(updateStartTime);
      
      if (this.lastMetrics) {
        this.lastMetrics.updateTime = updateTime;
      }
    } else {
      console.error('Chart.js: No chart instance available for update');
    }
  }
}
