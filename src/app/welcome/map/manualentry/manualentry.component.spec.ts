import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ManualentryComponent } from './manualentry.component';

describe('ManualentryComponent', () => {
  let component: ManualentryComponent;
  let fixture: ComponentFixture<ManualentryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ManualentryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManualentryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
