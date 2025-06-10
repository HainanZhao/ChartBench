import { Component, ElementRef, Input, OnDestroy, OnInit, OnChanges, SimpleChanges, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as echarts from 'echarts';
import { BenchmarkDataset } from '../services/time-series-data.service';
import { PerformanceService } from '../services/performance.service';
import { ChartStyleService } from '../services/chart-style.service';

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
      overflow: hidden;
      position: relative;
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
export class EchartsComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  @Input() dataset: BenchmarkDataset | null = null;
  @Input() height: number = 400;
  @Input() timeWindowMinutes: number = 30; // Default to 30 minutes
  
  private chart: echarts.ECharts | null = null;
  lastMetrics: any = null;
  
  constructor(
    public performanceService: PerformanceService,
    private chartStyleService: ChartStyleService
  ) {}
  
  ngOnInit(): void {
  }
  
  ngAfterViewInit(): void {
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
    
    if (changes['timeWindowMinutes'] && this.chart && this.dataset) {
      // Apply the new time window
      this.applyTimeWindow();
    }
  }
  
  private initChart(): void {
    if (!this.chartContainer?.nativeElement) {
      console.error('ECharts: Chart container not available');
      return;
    }

    const initStartTime = this.performanceService.startTimer();
    const container = this.chartContainer.nativeElement;
    
    // Set container height to match input
    container.style.height = `${this.height}px`;
  

    this.chart = echarts.init(container);
    
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
    
    // Convert to consistent format: use timestamp directly in milliseconds for ECharts time axis
    const data = this.dataset.points.map(point => [
      point.time, // ECharts expects milliseconds for time axis
      point.value
    ]);
    const styleConfig = this.chartStyleService.getStyleConfig();
    
    const option = {
      title: {
        show: false // Hide title to match other charts
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          if (params && params.length > 0) {
            const point = params[0];
            const timeStr = this.chartStyleService.formatTimeTooltip(point.data[0]);
            const valueStr = this.chartStyleService.formatValueTooltip(point.data[1]);
            return `Time: ${timeStr}<br/>Value: ${valueStr}`;
          }
          return '';
        }
      },
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          filterMode: 'filter',
          start: 0,
          end: 100,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
          moveOnMouseWheel: false
        },
        {
          type: 'slider',
          xAxisIndex: 0,
          filterMode: 'filter',
          height: 20,
          bottom: 5,
          start: 0,
          end: 100,
          handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7v-1.2h6.6V24.4z',
          handleSize: '80%'
        }
      ],
      grid: {
        left: styleConfig.dimensions.padding.left,
        right: styleConfig.dimensions.padding.right,
        top: styleConfig.dimensions.padding.top,
        bottom: styleConfig.dimensions.padding.bottom + 30, // Add more space for the zoom slider
        containLabel: false
      },
      xAxis: {
        type: 'time',
        axisLabel: {
          formatter: (value: number) => {
            const date = new Date(value);
            return styleConfig.formatting.timeFormat(date);
          },
          color: styleConfig.colors.text
        },
        axisLine: {
          lineStyle: {
            color: styleConfig.colors.border
          }
        },
        splitLine: {
          lineStyle: {
            color: styleConfig.colors.grid
          }
        }
      },
      yAxis: {
        type: 'value',
        name: 'Value',
        nameLocation: 'middle',
        nameGap: 40,
        nameTextStyle: {
          color: styleConfig.colors.text
        },
        axisLabel: {
          color: styleConfig.colors.text
        },
        axisLine: {
          lineStyle: {
            color: styleConfig.colors.border
          }
        },
        splitLine: {
          lineStyle: {
            color: styleConfig.colors.grid
          }
        }
      },
      series: [{
        data: data,
        type: 'line',
        symbol: 'none',
        lineStyle: {
          width: styleConfig.dimensions.lineWidth,
          color: styleConfig.colors.primary
        },
        smooth: false
      }]
    };
    
    this.chart.setOption(option);
    
    // Apply time window after setting options
    this.applyTimeWindow();
    
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
    
  }
  
  // Apply the time window setting to show only the specified time range
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
    
    // Calculate the percentage of the dataset that the time window represents
    const totalTimeRange = lastTimestamp - firstTimestamp;
    const windowTimeRange = lastTimestamp - minTime;
    
    // Calculate start and end percentages for dataZoom
    const startPercent = Math.max(0, ((minTime - firstTimestamp) / totalTimeRange) * 100);
    const endPercent = 100;
    
    // Update the dataZoom to show the time window, but don't set hard axis limits
    // This allows users to zoom out beyond the initial time window
    this.chart.setOption({
      dataZoom: [
        {
          start: startPercent,
          end: endPercent
        },
        {
          start: startPercent,
          end: endPercent
        }
      ]
    });
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

  addPoint(point: { time: number, value: number }, redraw: boolean = true): void {
    if (!this.chart || !this.dataset) {
      return;
    }

    const startTime = this.performanceService.startTimer();
    
    // Add point to dataset
    this.dataset.points.push(point);
    this.dataset.pointCount = this.dataset.points.length;
    
    // Use ECharts' efficient appendData method for streaming
    // This avoids getting the full option and just appends the new point
    const newPoint: [number, number] = [point.time, point.value];
    
    // Calculate time window for auto-scrolling if needed
    let updateOption: any = {
      series: [{
        data: null // We'll use appendData instead
      }]
    };
    
    if (redraw) {
      // Calculate time window for smooth auto-scroll
      const points = this.dataset.points;
      const lastTimestamp = points[points.length - 1].time;
      const firstTimestamp = points[0].time;
      const timeWindowMs = this.timeWindowMinutes * 60 * 1000;
      const minTime = Math.max(lastTimestamp - timeWindowMs, firstTimestamp);
      
      // Calculate percentages for smooth scrolling
      const totalTimeRange = lastTimestamp - firstTimestamp;
      if (totalTimeRange > 0) {
        const startPercent = Math.max(0, ((minTime - firstTimestamp) / totalTimeRange) * 100);
        const endPercent = 100;
        
        updateOption.dataZoom = [
          {
            start: startPercent,
            end: endPercent
          },
          {
            start: startPercent,
            end: endPercent
          }
        ];
      }
    }
    
    // Use the efficient method: append data and update zoom in single call
    // Remove the null data property since we're using appendData
    delete updateOption.series[0].data;
    
    // Update with minimal re-render
    if (Object.keys(updateOption.dataZoom || {}).length > 0) {
      this.chart.setOption(updateOption, true, false); // merge=true, silent=false
    }
    
    // Append the single point efficiently - this is the key to no flashing
    this.chart.appendData({
      seriesIndex: 0,
      data: [newPoint]
    });
    
    const endTime = this.performanceService.endTimer(startTime);
    
    // Update metrics with single point addition time
    if (this.lastMetrics) {
      this.lastMetrics.updateTime = endTime;
    }
  }

  resetZoom(): void {
    if (!this.chart) {
      return;
    }
    
    // Reset to the configured time window view (not full dataset)
    // This provides a more useful "reset" that shows the default time window
    this.applyTimeWindow();
  }

  resetToFullView(): void {
    if (!this.chart) {
      return;
    }
    
    // Reset the dataZoom to show all data (full dataset)
    this.chart.setOption({
      dataZoom: [
        {
          start: 0,
          end: 100
        },
        {
          start: 0,
          end: 100
        }
      ]
    });
  }
}
