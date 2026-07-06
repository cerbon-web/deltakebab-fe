import { Component } from '@angular/core';

@Component({
  selector: 'app-dev-indicator',
  standalone: true,
  template: `
    <div class="dev-indicator" aria-label="Local development">
      <span class="dot"></span>
      <span class="label">LOCAL DEVELOPMENT</span>
    </div>
  `,
  styles: [
    `
      .dev-indicator {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        color: #e53935;
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.04em;
      }

      .dot {
        width: 0.8rem;
        height: 0.8rem;
        border-radius: 50%;
        background: #e53935;
        box-shadow: 0 0 0 rgba(229, 57, 53, 0.5);
        animation: pulse 1.8s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% {
          box-shadow: 0 0 0 rgba(229, 57, 53, 0.5);
        }
        50% {
          box-shadow: 0 0 0.75rem rgba(229, 57, 53, 0.2);
        }
      }
    `
  ]
})
export class DevIndicatorComponent {}
