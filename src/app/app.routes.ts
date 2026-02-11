import { Routes } from '@angular/router';
import { TunerComponent } from './tuner/tuner.component';

export const routes: Routes = [
  { path: '', redirectTo: '/tuner', pathMatch: 'full' },
  { path: 'tuner', component: TunerComponent },
];
