# Large Dataset Performance Testing Guide

## Overview

ChartBench now supports comprehensive performance testing with datasets ranging from 1K to 1M data points, including specialized testing for:

- **500K data points** - Extreme performance testing
- **1M data points** - Ultra-scale performance testing

## Available Dataset Sizes

| Dataset Size | Point Count | Use Case |
|--------------|-------------|----------|
| Small | 1K | Basic functionality testing |
| Medium | 10K | Standard performance testing |
| Large | 50K | Heavy load testing |
| Extra Large | 100K | High performance testing |
| **Massive** | **250K** | **Extreme load testing** |
| **Extreme** | **500K** | **Stress testing** |
| **Ultra** | **1M** | **Maximum scale testing** |

## Benchmark Test Sequence

The automated benchmark now tests all chart libraries with the following data sizes:
- 1K → 5K → 10K → 25K → 50K → 100K → 250K → **500K**

Each test measures:
- **Initialization Time** - Time to create the chart instance
- **Render Time** - Time to display the data
- **Update Time** - Time to refresh with new data
- **Memory Usage** - JavaScript heap memory consumption

## Performance Optimizations

### Data Generation
- Pre-allocated arrays for datasets > 100K points
- Progress logging for datasets > 100K points
- Optimized memory allocation patterns

### Benchmark Timing
- **Small datasets (< 50K)**: 200ms render delay
- **Medium datasets (50K-100K)**: 500ms render delay  
- **Large datasets (≥ 100K)**: 1000ms render delay

### Warning System
- Displays performance warnings for datasets ≥ 250K points
- Provides progress feedback during data generation
- Memory usage monitoring throughout testing

## Expected Performance Characteristics

### Memory Usage by Dataset Size
- **1K points**: ~1-2 MB
- **10K points**: ~5-10 MB
- **50K points**: ~20-50 MB
- **100K points**: ~40-100 MB
- **250K points**: ~100-250 MB
- **500K points**: ~200-500 MB
- **1M points**: ~400-1000 MB

### Render Times (Approximate)
Results vary by hardware and browser, but typical ranges:

| Library | 1K | 10K | 50K | 100K | 250K | 500K |
|---------|----|----|-----|------|------|------|
| LightningChart | <5ms | <20ms | <100ms | <200ms | <500ms | <1s |
| TradingView Lightweight | <10ms | <30ms | <150ms | <300ms | <750ms | <1.5s |
| ECharts | <15ms | <50ms | <250ms | <500ms | <1.2s | <2.5s |

## Browser Considerations

### Chrome/Edge
- Best performance for large datasets
- Excellent memory management
- Full memory.performance API support

### Firefox
- Good performance, slightly slower than Chrome
- Limited memory API support
- May show memory as 0 MB

### Safari
- Moderate performance with large datasets
- No memory.performance API support
- Memory reporting disabled

## Usage Tips

1. **Start Small**: Begin testing with smaller datasets before moving to 500K+
2. **Monitor Memory**: Watch memory usage in browser dev tools
3. **Be Patient**: Large dataset tests can take several minutes
4. **Close Other Tabs**: Reduce browser memory pressure
5. **Use Latest Browser**: Newer browsers have better performance

## Troubleshooting

### Performance Issues
- Reduce dataset size if browser becomes unresponsive
- Close other applications to free memory
- Use Chrome for best large dataset performance

### Memory Warnings
- Browser memory usage over 1GB may cause slowdowns
- Consider testing smaller datasets if system has limited RAM
- Refresh page between large dataset tests

## Test Results Interpretation

### Performance Scores
- **Excellent**: < 10ms total time
- **Good**: 10-50ms total time  
- **Fair**: 50-100ms total time
- **Poor**: > 100ms total time

### Memory Efficiency
Lower memory usage indicates better optimization for large datasets.

### Scalability
Compare how performance degrades as dataset size increases - better libraries maintain more linear performance scaling.
