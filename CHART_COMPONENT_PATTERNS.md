# Chart Component Patterns & Standards

## Overview
This document defines the standardized patterns and conventions used across all chart components in ChartBench. Follow these patterns when adding new chart libraries or modifying existing components.

## 🎨 Standard Component Structure

### Template Pattern
```html
<div class="chart-container">
  <h3>[Chart Library Name]</h3>
  
  <!-- Performance metrics display -->
  <div class="chart-info" *ngIf="lastMetrics">
    <span>Render Time: {{ performanceService.formatTime(lastMetrics.renderTime) }}</span>
    <span>Init Time: {{ performanceService.formatTime(lastMetrics.initTime) }}</span>
    <span *ngIf="lastMetrics.updateTime">Update Time: {{ performanceService.formatTime(lastMetrics.updateTime) }}</span>
  </div>
  
  <!-- Dataset information -->
  <div class="chart-title" *ngIf="dataset">
    {{ dataset.name }} ({{ dataset.pointCount.toLocaleString() }} points)
  </div>
  
  <!-- Chart canvas/container -->
  <div #chartContainer class="chart" [style.height.px]="height"></div>
  
  <!-- Zoom controls -->
  <div class="zoom-control">
    <button (click)="resetZoom()" class="reset-zoom-btn">Reset View</button>
    <button (click)="resetToFullView()" class="full-view-btn">View All</button>
  </div>
</div>
```

### Class Structure Pattern
```typescript
@Component({
  selector: 'app-[library-name]-benchmark',
  standalone: true,
  imports: [CommonModule],
  template: `/* Standard template */`,
  styles: [`/* Standard styles */`]
})
export class [LibraryName]Component implements OnInit, OnDestroy, OnChanges {
  // Standard inputs
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  @Input() dataset: BenchmarkDataset | null = null;
  @Input() height: number = 400;
  @Input() timeWindowMinutes: number = 30;
  
  // Private chart instance
  private chart: [ChartType] | null = null;
  
  // Public metrics
  lastMetrics: any = null;
  
  // Standard constructor
  constructor(
    public performanceService: PerformanceService,
    private chartStyleService: ChartStyleService
  ) {}

  // Lifecycle methods
  ngOnInit(): void { /* Initialize chart */ }
  ngOnDestroy(): void { /* Cleanup chart */ }
  ngOnChanges(changes: SimpleChanges): void { /* Handle input changes */ }

  // Required methods
  resetZoom(): void { /* Reset to time window */ }
  resetToFullView(): void { /* Show full dataset */ }
  renderChart(): void { /* Render chart */ }
  updateChart(newDataset: BenchmarkDataset): void { /* Update data */ }
  
  // Private helpers
  private applyTimeWindow(): void { /* Apply time constraints */ }
}
```

## 🎨 Standard CSS Styling

### Complete Style Template
```css
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
  display: flex;
  gap: 5px;
  flex-direction: column;
}

.reset-zoom-btn, .full-view-btn {
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  opacity: 0.8;
  white-space: nowrap;
}

.reset-zoom-btn:hover, .full-view-btn:hover {
  opacity: 1;
}

.full-view-btn {
  background-color: #4caf50; /* Green for "View All" */
}
```

## 🔧 Chart Library-Specific Implementations

### ECharts Implementation
```typescript
// Mouse wheel zoom
dataZoom: [{
  type: 'inside',
  zoomOnMouseWheel: true,
  moveOnMouseMove: true,
  moveOnMouseWheel: false
}]

// Reset methods
resetZoom(): void {
  this.applyTimeWindow(); // Uses dataZoom percentages
}

resetToFullView(): void {
  this.chart.setOption({
    dataZoom: [{ start: 0, end: 100 }, { start: 0, end: 100 }]
  });
}
```

### Highcharts Implementation
```typescript
// Mouse wheel zoom (custom handling)
zooming: {
  type: 'x',
  mouseWheel: { enabled: false }
},
events: {
  load: function() {
    // Custom wheel event handling with preventDefault
  }
}

// Reset methods
resetZoom(): void {
  this.applyTimeWindow(); // Uses xAxis.setExtremes()
}

resetToFullView(): void {
  const xAxis = this.chart.xAxis[0];
  xAxis.setExtremes(undefined, undefined);
}
```

### Chart.js Implementation
```typescript
// Mouse wheel zoom
plugins: {
  zoom: {
    zoom: { wheel: { enabled: true }, mode: 'x' }
  }
}

// Reset methods
resetZoom(): void {
  // Set time window constraints on xScale
  const xScale = this.chart.options.scales['x'];
  xScale.min = minTime;
  xScale.max = maxTime;
  this.chart.update('none');
}

resetToFullView(): void {
  // Remove time constraints
  const xScale = this.chart.options.scales['x'];
  delete xScale.min;
  delete xScale.max;
  this.chart.update('none');
}
```

### Lightweight Charts Implementation
```typescript
// Mouse wheel zoom (built-in)
// No additional configuration needed

// Reset methods
resetZoom(): void {
  this.applyTimeWindow(); // Uses timeScale().setVisibleRange()
}

resetToFullView(): void {
  this.chart.timeScale().fitContent();
}
```

