import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cart-item-card',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './cart-item-card.component.html',
  styleUrls: ['./cart-item-card.component.scss']
})
export class CartItemCardComponent {
  @Input() entry: any;
  @Input() cartItemDisplayName = '';
  @Input() cartItemDisplaySize: string | null = null;
  @Input() cartModifierGroups: Array<{ name: string; options: Array<any> }> = [];
  @Input() cartItemPrice = 0;
  @Input() quantity = 1;

  @Output() quantityChanged = new EventEmitter<{ id: number; delta: number }>();
  @Output() notesChanged = new EventEmitter<{ id: number; notes: string }>();
  @Output() removed = new EventEmitter<number>();

  onQuantityChange(delta: number): void {
    this.quantityChanged.emit({ id: this.entry?.id, delta });
  }

  onNotesChange(notes: string): void {
    this.notesChanged.emit({ id: this.entry?.id, notes });
  }

  onRemove(): void {
    this.removed.emit(this.entry?.id);
  }
}
