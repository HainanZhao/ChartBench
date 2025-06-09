import { Component, ElementRef, Input, OnDestroy, OnInit, OnChanges, SimpleChanges, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as echarts from 'echarts';
import { BenchmarkDataset } from '../services/time-series-data.service';
import { PerformanceService } from '../services/performance.service';

@Component({
  selector: 'app-echarts-benchmark',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <h3>ECharts</h3>
      <div class="chart-info" *ngIf="lastMetrics">
        <span>Render Time: {{ performanceService.formatTime(lastMetrics.renderTime) }}</span>
        <span>Init Time: {{ performanceService.formatTime(lastMetrics.initTime) }}</span>
        <span *ngIf="lastMetrics.updateTime">Update Time: {{ performanceService.formatTime(lastMetrics.updateTime) }}</span>
      </div>
      <div class="chart-title" *ngIf="dataset">
        {{ dataset.name }} ({{ dataset.pointCount.toLocaleString() }} points)
      </div>
      <div #chartContainer class="chart"></div>
    </div>
  `,
  styles: [`
    .chart-container {
      margin: 20px;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
    }
    
    .chart {
      width: 100%;
      height: 400px;
      border: 1px solid #eee;
      background-color: #f9f9f9;
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
export class EchartsComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  @Input() dataset: BenchmarkDataset | null = null;
  @Input() height: number = 400;
  
  private chart: echarts.ECharts | null = null;
  lastMetrics: any = null;
  
  constructor(public performanceService: PerformanceService) {}
  
  ngOnInit(): void {
    console.log('ECharts ngOnInit called');
  }
  
  ngAfterViewInit(): void {
    console.log('ECharts ngAfterViewInit called');
    setTimeout(() => {
      this.initChart();
    }, 100);
  }
  
  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.dispose();
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataset'] && this.chart && this.dataset) {
      this.renderChart();
    }
  }
  
  private initChart(): void {
    if (!this.chartContainer?.nativeElement) {
      console.error('ECharts: Chart container not available');
      return;
    }

    const initStartTime = this.performanceService.startTimer();
    const container = this.chartContainer.nativeElement;
    console.log('ECharts initChart: Container details', {
      width: container.offsetWidth,
      height: container.offsetHeight
    });

    this.chart = echarts.init(container);
    console.log('ECharts initChart: Chart initialized');
    
    const initTime = this.performanceService.endTimer(initStartTime);
    
    if (this.dataset) {
      this.renderChart();
      // Update metrics with init time
      if (this.lastMetrics) {
        this.lastMetrics.initTime = initTime;
      }
    }
  }
  
  renderChart(): void {
    if (!this.chart || !this.dataset) {
      return;
    }
    
    const renderStartTime = this.performanceService.startTimer();
    
    console.log('ECharts renderChart: Starting render with', this.dataset.pointCount, 'points');
    console.log('ECharts renderChart: Sample data points:', this.dataset.points.slice(0, 3));
    
    // Convert to consistent format: use timestamp directly in milliseconds for ECharts time axis
    const data = this.dataset.points.map(point => [
      point.time, // ECharts expects milliseconds for time axis
      point.value
    ]);
    
    console.log('ECharts renderChart: Converted data sample:', data.slice(0, 3));
    console.log('ECharts renderChart: Time range from', new Date(data[0][0]).toISOString(), 'to', new Date(data[data.length-1][0]).toISOString());
    
    const option = {
      title: {
        text: this.dataset.name
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          if (params && params.length > 0) {
            const point = params[0];
            const date = new Date(point.data[0]);
            return `Time: ${date.toLocaleString()}<br/>Value: ${point.data[1].toFixed(2)}`;
          }
          return '';
        }
      },
      xAxis: {
        type: 'time'
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        data: data,
        type: 'line',
        symbol: 'none',
        lineStyle: {
          width: 2,
          color: '#2196F3'
        }
      }]
    };
    
    this.chart.setOption(option);
    
    const renderTime = this.performanceService.endTimer(renderStartTime);
    
    // Record performance metrics
    this.lastMetrics = {
      chartLibrary: 'ECharts',
      pointCount: this.dataset.pointCount,
      renderTime,
      initTime: 0, // Will be set by initChart if available
      memoryUsage: this.performanceService.getMemoryUsage(),
      timestamp: Date.now()
    };
    
    this.performanceService.recordMetrics(this.lastMetrics);
    
    console.log('ECharts renderChart: Chart rendered');
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
    }
  }
}
