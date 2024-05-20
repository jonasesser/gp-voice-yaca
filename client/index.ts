import * as alt from 'alt-client';
import { Yaca } from './src/yaca.js';
import { RegisterLocales } from './src/registerLocales.js';
import { Extensions } from './src/extensions.js';

Extensions.init();
Yaca.init();
RegisterLocales.init();

alt.log(`~ly~Plugin Loaded -- gp-voice-yaca`);
