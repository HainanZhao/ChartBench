import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BenchmarkDashboardComponent } from './benchmark-dashboard.component';
import { StreamingBenchmarkComponent } from './streaming-benchmark.component';

type TestType = 'static' | 'streaming';

@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BenchmarkDashboardComponent,
    StreamingBenchmarkComponent
  ],
  template: `
    <div class="main-dashboard">
      <div class="dashboard-header">
        <h1>Chart Performance Testing Suite</h1>
        <p>Comprehensive testing for chart library performance in different scenarios</p>
      </div>

      <div class="test-selector">
        <h3>Select Test Type</h3>
        <div class="test-options">
          <div class="test-option" 
               [class.active]="selectedTest === 'static'" 
               (click)="selectTest('static')">
            <div class="test-icon">📊</div>
            <h4>Static Data Benchmark</h4>
            <p>Test rendering performance with various static dataset sizes</p>
            <ul>
              <li>Multiple data size tests (1K - 100K points)</li>
              <li>Multiple iterations for accuracy</li>
              <li>Comprehensive performance comparison</li>
            </ul>
          </div>

          <div class="test-option" 
               [class.active]="selectedTest === 'streaming'" 
               (click)="selectTest('streaming')">
            <div class="test-icon">📈</div>
            <h4>Real-time Streaming Test</h4>
            <p>Simulate real-world stock market data streaming</p>
            <ul>
              <li>Start with baseline data (e.g., 25K points)</li>
              <li>Add points in real-time (e.g., 10 points/second)</li>
              <li>Monitor CPU usage and frame rates</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="test-content">
        <div *ngIf="selectedTest === 'static'" class="test-container">
          <app-benchmark-dashboard></app-benchmark-dashboard>
        </div>

        <div *ngIf="selectedTest === 'streaming'" class="test-container">
          <app-streaming-benchmark></app-streaming-benchmark>
        </div>
      </div>

      <div class="info-panel" *ngIf="!selectedTest">
        <h3>Welcome to Chart Performance Testing</h3>
        <p>This application allows you to test and compare the performance of different chart libraries:</p>
        
        <div class="library-list">
          <div class="library-item">
            <strong>ECharts</strong> - Powerful charting and visualization library
          </div>
          <div class="library-item">
            <strong>TradingView Lightweight Charts</strong> - High-performance financial charts
          </div>
          <div class="library-item">
            <strong>LightningChart</strong> - WebGL-accelerated charting for maximum performance
          </div>
          <div class="library-item">
            <strong>Chart.js</strong> - Simple yet flexible JavaScript charting
          </div>
          <div class="library-item">
            <strong>Highcharts</strong> - Feature-rich charting library for web applications
          </div>
        </div>

        <div class="features">
          <h4>Key Features:</h4>
          <ul>
            <li>📏 <strong>Multiple Test Types:</strong> Static benchmarks and real-time streaming</li>
            <li>⚡ <strong>Performance Metrics:</strong> Render time, CPU usage, memory consumption</li>
            <li>🔄 <strong>Multiple Iterations:</strong> Average results for statistical accuracy</li>
            <li>📊 <strong>Individual Chart Testing:</strong> Test specific libraries in isolation</li>
            <li>💾 <strong>Resource Monitoring:</strong> Track CPU and memory usage in real-time</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .main-dashboard {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .dashboard-header {
      text-align: center;
      color: white;
      margin-bottom: 40px;
    }

    .dashboard-header h1 {
      font-size: 2.5rem;
      margin: 0 0 10px 0;
      font-weight: 300;
    }

    .dashboard-header p {
      font-size: 1.1rem;
      opacity: 0.9;
      margin: 0;
    }

    .test-selector {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    }

    .test-selector h3 {
      margin: 0 0 25px 0;
      color: #333;
      text-align: center;
      font-size: 1.5rem;
    }

    .test-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 25px;
    }

    .test-option {
      border: 2px solid #e1e8ed;
      border-radius: 12px;
      padding: 25px;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #fafbfc;
    }

    .test-option:hover {
      border-color: #667eea;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
    }

    .test-option.active {
      border-color: #667eea;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }

    .test-icon {
      font-size: 3rem;
      text-align: center;
      margin-bottom: 15px;
    }

    .test-option h4 {
      margin: 0 0 10px 0;
      font-size: 1.3rem;
      text-align: center;
    }

    .test-option p {
      margin: 0 0 15px 0;
      text-align: center;
      opacity: 0.8;
    }

    .test-option.active p {
      opacity: 0.9;
    }

    .test-option ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .test-option li {
      padding: 5px 0;
      padding-left: 20px;
      position: relative;
      font-size: 0.9rem;
    }

    .test-option li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
    }

    .test-option.active li:before {
      color: white;
    }

    .test-content {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    }

    .test-container {
      background: #f5f5f5;
    }

    .info-panel {
      background: white;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    }

    .info-panel h3 {
      color: #333;
      margin: 0 0 20px 0;
      font-size: 1.8rem;
    }

    .info-panel p {
      color: #666;
      font-size: 1.1rem;
      margin-bottom: 30px;
      line-height: 1.6;
    }

    .library-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }

    .library-item {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
      text-align: left;
    }

    .library-item strong {
      color: #333;
      display: block;
      margin-bottom: 5px;
    }

    .features {
      background: #f8f9fa;
      padding: 25px;
      border-radius: 8px;
      text-align: left;
      max-width: 600px;
      margin: 0 auto;
    }

    .features h4 {
      color: #333;
      margin: 0 0 15px 0;
      text-align: center;
    }

    .features ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .features li {
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
    }

    .features li:last-child {
      border-bottom: none;
    }

    @media (max-width: 768px) {
      .main-dashboard {
        padding: 10px;
      }

      .dashboard-header h1 {
        font-size: 2rem;
      }

      .test-options {
        grid-template-columns: 1fr;
      }

      .test-option {
        padding: 20px;
      }

      .library-list {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MainDashboardComponent {
  selectedTest: TestType | null = null;

  selectTest(testType: TestType): void {
    this.selectedTest = testType;
  }
}
