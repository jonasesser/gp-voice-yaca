import * as alt from 'alt-server';
import * as AthenaServer from '@AthenaServer/api/index.js';
import { YaCAServerModule } from './yaca.server.js';

export class Yaca {
    static init() {
        YaCAServerModule.getInstance() // YACA Voiceplugin
    }
}
