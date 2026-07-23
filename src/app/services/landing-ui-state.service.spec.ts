import { TestBed } from '@angular/core/testing';
import { LandingUiStateService } from './landing-ui-state.service';

describe('LandingUiStateService', () => {
  let service: LandingUiStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LandingUiStateService);
  });

  it('tracks loading and menu loading flags', () => {
    service.setLoading(true);
    service.setMenuLoading(true);

    expect(service.loading()).toBeTrue();
    expect(service.menuLoading()).toBeTrue();
  });
});
