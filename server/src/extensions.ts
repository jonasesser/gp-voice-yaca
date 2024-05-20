import * as alt from 'alt-server';
import { PlayerRadioSettings, PlayerVoicePlugin, PlayerVoiceSettings } from '@AthenaPlugins/gp-voice-yaca/shared/interfaces.js';

declare module "alt-server" {
    export interface Colshape {
        voiceRangeInfos: {
            maxRange: number,
        }
    }

    export interface Player {
        voiceSettings: PlayerVoiceSettings,
        voiceplugin: PlayerVoicePlugin,
        radioSettings: PlayerRadioSettings
    }
}

export class Extensions {
    static async init() {
       //Just a placeholder for now, but needed to load extensions
    }

    static dummy(player: alt.Player){

    }
}