import * as alt from 'alt-client';
import * as natives from 'natives';
import * as AthenaClient from '@AthenaClient/api/index.js';
import { KEY_BINDS } from '../../../../shared/enums/keyBinds.js';
import { YaCAClientModule } from '../src/yaca.client.js';
import ViewModel from '@AthenaClient/models/viewModel.js';
import { YACA_EVENTS } from '@AthenaPlugins/gp-voice-yaca/shared/events.js';
import { Yaca } from '../src/yaca.js';
import { Config } from '@AthenaPlugins/gp-voice-yaca/shared/config.js';
import { RadioInfos } from '@AthenaPlugins/gp-voice-yaca/shared/interfaces.js';
import { CommDeviceMode, YacaFilter, YacaStereoMode } from '@AthenaPlugins/gp-voice-yaca/shared/enums.js';
import { MenuHelper } from '@AthenaPlugins/gp-athena-utils/client/src/utility/menuHelper.js';

let clientModule: YaCAClientModule;

let radioFrequenceSetted = false;
let radioToggle = false;
let radioEnabled = false;
let radioTalking = false;
let radioChannelSettings = {};
let radioInited = false;
let activeRadioChannel = 1;
let playersInRadioChannel = new Map();

export class YacaRadio implements ViewModel {
    static init(clientModule: YaCAClientModule) {
        clientModule = clientModule;

        alt.onServer(YACA_EVENTS.CLIENT_SET_RADIO_FREQUENCY, YacaRadio.setRadioFrequency);
        alt.onServer(YACA_EVENTS.CLIENT_RADIO_TALKING_WHISPER, YacaRadio.radioTalkingWhisper);
        alt.onServer(YACA_EVENTS.CLIENT_RADIO_TALKING, YacaRadio.radioTalking);
        alt.onServer(YACA_EVENTS.CLIENT_RADIO_MUTE_STATE, YacaRadio.radioMuteState);
        alt.onServer(YACA_EVENTS.CLIENT_LEAVE_RADIO_CHANNEL, YacaRadio.leaveRadioChannel);

        YacaRadio.registerKeybinds();
    }

    /**
     * Register the keybind to the Keybind Controller.
     * @static
     * @memberof BaseHud
     */
    static registerKeybinds() {
       //TODO: Move Keybinds here!
    }

    static async openRadio(): Promise<void> {
        AthenaClient.webview.on(YACA_EVENTS.WEBVIEW_RADIO_READY, YacaRadio.ready);
        AthenaClient.webview.on(YACA_EVENTS.WV_CLIENT_ENABLE_RADIO, YacaRadio.enableRadio);
        AthenaClient.webview.on(YACA_EVENTS.WV_CLIENT_CHANGE_RADIO_FREQUENCY, YacaRadio.changeRadioFrequency);
        AthenaClient.webview.on(YACA_EVENTS.WV_CLIENT_MUTE_RADIO_CHANNEL, YacaRadio.muteRadioChannel);
        AthenaClient.webview.on(YACA_EVENTS.WV_CLIENT_CHANGE_ACTIVE_RADIO_CHANNEL, YacaRadio.changeActiveRadioChannel);
        AthenaClient.webview.on(YACA_EVENTS.WV_CLIENT_CHANGE_RADIO_CHANNEL_VOLUME, YacaRadio.changeRadioChannelVolume);
        AthenaClient.webview.on(YACA_EVENTS.WV_CLIENT_CHANGE_RADIO_CHANNEL_STEREO, YacaRadio.changeRadioChannelStereo);
        AthenaClient.webview.on(YACA_EVENTS.WV_CLIENT_CHANGE_RADIO_SPEAKER, YacaRadio.changeRadioSpeaker);

        AthenaClient.webview.openStaticPage(YACA_EVENTS.WEBVIEW_RADIO_VIEW_NAME, false);

        MenuHelper.openMenu();
    }

    static ready() {
        AthenaClient.webview.emit(YACA_EVENTS.WEBVIEW_OPEN_STATE, true);
    }
    
