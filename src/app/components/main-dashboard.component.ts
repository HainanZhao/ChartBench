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
        <div class="test-options-container">
          <div class="test-options">
            <div class="test-option" 
                [class.active]="selectedTest === 'static'" 
                (click)="selectTest('static')">
              <div class="test-header">
                <div class="test-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="36" height="36">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                  </svg>
                </div>
                <h4>Static Data Benchmark</h4>
              </div>
              <p>Test rendering performance with various static dataset sizes</p>
              <ul>
                <li>Multiple data size tests (1K - 200K points)</li>
                <li>Multiple iterations for accuracy</li>
                <li>Comprehensive performance comparison</li>
              </ul>
              <div class="cta-button">
                <span>Select</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                </svg>
              </div>
            </div>

            <div class="test-option" 
                [class.active]="selectedTest === 'streaming'" 
                (click)="selectTest('streaming')">
              <div class="test-header">
                <div class="test-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="36" height="36">
                    <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
                  </svg>
                </div>
                <h4>Real-time Streaming Test</h4>
              </div>
              <p>Simulate real-world stock market data streaming</p>
              <ul>
                <li>Start with baseline data (e.g., 25K points)</li>
                <li>Add points in real-time (e.g., 10 points/second)</li>
                <li>Monitor CPU usage and frame rates</li>
              </ul>
              <div class="cta-button">
                <span>Select</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                </svg>
              </div>
            </div>
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
        
        <div class="library-grid">
          <div class="library-card">
            <div class="library-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
              </svg>
            </div>
            <h5>ECharts</h5>
            <p>Powerful charting and visualization library</p>
          </div>
          <div class="library-card">
            <div class="library-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
              </svg>
            </div>
            <h5>Lightweight Charts</h5>
            <p>High-performance financial charts</p>
          </div>
          <div class="library-card">
            <div class="library-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
              </svg>
            </div>
            <h5>LightningChart</h5>
            <p>WebGL-accelerated charting for maximum performance</p>
          </div>
          <div class="library-card">
            <div class="library-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z"/>
              </svg>
            </div>
            <h5>Chart.js</h5>
            <p>Simple yet flexible JavaScript charting</p>
          </div>
          <div class="library-card">
            <div class="library-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
            </div>
            <h5>Highcharts</h5>
            <p>Feature-rich charting library for web applications</p>
          </div>
          <div class="library-card">
            <div class="library-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99l1.5 1.5z"/>
              </svg>
            </div>
            <h5>D3.js</h5>
            <p>Data-driven documents for powerful visualizations</p>
          </div>
        </div>

        <div class="features-section">
          <h4>Key Features</h4>
          <div class="features-grid">
            <div class="feature-item">
              <div class="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M4 9h4v11H4V9zm12 4h4v7h-4v-7zm-6-9h4v16h-4V4z"/>
                </svg>
              </div>
              <div class="feature-content">
                <strong>Multiple Test Types</strong>
                <p>Static benchmarks and real-time streaming</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.9v2.02c1.39-.17 2.74-.71 3.9-1.61l-1.44-1.44c-.75.54-1.59.89-2.46 1.03zm3.89-2.42l1.42 1.41c.9-1.16 1.45-2.5 1.62-3.89h-2.02c-.14.87-.48 1.72-1.02 2.48z"/>
                </svg>
              </div>
              <div class="feature-content">
                <strong>Performance Metrics</strong>
                <p>Render time, CPU usage, memory consumption</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z"/>
                </svg>
              </div>
              <div class="feature-content">
                <strong>Multiple Iterations</strong>
                <p>Average results for statistical accuracy</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M9 21H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2zm6 0h4c1.1 0 2-.9 2-2v-5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v5c0 1.1.9 2 2 2zm6-13V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2z"/>
                </svg>
              </div>
              <div class="feature-content">
                <strong>Individual Chart Testing</strong>
                <p>Test specific libraries in isolation</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M15 9H9v6h6V9zm-2 4h-2v-2h2v2zm8-2V9h-2V7c0-1.1-.9-2-2-2h-2V3h-2v2h-2V3H9v2H7c-1.1 0-2 .9-2 2v2H3v2h2v2H3v2h2v2c0 1.1.9 2 2 2h2v2h2v-2h2v2h2v-2h2c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2zm-4 6H7V7h10v10z"/>
                </svg>
              </div>
              <div class="feature-content">
                <strong>Resource Monitoring</strong>
                <p>Track CPU and memory usage in real-time</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-14h2v6h-2zm0 8h2v2h-2z"/>
                </svg>
              </div>
              <div class="feature-content">
                <strong>Compare Libraries</strong>
                <p>Side-by-side comparison of chart libraries</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Base styles */
    .main-dashboard {
      min-height: 100vh;
      background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%);
      padding: 10px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }

    .dashboard-header {
      text-align: center;
      color: white;
      margin-bottom: 40px;
      padding: 0 20px;
    }

    .dashboard-header h1 {
      font-size: 2.8rem;
      margin: 0 0 15px 0;
      font-weight: 700;
      letter-spacing: -0.5px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .dashboard-header p {
      font-size: 1.2rem;
      opacity: 0.9;
      margin: 0;
      font-weight: 300;
    }

    /* Test Selector - Modern Card Design */
    .test-selector {
      background: white;
      border-radius: 20px;
      padding: 25px;
      margin-bottom: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      max-width: 98%;
      margin: 0 auto 20px auto;
      width: 98%;
    }

    .test-selector h3 {
      margin: 0 0 30px 0;
      color: #1a202c;
      text-align: center;
      font-size: 1.8rem;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .test-options-container {
      max-width: 100%;
      margin: 0 auto;
    }

    .test-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 30px;
    }

    .test-option {
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      background: #f8fafc;
      position: relative;
      display: flex;
      flex-direction: column;
      min-height: 280px;
      overflow: hidden;
    }

    .test-option:hover {
      border-color: #4b6cb7;
      transform: translateY(-5px);
      box-shadow: 0 15px 35px rgba(66, 153, 225, 0.15);
    }

    .test-option::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #4b6cb7, #182848);
      opacity: 0;
      transition: opacity 0.3s ease;
      border-radius: 20px 20px 0 0;
    }

    .test-option:hover::before,
    .test-option.active::before {
      opacity: 1;
    }

    .test-option.active {
      border-color: #4b6cb7;
      background: #fff;
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(66, 153, 225, 0.2);
    }

    .test-header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }

    .test-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      margin-right: 15px;
      border-radius: 16px;
      background: rgba(66, 153, 225, 0.1);
      color: #4b6cb7;
      transition: all 0.3s ease;
    }

    .test-option:hover .test-icon,
    .test-option.active .test-icon {
      background: linear-gradient(135deg, #4b6cb7, #182848);
      color: white;
      transform: scale(1.05);
    }

    .test-option h4 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #2d3748;
      transition: color 0.3s ease;
    }

    .test-option:hover h4,
    .test-option.active h4 {
      color: #4b6cb7;
    }

    .test-option p {
      margin: 0 0 20px 0;
      color: #4a5568;
      font-size: 1.05rem;
      line-height: 1.6;
    }

    .test-option ul {
      list-style: none;
      padding: 0;
      margin: 0 0 20px 0;
      flex-grow: 1;
    }

    .test-option li {
      padding: 6px 0 6px 32px;
      position: relative;
      font-size: 0.9rem;
      line-height: 1.4;
      color: #4a5568;
    }

    .test-option li:before {
      content: "";
      position: absolute;
      left: 0;
      top: 10px;
      width: 20px;
      height: 20px;
      background-color: #4b6cb7;
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234b6cb7'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E");
      mask-size: contain;
      mask-repeat: no-repeat;
      mask-position: center;
      transition: background-color 0.3s ease;
    }

    .test-option:hover li:before,
    .test-option.active li:before {
      background-color: #4299e1;
    }

    .cta-button {
      background: rgba(66, 153, 225, 0.1);
      color: #4b6cb7;
      padding: 12px 18px;
      border-radius: 12px;
      font-weight: 600;
      text-align: center;
      transition: all 0.3s ease;
      margin-top: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .test-option:hover .cta-button {
      background: linear-gradient(135deg, #4b6cb7, #182848);
      color: white;
      transform: translateY(-2px);
    }
    
    .test-option.active .cta-button {
      background: linear-gradient(135deg, #4b6cb7, #182848);
      color: white;
    }

    /* Test Content */
    .test-content {
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      max-width: 98%;
      width: 98%;
      margin: 0 auto;
    }

    .test-container {
      background: #f8fafc;
    }

    /* Info Panel - Modern Card Grid Design */
    .info-panel {
      background: white;
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      max-width: 98%;
      width: 98%;
      margin: 0 auto;
    }

    .info-panel h3 {
      color: #1a202c;
      margin: 0 0 20px 0;
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      text-align: center;
    }

    .info-panel p {
      color: #4a5568;
      font-size: 1.1rem;
      margin-bottom: 40px;
      line-height: 1.6;
      text-align: center;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }

    /* Library Cards Grid */
    .library-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 15px;
      margin-bottom: 50px;
    }

    .library-card {
      background: #f8fafc;
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      transition: all 0.3s ease;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .library-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(66, 153, 225, 0.1);
      border-color: #4b6cb7;
    }

    .library-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(66, 153, 225, 0.1);
      margin: 0 auto 15px auto;
      color: #4b6cb7;
      transition: all 0.3s ease;
    }

    .library-card:hover .library-icon {
      background: linear-gradient(135deg, #4b6cb7, #182848);
      color: white;
      transform: scale(1.1);
    }

    .library-card h5 {
      margin: 0 0 10px 0;
      font-size: 1.2rem;
      font-weight: 600;
      color: #2d3748;
    }

    .library-card p {
      margin: 0;
      font-size: 0.9rem;
      color: #4a5568;
      line-height: 1.4;
    }

    /* Features Section */
    .features-section {
      background: #f8fafc;
      border-radius: 16px;
      padding: 30px;
    }

    .features-section h4 {
      font-size: 1.5rem;
      color: #1a202c;
      margin: 0 0 25px 0;
      font-weight: 700;
      text-align: center;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      max-width: 100%;
    }

    .feature-item {
      display: flex;
      align-items: flex-start;
      padding: 20px;
      border-radius: 12px;
      background: white;
      transition: all 0.3s ease;
      border: 1px solid #e2e8f0;
    }

    .feature-item:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.05);
      border-color: #4b6cb7;
    }

    .feature-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(66, 153, 225, 0.1);
      margin-right: 15px;
      color: #4b6cb7;
    }

    .feature-item:hover .feature-icon {
      background: linear-gradient(135deg, #4b6cb7, #182848);
      color: white;
    }

    .feature-content {
      flex-grow: 1;
    }

    .feature-content strong {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #2d3748;
      font-size: 1.1rem;
    }

    .feature-content p {
      margin: 0;
      font-size: 0.95rem;
      color: #4a5568;
      line-height: 1.5;
      text-align: left;
    }

    /* Responsive adjustments */
    @media (max-width: 1600px) {
      .features-grid {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
    }
    
    @media (max-width: 1200px) {
      .test-options {
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      }
      
      .features-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      }
      
      .library-grid {
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      }
    }
    
    @media (max-width: 768px) {
      .main-dashboard {
        padding: 15px;
      }

      .dashboard-header h1 {
        font-size: 2.2rem;
      }

      .test-selector, .info-panel {
        padding: 25px;
      }

      .test-option {
        padding: 25px;
      }

      .library-grid {
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 15px;
      }
      
      .library-card {
        padding: 15px;
      }
      
      .library-icon {
        width: 50px;
        height: 50px;
      }
      
      .features-section {
        padding: 20px;
      }
    }
    
    @media (max-width: 480px) {
      .dashboard-header h1 {
        font-size: 1.8rem;
      }
      
      .dashboard-header p {
        font-size: 1rem;
      }
      
      .test-option h4 {
        font-size: 1.3rem;
      }
      
      .library-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class MainDashboardComponent {
  selectedTest: TestType | null = null;

  selectTest(test: TestType): void {
    this.selectedTest = test;
    
    // Scroll to the test content
    setTimeout(() => {
      const testContent = document.querySelector('.test-content');
      if (testContent) {
        testContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
}
