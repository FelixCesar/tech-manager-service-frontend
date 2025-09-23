import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';

@Component({
  selector: 'app-left-sidebar',
  imports: [RouterModule, CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './left-sidebar.html',
  styleUrl: './left-sidebar.css'
})
export class LeftSidebar {
    isLeftSidebarCollapsed = input.required<boolean>();
  changeIsLeftSidebarCollapsed = output<boolean>();

  items = [
    {
      routeLink: 'dashboard',
      icon: 'dashboard',
      label: 'Dashboard',
    },
    {
      routeLink: 'filtro',
      icon: 'filter_alt', 
      label: 'Filtrar Base',
    },
    {
      routeLink: 'rango-prefijos',
      icon: 'verified_user',
      label: 'Verificar Prefijos',
    },
    {
      routeLink: 'settings',
      icon: 'settings',
      label: 'Settings',
    },
  ];

  toggleCollapse(): void {
    this.changeIsLeftSidebarCollapsed.emit(!this.isLeftSidebarCollapsed());
  }

  closeSidenav(): void {
    this.changeIsLeftSidebarCollapsed.emit(true);
  }
}