    //Yaca Radio System
    static openRadioToggle() {
        if (!radioToggle && !alt.isCursorVisible()) {
            radioToggle = true;           
            YacaRadio.openRadio();
        } else if (radioToggle) {
            YacaRadio.closeRadio();
        }
    }   

    /**
     * Cleanup different things, if player closes his radio.
     */
    static closeRadio() {
        if (!radioToggle) return;

        radioToggle = false;

        alt.showCursor(false);
        alt.toggleGameControls(true);
        AthenaClient.webview.emit(YACA_EVENTS.WEBVIEW_OPEN_STATE, false);
        AthenaClient.webview.unfocus();

        MenuHelper.closeMenu();
    }

    /**
     * Set volume & stereo mode for all radio channels on first start and reconnect.
     */
    static initRadioSettings() {
        if (!radioInited) return;
        
        for (let i = 1; i <= Config.YACA_MAX_RADIO_CHANNELS; i++) {
            if (!radioChannelSettings[i]) radioChannelSettings[i] = Object.assign({}, Config.defaultRadioChannelSettings);
            if (!playersInRadioChannel.has(i)) playersInRadioChannel.set(i, new Set());

            const volume = radioChannelSettings[i].volume;
            const stereo = radioChannelSettings[i].stereo;

            clientModule.setCommDeviceStereomode(YacaFilter.RADIO, stereo, i);
            clientModule.setCommDeviceVolume(YacaFilter.RADIO, volume, i);
        }
    }

    /**
     * Sends an event to the plugin when a player starts or stops talking on the radio.
     *
     * @param {boolean} state - The state of the player talking on the radio.
     */
    static radioTalkingStateToPlugin(state: boolean) {
        YaCAClientModule.setPlayersCommType(clientModule.getPlayerByID(clientModule.localPlayer.remoteID), YacaFilter.RADIO, state, activeRadioChannel);
    }

    static handleSyncedMetas(entity: alt.Entity, key: string, value: any, oldValue?: any) {
        const isOwnPlayer = entity.remoteID === clientModule.localPlayer.remoteID;
        if (isOwnPlayer && !clientModule.isPlayerMuted) {
            AthenaClient.webview.emit(YACA_EVENTS.WEBVIEW_IS_TALKING, value);
        } 
    }

    static radioTalkingStateToPluginWithWhisper(state: boolean, targets: number[]) {
        let comDeviceTargets = [];
        for (const target of targets) {
            const player = clientModule.getPlayerByID(target);
            if (!player) continue;

            comDeviceTargets.push(player);
        }
            
        YaCAClientModule.setPlayersCommType(comDeviceTargets, YacaFilter.RADIO, state, activeRadioChannel, undefined, CommDeviceMode.SENDER, CommDeviceMode.RECEIVER);
    }

    /**
     * Updates the UI when a player changes the radio channel.
     *
     * @param {number} channel - The new radio channel.
     */
    static updateRadioInWebview(channel) {
        if (channel != activeRadioChannel) return;

        AthenaClient.webview.emit(YACA_EVENTS.WEBVIEW_SET_CHANNEL_DATA, radioChannelSettings[channel]);
    }

    /**
     * Finds a radio channel by a given frequency.
     *
     * @param {string} frequency - The frequency to search for.
     * @returns {number | undefined} The channel number if found, undefined otherwise.
     */
    static findRadioChannelByFrequency(frequency) {
        let foundChannel;
        for (const channel in radioChannelSettings) {
            const data = radioChannelSettings[channel];
            if (data.frequency == frequency) {
                foundChannel = parseInt(channel);
                break;
            }
        }

        return foundChannel;
    }

    static setRadioFrequency(channel: number, frequency: string) {
        radioFrequenceSetted = true;

        if (radioChannelSettings[channel].frequency != frequency) {
            YacaRadio.disableRadioFromPlayerInChannel(channel);
        }

        radioChannelSettings[channel].frequency = frequency;
    }

