import * as alt from 'alt-client';
import { YaCAClientModule } from './yaca.client.js';
import { ALT_V_EVENTS } from '@AthenaShared/enums/altvEvents.js';
import { YacaRadio } from '../views/yacaRadio.js';
import { SYSTEM_EVENTS } from '@AthenaShared/enums/system.js';


export class Yaca {
    static clientModule: YaCAClientModule;

    static init() {
        alt.onceServer(SYSTEM_EVENTS.TICKS_START, YacaRadio.init);
        
        alt.on(ALT_V_EVENTS.connectionComplete, () => {
            Yaca.clientModule = YaCAClientModule.getInstance();
        });        
    }
}
