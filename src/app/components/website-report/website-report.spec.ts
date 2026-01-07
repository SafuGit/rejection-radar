import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebsiteReport } from './website-report';

describe('WebsiteReport', () => {
  let component: WebsiteReport;
  let fixture: ComponentFixture<WebsiteReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebsiteReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WebsiteReport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
