import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  TimeSeriesDataService,
  BenchmarkDataset,
} from '../services/time-series-data.service';
import { PerformanceService } from '../services/performance.service';
import { EchartsComponent } from './echarts.component';
import { LightweightChartsComponent } from './lightweight-charts.component';
import { LightningChartsComponent } from './lightning-charts.component';
import { ChartjsComponent } from './chartjs.component';
import { HighchartsComponent } from './highcharts.component';
import { D3ChartComponent } from './d3-chart.component';

interface StreamingMetrics {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  renderTime: number;
  pointCount: number;
}

@Component({
  selector: 'app-streaming-benchmark',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EchartsComponent,
    LightweightChartsComponent,
    LightningChartsComponent,
    ChartjsComponent,
    HighchartsComponent,
    D3ChartComponent,
  ],
  template: `
    <div class="streaming-benchmark">
      <div class="controls">
        <div class="control-row">
          <div class="control-group">
            <label>Chart Library:</label>
            <select [(ngModel)]="selectedChart" (change)="onChartChange()">
              <option value="echarts">ECharts</option>
              <option value="lightweight">
                TradingView Lightweight Charts
              </option>
              <option value="lightning">LightningChart</option>
              <option value="chartjs">Chart.js</option>
              <option value="highcharts">Highcharts</option>
              <option value="d3">D3.js</option>
            </select>
          </div>

          <div class="control-group">
            <label>Baseline Points:</label>
            <input
              type="number"
              [(ngModel)]="baselinePoints"
              min="1000"
              max="500000"
              step="1000"
            />
          </div>

          <div class="control-group">
            <label>Points per Second:</label>
            <input
              type="number"
              [(ngModel)]="pointsPerSecond"
              min="1"
              max="100"
              step="1"
            />
          </div>

          <div class="control-group">
            <label>Duration (seconds):</label>
            <input
              type="number"
              [(ngModel)]="testDuration"
              min="10"
              max="300"
              step="10"
            />
          </div>

          <div class="control-group">
            <label>Number of Charts:</label>
            <input
              type="number"
              [(ngModel)]="numberOfCharts"
              min="1"
              max="16"
              step="1"
            />
          </div>

          <div class="control-group">
            <label>Time Window (minutes):</label>
            <input
              type="number"
              [(ngModel)]="timeWindowMinutes"
              min="1"
              max="120"
              step="1"
              (change)="onTimeWindowChange()"
            />
          </div>

          <div class="control-group button-group">
            <label>&nbsp;</label> <!-- Invisible label for alignment -->
            <div class="button-container">
              <button
                (click)="startStreaming()"
                [disabled]="isStreaming"
                class="btn btn-primary"
              >
                {{ isStreaming ? 'Streaming...' : 'Start Streaming Test' }}
              </button>
              <button
                (click)="stopStreaming()"
                [disabled]="!isStreaming"
                class="btn btn-secondary"
              >
                Stop Test
              </button>
              <button (click)="clearMetrics()" class="btn btn-secondary">
                Clear Metrics
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="status" *ngIf="isStreaming">
        <div class="status-item">
          <span>Total Points: {{ currentPointCount.toLocaleString() }}</span>
        </div>
        <div class="status-item">
          <span>Elapsed: {{ elapsedTime }}s / {{ testDuration }}s</span>
        </div>
        <div class="status-item">
          <span>Current FPS: {{ currentFPS }}</span>
        </div>
        <div class="status-item">
          <span>CPU Usage: {{ currentCPU }}%</span>
        </div>
      </div>

      <div class="chart-container">
        <!-- ECharts -->
        <div *ngIf="selectedChart === 'echarts'" class="chart-grid-container">
          <div class="chart-grid">
            <div
              *ngFor="let i of getNumberArray(numberOfCharts)"
              class="chart-wrapper"
            >
              <app-echarts-benchmark
                #echartsComponent
                [dataset]="currentDataset"
                [height]="getChartHeight()"
                [timeWindowMinutes]="timeWindowMinutes"
              >
              </app-echarts-benchmark>
            </div>
          </div>
        </div>

        <!-- Lightweight Charts -->
        <div
          *ngIf="selectedChart === 'lightweight'"
          class="chart-grid-container"
        >
          <div class="chart-grid">
            <div
              *ngFor="let i of getNumberArray(numberOfCharts)"
              class="chart-wrapper"
            >
              <app-lightweight-charts-benchmark
                #lightweightChartsComponent
                [dataset]="currentDataset"
                [height]="getChartHeight()"
                [timeWindowMinutes]="timeWindowMinutes"
              >
              </app-lightweight-charts-benchmark>
            </div>
          </div>
        </div>

        <!-- Lightning Charts -->
        <div *ngIf="selectedChart === 'lightning'" class="chart-grid-container">
          <div class="chart-grid">
            <div
              *ngFor="let i of getNumberArray(numberOfCharts)"
              class="chart-wrapper"
            >
              <app-lightning-charts-benchmark
                #lightningChartsComponent
                [dataset]="currentDataset"
                [height]="getChartHeight()"
                [timeWindowMinutes]="timeWindowMinutes"
              >
              </app-lightning-charts-benchmark>
            </div>
          </div>
        </div>

        <!-- Chart.js -->
        <div *ngIf="selectedChart === 'chartjs'" class="chart-grid-container">
          <div class="chart-grid">
            <div
              *ngFor="let i of getNumberArray(numberOfCharts)"
              class="chart-wrapper"
            >
              <app-chartjs-benchmark
                #chartjsComponent
                [dataset]="currentDataset"
                [height]="getChartHeight()"
                [timeWindowMinutes]="timeWindowMinutes"
              >
              </app-chartjs-benchmark>
            </div>
          </div>
        </div>

        <!-- Highcharts -->
        <div
          *ngIf="selectedChart === 'highcharts'"
          class="chart-grid-container"
        >
          <div class="chart-grid">
            <div
              *ngFor="let i of getNumberArray(numberOfCharts)"
              class="chart-wrapper"
            >
              <app-highcharts
                #highchartsComponent
                [data]="currentDataset?.points || []"
                [height]="getChartHeight()"
                [title]="'Highcharts - Real-time Streaming'"
                [timeWindowMinutes]="timeWindowMinutes"
              >
              </app-highcharts>
            </div>
          </div>
        </div>

        <!-- D3.js -->
        <div *ngIf="selectedChart === 'd3'" class="chart-grid-container">
          <div class="chart-grid">
            <div
              *ngFor="let i of getNumberArray(numberOfCharts)"
              class="chart-wrapper"
            >
              <app-d3-benchmark
                #d3ChartComponent
                [dataset]="currentDataset"
                [height]="getChartHeight()"
              >
              </app-d3-benchmark>
            </div>
          </div>
        </div>
      </div>

      <div class="metrics-dashboard" *ngIf="streamingMetrics.length > 0">
        <h4>Performance Metrics</h4>
        <div class="metrics-grid">
          <div class="metric-card">
            <h5>Average Render Time</h5>
            <span class="metric-value">{{ getAverageRenderTime() }}ms</span>
          </div>
          <div class="metric-card">
            <h5>Average CPU Usage</h5>
            <span class="metric-value">{{ getAverageCPU() }}%</span>
          </div>
          <div class="metric-card">
            <h5>Peak Memory Usage</h5>
            <span class="metric-value">{{ getPeakMemory() }}MB</span>
          </div>
          <div class="metric-card">
            <h5>Frame Drops</h5>
            <span class="metric-value">{{ getFrameDrops() }}</span>
          </div>
        </div>

        <div class="metrics-chart">
          <canvas #metricsCanvas width="800" height="200"></canvas>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .streaming-benchmark {
        padding: 20px;
        background: #f5f5f5;
        min-height: 100vh;
      }

      .controls {
        background: white;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .controls h3 {
        margin: 0 0 20px 0;
        color: #333;
      }

      .control-row {
        display: flex;
        gap: 20px;
        margin-bottom: 15px;
        flex-wrap: wrap;
      }

      .control-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .control-group label {
        font-weight: bold;
        color: #333;
        font-size: 12px;
      }

      .control-group select,
      .control-group input {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
      }

      .control-subgroup {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;
      }

      .control-subgroup input[type='checkbox'] {
        margin: 0;
        padding: 0;
        width: 16px;
        height: 16px;
      }

      .control-subgroup input[type='number'] {
        width: 70px;
      }

      .button-group {
        flex-direction: column !important;
        gap: 5px !important;
        align-items: stretch;
      }

      .button-group label {
        font-weight: bold;
        color: #333;
        font-size: 12px;
        visibility: hidden; /* Keep for spacing but hide the actual text */
      }

      .button-container {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        font-weight: bold;
        transition: background-color 0.2s;
        white-space: nowrap;
      }

      .btn-primary {
        background: #2196f3;
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        background: #1976d2;
      }

      .btn-primary:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      .btn-secondary {
        background: #666;
        color: white;
      }

      .btn-secondary:hover {
        background: #555;
      }

      .status {
        display: flex;
        gap: 30px;
        background: white;
        padding: 15px 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        flex-wrap: wrap;
      }

      .status-item {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .status-item span {
        font-weight: bold;
        color: #333;
      }

      .chart-container {
        margin-bottom: 20px;
      }

      .chart-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: 15px;
        max-width: 100%;
      }

      /* Ensure a maximum of 3 columns regardless of screen size */
      .chart-grid-container {
        max-width: 100%;
        margin: 0 auto;
      }

      @media (min-width: 1200px) {
        .chart-grid {
          grid-template-columns: repeat(3, minmax(400px, 1fr));
        }
      }

      .chart-wrapper {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      .chart-controls {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 10px;
      }

      .metrics-dashboard {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .metrics-dashboard h4 {
        margin: 0 0 20px 0;
        color: #333;
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-bottom: 30px;
      }

      .metric-card {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
        text-align: center;
        border: 1px solid #e9ecef;
      }

      .metric-card h5 {
        margin: 0 0 10px 0;
        color: #666;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
      }

      .metric-value {
        font-size: 24px;
        font-weight: bold;
        color: #2196f3;
      }

      .metrics-chart {
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
      }

      @media (max-width: 768px) {
        .control-row {
          flex-direction: column;
        }

        .button-container {
          flex-direction: column;
          gap: 10px;
        }

        .btn {
          width: 100%;
        }

        .status {
          flex-direction: column;
          gap: 10px;
        }
      }
    `,
  ],
})
export class StreamingBenchmarkComponent implements OnInit, OnDestroy {
  @ViewChildren('echartsComponent')
  echartsComponents?: QueryList<EchartsComponent>;
  @ViewChildren('lightweightChartsComponent')
  lightweightChartsComponents?: QueryList<LightweightChartsComponent>;
  @ViewChildren('lightningChartsComponent')
  lightningChartsComponents?: QueryList<LightningChartsComponent>;
  @ViewChildren('chartjsComponent')
  chartjsComponents?: QueryList<ChartjsComponent>;
  @ViewChildren('highchartsComponent')
  highchartsComponents?: QueryList<HighchartsComponent>;
  @ViewChildren('d3ChartComponent')
  d3ChartComponents?: QueryList<D3ChartComponent>;

