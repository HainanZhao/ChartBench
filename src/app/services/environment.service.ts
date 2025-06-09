import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  // Add your LightningChart license key here
  public readonly lightningChartLicense: string = '';
  
  public readonly production: boolean = false;
  
  hasLightningChartLicense(): boolean {
    return this.lightningChartLicense.length > 0;
  }
}
