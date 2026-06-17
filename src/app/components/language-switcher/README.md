Language Switcher Component

Installation / Notes

- This component expects `@ngx-translate/core` to be configured in the application. The repository already imports `TranslateModule` in `AppComponent`.
- Persisted language is stored in `localStorage` under the key `delta-lang`.

Usage

- The component is standalone. Add `<app-language-switcher></app-language-switcher>` into your header markup and include the component in the host's `imports` array.

Accessibility & Keyboard

- Arrow Down / Arrow Up to navigate
- Enter to select
- Escape to close
