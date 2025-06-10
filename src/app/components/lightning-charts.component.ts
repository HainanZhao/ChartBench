import { Component, ElementRef, Input, OnDestroy, OnInit, OnChanges, SimpleChanges, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { lightningChart, LightningChart, LineSeries, ChartXY, Axis, AxisTickStrategies, AxisScrollStrategies } from '@lightningchart/lcjs';
import { BenchmarkDataset } from '../services/time-series-data.service';
import { PerformanceService } from '../services/performance.service';

@Component({
  selector: 'app-lightning-charts-benchmark',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <h3>LightningChart</h3>
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
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
      position: relative;
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
export class LightningChartsComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  @Input() dataset: BenchmarkDataset | null = null;
  @Input() height: number = 400;
  @Input() timeWindowMinutes: number = 30; // Default to 30 minutes
  
  private readonly LIGHTNING_CHART_LICENSE = '0002-n0i9AP8MN/ezP+gV3RZRzNiQvQvBKwBJvTnrFTHppybuCwWuickxBJV+q3qyoeEBGSE4hS0aeo3pySDywrb/iIsl-MEUCIAiJOU3BrUq71LqSlRAIFAI0dKK05qBRIJYHFmBoOoIHAiEA4Y55O1QpeuEkiuVktPGLauOHc1TzxNu85/vz/eNscz8=';
  private chart: ChartXY | null = null;
  private lineSeries: LineSeries | null = null;
  private xAxis: Axis | null = null; // Store reference to X axis for zooming
  private originalXRange: { min: number, max: number } | null = null; // Store original X range for reset
  lastMetrics: any = null;
  
  constructor(public performanceService: PerformanceService) {}
  
  ngOnInit(): void {
    this.initChart();
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
    
    if (changes['timeWindowMinutes'] && this.chart && this.dataset) {
      // Apply the new time window using native API
      this.applyTimeWindow();
    }
  }
  
  private initChart(): void {
    const initStartTime = this.performanceService.startTimer();
    
    // Apply license key when initializing LightningChart
    this.chart = lightningChart({
      license: this.LIGHTNING_CHART_LICENSE, 
      licenseInformation: {
        appTitle: "LightningChart JS Trial",
        company: "LightningChart Ltd."
      },
    }).ChartXY({
      container: this.chartContainer.nativeElement
    });
    
    // Configure chart
    this.chart.setTitle('');
    this.chart.setPadding({ left: 60, right: 20, top: 20, bottom: 40 });
    
    // Configure axes with better time formatting
    this.xAxis = this.chart.getDefaultAxisX()
      .setTitle('Time')
      .setTickStrategy(AxisTickStrategies.Time)
      .setScrollStrategy(AxisScrollStrategies.expansion); // Use expansion instead of progressive

    this.chart.getDefaultAxisY()
      .setTitle('Value')
      .setScrollStrategy(AxisScrollStrategies.expansion); // Use expansion instead of default
    
    // Add line series
    this.lineSeries = this.chart.addLineSeries();
    
    // Configure line series appearance  
    this.lineSeries?.setStrokeStyle((stroke: any) => stroke.setThickness(1));
    
    const initTime = this.performanceService.endTimer(initStartTime);
    
    if (this.dataset) {
      this.renderChart(initTime);
    }
  }
  
  renderChart(initTime?: number): void {
    if (!this.lineSeries || !this.dataset) return;
    
    const renderStartTime = this.performanceService.startTimer();
    
    // Convert data to LightningChart format - ensure consistent time handling
    const data = this.dataset.points.map(point => ({
      x: point.time, // LightningChart can handle milliseconds timestamp directly
      y: point.value
    }));
    
    this.lineSeries.clear();
    this.lineSeries.add(data);
    
    // Store the original range for reset zoom
    if (data.length > 0) {
      this.originalXRange = {
        min: data[0].x,
        max: data[data.length - 1].x
      };
    }
    
    // Let Lightning Charts do its default fitting initially
    this.chart?.getDefaultAxisX().fit();
    this.chart?.getDefaultAxisY().fit();
    
    // Note: Time window can be applied manually using "Reset View" button
    // Automatic application removed to prevent shaking during streaming
    
    const renderTime = this.performanceService.endTimer(renderStartTime);
    
    this.lastMetrics = {
      chartLibrary: 'LightningChart',
      pointCount: this.dataset.pointCount,
      renderTime,
      initTime: initTime || 0,
      memoryUsage: this.performanceService.getMemoryUsage(),
      timestamp: Date.now()
    };
    
    this.performanceService.recordMetrics(this.lastMetrics);
  }
  
  // Apply time window using Lightning Charts native APIs
  private applyTimeWindow(): void {
    if (!this.xAxis || !this.dataset || !this.dataset.points.length) {
      return;
    }
    
    const points = this.dataset.points;
    const lastTimestamp = points[points.length - 1].time;
    const firstTimestamp = points[0].time;
    
    // Calculate the time window based on actual data timestamps
    const timeWindowMs = this.timeWindowMinutes * 60 * 1000;
    const minTime = Math.max(lastTimestamp - timeWindowMs, firstTimestamp);
    
    // Use Lightning Charts native setInterval for smooth time window adjustment
    this.xAxis.setInterval({ start: minTime, end: lastTimestamp });
  }
  
  // Reset zoom to the time window view
  resetZoom(): void {
    this.applyTimeWindow();
  }

  resetToFullView(): void {
    if (this.xAxis && this.originalXRange) {
      // Reset to show all data (full dataset)
      this.xAxis.setInterval({ start: this.originalXRange.min, end: this.originalXRange.max });
    }
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

  addPoint(point: { time: number, value: number }, redraw: boolean = true): void {
    if (!this.dataset) {
      return;
    }

    const startTime = this.performanceService.startTimer();
    
    // Add point to dataset
    this.dataset.points.push(point);
    this.dataset.pointCount = this.dataset.points.length;
    
    // Use updateChart approach for reliability - let Lightning Charts handle optimization
    this.updateChart(this.dataset);
    
    const endTime = this.performanceService.endTimer(startTime);
    
    // Update metrics with single point addition time
    if (this.lastMetrics) {
      this.lastMetrics.updateTime = endTime;
    }
  }
}
