import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { AppLanguage, TranslationKey, TranslationParams, TRANSLATIONS } from './i18n.defines';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  readonly language = signal<AppLanguage>(this.readLanguage());

  constructor() {
    this.updateDocumentMetadata(this.language());
  }

  /**
   * Selects a supported language, persists the choice, and updates document metadata.
   * @param language The language to set.
   */
  setLanguage(language: AppLanguage): void {
    this.language.set(language);
    this.document.defaultView?.localStorage.setItem('taskflow.language', language);
    this.updateDocumentMetadata(language);
  }

  /**
   * Switches between the supported English and German translations.
   */
  toggleLanguage(): void {
    this.setLanguage(this.language() === 'en' ? 'de' : 'en');
  }

  /**
   * Returns a localized string with optional named interpolation values.
   *
   * @param key The translation key.
   * @param params The interpolation parameters.
   * @returns The localized string.
   */
  translate(key: TranslationKey, params: TranslationParams = {}): string {
    return Object.entries(params).reduce(
      (message, [name, value]) => message.replaceAll(`{${name}}`, String(value)),
      TRANSLATIONS[this.language()][key],
    );
  }

  /**
   * Formats a date using the active locale.
   * @param date The date to format.
   * @param options The formatting options.
   * @returns The formatted date string.
   */
  formatDate(date: Date, options: Intl.DateTimeFormatOptions): string {
    const locale = this.language() === 'de' ? 'de-DE' : 'en-US';
    return new Intl.DateTimeFormat(locale, options).format(date);
  }

  /**
   * Reads the preferred language from local storage or defaults to English.
   * @returns The preferred language.
   */
  private readLanguage(): AppLanguage {
    return this.document.defaultView?.localStorage.getItem('taskflow.language') === 'de'
      ? 'de'
      : 'en';
  }

  /**
   * Updates the document's metadata based on the selected language.
   * @param language The language to update the metadata for.
   */
  private updateDocumentMetadata(language: AppLanguage): void {
    this.document.documentElement.lang = language;
    this.document.title = TRANSLATIONS[language]['document.title'];
    this.document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', TRANSLATIONS[language]['document.description']);
  }
}
