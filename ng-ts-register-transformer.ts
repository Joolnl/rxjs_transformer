import { rxjsTransformer } from './rxjs_transformer';
import { RxJSTransformer as rxjs_transformer_ref } from './rxjs_transformer_ref';
import { AngularCompilerPlugin } from '@ngtools/webpack';

function findAngularCompilerPlugin(webpackCfg): AngularCompilerPlugin | null {
  return webpackCfg.plugins.find(plugin => plugin.constructor.name === 'AngularCompilerPlugin');
}

// The AngularCompilerPlugin has nog public API to add transformations, user private API _transformers instead.
function addTransformerToAngularCompilerPlugin(acp, transformer): void {
  acp._transformers = [transformer, ...acp._transformers];
}

export default {
  pre() {
    // This hook is not used in our example
  },

  // This hook is used to manipulate the webpack configuration
  config(cfg) {
    // Find the AngularCompilerPlugin in the webpack configuration
    const angularCompilerPlugin = findAngularCompilerPlugin(cfg);

    if (!angularCompilerPlugin) {
      console.error('Could not inject the typescript transformer: Webpack AngularCompilerPlugin not found');
      return;
    }

    addTransformerToAngularCompilerPlugin(angularCompilerPlugin, rxjs_transformer_ref);
    return cfg;
  },

  post() {
    // This hook is not used in our example
  }
};
