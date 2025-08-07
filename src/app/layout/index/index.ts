import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { Header } from '../../shared/components/header/header';

@Component({
  selector: 'app-index',
  imports: [CommonModule,RouterOutlet,Sidebar,Header],
  templateUrl: './index.html',
  styleUrl: './index.css'
})
export class Index {

}
