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
    
    // Multiple wave components for more realistic patterns
    const baseValue = 100;
    let cumulativeTrend = 0;
    
    // Wave parameters for different frequencies
    const waves = [
      { frequency: 0.02, amplitude: 15, phase: 0 },      // Primary trend
      { frequency: 0.08, amplitude: 8, phase: Math.PI/4 }, // Secondary wave
      { frequency: 0.15, amplitude: 4, phase: Math.PI/2 }, // Short-term fluctuation
      { frequency: 0.3, amplitude: 2, phase: Math.PI/3 }   // High-frequency noise
    ];
    
    // Pre-allocate array for better performance with large datasets
    points.length = pointCount;
    
    // Optimize for large datasets
    const batchSize = pointCount > 100000 ? 10000 : pointCount;
    
    for (let i = 0; i < pointCount; i++) {
      const time = startTime + (i * 60000); // 1 minute intervals
      const progress = i / pointCount; // 0 to 1
      
      // Generate complex wave pattern
      let waveValue = baseValue;
      
      // Add multiple sine waves for realistic market-like behavior
      waves.forEach(wave => {
        waveValue += wave.amplitude * Math.sin(
          (progress * Math.PI * 2 * wave.frequency * pointCount/1000) + wave.phase
        );
      });
      
      // Add some random walk behavior
      const randomWalk = (Math.random() - 0.5) * 3;
      cumulativeTrend += randomWalk * 0.1; // Accumulate trend
      waveValue += cumulativeTrend;
      
      // Add market-like volatility clusters
      const volatilityCluster = Math.sin(progress * Math.PI * 8) * 2;
      const marketNoise = (Math.random() - 0.5) * (2 + Math.abs(volatilityCluster));
      waveValue += marketNoise;
      
      // Add occasional "shocks" or spikes (like market events)
      if (Math.random() < 0.005) { // 0.5% chance of shock
        const shockMagnitude = (Math.random() - 0.5) * 20;
        waveValue += shockMagnitude;
      }
      
      // Ensure value stays in reasonable range
      waveValue = Math.max(waveValue, baseValue * 0.2); // Min 20% of base
      waveValue = Math.min(waveValue, baseValue * 3);   // Max 300% of base
      
      points[i] = {
        time,
        value: parseFloat(waveValue.toFixed(2))
      };
      
      // For very large datasets, provide progress feedback
      if (pointCount > 100000 && i % batchSize === 0) {
        // Allow the UI to update by yielding control occasionally
        if (i > 0) {
          console.log(`Generated ${i.toLocaleString()} / ${pointCount.toLocaleString()} data points (${Math.round(i/pointCount*100)}%)`);
        }
      }
    }
    
    console.log(`Generated wave-like dataset "${name}" with ${pointCount.toLocaleString()} points`);
    
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
