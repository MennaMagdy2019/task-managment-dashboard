import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;
  let descriptionMeta: HTMLMetaElement;

  beforeEach(() => {
    localStorage.removeItem('taskflow.language');
    descriptionMeta = document.createElement('meta');
    descriptionMeta.name = 'description';
    document.head.append(descriptionMeta);
    TestBed.configureTestingModule({});
    service = TestBed.inject(I18nService);
  });

  afterEach(() => {
    service.setLanguage('en');
    descriptionMeta.remove();
    localStorage.removeItem('taskflow.language');
  });

  it('updates the language, document metadata, and persisted preference', () => {
    service.setLanguage('de');

    expect(service.language()).toBe('de');
    expect(localStorage.getItem('taskflow.language')).toBe('de');
    expect(document.documentElement.lang).toBe('de');
    expect(document.title).toBe('Task Management Dashboard');
    expect(descriptionMeta.content).toContain('Planen');
  });

  it('interpolates values into localized strings', () => {
    service.setLanguage('de');

    expect(service.translate('header.profile', { initials: 'OR' })).toBe('Profil von OR');
  });

  it('loads the persisted language when the service is created', () => {
    localStorage.setItem('taskflow.language', 'de');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    const restoredService = TestBed.inject(I18nService);

    expect(restoredService.language()).toBe('de');
    expect(document.documentElement.lang).toBe('de');
  });
});
