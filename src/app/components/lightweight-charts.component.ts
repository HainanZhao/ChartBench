import { Component, ElementRef, Input, OnDestroy, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { createChart, IChartApi, ISeriesApi, LineData, UTCTimestamp } from 'lightweight-charts';
import { BenchmarkDataset } from '../services/time-series-data.service';
import { PerformanceService } from '../services/performance.service';
import { ChartStyleService } from '../services/chart-style.service';

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
      <div class="zoom-control">
        <button (click)="resetZoom()" class="reset-zoom-btn">Reset View</button>
        <button (click)="resetToFullView()" class="full-view-btn">View All</button>
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
    
    .chart {
      width: 100%;
      min-height: 400px;
    }
    
    .chart-info {
      display: flex;
      gap: 15px;
      margin-bottom: 10px;
      font-size: 0.9em;
      color: #666;
      flex-wrap: wrap;
    }
    
    .chart-title {
      text-align: center;
      font-size: 14px;
      margin-bottom: 10px;
      color: #333;
      font-weight: 500;
    }
    
    h3 {
      margin: 0 0 10px 0;
      color: #333;
      text-align: center;
      font-size: 18px;
      font-weight: 600;
    }
    
    .zoom-control {
      position: absolute;
      top: 40px;
      right: 25px;
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
export class LightweightChartsComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  @Input() dataset: BenchmarkDataset | null = null;
  @Input() height: number = 400;
  @Input() timeWindowMinutes: number = 30; // Default to 30 minutes
  
  private chart: IChartApi | null = null;
  private lineSeries: ISeriesApi<'Line'> | null = null;
  lastMetrics: any = null;
  
  constructor(
    public performanceService: PerformanceService,
    private chartStyleService: ChartStyleService
  ) {}
  
  ngOnInit(): void {
    this.initChart();
  }
  
  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.remove();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataset'] && this.chart && this.dataset) {
      this.renderChart();
    }
    
    if (changes['timeWindowMinutes'] && this.chart && this.dataset) {
      // Apply the new time window
      this.applyTimeWindow();
    }
  }
  
  private initChart(): void {
    const initStartTime = this.performanceService.startTimer();
    const styleConfig = this.chartStyleService.getStyleConfig();
    
    // Set container height explicitly
    const container = this.chartContainer.nativeElement;
    container.style.height = `${this.height}px`;
    
    this.chart = createChart(container, {
      width: container.clientWidth || this.chartStyleService.getCommonChartWidth(),
      height: this.height,
      layout: {
        background: { color: styleConfig.colors.background },
        textColor: styleConfig.colors.text,
      },
      grid: {
        vertLines: { color: styleConfig.colors.grid },
        horzLines: { color: styleConfig.colors.grid },
      },
      timeScale: {
        borderColor: styleConfig.colors.border,
        timeVisible: true,
        secondsVisible: true,
      },
      rightPriceScale: {
        borderColor: styleConfig.colors.border,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      leftPriceScale: {
        visible: false,
      },
      crosshair: {
        mode: 1, // Normal crosshair mode
        vertLine: {
          color: styleConfig.colors.border,
          width: 1,
          style: 3,
          visible: true,
          labelVisible: true,
        },
        horzLine: {
          color: styleConfig.colors.border,
          width: 1,
          style: 3,
          visible: true,
          labelVisible: true,
        },
      },
    });
    
    this.lineSeries = this.chart.addLineSeries({
      color: styleConfig.colors.primary,
      lineWidth: styleConfig.dimensions.lineWidth as any,
      priceLineVisible: false,
      lastValueVisible: false,
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
    
    this.lineSeries.setData(data);
    
    // Apply time window
    this.applyTimeWindow();
    
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
  
  // Apply the time window to show only the last X minutes of data
  private applyTimeWindow(): void {
    if (!this.chart || !this.dataset || !this.dataset.points.length) {
      return;
    }
    
    const points = this.dataset.points;
    const lastTimestamp = points[points.length - 1].time;
    const firstTimestamp = points[0].time;
    
    // Calculate the time window in milliseconds
    const timeWindowMs = this.timeWindowMinutes * 60 * 1000;
    const minTime = Math.max(lastTimestamp - timeWindowMs, firstTimestamp);
    
    // Convert to the format expected by LightweightCharts (seconds for UTCTimestamp)
    const minTimeUTC = Math.floor(minTime / 1000) as UTCTimestamp;
    const lastTimestampUTC = Math.floor(lastTimestamp / 1000) as UTCTimestamp;
    
    // Set the visible time range
    this.chart.timeScale().setVisibleRange({
      from: minTimeUTC,
      to: lastTimestampUTC
    });
  }
  
  // Reset zoom to the time window view
  resetZoom(): void {
    this.applyTimeWindow();
  }

  resetToFullView(): void {
    if (!this.chart) {
      return;
    }
    
    // Reset to show all data (full dataset)
    this.chart.timeScale().fitContent();
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
