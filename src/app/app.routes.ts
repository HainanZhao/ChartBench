import { Routes } from '@angular/router';
import { MainDashboardComponent } from './components/main-dashboard.component';
import { BenchmarkDashboardComponent } from './components/benchmark-dashboard.component';
import { StreamingBenchmarkComponent } from './components/streaming-benchmark.component';

export const routes: Routes = [
  { path: '', component: MainDashboardComponent },
  { path: 'static-benchmark', component: BenchmarkDashboardComponent },
  { path: 'streaming-benchmark', component: StreamingBenchmarkComponent },
  { path: '**', redirectTo: '' }
];
