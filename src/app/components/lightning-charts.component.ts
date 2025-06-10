import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { lightningChart, LightningChart, LineSeries, ChartXY } from '@lightningchart/lcjs';
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
    </div>
  `,
  styles: [`
    .chart-container {
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
export class LightningChartsComponent implements OnInit, OnDestroy {
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  @Input() dataset: BenchmarkDataset | null = null;
  @Input() height: number = 400;
  
  private readonly LIGHTNING_CHART_LICENSE = '0002-n0i9AP8MN/ezP+gV3RZRzNiQvQvBKwBJvTnrFTHppybuCwWuickxBJV+q3qyoeEBGSE4hS0aeo3pySDywrb/iIsl-MEUCIAiJOU3BrUq71LqSlRAIFAI0dKK05qBRIJYHFmBoOoIHAiEA4Y55O1QpeuEkiuVktPGLauOHc1TzxNu85/vz/eNscz8=';
  private chart: ChartXY | null = null;
  private lineSeries: LineSeries | null = null;
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
    
    // Configure axes
    this.chart.getDefaultAxisX().setTitle('Time');
    this.chart.getDefaultAxisY().setTitle('Value');
    
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
    
    // Fit chart to data
    this.chart?.getDefaultAxisX().fit();
    this.chart?.getDefaultAxisY().fit();
    
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
