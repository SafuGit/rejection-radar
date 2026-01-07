import { TestBed } from '@angular/core/testing';

import { JDService } from './jdservice';

describe('JDService', () => {
  let service: JDService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JDService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
