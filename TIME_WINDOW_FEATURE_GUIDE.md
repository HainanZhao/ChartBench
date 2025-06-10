# Time Window Feature Guide

## Overview

The time window feature allows you to focus on the most recent data in your charts by automatically showing only the last X minutes of data. This feature is implemented across all chart libraries in ChartBench and provides a consistent user experience regardless of which chart library you're using.

## How It Works

When enabled, the time window feature:

1. Automatically calculates the time range to display based on the `timeWindowMinutes` setting (default: 30 minutes)
2. Adjusts the chart's X-axis to show only data points within that time window
3. Updates the view when new data arrives to maintain the time window focus
4. Allows you to zoom/pan within that window for more detailed analysis
5. Provides a "Reset Zoom" button to return to the default time window view

## Supported Chart Libraries

The time window feature is implemented for all chart libraries in ChartBench:

- **Chart.js**: Uses the Chart.js zoom plugin with customized axis min/max values
- **ECharts**: Uses the built-in dataZoom component with axis min/max settings
- **D3.js**: Uses D3's zoom behavior with custom transform calculations
- **Highcharts**: Uses the Highcharts setExtremes method on the X-axis
- **LightningCharts**: Uses the setInterval method on the X-axis
- **Lightweight Charts**: Uses the timeScale().setVisibleRange method

## Usage

The time window feature is controlled by the `timeWindowMinutes` property, which can be set in the UI. This property determines how many minutes of the most recent data to display.

### Benefits

- **Improved performance**: By focusing on a subset of the data, charts can render more efficiently
- **Better visualization**: Focusing on recent data makes trends and patterns more visible
- **Consistent experience**: The same behavior is applied across all chart libraries

### User Controls

- **Time Window Size**: Adjust the number of minutes to display
- **Reset Zoom Button**: Return to the default time window view after zooming or panning
- **Zoom/Pan**: Use mouse wheel and drag to explore data within the window

## Implementation Details

Each chart library required specific implementation approaches:

- **Chart.js**: Implements the time window by setting the min/max values on the X-axis scale
- **ECharts**: Uses the setOption method to update the X-axis min/max values
- **D3.js**: Uses D3's zoom transform to apply the appropriate scale and translation
- **Highcharts**: Uses the setExtremes method on the X-axis to define the visible range
- **LightningCharts**: Sets the axis interval using the setInterval method
- **Lightweight Charts**: Sets the visible range using the timeScale().setVisibleRange method

## Streaming Updates

When new data arrives in streaming mode, the time window automatically shifts to maintain focus on the most recent data. This creates a sliding window effect that keeps your view centered on the newest information.

## Default Settings

By default, all charts show the last 30 minutes of data. You can adjust this setting based on your monitoring needs.
