import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { createChart, IChartApi, ISeriesApi, LineData, UTCTimestamp } from 'lightweight-charts';
import { BenchmarkDataset } from '../services/time-series-data.service';
import { PerformanceService } from '../services/performance.service';

@Component({
  selector: 'app-lightweight-charts-benchmark',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <h3>TradingView Lightweight Charts</h3>
      <div class="chart-info" *ngIf="lastMetrics">
        <span>Render Time: {{ performanceService.formatTime(lastMetrics.renderTime) }}</span>
        <span>Init Time: {{ performanceService.formatTime(lastMetrics.initTime) }}</span>
        <span *ngIf="lastMetrics.updateTime">Update Time: {{ performanceService.formatTime(lastMetrics.updateTime) }}</span>
      </div>
      <div class="chart-title" *ngIf="dataset">
        {{ dataset.name }} ({{ dataset.pointCount.toLocaleString() }} points)
      </div>
      <div #chartContainer class="chart" [style.height.px]="height"></div>
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
export class LightweightChartsComponent implements OnInit, OnDestroy {
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  @Input() dataset: BenchmarkDataset | null = null;
  @Input() height: number = 400;
  
  private chart: IChartApi | null = null;
  private lineSeries: ISeriesApi<'Line'> | null = null;
  lastMetrics: any = null;
  
  constructor(public performanceService: PerformanceService) {}
  
  ngOnInit(): void {
    this.initChart();
  }
  
  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.remove();
    }
  }
  
  private initChart(): void {
    const initStartTime = this.performanceService.startTimer();
    
    this.chart = createChart(this.chartContainer.nativeElement, {
      width: this.chartContainer.nativeElement.clientWidth,
      height: this.height,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#e1e1e1' },
        horzLines: { color: '#e1e1e1' },
      },
      timeScale: {
        borderColor: '#cccccc',
      },
      rightPriceScale: {
        borderColor: '#cccccc',
      },
    });
    
    this.lineSeries = this.chart.addLineSeries({
      color: '#2196F3',
      lineWidth: 1,
    });
    
    const initTime = this.performanceService.endTimer(initStartTime);
    
    if (this.dataset) {
      this.renderChart(initTime);
    }
  }
  
  renderChart(initTime?: number): void {
    if (!this.lineSeries || !this.dataset) return;
    
    const renderStartTime = this.performanceService.startTimer();
    
    // Convert data to Lightweight Charts format - ensure consistent time handling
    const data: LineData[] = this.dataset.points.map(point => ({
      time: Math.floor(point.time / 1000) as UTCTimestamp, // Convert milliseconds to seconds for UTC timestamp
      value: point.value
    }));
    
    console.log('Lightweight Charts: Sample converted data:', data.slice(0, 3));
    console.log('Lightweight Charts: Time range from', new Date(Number(data[0].time) * 1000).toISOString(), 'to', new Date(Number(data[data.length-1].time) * 1000).toISOString());
    
    this.lineSeries.setData(data);
    
    // Fit content to show all data
    this.chart?.timeScale().fitContent();
    
    const renderTime = this.performanceService.endTimer(renderStartTime);
    
    this.lastMetrics = {
      chartLibrary: 'TradingView Lightweight Charts',
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
    
    if (this.lineSeries) {
      const updateStartTime = this.performanceService.startTimer();
      this.renderChart();
      const updateTime = this.performanceService.endTimer(updateStartTime);
      
      if (this.lastMetrics) {
        this.lastMetrics.updateTime = updateTime;
      }
    }
  }
}
