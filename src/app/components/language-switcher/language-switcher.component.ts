import { Component, HostListener, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.scss'],
})
export class LanguageSwitcherComponent {
  private host = inject(ElementRef<HTMLElement>);
  public lang = inject(LanguageService);

  public open = signal(false);
  public focusedIndex = signal<number | null>(null);
  public current = this.lang.currentLang;

  get items() {
    return this.lang.available;
  }

  toggle() {
    this.open.update((v) => !v);
    if (!this.open()) this.focusedIndex.set(null);
  }

  choose(i: number) {
    const code = this.items[i].code as any;
    this.lang.setLang(code);
    this.open.set(false);
  }

  onKey(event: KeyboardEvent) {
    if (!this.open()) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.open.set(true);
        this.focusedIndex.set(0);
      }
      return;
    }

    if (event.key === 'Escape') {
      this.open.set(false);
      this.focusedIndex.set(null);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = (this.focusedIndex() === null ? 0 : Math.min(this.items.length - 1, this.focusedIndex()! + 1));
      this.focusedIndex.set(next);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = (this.focusedIndex() === null ? this.items.length - 1 : Math.max(0, this.focusedIndex()! - 1));
      this.focusedIndex.set(prev);
      return;
    }

    if (event.key === 'Enter' && this.focusedIndex() !== null) {
      this.choose(this.focusedIndex()!);
      return;
    }
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(e: MouseEvent) {
    const target = e.target as Node;
    if (!this.host.nativeElement.contains(target)) {
      this.open.set(false);
      this.focusedIndex.set(null);
    }
  }
}