    /**
     * Disable radio effect for all players in the given channel.
     *
     * @param {number} channel - The channel number.
     */
    static disableRadioFromPlayerInChannel(channel: number) {
        if (!playersInRadioChannel.has(channel)) return;

        const players = playersInRadioChannel.get(channel);
        if (!players?.size) return;

        let targets = [];
        for (const playerId of players) {
            const player = clientModule.getPlayerByID(playerId);
            if (!player) continue;

            targets.push(player);
            players.delete(player.remoteID);
        }

        if (targets.length) YaCAClientModule.setPlayersCommType(targets, YacaFilter.RADIO, false, channel, undefined, CommDeviceMode.RECEIVER, CommDeviceMode.SENDER);
    }

    /**
     * Starts the radio talking state.
     *
     * @param {boolean} state - The state of the radio talking.
     * @param {boolean} [clearPedTasks=true] - Whether to clear ped tasks. Defaults to true if not provided.
     */
    static radioTalkingStart(state: boolean, clearPedTasks = true) {
        if (!state) {
            if (radioTalking) {
                radioTalking = false;
                if (!clientModule.useWhisper) YacaRadio.radioTalkingStateToPlugin(false);
                alt.emitServerRaw(YACA_EVENTS.SERVER_RADIO_TALKING, false);
                if (clearPedTasks) natives.stopAnimTask(clientModule.localPlayer, "random@arrests", "generic_radio_chatter", 4);
            }

            return;
        }

        if (!radioEnabled || !radioFrequenceSetted || radioTalking || clientModule.localPlayer.isReloading) return;

        radioTalking = true;
        if (!clientModule.useWhisper) YacaRadio.radioTalkingStateToPlugin(true);

        alt.Utils.requestAnimDict("random@arrests").then(() => {
            natives.taskPlayAnim(clientModule.localPlayer, "random@arrests", "generic_radio_chatter", 3, -4, -1, 49, 0.0, false, false, false);

            alt.emitServerRaw(YACA_EVENTS.SERVER_RADIO_TALKING, true);
        });
    };

    //Yaca Radio Functions

    static enableRadio(state: boolean) {
        if (!clientModule.isPluginInitialized()) return;

        if (radioEnabled != state) {
            radioEnabled = state;
            alt.emitServerRaw(YACA_EVENTS.SERVER_ENABLE_RADIO, state);

            if (!state) {
                for (let i = 1; i <= Config.YACA_MAX_RADIO_CHANNELS; i++) {
                    YacaRadio.disableRadioFromPlayerInChannel(i);
                }
            }
        }

        if (state && !radioInited) {
            radioInited = true;
            YacaRadio.initRadioSettings();
            YacaRadio.updateRadioInWebview(activeRadioChannel);
        }
    }

    static changeRadioFrequency(frequency: string) {
        if (!clientModule.isPluginInitialized()) return;

        alt.emitServerRaw(YACA_EVENTS.SERVER_CHANGE_RADIO_FREQUENCY, activeRadioChannel, frequency);
    }
   
    static radioTalkingWhisper(targets: number[], state: boolean) {
        YacaRadio.radioTalkingStateToPluginWithWhisper(state, targets);
    }  

    static radioTalking(target: number, frequency: string, state?: boolean, infos?: RadioInfos) {
        const channel = YacaRadio.findRadioChannelByFrequency(frequency);
        if (!channel) return;
        
        const player = clientModule.getPlayerByID(target);
        if (!player) return;

        const info = infos[clientModule.localPlayer.remoteID];

        if (!info?.shortRange || (info?.shortRange && alt.Player.getByRemoteID(target)?.isSpawned)) {
            YaCAClientModule.setPlayersCommType(player, YacaFilter.RADIO, state, channel, undefined, CommDeviceMode.RECEIVER, CommDeviceMode.SENDER);
        }

        state ? playersInRadioChannel.get(channel)?.add(target) : playersInRadioChannel.get(channel)?.delete(target);

        if (info?.shortRange || !state) {
            if (state) {
                clientModule.playersWithShortRange.set(target, frequency)
            } else {
                clientModule.playersWithShortRange.delete(target)
            }
        }
    }

