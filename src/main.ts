import { provideZonelessChangeDetection } from "@angular/core";
import {
  bootstrapApplication,
  provideNativeScriptRouter,
  runNativeScriptAngularApp,
} from "@nativescript/angular";
import { initNorrix } from "@norrix/client-sdk";
import { AppComponent } from "./app/app.component";
import { routes } from "./app/app.routes";

initNorrix({
  updateUrl: "https://norrix.net",
  checkForUpdatesOnLaunch: true,
  installUpdatesAutomatically: true,
});

runNativeScriptAngularApp({
  appModuleBootstrap: () => {
    return bootstrapApplication(AppComponent, {
      providers: [
        provideNativeScriptRouter(routes),
        provideZonelessChangeDetection(),
      ],
    });
  },
});
