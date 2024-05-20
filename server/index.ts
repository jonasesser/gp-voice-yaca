import * as alt from 'alt-server';
import * as Athena from '@AthenaServer/api/index.js';
import { Yaca} from './src/yaca.js';

const PLUGIN_NAME = 'gp-voice-yaca';

Athena.systems.plugins.registerPlugin(PLUGIN_NAME, async () => {
    
    await Yaca.init();

    alt.log(`~lg~${PLUGIN_NAME} was Loaded`);
});