### Lightning Charts Implementation
```typescript
// Mouse wheel zoom (built-in)
// Configured through axis scroll strategies

// Reset methods
resetZoom(): void {
  this.applyTimeWindow(); // Uses xAxis.setInterval()
}

resetToFullView(): void {
  if (this.xAxis && this.originalXRange) {
    this.xAxis.setInterval({
      start: this.originalXRange.min,
      end: this.originalXRange.max
    });
  }
}
```

### D3.js Implementation
```typescript
// Mouse wheel zoom setup
const zoom = d3.zoom()
  .scaleExtent([1, 10])
  .on('zoom', (event) => {
    // Handle zoom transform
  });
svg.call(zoom);

// Reset methods
resetZoom(): void {
  this.applyTimeWindow(); // Uses zoom transforms
}

resetToFullView(): void {
  this.svg.select('.zoom-rect')
    .transition()
    .duration(300)
    .call(this.zoom.transform, d3.zoomIdentity);
}
```

## 📊 Time Window Management Pattern

### Standard Implementation
```typescript
private applyTimeWindow(): void {
  if (!this.chart || !this.dataset || !this.dataset.points.length) {
    return;
  }
  
  const points = this.dataset.points;
  const lastTimestamp = points[points.length - 1].time;
  const firstTimestamp = points[0].time;
  
  // Calculate time window
  const timeWindowMs = this.timeWindowMinutes * 60 * 1000;
  const minTime = Math.max(lastTimestamp - timeWindowMs, firstTimestamp);
  
  // Apply constraints using library-specific method
  // ECharts: dataZoom percentages
  // Highcharts: xAxis.setExtremes(minTime, lastTimestamp)
  // Chart.js: scale.min/max properties
  // Lightweight: timeScale().setVisibleRange()
  // Lightning: xAxis.setInterval()
  // D3: zoom transforms
}
```

## 🎯 Button Behavior Standards

### Reset View Button (Blue)
- **Purpose**: Return to the configured time window view
- **Behavior**: Shows last N minutes of data (default: 30 minutes)
- **Implementation**: Calls `resetZoom()` method
- **Visual**: Blue background (#2196f3)

### View All Button (Green)
- **Purpose**: Show the complete dataset
- **Behavior**: Displays all data from first to last timestamp
- **Implementation**: Calls `resetToFullView()` method
- **Visual**: Green background (#4caf50)

## 🖱️ Mouse Wheel Zoom Standards

### Requirements
1. **Enable mouse wheel zooming** for all chart libraries
2. **Prevent page scrolling** when mouse is over chart
3. **Smooth zoom behavior** with appropriate sensitivity
4. **Horizontal zoom only** (time axis) for consistency
5. **Preserve zoom state** across data updates

### Implementation Checklist
- [ ] Mouse wheel zoom enabled
- [ ] Page scroll prevention implemented
- [ ] Zoom sensitivity configured appropriately
- [ ] Zoom limited to X-axis (time)
- [ ] Smooth zoom transitions
- [ ] Compatible with touch devices (where applicable)

## 📏 Performance Metrics Standards

### Required Metrics
1. **Render Time**: Initial chart rendering duration
2. **Init Time**: Chart library initialization time
3. **Update Time**: Data update operation duration
4. **Memory Usage**: Current memory consumption
5. **Point Count**: Number of data points displayed

### Display Format
```html
<div class="chart-info" *ngIf="lastMetrics">
  <span>Render Time: {{ performanceService.formatTime(lastMetrics.renderTime) }}</span>
  <span>Init Time: {{ performanceService.formatTime(lastMetrics.initTime) }}</span>
  <span *ngIf="lastMetrics.updateTime">Update Time: {{ performanceService.formatTime(lastMetrics.updateTime) }}</span>
</div>
```

## ✅ Component Checklist

When creating a new chart component, ensure:

### Structure
- [ ] Uses standard template structure
- [ ] Implements standard CSS styling
- [ ] Follows standard class structure
- [ ] Includes all required inputs and methods

### Functionality
- [ ] Mouse wheel zoom implemented
- [ ] Reset View button works (shows time window)
- [ ] View All button works (shows full dataset)
- [ ] Time window management functional
- [ ] Performance metrics tracked

### Integration
- [ ] Uses PerformanceService for metrics
- [ ] Uses ChartStyleService for styling
- [ ] Handles BenchmarkDataset input
- [ ] Implements OnInit, OnDestroy, OnChanges
- [ ] Proper error handling

### Quality
- [ ] TypeScript types properly defined
- [ ] No console errors or warnings
- [ ] Responsive design working
- [ ] Smooth animations and transitions
- [ ] Professional appearance and behavior

## 🚀 Adding New Chart Libraries

1. **Create component file**: `[library-name].component.ts`
2. **Copy standard template**: Use the template pattern above
3. **Implement chart library**: Add library-specific chart creation
4. **Configure mouse wheel**: Enable zoom with library's API
5. **Implement reset methods**: Both time window and full view
6. **Add performance tracking**: Initialize and render timings
7. **Test functionality**: Verify all features work correctly
8. **Update documentation**: Add to component matrix and guides

This pattern ensures consistency, maintainability, and professional user experience across all chart components in ChartBench.