  @ViewChild('metricsCanvas') metricsCanvas?: any;

  // Configuration
  selectedChart = 'echarts';
  baselinePoints = 50000;
  pointsPerSecond = 2;
  testDuration = 60;
  numberOfCharts = 9;
  timeWindowMinutes = 30; // Default to 30 minutes

  // State
  isStreaming = false;
  currentDataset: BenchmarkDataset | null = null;
  currentPointCount = 0;
  elapsedTime = 0;
  currentFPS = 0;
  currentCPU = 0;

  // Metrics
  streamingMetrics: StreamingMetrics[] = [];

  private streamingInterval?: number;
  private metricsInterval?: number;
  private startTime = 0;
  private baselineData: Array<{ time: number; value: number }> = [];

  constructor(
    private timeSeriesDataService: TimeSeriesDataService,
    private performanceService: PerformanceService
  ) {}

  ngOnInit(): void {
    this.initializeBaselineData();
  }

  ngOnDestroy(): void {
    this.stopStreaming();
  }

  private initializeBaselineData(): void {
    const baselineDataset = this.timeSeriesDataService.generateTimeSeriesData(
      this.baselinePoints,
      `Baseline Dataset (${this.baselinePoints.toLocaleString()} points)`
    );
    this.baselineData = [...baselineDataset.points];
    this.currentDataset = baselineDataset;
    this.currentPointCount = this.baselinePoints;
  }

