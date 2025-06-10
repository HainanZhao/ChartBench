import { Component, ElementRef, Input, OnDestroy, OnInit, OnChanges, SimpleChanges, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { BenchmarkDataset } from '../services/time-series-data.service';
import { PerformanceService } from '../services/performance.service';
import { ChartStyleService } from '../services/chart-style.service';

@Component({
  selector: 'app-d3-benchmark',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <h3>D3.js</h3>
      <div class="chart-info" *ngIf="lastMetrics">
        <span>Render Time: {{ performanceService.formatTime(lastMetrics.renderTime) }}</span>
        <span>Init Time: {{ performanceService.formatTime(lastMetrics.initTime) }}</span>
        <span *ngIf="lastMetrics.updateTime">Update Time: {{ performanceService.formatTime(lastMetrics.updateTime) }}</span>
      </div>
      <div class="chart-title" *ngIf="dataset">
        {{ dataset.name }} ({{ dataset.pointCount.toLocaleString() }} points)
      </div>
      <div #chartContainer class="chart" [style.height.px]="height"></div>
      <div class="zoom-control">
        <button (click)="resetZoom()" class="reset-zoom-btn">Reset View</button>
        <button (click)="resetToFullView()" class="full-view-btn">View All</button>
      </div>
    </div>
  `,
  styles: [`
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
      background-color: #4caf50;
    }
  `]
})
export class D3ChartComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  @Input() dataset: BenchmarkDataset | null = null;
  @Input() height: number = 400;
  @Input() timeWindowMinutes: number = 10; // Default to 10 minutes

  private svg: any = null;
  private xScale: any = null;
  private yScale: any = null;
  private xAxis: any = null;
  private yAxis: any = null;
  private line: any = null;
  private brush: any = null;
  private zoom: any = null;
  private originalXDomain: [number, number] | null = null;
  private originalYDomain: [number, number] | null = null;
  lastMetrics: any = null;
  
  constructor(
    public performanceService: PerformanceService,
    private chartStyleService: ChartStyleService
  ) {}
  
  ngOnInit(): void {
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initChart();
    }, 100);
  }
  
  ngOnDestroy(): void {
    if (this.svg) {
      // Remove the SVG from the DOM
      d3.select(this.chartContainer.nativeElement).selectAll('*').remove();
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataset'] && this.svg && this.dataset) {
      this.renderChart();
    }
    
    if (changes['timeWindowMinutes'] && this.svg && this.dataset) {
      // Apply the new time window
      this.applyTimeWindow();
    }
  }
  
  private initChart(): void {
    if (!this.chartContainer?.nativeElement) {
      console.error('D3: Chart container not available');
      return;
    }

    const initStartTime = this.performanceService.startTimer();
    const container = this.chartContainer.nativeElement;
    
    // Set container height to match input
    container.style.height = `${this.height}px`;
    
    // Clear any existing SVG
    d3.select(container).selectAll('*').remove();
    
    // Get container dimensions
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const styleConfig = this.chartStyleService.getStyleConfig();
    const margin = {
      top: styleConfig.dimensions.padding.top,
      right: styleConfig.dimensions.padding.right,
      bottom: styleConfig.dimensions.padding.bottom,
      left: styleConfig.dimensions.padding.left
    };
    
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;
    
    // Create SVG element
    this.svg = d3.select(container)
      .append('svg')
        .attr('width', containerWidth)
        .attr('height', containerHeight)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create clip path to prevent drawing outside chart area
    this.svg.append('defs').append('clipPath')
      .attr('id', 'd3-chart-clip')
      .append('rect')
        .attr('width', width)
        .attr('height', height);
    
    // Create scales
    this.xScale = d3.scaleTime()
      .range([0, width]);
      
    this.yScale = d3.scaleLinear()
      .range([height, 0]);
    
    // Create axes
    this.xAxis = this.svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .style('color', styleConfig.colors.text);
      
    this.yAxis = this.svg.append('g')
      .attr('class', 'y-axis')
      .style('color', styleConfig.colors.text);
    
    // Create grid lines
    this.svg.append('g')
      .attr('class', 'grid x-grid')
      .attr('transform', `translate(0,${height})`)
      .style('stroke', styleConfig.colors.grid)
      .style('stroke-opacity', 0.1);
      
    this.svg.append('g')
      .attr('class', 'grid y-grid')
      .style('stroke', styleConfig.colors.grid)
      .style('stroke-opacity', 0.1);
    
    // Create line generator
    this.line = d3.line<any>()
      .x(d => this.xScale(d.time))
      .y(d => this.yScale(d.value))
      .curve(d3.curveLinear);
    
    // Create a chart group for the line path that will be clipped
    this.svg.append('g')
      .attr('class', 'chart-group')
      .attr('clip-path', 'url(#d3-chart-clip)');
    
    // Set up zoom behavior
    this.zoom = d3.zoom()
      .scaleExtent([1, 32])
      .extent([[0, 0], [width, height]])
      .translateExtent([[0, -Infinity], [width, Infinity]])
      .on('zoom', (event) => {
        // Update the x-scale
        const newXScale = event.transform.rescaleX(this.xScale);
        
        // Update the x-axis with the new scale
        this.xAxis.call(
          d3.axisBottom(newXScale)
            .tickFormat((d: any) => styleConfig.formatting.timeFormat(new Date(d)))
        );
        
        // Update x-grid
        this.svg.select('.x-grid')
          .call(
            d3.axisBottom(newXScale)
              .tickSize(-this.yScale.range()[0])
              .tickFormat(() => '')
          );
        
        // Update the line path with the new scale
        this.svg.select('.line-path')
          .attr('d', d3.line<any>()
            .x(d => newXScale(d.time))
            .y(d => this.yScale(d.value))
            .curve(d3.curveLinear)
          );
      });
    
    // Add zoom rectangle
    this.svg.append('rect')
      .attr('class', 'zoom-rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .call(this.zoom);
    
    const initTime = this.performanceService.endTimer(initStartTime);
    
    if (this.dataset) {
      this.renderChart();
      // Update metrics with init time
      if (this.lastMetrics) {
        this.lastMetrics.initTime = initTime;
      }
    }
  }
  
  renderChart(): void {
    if (!this.svg || !this.dataset) {
      return;
    }
    
    const renderStartTime = this.performanceService.startTimer();
    const styleConfig = this.chartStyleService.getStyleConfig();
    
    // Get the data points
    const data = this.dataset.points;
    
    // Update scales domains
    const xExtent = d3.extent(data, d => d.time) as [number, number];
    this.xScale.domain(xExtent);
    this.originalXDomain = [...xExtent]; // Store original domain for reset
    
    const yMin = d3.min(data, d => d.value) as number * 0.95;
    const yMax = d3.max(data, d => d.value) as number * 1.05;
    const yExtent: [number, number] = [yMin, yMax];
    
    this.yScale.domain(yExtent);
    this.originalYDomain = [...yExtent]; // Store original Y domain for reset
    
    // Format the time for the x-axis
    const formatTime = (time: Date) => {
      return styleConfig.formatting.timeFormat(time);
    };
    
    // Update x-axis
    this.xAxis.call(
      d3.axisBottom(this.xScale)
        .tickFormat((d: any) => formatTime(new Date(d)))
    );
    
    // Update y-axis
    this.yAxis.call(d3.axisLeft(this.yScale));
    
    // Update grid lines
    this.svg.select('.x-grid')
      .call(
        d3.axisBottom(this.xScale)
          .tickSize(-this.yScale.range()[0])
          .tickFormat(() => '')
      );
      
    this.svg.select('.y-grid')
      .call(
        d3.axisLeft(this.yScale)
          .tickSize(-this.xScale.range()[1])
          .tickFormat(() => '')
      );
    
    // Update line path - add to the clipped group
    const chartGroup = this.svg.select('.chart-group');
    const linePath = chartGroup.selectAll('.line-path')
      .data([data]);
    
    linePath.enter()
      .append('path')
        .attr('class', 'line-path')
        .merge(linePath)
        .attr('d', this.line)
        .attr('fill', 'none')
        .attr('stroke', styleConfig.colors.primary)
        .attr('stroke-width', styleConfig.dimensions.lineWidth);
    
    linePath.exit().remove();
    
    // Set up tooltip
    const tooltip = d3.select(this.chartContainer.nativeElement)
      .selectAll('.tooltip')
      .data([null]);
      
    const tooltipEnter = tooltip.enter()
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background', 'rgba(0, 0, 0, 0.7)')
      .style('color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('opacity', 0);
    
    const tooltipMerge = tooltipEnter.merge(tooltip as any);
    
    // Handle tooltip on the zoom rect
    this.svg.select('.zoom-rect')
      .on('mousemove', (event: MouseEvent) => {
        const mouseX = d3.pointer(event, this.svg.node())[0];
        const x0 = this.xScale.invert(mouseX);
        
        // Find closest data point
        const bisect = d3.bisector((d: any) => d.time).left;
        const index = bisect(data, x0);
        const d0 = data[Math.max(0, index - 1)];
        const d1 = data[Math.min(data.length - 1, index)];
        const point = x0 - d0.time > d1.time - x0 ? d1 : d0;
        
        // Position and show tooltip
        tooltipMerge
          .style('opacity', 1)
          .style('left', `${event.offsetX + 10}px`)
          .style('top', `${event.offsetY - 10}px`)
          .html(`
            Time: ${this.chartStyleService.formatTimeTooltip(point.time)}<br/>
            Value: ${this.chartStyleService.formatValueTooltip(point.value)}
          `);
          
        // Highlight point
        this.svg.selectAll('.highlight-point').remove();
        this.svg.append('circle')
          .attr('class', 'highlight-point')
          .attr('cx', this.xScale(point.time))
          .attr('cy', this.yScale(point.value))
          .attr('r', 4)
          .attr('fill', styleConfig.colors.primary)
          .attr('stroke', 'white')
          .attr('stroke-width', 2);
      })
      .on('mouseleave', () => {
        tooltipMerge.style('opacity', 0);
        this.svg.selectAll('.highlight-point').remove();
      });
    
    // Apply time window after initial render
    this.applyTimeWindow();
    
    const renderTime = this.performanceService.endTimer(renderStartTime);
    
    // Record performance metrics
    this.lastMetrics = {
      chartLibrary: 'D3.js',
      pointCount: this.dataset.pointCount,
      renderTime,
      initTime: 0, // Will be set by initChart if available
      memoryUsage: this.performanceService.getMemoryUsage(),
      timestamp: Date.now()
    };
    
    this.performanceService.recordMetrics(this.lastMetrics);
  }
  
  // Apply the time window to show only the last X minutes of data
  private applyTimeWindow(): void {
    if (!this.svg || !this.dataset || !this.dataset.points.length || !this.zoom) {
      return;
    }
    
    // Get the data points
    const data = this.dataset.points;
    const lastTimestamp = data[data.length - 1].time;
    const firstTimestamp = data[0].time;
    
    // Calculate the time window
    const timeWindowMs = this.timeWindowMinutes * 60 * 1000;
    const minTime = Math.max(lastTimestamp - timeWindowMs, firstTimestamp);
    
    // Filter data to only points visible in the time window
    const visibleData = data.filter(d => d.time >= minTime && d.time <= lastTimestamp);
    
    // Calculate Y-axis range for visible data
    if (visibleData.length > 0) {
      const yMin = d3.min(visibleData, d => d.value) as number;
      const yMax = d3.max(visibleData, d => d.value) as number;
      
      // Add 5% padding to Y-axis range
      const yRange = yMax - yMin;
      const padding = yRange * 0.05;
      
      // Update Y scale domain to focus on visible data
      this.yScale.domain([yMin - padding, yMax + padding]);
      
      // Update the Y axis
      this.yAxis.call(d3.axisLeft(this.yScale));
      
      // Update grid lines
      this.svg.select('.y-grid')
        .call(
          d3.axisLeft(this.yScale)
            .tickSize(-this.xScale.range()[1])
            .tickFormat(() => '')
        );
      
      // Update the line path with new Y scale
      if (this.line) {
        this.svg.select('.line')
          .datum(this.dataset.points)
          .attr('d', this.line);
      }
    }
    
    // Calculate the transform to apply to zoom to the time window
    const width = this.xScale.range()[1] - this.xScale.range()[0];
    
    // Calculate the scale factor
    const fullTimeRange = this.originalXDomain![1] - this.originalXDomain![0];
    const windowTimeRange = lastTimestamp - minTime;
    const scale = fullTimeRange / windowTimeRange;
    
    // Calculate the translation to center the window
    const minX = this.xScale(minTime);
    const translateX = -minX * scale;
    
    // Create the transform
    const transform = d3.zoomIdentity
      .scale(scale)
      .translate(translateX / scale, 0);
    
    // Apply the transform to zoom the chart
    this.svg.select('.zoom-rect')
      .call(this.zoom.transform, transform);
  }
  
  // Reset zoom to the time window view
  resetZoom(): void {
    if (this.svg && this.zoom) {
      this.applyTimeWindow();
    }
  }

  resetToFullView(): void {
    if (this.svg && this.zoom && this.originalYDomain) {
      // Reset Y scale to original domain
      this.yScale.domain(this.originalYDomain);
      
      // Update the Y axis
      this.yAxis.call(d3.axisLeft(this.yScale));
      
      // Update grid lines
      this.svg.select('.y-grid')
        .call(
          d3.axisLeft(this.yScale)
            .tickSize(-this.xScale.range()[1])
            .tickFormat(() => '')
        );
      
      // Update the line path with original Y scale
      if (this.line && this.dataset) {
        this.svg.select('.line')
          .datum(this.dataset.points)
          .attr('d', this.line);
      }
      
      // Reset to show all data (full dataset)
      // Apply identity transform to show the complete original domain
      this.svg.select('.zoom-rect')
        .transition()
        .duration(300)
        .call(this.zoom.transform, d3.zoomIdentity);
    }
  }
  
  updateChart(newDataset: BenchmarkDataset): void {
    this.dataset = newDataset;
    if (this.svg) {
      const updateStartTime = this.performanceService.startTimer();
      this.renderChart();
      const updateTime = this.performanceService.endTimer(updateStartTime);
      
      if (this.lastMetrics) {
        this.lastMetrics.updateTime = updateTime;
      }
    }
  }

  addPoint(point: { time: number, value: number }, redraw: boolean = true): void {
    if (!this.svg || !this.dataset) {
      return;
    }

    const startTime = this.performanceService.startTimer();
    
    // Add point to dataset
    this.dataset.points.push(point);
    this.dataset.pointCount = this.dataset.points.length;
    
    // For D3, incremental updates are complex, so we'll do a full re-render
    // This could be optimized further with more complex D3 data binding
    this.renderChart();
    
    const endTime = this.performanceService.endTimer(startTime);
    
    // Update metrics with single point addition time
    if (this.lastMetrics) {
      this.lastMetrics.updateTime = endTime;
    }
  }
}
