import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { TimeSeriesPoint } from '../services/time-series-data.service';
import { ChartStyleService } from '../services/chart-style.service';

// AG Charts imports
import { AgCharts, AgLineSeriesOptions, AgChartOptions } from 'ag-charts-community';

export interface AGChartsRenderingResult {
  renderTime: number;
  chartInstance: any;
}

@Component({
  selector: 'app-ag-charts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <h3>AG Charts</h3>
      <div class="chart-info" *ngIf="lastRenderTime">
        <span>Render Time: {{lastRenderTime}}ms</span>
        <span>Points: {{pointCount | number}}</span>
      </div>
      <div class="chart-title" *ngIf="pointCount > 0">
        Dataset ({{ pointCount.toLocaleString() }} points)
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
export class AGChartsComponent implements OnInit, OnDestroy {
  @Input() data: TimeSeriesPoint[] = [];
  @Input() height: number = 400;
  @Input() title: string = 'AG Charts Performance Test';

  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  public lastRenderTime: number = 0;
  public pointCount: number = 0;
  private chart: any = null;
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private chartStyleService: ChartStyleService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser && this.data.length > 0) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  async renderChart(): Promise<AGChartsRenderingResult> {
    if (!this.isBrowser || !this.data.length) {
      return { renderTime: 0, chartInstance: null };
    }

    const startTime = performance.now();

    try {
      // Destroy existing chart
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }

      // Prepare data for AG Charts (convert timestamps to formatted strings)
      const chartData = this.data.map((point, index) => ({
        index: index,
        time: new Date(point.time).toLocaleTimeString(),
        value: point.value
      }));
      this.pointCount = chartData.length;

      // Get chart style
      const styleConfig = this.chartStyleService.getStyleConfig();
      const style = {
        backgroundColor: styleConfig.colors.background,
        textColor: styleConfig.colors.text,
        gridColor: styleConfig.colors.grid,
        primaryColor: styleConfig.colors.primary,
        lineWidth: styleConfig.dimensions.lineWidth
      };

      // Create chart configuration
      const options: AgChartOptions = {
        container: this.chartContainer.nativeElement,
        height: this.height,
        title: {
          text: this.title,
          fontSize: 14,
          color: style.textColor
        },
        subtitle: {
          text: `${this.pointCount.toLocaleString()} data points`
        },
        background: {
          fill: style.backgroundColor
        },
        data: chartData,
        series: [
          {
            type: 'line',
            xKey: 'index',
            yKey: 'value',
            stroke: style.primaryColor,
            strokeWidth: style.lineWidth,
            marker: {
              enabled: this.data.length < 1000, // Only show markers for small datasets
              size: 3,
              fill: style.primaryColor,
              stroke: style.primaryColor
            }
          } as AgLineSeriesOptions
        ],
        legend: {
          enabled: false
        },
        animation: {
          enabled: false // Disable animations for performance
        }
      };

      return new Promise<AGChartsRenderingResult>((resolve) => {
        // Use requestAnimationFrame to ensure DOM is ready and measure actual rendering time
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.chart = AgCharts.create(options);
            
            const endTime = performance.now();
            this.lastRenderTime = Math.round(endTime - startTime);
            
            console.log(`AG Charts rendered ${this.pointCount.toLocaleString()} points in ${this.lastRenderTime}ms`);
            
            resolve({
              renderTime: this.lastRenderTime,
              chartInstance: this.chart
            });
          });
        });
      });

    } catch (error) {
      const endTime = performance.now();
      this.lastRenderTime = Math.round(endTime - startTime);
      console.error('AG Charts rendering error:', error);
      
      return {
        renderTime: this.lastRenderTime,
        chartInstance: null
      };
    }
  }

  updateData(newData: TimeSeriesPoint[]): void {
    this.data = newData;
    if (this.isBrowser) {
      this.renderChart();
    }
  }

  updateSize(width: number, height: number): void {
    this.height = height;
    if (this.chart) {
      // Recreate chart with new size
      this.renderChart();
    }
  }

  exportChart(format: 'PNG' | 'SVG' | 'PDF' = 'PNG'): void {
    if (this.chart) {
      // AG Charts may not have built-in export, implement basic version
      console.log('AG Charts export functionality not yet implemented');
    }
  }

  getPerformanceMetrics() {
    return {
      library: 'AG Charts',
      pointCount: this.pointCount,
      renderTime: this.lastRenderTime,
      chartInstance: this.chart
    };
  }
}
