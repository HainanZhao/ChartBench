import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { TimeSeriesPoint } from '../services/time-series-data.service';
import { ChartStyleService } from '../services/chart-style.service';

// Highcharts imports
import * as Highcharts from 'highcharts';

export interface HighchartsRenderingResult {
  renderTime: number;
  chartInstance: any;
}

@Component({
  selector: 'app-highcharts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <h3>Highcharts</h3>
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
export class HighchartsComponent implements OnInit, OnDestroy {
  @Input() data: TimeSeriesPoint[] = [];
  @Input() height: number = 400;
  @Input() title: string = 'Highcharts Performance Test';

  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  public lastRenderTime: number = 0;
  public pointCount: number = 0;
  private chart: Highcharts.Chart | null = null;
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

  async renderChart(): Promise<HighchartsRenderingResult> {
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

      // Prepare data for Highcharts
      const chartData = this.data.map(point => [point.time, point.value]);
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
      const options: Highcharts.Options = {
        chart: {
          type: 'line',
          backgroundColor: style.backgroundColor,
          animation: false, // Disable animations for performance
          renderTo: this.chartContainer.nativeElement,
          height: this.height,
          spacing: [10, 10, 10, 10]
        },
        title: {
          text: this.title,
          style: {
            color: style.textColor,
            fontSize: '14px'
          }
        },
        xAxis: {
          type: 'datetime',
          labels: {
            style: {
              color: style.textColor,
              fontSize: '11px'
            }
          },
          gridLineColor: style.gridColor,
          lineColor: style.gridColor
        },
        yAxis: {
          title: {
            text: 'Value',
            style: {
              color: style.textColor
            }
          },
          labels: {
            style: {
              color: style.textColor,
              fontSize: '11px'
            }
          },
          gridLineColor: style.gridColor
        },
        legend: {
          enabled: false
        },
        tooltip: {
          enabled: this.data.length < 10000, // Disable tooltips for large datasets
          formatter: function() {
            return `<b>Time:</b> ${Highcharts.dateFormat('%Y-%m-%d %H:%M', this.x as number)}<br/>
                    <b>Value:</b> ${(this.y as number).toFixed(2)}`;
          }
        },
        plotOptions: {
          line: {
            marker: {
              enabled: this.data.length < 1000, // Only show markers for small datasets
              radius: 2
            },
            lineWidth: style.lineWidth,
            color: style.primaryColor,
            animation: false,
            turboThreshold: 0, // Remove point limit
            boostThreshold: 1000, // Enable boost for large datasets
            shadow: false
          },
          series: {
            animation: false,
            stickyTracking: false
          }
        },
        series: [{
          type: 'line',
          name: 'Time Series Data',
          data: chartData,
          color: style.primaryColor
        }],
        credits: {
          enabled: false
        },
        boost: {
          useGPUTranslations: true,
          usePreallocated: true
        }
      };

      return new Promise<HighchartsRenderingResult>((resolve) => {
        // Use requestAnimationFrame to ensure DOM is ready and measure actual rendering time
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.chart = Highcharts.chart(this.chartContainer.nativeElement, options);
            
            const endTime = performance.now();
            this.lastRenderTime = Math.round(endTime - startTime);
            
            console.log(`Highcharts rendered ${this.pointCount.toLocaleString()} points in ${this.lastRenderTime}ms`);
            
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
      console.error('Highcharts rendering error:', error);
      
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
      this.chart.setSize(undefined, height, false);
    }
  }

  exportChart(format: 'PNG' | 'SVG' | 'PDF' = 'PNG'): void {
    if (this.chart && (this.chart as any).exportChart) {
      const exportFormat = format.toLowerCase() as 'png' | 'svg' | 'pdf';
      (this.chart as any).exportChart({
        type: `image/${exportFormat}` as any,
        filename: `highcharts-performance-test-${Date.now()}`
      });
    }
  }

  getPerformanceMetrics() {
    return {
      library: 'Highcharts',
      pointCount: this.pointCount,
      renderTime: this.lastRenderTime,
      chartInstance: this.chart
    };
  }
}
