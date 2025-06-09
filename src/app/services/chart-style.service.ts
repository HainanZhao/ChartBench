import { Injectable } from '@angular/core';

export interface ChartStyleConfig {
  colors: {
    primary: string;
    background: string;
    text: string;
    grid: string;
    border: string;
  };
  dimensions: {
    padding: {
      left: number;
      right: number;
      top: number;
      bottom: number;
    };
    lineWidth: number;
  };
  formatting: {
    timeFormat: (date: Date) => string;
    valueFormat: (value: number) => string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChartStyleService {
  
  private readonly styleConfig: ChartStyleConfig = {
    colors: {
      primary: '#2196F3',
      background: '#ffffff',
      text: '#333333',
      grid: '#e1e1e1',
      border: '#cccccc'
    },
    dimensions: {
      padding: {
        left: 60,
        right: 20,
        top: 20,
        bottom: 40
      },
      lineWidth: 2
    },
    formatting: {
      timeFormat: (date: Date) => {
        // Consistent time formatting across all charts
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
      },
      valueFormat: (value: number) => {
        // Consistent value formatting with 2 decimal places
        return value.toFixed(2);
      }
    }
  };

  getStyleConfig(): ChartStyleConfig {
    return this.styleConfig;
  }

  formatTimeTooltip(timestamp: number): string {
    const date = new Date(timestamp);
    // More detailed tooltip format showing date and time
    const dateStr = date.toLocaleDateString();
    const timeStr = this.styleConfig.formatting.timeFormat(date);
    return `${dateStr} ${timeStr}`;
  }

  formatValueTooltip(value: number): string {
    return this.styleConfig.formatting.valueFormat(value);
  }

  getCommonChartWidth(): number {
    return 800; // Standard width for all charts
  }

  getCommonChartHeight(): number {
    return 400; // Standard height for all charts
  }
}
