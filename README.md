# Guitar Tuner

A mobile guitar tuner app built with NativeScript and Angular.

## Screenshots

| Tuner                                                                     | Settings                                             |
| ------------------------------------------------------------------------- | ---------------------------------------------------- |
| `<img src="screenshots/Android/Screenshot_1770797149.png" width="300">` | `<img src="screenshots/settings.png" width="300">` |

## Features

- Real-time pitch detection
- Visual tuning indicator
- Support for standard guitar tuning
- Customizable settings
- Dark/Light theme support

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- NativeScript CLI
- Android SDK / Xcode (for iOS development)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/herefishyfish/simple-guitar-tuner.git
   cd guitar-tuner
   ```
2. Install dependencies:

   ```bash
   pnpm install
   ```
3. Run on Android:

   ```bash
   ns run android
   ```
4. Run on iOS:

   ```bash
   ns run ios
   ```

## Project Structure

```
src/
├── app/
│   ├── tuner/
│   │   ├── tuner.component.ts      # Main tuner UI
│   │   ├── settings.component.ts   # Settings page
│   │   ├── audio.service.ts        # Audio processing
│   │   └── settings.service.ts     # Settings management
│   ├── app.component.ts
│   └── app.routes.ts
├── assets/
└── main.ts
```

## Technologies

- [NativeScript](https://nativescript.org/)
- [Angular](https://angular.io/)
- [TailwindCSS](https://tailwindcss.com/)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