    static muteRadioChannel(){
        if (!clientModule.isPluginInitialized() || !radioEnabled) return;

        const channel = activeRadioChannel;
        if (radioChannelSettings[channel].frequency == 0) return;
        alt.emitServerRaw(YACA_EVENTS.SERVER_MUTE_RADIO_CHANNEL, channel)
    }

    static radioMuteState(channel: number, state: boolean) {
        radioChannelSettings[channel].muted = state;
        YacaRadio.updateRadioInWebview(channel);
        YacaRadio.disableRadioFromPlayerInChannel(channel);
    }

    static leaveRadioChannel(client_ids: number[], frequency: number) {
        if (!Array.isArray(client_ids)) client_ids = [client_ids];

        const channel = YacaRadio.findRadioChannelByFrequency(frequency);

        if (client_ids.includes(clientModule.getPlayerByID(clientModule.localPlayer.remoteID)?.clientId)) YacaRadio.setRadioFrequency(channel, "0");

        clientModule.sendWebsocket({
            base: {"request_type": "INGAME"},
            comm_device_left: {
                comm_type: YacaFilter.RADIO,
                client_ids: client_ids,
                channel: channel
            }
        });
    }

    static changeActiveRadioChannel(channel: number) {
        if (!clientModule.isPluginInitialized() || !radioEnabled) return;

        alt.emitServerRaw(YACA_EVENTS.SERVER_CHANGE_ACTIVE_RADIO_CHANNEL, channel);
        activeRadioChannel = channel;
        YacaRadio.updateRadioInWebview(channel);
    }

    static changeRadioChannelVolume(higher: boolean) {
        if (!clientModule.isPluginInitialized() || !radioEnabled || radioChannelSettings[activeRadioChannel].frequency == 0) return;

        const channel = activeRadioChannel;
        const oldVolume = radioChannelSettings[channel].volume;
        radioChannelSettings[channel].volume = clientModule.clamp(
            oldVolume + (higher ? 0.17 : -0.17),
            0,
            1
        )

        // Prevent event emit spams, if nothing changed
        if (oldVolume == radioChannelSettings[channel].volume) return

        if (radioChannelSettings[channel].volume == 0 || (oldVolume == 0 && radioChannelSettings[channel].volume > 0)) {
            alt.emitServerRaw(YACA_EVENTS.SERVER_MUTE_RADIO_CHANNEL, channel)
        }

        // Prevent duplicate update, cuz mute has its own update
        if (radioChannelSettings[channel].volume > 0) YacaRadio.updateRadioInWebview(channel);

        // Send update to voiceplugin
        clientModule.setCommDeviceVolume(YacaFilter.RADIO, radioChannelSettings[channel].volume, channel);
    }

    static changeRadioChannelStereo() {
        if (!clientModule.isPluginInitialized() || !radioEnabled) return;

        const channel = activeRadioChannel;

        //TODO: Translation!
        switch (radioChannelSettings[channel].stereo) {
            case YacaStereoMode.STEREO:
                radioChannelSettings[channel].stereo = YacaStereoMode.MONO_LEFT;
                clientModule.radarNotification(`Kanal ${channel} ist nun auf der linken Seite hörbar.`);
                break;
            case YacaStereoMode.MONO_LEFT:
                radioChannelSettings[channel].stereo = YacaStereoMode.MONO_RIGHT;
                clientModule.radarNotification(`Kanal ${channel} ist nun auf der rechten Seite hörbar.`);
                break;
            case YacaStereoMode.MONO_RIGHT:
                radioChannelSettings[channel].stereo = YacaStereoMode.STEREO;
                clientModule.radarNotification(`Kanal ${channel} ist nun auf beiden Seiten hörbar.`);
        };

        // Send update to voiceplugin
        clientModule.setCommDeviceStereomode(YacaFilter.RADIO, radioChannelSettings[channel].stereo, channel);
    }
   
    static changeRadioSpeaker() {
        //TODO: Implement, will be used if player activates radio speaker so everyone around him can hear it
    }

}
