import { Injectable } from '@angular/core';

export interface TimeSeriesPoint {
  time: number;
  value: number;
}

export interface BenchmarkDataset {
  name: string;
  points: TimeSeriesPoint[];
  pointCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class TimeSeriesDataService {
  
  generateTimeSeriesData(pointCount: number, name: string = 'Dataset'): BenchmarkDataset {
    const points: TimeSeriesPoint[] = [];
    const startTime = Date.now() - (pointCount * 60000); // Start from pointCount minutes ago
    
    let lastValue = 100; // Starting value
    
    // Pre-allocate array for better performance with large datasets
    points.length = pointCount;
    
    // Optimize for large datasets
    const batchSize = pointCount > 100000 ? 10000 : pointCount;
    
    for (let i = 0; i < pointCount; i++) {
      const time = startTime + (i * 60000); // 1 minute intervals
      
      // Generate realistic stock-like data with random walk + trend
      const randomChange = (Math.random() - 0.5) * 2; // Random change between -1 and 1
      const trend = Math.sin(i / pointCount * Math.PI * 2) * 0.1; // Sine wave trend
      const volatility = Math.random() * 0.5; // Additional volatility
      
      lastValue = lastValue + randomChange + trend + volatility;
      
      // Ensure value doesn't go negative
      lastValue = Math.max(lastValue, 1);
      
      points[i] = {
        time,
        value: parseFloat(lastValue.toFixed(2))
      };
      
      // For very large datasets, provide progress feedback
      if (pointCount > 100000 && i % batchSize === 0) {
        // Allow the UI to update by yielding control occasionally
        if (i > 0) {
          console.log(`Generated ${i.toLocaleString()} / ${pointCount.toLocaleString()} data points (${Math.round(i/pointCount*100)}%)`);
        }
      }
    }
    
    console.log(`Generated dataset "${name}" with ${pointCount.toLocaleString()} points`);
    
    return {
      name,
      points,
      pointCount
    };
  }
  
  generateMultipleDatasets(datasets: number, pointsPerDataset: number): BenchmarkDataset[] {
    const result: BenchmarkDataset[] = [];
    
    for (let i = 0; i < datasets; i++) {
      result.push(this.generateTimeSeriesData(pointsPerDataset, `Dataset ${i + 1}`));
    }
    
    return result;
  }
  
  getPresetDatasets(): { name: string, pointCount: number }[] {
    return [
      { name: 'Small (1K points)', pointCount: 1000 },
      { name: 'Medium (10K points)', pointCount: 10000 },
      { name: 'Large (50K points)', pointCount: 50000 },
      { name: 'Extra Large (100K points)', pointCount: 100000 },
      { name: 'Massive (250K points)', pointCount: 250000 },
      { name: 'Extreme (500K points)', pointCount: 500000 },
      { name: 'Ultra (1M points)', pointCount: 1000000 }
    ];
  }
}
