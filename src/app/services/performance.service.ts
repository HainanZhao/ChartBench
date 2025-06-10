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
  
  // CPU monitoring utilities
  private frameTimings: number[] = [];
  private cpuUsageHistory: number[] = [];

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
  
  // CPU monitoring methods
  startCPUMonitoring(): void {
    this.frameTimings = [];
    this.cpuUsageHistory = [];
  }

  recordFrameTime(frameTime: number): void {
    this.frameTimings.push(frameTime);
    
    // Keep only last 60 frames for CPU calculation
    if (this.frameTimings.length > 60) {
      this.frameTimings = this.frameTimings.slice(-60);
    }
    
    // Calculate CPU usage based on frame times
    // Higher frame times indicate higher CPU usage
    const avgFrameTime = this.frameTimings.reduce((a, b) => a + b, 0) / this.frameTimings.length;
    const cpuUsage = Math.min(100, (avgFrameTime / 16.67) * 100); // 16.67ms = 60 FPS
    this.cpuUsageHistory.push(cpuUsage);
    
    if (this.cpuUsageHistory.length > 100) {
      this.cpuUsageHistory = this.cpuUsageHistory.slice(-100);
    }
  }

  getCurrentCPUUsage(): number {
    if (this.cpuUsageHistory.length === 0) return 0;
    return this.cpuUsageHistory[this.cpuUsageHistory.length - 1];
  }

  getAverageCPUUsage(): number {
    if (this.cpuUsageHistory.length === 0) return 0;
    return this.cpuUsageHistory.reduce((a, b) => a + b, 0) / this.cpuUsageHistory.length;
  }

  // Enhanced memory monitoring
  getDetailedMemoryInfo(): any {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      return {
        used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024),
        percentage: Math.round((memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100)
      };
    }
    return { used: 0, total: 0, limit: 0, percentage: 0 };
  }

  // Performance profiling
  profileRenderingPerformance(renderFunction: () => Promise<void>): Promise<{
    renderTime: number;
    frameTime: number;
    memoryDelta: number;
  }> {
    return new Promise(async (resolve) => {
      const startMemory = this.getMemoryUsage();
      const startTime = performance.now();
      
      // Record frame start
      const frameStart = performance.now();
      
      await renderFunction();
      
      // Wait for next frame to ensure rendering is complete
      requestAnimationFrame(() => {
        const endTime = performance.now();
        const frameTime = endTime - frameStart;
        const renderTime = endTime - startTime;
        const endMemory = this.getMemoryUsage();
        
        this.recordFrameTime(frameTime);
        
        resolve({
          renderTime,
          frameTime,
          memoryDelta: endMemory - startMemory
        });
      });
    });
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
