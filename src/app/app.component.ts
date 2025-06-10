import { Component } from '@angular/core';
import { MainDashboardComponent } from './components/main-dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MainDashboardComponent],
  template: '<app-main-dashboard></app-main-dashboard>',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Chart Performance Benchmark';
}
