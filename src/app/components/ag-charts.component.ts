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
  private pendingUpdate: boolean = false;
  private updateTimeout: any = null;
  private batchedPoints: TimeSeriesPoint[] = [];
  private lastUpdateTime: number = 0;
  private readonly UPDATE_INTERVAL = 50; // Update every 50ms for smooth streaming

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private chartStyleService: ChartStyleService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      // Create an initial empty chart that's ready to receive streaming data
      setTimeout(() => {
        this.renderChart();
      }, 0);
    }
  }

  ngOnDestroy(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  async renderChart(): Promise<AGChartsRenderingResult> {
    if (!this.isBrowser) {
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
      // Use an empty array if no data available
      const chartData = this.data.length > 0 ? 
        this.data.map((point, index) => ({
          index: index,
          time: new Date(point.time).toLocaleTimeString(),
          value: point.value
        })) : [];
      
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
        // Create chart immediately without nested requestAnimationFrame
        // This ensures the chart is created and ready for streaming updates
        this.chart = AgCharts.create(options);
        
        const endTime = performance.now();
        this.lastRenderTime = Math.round(endTime - startTime);
        
        console.log(`AG Charts rendered ${this.pointCount.toLocaleString()} points in ${this.lastRenderTime}ms`);
        
        resolve({
          renderTime: this.lastRenderTime,
          chartInstance: this.chart
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
    this.pointCount = newData.length;
    
    if (this.isBrowser) {
      if (this.chart) {
        // If we already have a chart, update it directly
        this.performChartUpdate();
      } else {
        // Otherwise create a new chart
        this.renderChart();
      }
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

  addPoint(point: TimeSeriesPoint, redraw: boolean = true): void {
    if (!this.isBrowser) {
      return;
    }

    const startTime = performance.now();
    
    // Add the new point to our data array
    this.data.push(point);
    this.pointCount = this.data.length;
    
    if (redraw) {
      // Always recreate the chart for each point in streaming mode
      // This is less efficient but ensures data is always visible
      this.performChartUpdate();
      
      const endTime = performance.now();
      this.lastRenderTime = Math.round(endTime - startTime);
      console.log(`AG Charts addPoint: ${this.lastRenderTime}ms for point ${this.pointCount}`);
    }
  }
  
  private performChartUpdate(): void {
    if (!this.chart) return;
    
    try {
      // Always use full data for better visualization
      // For large datasets, we can limit to the last 5000 points for performance
      // const dataToProcess = this.data.length > 5000 ? this.data.slice(-5000) : this.data;
      const dataToProcess = this.data; // Use all data for AG Charts
      // Make sure to use sequential indices for AG Charts
      const chartData = dataToProcess.map((p, index) => ({
        index: index, // Use sequential indices rather than preserving global index
        time: new Date(p.time).toLocaleTimeString(),
        value: p.value
      }));
      
      // Recreate the chart options with the latest data
      const styleConfig = this.chartStyleService.getStyleConfig();
      const style = {
        backgroundColor: styleConfig.colors.background,
        textColor: styleConfig.colors.text,
        gridColor: styleConfig.colors.grid,
        primaryColor: styleConfig.colors.primary,
        lineWidth: styleConfig.dimensions.lineWidth
      };
      
      // Completely recreate the chart for better visibility during streaming
      if (this.chart) {
        this.chart.destroy();
      }
      
      // Create a new chart with updated data
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
              enabled: chartData.length < 1000, // Only show markers for small datasets
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
      
      this.chart = AgCharts.create(options);
      
    } catch (error) {
      console.error('AG Charts update error:', error);
    }
  }

  updateDataStreaming(newData: TimeSeriesPoint[]): Promise<AGChartsRenderingResult> {
    // For streaming updates, we'll recreate the chart
    const startTime = performance.now();
    
    this.data = newData;
    this.pointCount = newData.length;
    
    if (!this.isBrowser) {
      return Promise.resolve({ renderTime: 0, chartInstance: null });
    }
    
    // Use the same chart recreation approach as performChartUpdate
    this.performChartUpdate();
    
    const endTime = performance.now();
    this.lastRenderTime = Math.round(endTime - startTime);
    
    console.log(`AG Charts streaming update: ${this.lastRenderTime}ms for ${this.pointCount} points`);
    
    return Promise.resolve({
      renderTime: this.lastRenderTime,
      chartInstance: this.chart
    });
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
