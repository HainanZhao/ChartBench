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
  `]
})
export class EchartsComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  @Input() dataset: BenchmarkDataset | null = null;
  @Input() height: number = 400;
  
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
      grid: {
        left: styleConfig.dimensions.padding.left,
        right: styleConfig.dimensions.padding.right,
        top: styleConfig.dimensions.padding.top,
        bottom: styleConfig.dimensions.padding.bottom,
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
