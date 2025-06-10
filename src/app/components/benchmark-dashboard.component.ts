import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimeSeriesDataService, BenchmarkDataset } from '../services/time-series-data.service';
import { PerformanceService, BenchmarkResult } from '../services/performance.service';
import { EchartsComponent } from '../components/echarts.component';
import { LightweightChartsComponent } from '../components/lightweight-charts.component';
import { LightningChartsComponent } from '../components/lightning-charts.component';
import { ChartjsComponent } from '../components/chartjs.component';
import { HighchartsComponent } from '../components/highcharts.component';

@Component({
  selector: 'app-benchmark-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    EchartsComponent,
    LightweightChartsComponent,
    LightningChartsComponent,
    ChartjsComponent,
    HighchartsComponent
  ],
  template: `
    <div class="dashboard">
      <div class="controls">
        <div class="control-group">
          <label for="datasetSelect">Dataset Size:</label>
          <select id="datasetSelect" [(ngModel)]="selectedDatasetSize" (change)="onDatasetChange()">
            <option *ngFor="let preset of datasetPresets" [value]="preset.pointCount">
              {{ preset.name }}
            </option>
          </select>
        </div>

        <div class="control-group">
          <button (click)="runBenchmark()" [disabled]="isRunning" class="btn btn-primary">
            {{ isRunning ? 'Running...' : 'Run Benchmark' }}
          </button>
          <button (click)="clearResults()" class="btn btn-secondary">Clear Results</button>
        </div>
      </div>

      <div class="benchmark-progress" *ngIf="isRunning">
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progressPercentage"></div>
        </div>
        <p>{{ progressText }}</p>
      </div>

      <div class="charts-container" *ngIf="currentDataset">
        <div class="chart-item">
          <app-echarts-benchmark 
            #echartsComponent
            [dataset]="currentDataset"
            [height]="400">
          </app-echarts-benchmark>
        </div>
        <div class="chart-item">
          <app-lightweight-charts-benchmark 
            #lightweightChartsComponent
            [dataset]="currentDataset"
            [height]="400">
          </app-lightweight-charts-benchmark>
        </div>
        <div class="chart-item">
          <app-lightning-charts-benchmark 
            #lightningChartsComponent
            [dataset]="currentDataset"
            [height]="400">
          </app-lightning-charts-benchmark>
        </div>
        <div class="chart-item">
          <app-chartjs-benchmark 
            #chartjsComponent
            [dataset]="currentDataset"
            [height]="400">
          </app-chartjs-benchmark>
        </div>
        <div class="chart-item">
          <app-highcharts
            #highchartsComponent
            [data]="currentDataset.points || []"
            [height]="400"
            [title]="'Highcharts - ' + (currentDataset.name || '')">
          </app-highcharts>
        </div>

      </div>

      <div class="results-section" *ngIf="benchmarkResults.length > 0">
        <h2>Benchmark Results</h2>
        
        <div class="results-table">
          <table>
            <thead>
              <tr>
                <th>Chart Library</th>
                <th>Avg Init Time</th>
                <th>Avg Render Time</th>
                <th>Avg Update Time</th>
                <th>Performance Score</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let result of benchmarkResults; let i = index" 
                  [class.winner]="i === 0">
                <td>{{ result.chartLibrary }}</td>
                <td>{{ performanceService.formatTime(result.averageInitTime) }}</td>
                <td>{{ performanceService.formatTime(result.averageRenderTime) }}</td>
                <td>{{ performanceService.formatTime(result.averageUpdateTime) }}</td>
                <td>{{ getPerformanceScore(result) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="detailed-results">
          <h3>Detailed Metrics</h3>
          <div class="metrics-grid">
            <div *ngFor="let result of benchmarkResults" class="metric-card">
              <h4>{{ result.chartLibrary }}</h4>
              <div class="metric-list">
                <div *ngFor="let metric of result.metrics" class="metric-item">
                  <span class="metric-label">{{ metric.pointCount.toLocaleString() }} points:</span>
                  <span class="metric-value">{{ performanceService.formatTime(metric.renderTime) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 20px;
      background: #f5f5f5;
      min-height: 100vh;
    }

    .dashboard-header {
      text-align: center;
      margin-bottom: 30px;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .dashboard-header h1 {
      color: #333;
      margin: 0 0 10px 0;
    }

    .dashboard-header p {
      color: #666;
      margin: 0;
    }

    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 20px;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    @media (max-width: 768px) {
      .controls {
        flex-direction: column;
      }
    }

    .control-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .control-group label {
      font-weight: bold;
      color: #333;
    }

    select {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      transition: background-color 0.2s;
    }

    .btn-primary {
      background: #2196F3;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #1976D2;
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

    .benchmark-progress {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .progress-bar {
      width: 100%;
      height: 20px;
      background: #eee;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 10px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #2196F3, #21CBF3);
      transition: width 0.3s ease;
    }

    .charts-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr); /* 3 equal columns */
      gap: 15px;
      margin-bottom: 30px;
      width: 100%;
      box-sizing: border-box;
    }

    .chart-item {
      /* Each chart item takes full width of its grid cell */
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }

    /* Tablet view: 2 columns when container is too narrow for 3 equal columns */
    @media (max-width: 1400px) and (min-width: 800px) {
      .charts-container {
        grid-template-columns: repeat(2, 1fr); /* 2 equal columns */
        gap: 10px;
      }
    }

    /* Force 2-column layout when screen is too narrow for 3 equal columns */
    @media (max-width: 1320px) and (min-width: 800px) {
      .charts-container tr:first-child {
        display: table-row;
      }
      
      .charts-container tr:first-child td:nth-child(3) {
        display: none;
      }
      
      .charts-container tr:first-child td {
        width: 50%;
      }
      
      .charts-container tr:last-child td:nth-child(1) {
        width: 50%;
      }
      
      .charts-container tr:last-child td:nth-child(2),
      .charts-container tr:last-child td:nth-child(3) {
        width: 25%;
      }
    }

    /* Mobile view: single column */
    @media (max-width: 799px) {
      .charts-container {
        grid-template-columns: 1fr; /* Single column */
        gap: 20px;
      }
    }

    .results-section {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .results-section h2 {
      color: #333;
      margin: 0 0 20px 0;
    }

    .results-table {
      overflow-x: auto;
      margin-bottom: 30px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }

    th {
      background: #f8f9fa;
      font-weight: bold;
      color: #333;
    }

    .winner {
      background: #e8f5e8;
      font-weight: bold;
    }

    .detailed-results h3 {
      color: #333;
      margin: 0 0 20px 0;
    }

    .metrics-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      justify-content: space-between;
    }
    
    .metric-card {
      flex: 1 1 calc(50% - 20px);
      min-width: 300px;
      max-width: calc(50% - 10px);
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .metric-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #ddd;
    }

    .metric-card h4 {
      color: #333;
      margin: 0 0 15px 0;
    }

    .metric-item {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid #eee;
    }

    .metric-item:last-child {
      border-bottom: none;
    }

    .metric-label {
      color: #666;
    }

    .metric-value {
      font-weight: bold;
      color: #333;
    }
  `]
})
export class BenchmarkDashboardComponent implements OnInit {
  @ViewChild('echartsComponent') echartsComponent!: EchartsComponent;
  @ViewChild('lightweightChartsComponent') lightweightChartsComponent!: LightweightChartsComponent;
  @ViewChild('lightningChartsComponent') lightningChartsComponent!: LightningChartsComponent;
  @ViewChild('chartjsComponent') chartjsComponent!: ChartjsComponent;
  @ViewChild('highchartsComponent') highchartsComponent!: HighchartsComponent;


