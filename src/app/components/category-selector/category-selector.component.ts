import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-category-selector',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './category-selector.component.html',
  styleUrls: ['./category-selector.component.scss']
})
export class CategorySelectorComponent implements OnChanges, OnInit {
  private readonly translate = inject(TranslateService);

  @Input() categories: Array<{ id?: string | number; name: string; icon?: string | null }> = [];
  @Input() selectedCategory: string | null = null;
  @Input() menuLoading = false;

  @Output() categorySelected = new EventEmitter<string>();
  @Output() categoryCleared = new EventEmitter<void>();

  readonly pageSize = 8;
  readonly mobileBreakpoint = 900;
  currentPage = 0;
  isMobileView = false;

  ngOnInit(): void {
    this.updateViewportMode();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categories']) {
      const totalPages = this.totalPages;
      this.currentPage = Math.min(this.currentPage, Math.max(0, totalPages - 1));
    }
  }

  onCategorySelect(categoryName: string): void {
    this.categorySelected.emit(categoryName);
  }

  onClearSelection(): void {
    this.categoryCleared.emit();
  }

  private updateViewportMode(): void {
    this.isMobileView = typeof window !== 'undefined' && window.innerWidth < this.mobileBreakpoint;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.categories.length / this.pageSize));
  }

  get visibleCategories() {
    const start = this.currentPage * this.pageSize;
    return this.categories.slice(start, start + this.pageSize);
  }

  get shouldShowPrevButton(): boolean {
    return !this.isMobileView && this.totalPages > 1 && this.currentPage > 0;
  }

  get shouldShowNextButton(): boolean {
    return !this.isMobileView && this.totalPages > 1 && this.currentPage < this.totalPages - 1;
  }

  get visibleCategoriesForLayout() {
    return this.isMobileView ? this.categories : this.visibleCategories;
  }

  goToPreviousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage -= 1;
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage += 1;
    }
  }

  getCategoryIcon(category: { id?: string | number; name: string; icon?: string | null }): string {
    const rawIcon = category.icon?.trim();
    const emojiPattern = /[\p{Extended_Pictographic}]/u;
    const imagePattern = /^(https?:\/\/|\/|\.\/|\.\.\/)/i;

    if (rawIcon && emojiPattern.test(rawIcon)) {
      return rawIcon;
    }

    if (rawIcon && imagePattern.test(rawIcon)) {
      return this.getCategoryIconAssetUrl(rawIcon) ?? rawIcon;
    }

    const idIconMap: Record<string, string> = {
      featured: '⭐',
      '1': '🥙',
      '2': '🌯',
      '4': '📦',
      '5': '🥖',
      '6': '🥡',
      '8': '🥗',
      '9': '🧂',
      '10': '🥤'
    };

    if (category.id !== undefined && category.id !== null) {
      const idKey = String(category.id);
      if (idIconMap[idKey]) {
        return idIconMap[idKey];
      }
    }

    const normalized = category.name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .trim();

    const fallbackNameMap: Array<{ matcher: string; icon: string }> = [
      { matcher: 'bestsellers', icon: '⭐' },
      { matcher: 'rollo', icon: '🥙' },
      { matcher: 'tortilla', icon: '🌯' },
      { matcher: 'bulka', icon: '🥖' },
      { matcher: 'box', icon: '📦' },
      { matcher: 'kebab na talerzu', icon: '🥣' },
      { matcher: 'salatki', icon: '🥗' },
      { matcher: 'kapsalon', icon: '🥡' },
      { matcher: 'dodatki', icon: '🧂' },
      { matcher: 'o kurcze', icon: '🍗' },
      { matcher: 'napoje', icon: '🥤' },
      { matcher: 'pizza', icon: '🍕' },
      { matcher: 'burger', icon: '🍔' },
      { matcher: 'sandwich', icon: '🥪' },
      { matcher: 'salad', icon: '🥗' },
      { matcher: 'dessert', icon: '🍰' },
      { matcher: 'cake', icon: '🍰' },
      { matcher: 'drink', icon: '🥤' },
      { matcher: 'coffee', icon: '☕' },
      { matcher: 'tea', icon: '🫖' },
      { matcher: 'soup', icon: '🍲' },
      { matcher: 'pasta', icon: '🍝' },
      { matcher: 'fries', icon: '🍟' }
    ];

    const matched = fallbackNameMap.find((entry) => normalized.includes(entry.matcher));
    return matched?.icon ?? '🍽️';
  }

  getCategoryDisplayName(category: { name: string }): string {
    const normalized = category.name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .trim();

    if (normalized === 'bestsellers') {
      return this.translate.instant('LANDING.CATEGORY.BESTSELLERS');
    }

    return category.name;
  }

  isCategoryIconImage(category: { icon?: string | null }): boolean {
    const rawIcon = category.icon?.trim();
    const imagePattern = /^(https?:\/\/|\/|\.\/|\.\.\/)/i;
    return Boolean(rawIcon && imagePattern.test(rawIcon));
  }

  private getCategoryIconAssetUrl(rawIcon?: string | null): string | null {
    const trimmedIcon = rawIcon?.trim();
    if (!trimmedIcon) {
      return null;
    }

    if (/^https?:\/\//i.test(trimmedIcon)) {
      return trimmedIcon;
    }

    if (/^(\/|\.\/|\.\.\/)/i.test(trimmedIcon)) {
      const baseUrl = environment.apiBaseUrl.replace(/\/api\/?$/, '');
      return `${baseUrl}${trimmedIcon.startsWith('/') ? trimmedIcon : `/${trimmedIcon}`}`;
    }

    return trimmedIcon;
  }
}
