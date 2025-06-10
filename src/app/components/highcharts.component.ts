import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ElementRef, ViewChild, PLATFORM_ID, Inject } from '@angular/core';
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
      <div class="zoom-control">
        <button (click)="resetZoom()" class="reset-zoom-btn">Reset Zoom</button>
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
    }
    
    .reset-zoom-btn {
      background-color: #2196f3;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      opacity: 0.8;
    }
    
    .reset-zoom-btn:hover {
      opacity: 1;
    }
  `]
})
export class HighchartsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() data: TimeSeriesPoint[] = [];
  @Input() height: number = 400;
  @Input() title: string = 'Highcharts Performance Test';
  @Input() timeWindowMinutes: number = 30; // Default to 30 minutes

  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  public lastRenderTime: number = 0;
  public initialRenderTime: number = 0;
  public lastStreamingTime: number = 0;
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && changes['data'].currentValue && this.isBrowser) {
      // When data input changes (for static benchmark), update the chart
      this.data = changes['data'].currentValue;
      this.pointCount = this.data.length;
      
      if (this.chart) {
        this.updateStaticChart();
      } else {
        // If no chart exists yet, create one
        this.renderChart();
      }
    }
    
    if (changes['timeWindowMinutes'] && this.chart) {
      // Apply the new time window
      this.applyTimeWindow();
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
          spacing: [10, 10, 10, 10],
          // Add zoom and pan capabilities
          zooming: {
            type: 'x',
            mouseWheel: {
              enabled: false // Disabled because we handle it manually in events
            },
            resetButton: {
              theme: {
                style: {
                  display: 'none' // Hide the built-in reset button since we have our own
                }
              }
            }
          },
          panning: {
            enabled: true
          },
          events: {
            load: function() {
              // Handle mouse wheel events for zooming
              const chart = this;
              const chartContainer = this.container;
              
              chartContainer.addEventListener('wheel', function(e: WheelEvent) {
                // Only prevent default if we're actually going to zoom
                const rect = chartContainer.getBoundingClientRect();
                const isOverChart = e.clientX >= rect.left && e.clientX <= rect.right && 
                                   e.clientY >= rect.top && e.clientY <= rect.bottom;
                
                if (isOverChart) {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Get the current axis extremes
                  const xAxis = chart.xAxis[0];
                  const extremes = xAxis.getExtremes();
                  const range = extremes.max - extremes.min;
                  
                  // Calculate zoom factor based on wheel delta
                  const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
                  const newRange = range * zoomFactor;
                  
                  // Get mouse position relative to chart
                  const mouseX = e.clientX - rect.left;
                  const plotLeft = chart.plotLeft;
                  const plotWidth = chart.plotWidth;
                  
                  if (mouseX >= plotLeft && mouseX <= plotLeft + plotWidth) {
                    // Convert mouse position to data value
                    const mouseTime = xAxis.toValue(mouseX);
                    
                    // Calculate new extremes centered on mouse position
                    const mouseRatio = (mouseTime - extremes.min) / range;
                    const newMin = mouseTime - (newRange * mouseRatio);
                    const newMax = mouseTime + (newRange * (1 - mouseRatio));
                    
                    // Apply the zoom
                    xAxis.setExtremes(newMin, newMax, true, false);
                  }
                }
              }, { passive: false });
            }
          }
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
          lineColor: style.gridColor,
          // Add zoom capabilities
          minRange: 60 * 1000, // Allow zooming to 1-minute intervals at minimum
          ordinal: false
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
          formatter: function(this: any): string {
            if (this.x !== undefined && this.y !== undefined) {
              return `<b>Time:</b> ${Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x)}<br/>
                    <b>Value:</b> ${this.y.toFixed(2)}`;
            }
            return '';
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
            
            // Apply time window after chart is created
            this.applyTimeWindow();
            
            const endTime = performance.now();
            this.lastRenderTime = Math.round(endTime - startTime);

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
    this.pointCount = newData.length;
    
    if (this.isBrowser) {
      // For static benchmark tests, do a complete data replacement
      this.updateStaticChart();
    }
  }

  private updateStaticChart(): void {
    const startTime = performance.now();
    
    if (!this.chart) {
      // Create chart if it doesn't exist
      this.renderChart();
      return;
    }

    try {
      // Prepare data for Highcharts
      const chartData = this.data.map(point => [point.time, point.value]);
      
      // Update the series data directly for static benchmark
      if (this.chart.series && this.chart.series.length > 0) {
        this.chart.series[0].setData(chartData, true); // true = redraw immediately
      }
      
      // Apply time window after data update
      this.applyTimeWindow();
      
      const endTime = performance.now();
      this.lastRenderTime = Math.round(endTime - startTime);
    } catch (error) {
      console.error('Highcharts static update error:', error);
      // Fallback to full recreation if update fails
      this.renderChart();
    }
  }

  private updateDataStreaming(newData: TimeSeriesPoint[]): void {
    if (!this.chart || !this.chart.series || this.chart.series.length === 0) {
      // If chart doesn't exist, render from scratch
      this.renderChart();
      return;
    }

    const startTime = performance.now();
    const series = this.chart.series[0];
    const currentDataLength = series.data.length;
    const newDataLength = newData.length;

    // If we have new points to add
    if (newDataLength > currentDataLength) {
      // Add only the new points (streaming approach)
      const newPoints = newData.slice(currentDataLength);
      
      newPoints.forEach(point => {
        const chartPoint = [point.time, point.value];
        // Add point without redraw (redraw = false), shift if we have too many points
        const shouldShift = series.data.length > 10000; // Keep max 10k points for performance
        series.addPoint(chartPoint, false, shouldShift);
      });
      
      // Redraw once at the end
      this.chart.redraw();
      this.pointCount = newDataLength;
      
      // Apply time window after adding new points
      this.applyTimeWindow();
      
      // Measure and update streaming render time
      const endTime = performance.now();
      this.lastRenderTime = Math.round(endTime - startTime);
    } else if (newDataLength < currentDataLength) {
      // Data was reset or truncated, do full re-render
      this.renderChart();
    } else if (newDataLength === currentDataLength && newDataLength > 0) {
      // Same number of points - check if the last point changed (real-time update)
      const lastNewPoint = newData[newDataLength - 1];
      const lastChartPoint = series.data[currentDataLength - 1];
      
      if (lastChartPoint && 
          (lastChartPoint.x !== lastNewPoint.time || lastChartPoint.y !== lastNewPoint.value)) {
        // Update the last point
        lastChartPoint.update([lastNewPoint.time, lastNewPoint.value], true, false);
      }
    }
  }

  // Apply the time window to show only the last X minutes of data
  private applyTimeWindow(): void {
    if (!this.chart || !this.data || this.data.length === 0) {
      return;
    }
    
    // Calculate time window
    const lastTimestamp = this.data[this.data.length - 1].time;
    const firstTimestamp = this.data[0].time;
    const timeWindowMs = this.timeWindowMinutes * 60 * 1000;
    const minTime = Math.max(lastTimestamp - timeWindowMs, firstTimestamp);
    
    // Set the x-axis extremes to show only the time window
    if (this.chart.xAxis && this.chart.xAxis[0]) {
      this.chart.xAxis[0].setExtremes(minTime, lastTimestamp);
    }
  }
  
  // Reset zoom to show the time window
  resetZoom(): void {
    this.applyTimeWindow();
  }

  addPoint(point: TimeSeriesPoint, redraw: boolean = true): void {
    if (!this.isBrowser || !this.chart || !this.chart.series || this.chart.series.length === 0) {
      return;
    }

    const startTime = performance.now();
    const series = this.chart.series[0];
    const chartPoint = [point.time, point.value];
    
    // Add point and optionally shift old points to maintain performance
    const shouldShift = series.data.length > 10000;
    series.addPoint(chartPoint, redraw, shouldShift);
    
    this.data.push(point);
    this.pointCount = this.data.length;
    
    // Apply time window after adding point if we're redrawing
    if (redraw) {
      this.applyTimeWindow();
      
      // Measure render time for single point addition
      const endTime = performance.now();
      this.lastRenderTime = Math.round(endTime - startTime);
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