  datasetPresets = this.timeSeriesDataService.getPresetDatasets();
  selectedDatasetSize = 1000;
  currentDataset: BenchmarkDataset | null = null;
  benchmarkResults: BenchmarkResult[] = [];
  isRunning = false;
  progressPercentage = 0;
  progressText = '';

  constructor(
    private timeSeriesDataService: TimeSeriesDataService,
    public performanceService: PerformanceService
  ) {}

  ngOnInit(): void {
    this.onDatasetChange();
  }

  onDatasetChange(): void {
    this.currentDataset = this.timeSeriesDataService.generateTimeSeriesData(
      this.selectedDatasetSize,
      `Dataset (${this.selectedDatasetSize.toLocaleString()} points)`
    );
  }

  async runBenchmark(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.progressPercentage = 0;
    this.performanceService.clearResults();

    const testSizes = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000];
    const ITERATIONS_PER_SIZE = 3;
    const totalTests = testSizes.length * ITERATIONS_PER_SIZE;
    let testCount = 0;

    // For each size, run multiple iterations
    for (let i = 0; i < testSizes.length; i++) {
      const size = testSizes[i];
      const iterationResults: { [key: string]: number[] } = {};
      
      for (let iteration = 0; iteration < ITERATIONS_PER_SIZE; iteration++) {
        this.progressText = `Testing ${size.toLocaleString()} points (iteration ${iteration + 1}/${ITERATIONS_PER_SIZE})...`;
        this.progressPercentage = (testCount / totalTests) * 100;
        testCount++;

        // Generate test data
        const testDataset = this.timeSeriesDataService.generateTimeSeriesData(
          size,
          `Test Dataset (${size.toLocaleString()} points)`
        );

        // Small delay for UI updates
        await this.delay(100);

        // Test each chart component
        if (this.echartsComponent) {
          await this.echartsComponent.updateChart(testDataset);
          if (this.echartsComponent.lastMetrics) {
            if (!iterationResults['ECharts']) iterationResults['ECharts'] = [];
            iterationResults['ECharts'].push(this.echartsComponent.lastMetrics.renderTime);
          }
        }

        await this.delay(100);

        if (this.lightweightChartsComponent) {
          await this.lightweightChartsComponent.updateChart(testDataset);
          if (this.lightweightChartsComponent.lastMetrics) {
            if (!iterationResults['TradingView Lightweight Charts']) iterationResults['TradingView Lightweight Charts'] = [];
            iterationResults['TradingView Lightweight Charts'].push(this.lightweightChartsComponent.lastMetrics.renderTime);
          }
        }

        await this.delay(100);

        if (this.lightningChartsComponent) {
          await this.lightningChartsComponent.updateChart(testDataset);
          if (this.lightningChartsComponent.lastMetrics) {
            if (!iterationResults['LightningChart']) iterationResults['LightningChart'] = [];
            iterationResults['LightningChart'].push(this.lightningChartsComponent.lastMetrics.renderTime);
          }
        }

        await this.delay(100);

        if (this.chartjsComponent) {
          await this.chartjsComponent.updateChart(testDataset);
          if (this.chartjsComponent.lastMetrics) {
            if (!iterationResults['Chart.js']) iterationResults['Chart.js'] = [];
            iterationResults['Chart.js'].push(this.chartjsComponent.lastMetrics.renderTime);
          }
        }

        await this.delay(100);

        if (this.highchartsComponent) {
          this.highchartsComponent.updateData(testDataset.points);
          if (this.highchartsComponent.lastRenderTime > 0) {
            if (!iterationResults['Highcharts']) iterationResults['Highcharts'] = [];
            iterationResults['Highcharts'].push(this.highchartsComponent.lastRenderTime);
          }
        }

        await this.delay(100);
      }

      // Calculate and record averages for each chart library
      Object.entries(iterationResults).forEach(([library, times]) => {
        const avgRenderTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        const metrics = {
          chartLibrary: library,
          pointCount: size,
          renderTime: avgRenderTime,
          initTime: 0, // We're focusing on render time for the benchmark
          memoryUsage: this.performanceService.getMemoryUsage(),
          timestamp: Date.now(),
          individualRuns: times // Keep the individual runs for potential analysis
        };
        this.performanceService.recordMetrics(metrics);
      });
    }

