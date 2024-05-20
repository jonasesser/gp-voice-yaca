import * as alt from 'alt-client';
import { YaCAClientModule } from './yaca.client.js';
import { ALT_V_EVENTS } from '@AthenaShared/enums/altvEvents.js';


export class Yaca {
    static init() {
        alt.on(ALT_V_EVENTS.connectionComplete, () => {
            YaCAClientModule.getInstance();
        });        
    }
}
