import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: 'dev.herefishy.simpleguitartuner',
  appPath: 'src',
  appResourcesPath: 'App_Resources',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none'
  }
} as NativeScriptConfig;