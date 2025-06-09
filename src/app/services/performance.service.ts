import { Injectable } from '@angular/core';

export interface PerformanceMetrics {
  chartLibrary: string;
  pointCount: number;
  renderTime: number;
  initTime: number;
  updateTime?: number;
  memoryUsage?: number;
  timestamp: number;
  individualRuns?: number[]; // Store individual run times for calculating variance
}

export interface BenchmarkResult {
  chartLibrary: string;
  metrics: PerformanceMetrics[];
  averageRenderTime: number;
  averageInitTime: number;
  averageUpdateTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private results: Map<string, PerformanceMetrics[]> = new Map();
  
  startTimer(): number {
    return performance.now();
  }
  
  endTimer(startTime: number): number {
    return performance.now() - startTime;
  }
  
  recordMetrics(metrics: PerformanceMetrics): void {
    const libraryResults = this.results.get(metrics.chartLibrary) || [];
    libraryResults.push(metrics);
    this.results.set(metrics.chartLibrary, libraryResults);
  }
  
  getResults(): BenchmarkResult[] {
    const results: BenchmarkResult[] = [];
    
    this.results.forEach((metrics, chartLibrary) => {
      const renderTimes = metrics.map(m => m.renderTime);
      const initTimes = metrics.map(m => m.initTime);
      const updateTimes = metrics.filter(m => m.updateTime !== undefined).map(m => m.updateTime!);
      
      // Group metrics by point count to calculate proper averages
      const metricsByPointCount = new Map<number, PerformanceMetrics[]>();
      metrics.forEach(m => {
        const existing = metricsByPointCount.get(m.pointCount) || [];
        existing.push(m);
        metricsByPointCount.set(m.pointCount, existing);
      });

      // Calculate averages for each point count
      const processedMetrics: PerformanceMetrics[] = [];
      metricsByPointCount.forEach((pointMetrics, pointCount) => {
        const avgRenderTime = Math.round(pointMetrics.reduce((sum, m) => sum + m.renderTime, 0) / pointMetrics.length);
        const avgInitTime = Math.round(pointMetrics.reduce((sum, m) => sum + m.initTime, 0) / pointMetrics.length);
        const runs = pointMetrics.map(m => m.renderTime);
        
        processedMetrics.push({
          chartLibrary,
          pointCount,
          renderTime: avgRenderTime,
          initTime: avgInitTime,
          timestamp: Date.now(),
          individualRuns: runs
        });
      });

      results.push({
        chartLibrary,
        metrics: processedMetrics,
        averageRenderTime: this.calculateAverage(renderTimes),
        averageInitTime: this.calculateAverage(initTimes),
        averageUpdateTime: this.calculateAverage(updateTimes)
      });
    });
    
    return results.sort((a, b) => a.averageRenderTime - b.averageRenderTime);
  }
  
  clearResults(): void {
    this.results.clear();
  }
  
  getMemoryUsage(): number {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      return memInfo.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }
    return 0;
  }
  
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }
  
  formatTime(milliseconds: number): string {
    if (milliseconds < 1) {
      return `${(milliseconds * 1000).toFixed(1)}μs`;
    } else if (milliseconds < 1000) {
      return `${milliseconds.toFixed(1)}ms`;
    } else {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    }
  }
  
  formatMemory(megabytes: number): string {
    if (megabytes < 1) {
      return `${(megabytes * 1024).toFixed(1)}KB`;
    } else if (megabytes < 1024) {
      return `${megabytes.toFixed(1)}MB`;
    } else {
      return `${(megabytes / 1024).toFixed(1)}GB`;
    }
  }
}