    this.progressPercentage = 100;
    this.progressText = 'Benchmark completed!';
    
    // Get results
    this.benchmarkResults = this.performanceService.getResults();

    await this.delay(1000);
    this.isRunning = false;

    // Reset to original dataset
    if (this.currentDataset) {
      await this.updateAllCharts(this.currentDataset);
    }
  }

  clearResults(): void {
    this.performanceService.clearResults();
    this.benchmarkResults = [];
  }

  getPerformanceScore(result: BenchmarkResult): string {
    const totalTime = result.averageInitTime + result.averageRenderTime + result.averageUpdateTime;
    if (totalTime < 10) return 'Excellent';
    if (totalTime < 50) return 'Good';
    if (totalTime < 100) return 'Fair';
    return 'Poor';
  }

  private async updateAllCharts(dataset: BenchmarkDataset): Promise<void> {
    if (this.echartsComponent) {
      await this.echartsComponent.updateChart(dataset);
    }
    if (this.lightweightChartsComponent) {
      await this.lightweightChartsComponent.updateChart(dataset);
    }
    if (this.lightningChartsComponent) {
      await this.lightningChartsComponent.updateChart(dataset);
    }
    if (this.chartjsComponent) {
      await this.chartjsComponent.updateChart(dataset);
    }
    if (this.highchartsComponent) {
      this.highchartsComponent.updateData(dataset.points);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