  onChartChange(): void {
    // Reset and reinitialize when chart changes
    this.stopStreaming();
    this.initializeBaselineData();
  }

  // Update Chart.js time window when setting changes
  onChartjsTimeWindowChange(): void {
    if (
      this.selectedChart === 'chartjs' &&
      this.chartjsComponents &&
      this.chartjsComponents.length > 0
    ) {
      this.chartjsComponents.forEach((chart) => {
        chart.timeWindowMinutes = this.timeWindowMinutes;
        chart.resetZoom(); // Apply the new time window immediately
      });
    }
  }

  // Update time window when setting changes
  onTimeWindowChange(): void {
    if (this.selectedChart === 'chartjs' && this.chartjsComponents && this.chartjsComponents.length > 0) {
      this.chartjsComponents.forEach((chart) => {
        chart.timeWindowMinutes = this.timeWindowMinutes;
        chart.resetZoom(); // Apply the new time window immediately
      });
    }
    
    // Future: Add support for other chart types that could use the time window
  }

  async startStreaming(): Promise<void> {
    if (this.isStreaming) return;

    this.isStreaming = true;
    this.startTime = Date.now();
    this.elapsedTime = 0;
    this.streamingMetrics = [];

    // Initialize with baseline data
    this.initializeBaselineData();
    await this.updateCurrentChart();

    // Start streaming new points
    const intervalMs = 1000 / this.pointsPerSecond;

    this.streamingInterval = window.setInterval(async () => {
      if (this.elapsedTime >= this.testDuration) {
        this.stopStreaming();
        return;
      }

      await this.addStreamingPoint();
    }, intervalMs);

    // Start metrics collection
    this.metricsInterval = window.setInterval(() => {
      this.collectMetrics();
    }, 100); // Collect metrics every 100ms
  }

