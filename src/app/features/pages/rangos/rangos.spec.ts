import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Rangos } from './rangos';

describe('Rangos', () => {
  let component: Rangos;
  let fixture: ComponentFixture<Rangos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rangos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Rangos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
