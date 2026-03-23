import type { INestiaConfig } from '@nestia/sdk';

const config: INestiaConfig = {
  input: [
    './src/commandes/commandes.controller.ts',
    './src/codes/codes.controller.ts',
  ],
  output: '../../packages/nestia-sdk/src',
  // distribute: '../../packages/nestia-sdk',
  simulate: false,
};

export default config;