  stopStreaming(): void {
    this.isStreaming = false;

    if (this.streamingInterval) {
      clearInterval(this.streamingInterval);
      this.streamingInterval = undefined;
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }
  }

  clearMetrics(): void {
    this.streamingMetrics = [];
    this.initializeBaselineData();
  }

  private async addStreamingPoint(): Promise<void> {
    this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);

    // Generate new point
    const lastPoint = this.baselineData[this.baselineData.length - 1];
    const newTime = lastPoint.time + 1000; // Add 1 second
    const newValue = lastPoint.value + (Math.random() - 0.5) * 10; // Random walk
    const newPoint = { time: newTime, value: newValue };

    this.baselineData.push(newPoint);
    this.currentPointCount++;

    // Update dataset
    this.currentDataset = {
      name: `Streaming Dataset (${this.currentPointCount.toLocaleString()} points)`,
      pointCount: this.currentPointCount,
      points: [...this.baselineData],
    };

    // Update chart efficiently based on chart type
    const renderStart = performance.now();
    await this.updateCurrentChartStreaming(newPoint);
    const renderTime = performance.now() - renderStart;

    // Calculate FPS
    this.currentFPS = Math.round(1000 / Math.max(renderTime, 16.67)); // Min 60 FPS cap
  }

  private async updateCurrentChartStreaming(newPoint: {
    time: number;
    value: number;
  }): Promise<void> {
    if (!this.currentDataset) return;

    switch (this.selectedChart) {
      case 'echarts':
        if (this.echartsComponents && this.echartsComponents.length > 0) {
          // Use efficient single-point addition instead of full data update
          this.echartsComponents.forEach((chart) =>
            chart.addPoint(newPoint, true)
          );
        }
        break;
      case 'lightweight':
        if (
          this.lightweightChartsComponents &&
          this.lightweightChartsComponents.length > 0
        ) {
          // Use efficient single-point addition instead of full data update
          this.lightweightChartsComponents.forEach((chart) =>
            chart.addPoint(newPoint, true)
          );
        }
        break;
      case 'lightning':
        if (
          this.lightningChartsComponents &&
          this.lightningChartsComponents.length > 0
        ) {
          // Use efficient single-point addition instead of full data update
          this.lightningChartsComponents.forEach((chart) =>
            chart.addPoint(newPoint, true)
          );
        }
        break;
      case 'chartjs':
        if (this.chartjsComponents && this.chartjsComponents.length > 0) {
          // Use efficient single-point addition instead of full data update
          this.chartjsComponents.forEach((chart) =>
            chart.addPoint(newPoint, true)
          );
        }
        break;
      case 'highcharts':
        if (this.highchartsComponents && this.highchartsComponents.length > 0) {
          // Use efficient single-point addition instead of full data update
          this.highchartsComponents.forEach((chart) =>
            chart.addPoint(newPoint, true)
          );
        }
        break;
      case 'd3':
        if (this.d3ChartComponents && this.d3ChartComponents.length > 0) {
          // Use efficient single-point addition instead of full data update
          this.d3ChartComponents.forEach((chart) =>
            chart.addPoint(newPoint, true)
          );
        }
        break;
    }
  }

  private async updateCurrentChart(): Promise<void> {
    if (!this.currentDataset) return;

    switch (this.selectedChart) {
      case 'echarts':
        if (this.echartsComponents && this.echartsComponents.length > 0) {
          const promises = this.echartsComponents.map((chart) =>
            chart.updateChart(this.currentDataset!)
          );
          await Promise.all(promises);
        }
        break;
      case 'lightweight':
        if (
          this.lightweightChartsComponents &&
          this.lightweightChartsComponents.length > 0
        ) {
          const promises = this.lightweightChartsComponents.map((chart) =>
            chart.updateChart(this.currentDataset!)
          );
          await Promise.all(promises);
        }
        break;
      case 'lightning':
        if (
          this.lightningChartsComponents &&
          this.lightningChartsComponents.length > 0
        ) {
          const promises = this.lightningChartsComponents.map((chart) =>
            chart.updateChart(this.currentDataset!)
          );
          await Promise.all(promises);
        }
        break;
      case 'chartjs':
        if (this.chartjsComponents && this.chartjsComponents.length > 0) {
          const promises = this.chartjsComponents.map((chart) =>
            chart.updateChart(this.currentDataset!)
          );
          await Promise.all(promises);
        }
        break;
      case 'highcharts':
        if (this.highchartsComponents && this.highchartsComponents.length > 0) {
          // Use the optimized updateData method which handles streaming efficiently
          this.highchartsComponents.forEach((chart) =>
            chart.updateData(this.currentDataset!.points)
          );
        }
        break;
      case 'd3':
        if (this.d3ChartComponents && this.d3ChartComponents.length > 0) {
          const promises = this.d3ChartComponents.map((chart) =>
            chart.updateChart(this.currentDataset!)
          );
          await Promise.all(promises);
        }
        break;
    }
  }

  // Reset zoom for all Chart.js charts
  resetChartjsZoom(): void {
    if (this.chartjsComponents && this.chartjsComponents.length > 0) {
      this.chartjsComponents.forEach((chart) => {
        chart.resetZoom();
      });
    }
  }

  private collectMetrics(): void {
    const memoryInfo = (performance as any).memory;
    const memoryUsage = memoryInfo
      ? Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024)
      : 0;

    // Collect render times from all chart instances and calculate the average
    let totalRenderTime = 0;
    let count = 0;

    switch (this.selectedChart) {
      case 'echarts':
        if (this.echartsComponents && this.echartsComponents.length > 0) {
          this.echartsComponents.forEach((chart) => {
            if (chart.lastMetrics?.renderTime) {
              totalRenderTime += chart.lastMetrics.renderTime;
              count++;
            }
          });
        }
        break;
      case 'lightweight':
        if (
          this.lightweightChartsComponents &&
          this.lightweightChartsComponents.length > 0
        ) {
          this.lightweightChartsComponents.forEach((chart) => {
            if (chart.lastMetrics?.renderTime) {
              totalRenderTime += chart.lastMetrics.renderTime;
              count++;
            }
          });
        }
        break;
      case 'lightning':
        if (
          this.lightningChartsComponents &&
          this.lightningChartsComponents.length > 0
        ) {
          this.lightningChartsComponents.forEach((chart) => {
            if (chart.lastMetrics?.renderTime) {
              totalRenderTime += chart.lastMetrics.renderTime;
              count++;
            }
          });
        }
        break;
      case 'chartjs':
        if (this.chartjsComponents && this.chartjsComponents.length > 0) {
          this.chartjsComponents.forEach((chart) => {
            if (chart.lastMetrics?.renderTime) {
              totalRenderTime += chart.lastMetrics.renderTime;
              count++;
            }
          });
        }
        break;
      case 'highcharts':
        if (this.highchartsComponents && this.highchartsComponents.length > 0) {
          this.highchartsComponents.forEach((chart) => {
            if (chart.lastRenderTime) {
              totalRenderTime += chart.lastRenderTime;
              count++;
            }
          });
        }
        break;
      case 'd3':
        if (this.d3ChartComponents && this.d3ChartComponents.length > 0) {
          this.d3ChartComponents.forEach((chart) => {
            if (chart.lastMetrics?.renderTime) {
              totalRenderTime += chart.lastMetrics.renderTime;
              count++;
            }
          });
        }
        break;
    }

    // Calculate average render time
    const renderTime = count > 0 ? totalRenderTime / count : 0;

    // Simulate CPU usage (higher render time = higher CPU usage)
    this.currentCPU = Math.min(100, Math.round((renderTime / 50) * 100));

    this.streamingMetrics.push({
      timestamp: Date.now(),
      cpuUsage: this.currentCPU,
      memoryUsage,
      renderTime,
      pointCount: this.currentPointCount,
    });

    // Keep only last 1000 metrics to prevent memory issues
    if (this.streamingMetrics.length > 1000) {
      this.streamingMetrics = this.streamingMetrics.slice(-1000);
    }
  }

  getAverageRenderTime(): number {
    if (this.streamingMetrics.length === 0) return 0;
    const avg =
      this.streamingMetrics.reduce((sum, m) => sum + m.renderTime, 0) /
      this.streamingMetrics.length;
    return Math.round(avg * 100) / 100;
  }

  getAverageCPU(): number {
    if (this.streamingMetrics.length === 0) return 0;
    const avg =
      this.streamingMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) /
      this.streamingMetrics.length;
    return Math.round(avg);
  }

  getPeakMemory(): number {
    if (this.streamingMetrics.length === 0) return 0;
    return Math.max(...this.streamingMetrics.map((m) => m.memoryUsage));
  }

  getFrameDrops(): number {
    if (this.streamingMetrics.length === 0) return 0;
    // Count frames where render time > 16.67ms (60 FPS threshold)
    return this.streamingMetrics.filter((m) => m.renderTime > 16.67).length;
  }

  // Helper method to generate an array of numbers for ngFor
  getNumberArray(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i);
  }

  // Calculate chart height based on number of charts
  getChartHeight(): number {
    if (this.numberOfCharts <= 1) return 500;
    if (this.numberOfCharts <= 3) return 450;
    if (this.numberOfCharts <= 6) return 400;
    if (this.numberOfCharts <= 9) return 350;
    return 300; // For more than 9 charts
  }
}
