import * as alt from 'alt-server';
import * as Athena from '@AthenaServer/api/index.js';
import { Yaca} from './src/yaca.js';
import { RegisterLocales } from './src/registerLocales.js';
import { Extensions } from './src/extensions.js';

const PLUGIN_NAME = 'gp-voice-yaca';

Athena.systems.plugins.registerPlugin(PLUGIN_NAME, async () => {

    Extensions.init();
    await Yaca.init();
    RegisterLocales.init();

    alt.log(`~lg~${PLUGIN_NAME} was Loaded`);
});
