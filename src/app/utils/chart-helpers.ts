/**
 * Helper functions for working with chart libraries
 */

/**
 * Safely validates and transforms time series data for charts
 * @param points Array of data points with time and value properties
 * @returns Cleaned and validated data array
 */
export function validateTimeSeriesData(points: Array<{time: number, value: number}>) {
  if (!points || points.length === 0) {
    console.warn('No data points provided');
    return [];
  }
  
  // Filter out any invalid points
  const validPoints = points.filter(point => 
    point && 
    typeof point.time === 'number' && 
    !isNaN(point.time) && 
    typeof point.value === 'number' && 
    !isNaN(point.value)
  );
  
  if (validPoints.length < points.length) {
    console.warn(`Removed ${points.length - validPoints.length} invalid data points`);
  }
  
  // Sort by time
  return validPoints.sort((a, b) => a.time - b.time);
}

/**
 * Safely formats time values for display
 * @param timestamp Timestamp in milliseconds
 * @returns Formatted time string
 */
export function formatTimeValue(timestamp: number): string {
  if (!timestamp || isNaN(timestamp)) {
    return 'Invalid time';
  }
  
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  } catch (e) {
    console.error('Error formatting time value:', e);
    return 'Error';
  }
}
