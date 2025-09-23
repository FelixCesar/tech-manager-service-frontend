import { Routes } from '@angular/router';

import { Index } from './layout/index';
import { Dashboard } from './features/pages/dashboard/dashboard';
import { Settings } from './features/pages/settings/settings';
import { Filtro } from './features/pages/filtro/filtro';
import { Rangos } from './features/pages/rangos/rangos';

export const routes: Routes = [
  {
    path: '',
    component: Index,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'filtro', component: Filtro },
      { path: 'rango-prefijos', component: Rangos },
      { path: 'settings', component: Settings }
    ]
  }
];
