import * as alt from 'alt-client';
import { PlayerLocalVoicePlugin, PlayerVoicePlugin } from "@AthenaPlugins/gp-voice-yaca/shared/interfaces.js"

declare module "alt-client" {
    export interface LocalPlayer {
        yacaPluginLocal: PlayerLocalVoicePlugin
    }

    export interface Player {
        yacaPlugin: PlayerVoicePlugin
    }
}

export class Extensions {
    static async init() {
       //Just a placeholder for now, but needed to load extensions
    }

    static dummy(player: alt.Player){
        
    }
}