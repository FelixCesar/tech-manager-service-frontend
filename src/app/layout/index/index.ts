
import { Component, HostListener, OnInit, signal, Inject, PLATFORM_ID } from '@angular/core';
import { LeftSidebar } from '../../shared/components/left-sidebar/left-sidebar';
import { isPlatformBrowser } from '@angular/common';

import { Main } from '../main/main';

@Component({
  selector: 'app-index',
  imports: [LeftSidebar, Main],
  templateUrl: './index.html',
  styleUrl: './index.css'
})
export class Index implements OnInit {

isLeftSidebarCollapsed = signal<boolean>(false);
  screenWidth = signal<number>(0);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  @HostListener('window:resize')
  onResize() {
    if (isPlatformBrowser(this.platformId)) {
      this.screenWidth.set(window.innerWidth);
      if (this.screenWidth() < 768) {
        this.isLeftSidebarCollapsed.set(true);
      }
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.screenWidth.set(window.innerWidth);
      this.isLeftSidebarCollapsed.set(this.screenWidth() < 768);
    }
  }

  changeIsLeftSidebarCollapsed(isLeftSidebarCollapsed: boolean): void {
    this.isLeftSidebarCollapsed.set(isLeftSidebarCollapsed);
  }

}
