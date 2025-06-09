import { Component } from '@angular/core';
import { BenchmarkDashboardComponent } from './components/benchmark-dashboard-simple.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BenchmarkDashboardComponent],
  template: '<app-benchmark-dashboard></app-benchmark-dashboard>',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Chart Performance Benchmark';
}
