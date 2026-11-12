import { ChangeDetectorRef, Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from './i18n.service';
import { TranslationKey, TranslationParams } from './i18n.defines';
@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private lastLanguage = this.i18n.language();

  transform(key: TranslationKey, params?: TranslationParams): string {
    const language = this.i18n.language();
    if (language !== this.lastLanguage) {
      this.lastLanguage = language;
      this.changeDetector.markForCheck();
    }
    return this.i18n.translate(key, params);
  }
}
