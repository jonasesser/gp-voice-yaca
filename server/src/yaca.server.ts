import * as alt from 'alt-server';
import * as AthenaServer from '@AthenaServer/api/index.js';
import { Config } from '@AthenaPlugins/gp-voice-yaca/shared/config.js';
import { FrequenceValueMap, PlayerRadioSettings, PlayerVoicePlugin, PlayerVoiceSettings, RadioInfoValue, RadioInfos } from '@AthenaPlugins/gp-voice-yaca/shared/interfaces.js';
import { YACA_META } from '@AthenaPlugins/gp-voice-yaca/shared/meta.js';
import { YACA_EVENTS } from '@AthenaPlugins/gp-voice-yaca/shared/events.js';
import { ALT_V_EVENTS } from '@AthenaShared/enums/altvEvents.js';
import { LOCALES_KEYS } from '@AthenaPlugins/gp-voice-yaca/shared/locale/locales_keys.js';

const settings = {
    // Max Radio Channels
    maxRadioChannels: Config.YACA_MAX_RADIO_CHANNELS || 9, // needs to be sync with client setting

    // Unique Teamspeakserver ID
    UNIQUE_SERVER_ID: Config.YACA_UNIQUE_SERVER_ID || "",

    // Ingame Voice Channel ID
    CHANNEL_ID: Config.YACA_CHANNEL_ID || 0,

    // Ingame Voice Channel Password
    CHANNEL_PASSWORD: Config.YACA_CHANNEL_PASSWORD || "",

    // Default Teamspeak Channel, if player can't be moved back to his old channel
    DEFAULT_CHANNEL_ID: Config.YACA_DEFAULT_CHANNEL_ID || 1,

    // If true, it will use the teamspeak whisper system
    USE_WHISPER: Config.YACA_USE_WHISPER || false,
}

/**
 * Generates a random string of a given length.
 *
 * @param {number} [length=50] - The length of the string to generate. Defaults to 50 if not provided.
 * @param {string} [possible="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"] - The characters to use in the string. Defaults to all alphanumeric characters if not provided.
 * @returns {string} The generated random string.
 */
function generateRandomString(length: number = 50, possible: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") {
    let text = "";
    for (let i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

export class YaCAServerModule {
    static instance;
    static nameSet = new Set();
    static voiceRangesColShapes = new Map();

    static radioFrequencyMap: Map<string, Map<number, FrequenceValueMap>> = new Map();

    constructor() {
        if (!settings.UNIQUE_SERVER_ID || settings.UNIQUE_SERVER_ID == "") {
            throw Error('~r~ --> YaCA: Unique Server ID is not set! Please set it in your .env file');
        }
        alt.log('~g~ --> YaCA: Server loaded');
        this.registerEvents();

        // Example colshape for extendet voicerange
        const pos = new alt.Vector3(0, 0, 70);
        const colshape = new alt.ColshapeCylinder(pos.x, pos.y, pos.z, 10, 5);
        colshape.playersOnly = true;
        colshape.dimension = 0;
        colshape.voiceRangeInfos = {
            maxRange: 8 // Value from clientside voiceRangesEnum
        }
        YaCAServerModule.voiceRangesColShapes.set(1337, colshape)
    }

    /**
     * Gets the singleton of YaCAServerModule.
     *
     * @returns {YaCAServerModule} The singleton instance of YaCAServerModule.
     */
    static getInstance() {
        if (!this.instance) {
            this.instance = new YaCAServerModule();
        }

        return this.instance;
    }

    /**
     * Generate a random name and insert it into the database.
     *
     * @param {alt.Player} player - The player for whom to generate a random name.
     */
    generateRandomName(player: alt.Player) {
        let name;
        for (let i = 0; i < 100; i++) {
            let generatedName = generateRandomString(15, "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789");
            if (!YaCAServerModule.nameSet.has(name)) {
                name = generatedName;
                YaCAServerModule.nameSet.add(name);
                break;
            }
        }

        if (!name && player.valid) AthenaServer.player.emit.notification(player,AthenaServer.locale.get(player,LOCALES_KEYS.TS_NAME_NOT_FOUND));

        return name;
    }

    /**
     * Initialize the player on first connect.
     *
     * @param {alt.Player} player - The player to connect to voice.
     */
    connectToVoice(player: alt.Player) {
        if (!player?.valid) return;

        const name = this.generateRandomName(player);
        if (!name) return;

        player.voiceSettings = {
            voiceRange: 3,
            voiceFirstConnect: false,
            maxVoiceRangeInMeter: 15,
            forceMuted: false,
            ingameName: name,
            mutedOnPhone: false,
            inCallWith: []
        };

        player.radioSettings = {
            activated: false,
            currentChannel: 1,
            hasLong: false,
            frequencies: {} //{ [key: number]: string }
        };

        this.connect(player);
    }

    registerEvents() {
        // alt:V Events
        alt.on(ALT_V_EVENTS.playerDisconnect, this.handlePlayerDisconnect);
        alt.on(ALT_V_EVENTS.playerLeftVehicle, this.handlePlayerLeftVehicle);
        alt.on(ALT_V_EVENTS.entityEnterColshape, this.handleEntityEnterColshape);
        alt.on(ALT_V_EVENTS.entityLeaveColshape, this.handleEntityLeaveColshape);

        //Events if called from other serverside ressource
        alt.on(YACA_EVENTS.SERVER_CONNECT, this.connectToVoice);
        alt.on(YACA_EVENTS.SERVER_CALL_PLAYER, this.callPlayer);
        alt.on(YACA_EVENTS.SERVER_CALL_PLAYER_OLD_EFFECT, this.callPlayerOldEffect);
        alt.on(YACA_EVENTS.SERVER_CHANGE_PLAYER_ALIVE_STATUS, this.changePlayerAliveStatus);
        alt.on(YACA_EVENTS.SERVER_ENABLE_PHONE_SPEAKER, this.enablePhoneSpeaker);
        alt.on(YACA_EVENTS.SERVER_MUTE_ON_PHONE, this.muteOnPhone);

        // YaCA: voice range toggle
        alt.onClient(YACA_EVENTS.SERVER_CHANGE_VOICE_RANGE, this.changeVoiceRange);

        // YACA: Playerlipsync
        alt.onClient(YACA_EVENTS.SERVER_LIP_SYNC, (player, state) => {
            player.setStreamSyncedMeta(YACA_META.LIPSYNC, state);
        });

        // YaCA:successful voice connection and client-id sync
        alt.onClient(YACA_EVENTS.SERVER_ADD_PLAYER, this.addNewPlayer);

        // YaCA: Change megaphone state by player
        alt.onClient(YACA_EVENTS.SERVER_USE_MEGAPHONE, this.playerUseMegaphone);

        // YaCA: Triggers if voiceplugin is for x amount of time not connected
        alt.onClient(YACA_EVENTS.SERVER_NO_VOICE_PLUGIN, this.playerNoVoicePlugin);

        //YaCa: voice restart
        alt.onClient(YACA_EVENTS.SERVER_WS_READY, this.playerReconnect);

        //YaCA: Enable radio
        alt.onClient(YACA_EVENTS.SERVER_ENABLE_RADIO, this.enableRadio);

        //YaCA-Radio: Change radio channel frequency
        alt.onClient(YACA_EVENTS.SERVER_CHANGE_RADIO_FREQUENCY, this.changeRadioFrequency);

        //YaCA-Radio: Mute a radio channel
        alt.onClient(YACA_EVENTS.SERVER_MUTE_RADIO_CHANNEL, this.radioChannelMute);

        //YaCA-Radio: Talk in radio channel
        alt.onClient(YACA_EVENTS.SERVER_RADIO_TALKING, this.radioTalkingState);

        //YaCA-Radio: Change active radio channel
        alt.onClient(YACA_EVENTS.SERVER_CHANGE_ACTIVE_RADIO_CHANNEL, this.radioActiveChannelChange);

        alt.onClient(YACA_EVENTS.SERVER_PHONE_SPEAKER_EMIT, (player, enableForTargets, disableForTargets) => {
            const enableWhisperReceive = [];
            const disableWhisperReceive = [];

            player.voiceSettings.inCallWith.forEach(callTarget => {
                const target = alt.Player.getByID(callTarget);
                if (!target?.valid) return;

                if (enableForTargets?.length) enableWhisperReceive.push(target);
                if (disableForTargets?.length) disableWhisperReceive.push(target);
            });

            if (enableWhisperReceive.length) alt.emitClientRaw(enableWhisperReceive, YACA_EVENTS.CLIENT_PLAYERS_TO_PHONE_SPEAKER_EMIT, enableForTargets, true);
            if (disableWhisperReceive.length) alt.emitClientRaw(disableWhisperReceive, YACA_EVENTS.CLIENT_PLAYERS_TO_PHONE_SPEAKER_EMIT, disableForTargets, false);
        });

        alt.onClient(YACA_EVENTS.SERVER_MUTE_ON_PHONE, this.muteOnPhone.bind(this));
        alt.onClient(YACA_EVENTS.SERVER_ENABLE_PHONE_SPEAKER, this.enablePhoneSpeaker.bind(this));
    }

    /**
     * Handle various cases if player disconnects.
     *
     * @param {alt.Player} player - The player who disconnected.
     */
    handlePlayerDisconnect(player: alt.Player) {
        const playerID = player.id;
        YaCAServerModule.nameSet.delete(player.voiceSettings?.ingameName);

        const allFrequences = YaCAServerModule.radioFrequencyMap;
        
        allFrequences.forEach((value, key) => {
            value.delete(playerID);
            if (!value.size) YaCAServerModule.radioFrequencyMap.delete(key);
        });

        //TODO: Clarify why this is not working!
        // for (const [key, value] of allFrequences) {
        //     value.delete(playerID);
        //     if (!value.size) YaCAServerModule.radioFrequencyMap.delete(key)
        // }

        alt.emitAllClientsRaw(YACA_EVENTS.CLIENT_DISCONNECT, player.id);
    }

    /**
     * Handle various cases if player left a vehicle.
     *
     * @param {alt.Player} player - The player who left the vehicle.
     * @param {alt.Vehicle} vehicle - The vehicle that the player left.
     * @param {number} seat - The seat number that the player was in.
     */
    handlePlayerLeftVehicle(player: alt.Player, vehicle: alt.Vehicle, seat: number) {
        YaCAServerModule.changeMegaphoneState(player, false, true);
    }

    /**
     * Handle various cases if player enters colshapes.
     *
     * @param {alt.Colshape} colshape - The colshape that the entity entered.
     * @param {alt.Entity} entity - The entity that entered the colshape.
     */
    handleEntityEnterColshape(colshape: alt.Colshape, entity: alt.Entity) {
        if (!colshape.voiceRangeInfos || !(entity instanceof alt.Player) || !entity?.valid) return;

        const voiceRangeInfos = colshape.voiceRangeInfos;

        entity.emitRaw(YACA_EVENTS.CLIENT_SET_MAX_VOICE_RANGE, voiceRangeInfos.maxRange);

        switch (voiceRangeInfos.maxRange)
        {
            case 5:
                entity.voiceSettings.maxVoiceRangeInMeter = 20;
                break;
            case 6:
                entity.voiceSettings.maxVoiceRangeInMeter = 25;
                break;
            case 7:
                entity.voiceSettings.maxVoiceRangeInMeter = 30;
                break;
            case 8:
                entity.voiceSettings.maxVoiceRangeInMeter = 40;
                break;
        }
    };

    /**
     * Handle various cases if player leaves colshapes.
     *
     * @param {alt.Colshape} colshape - The colshape that the entity left.
     * @param {alt.Entity} entity - The entity that left the colshape.
     */
    handleEntityLeaveColshape(colshape: alt.Colshape, entity: alt.Entity) {
        if (!colshape.voiceRangeInfos || !(entity instanceof alt.Player) || !entity?.valid) return;

        entity.voiceSettings.maxVoiceRangeInMeter = 15;

        //We have to reset it here if player leaves the colshape
        if (entity.voiceSettings.voiceRange > 15) {
            entity.emitRaw(YACA_EVENTS.CLIENT_SET_MAX_VOICE_RANGE, 15);
            this.changeVoiceRange(entity, 15);
        }
    };

    /**
     * Syncs player alive status and mute him if he is dead or whatever.
     *
     * @param {alt.Player} player - The player whose alive status is to be changed.
     * @param {boolean} alive - The new alive status.
     */
    changePlayerAliveStatus(player: alt.Player, alive: boolean) {
        player.voiceSettings.forceMuted = !alive;
        alt.emitAllClientsRaw(YACA_EVENTS.CLIENT_MUTE_TARGET, player.id, !alive);

        if (player.voiceplugin) player.voiceplugin.forceMuted = !alive;
    }

    /**
     * Apply the megaphone effect on a specific player via client event.
     *
     * @param {alt.Player} player - The player to apply the megaphone effect on.
     * @param {boolean} state - The state of the megaphone effect.
     */
    playerUseMegaphone(player: alt.Player, state: boolean) {
        if (!player.vehicle && !player.hasLocalMeta(YACA_META.MEGAPHONE_CAN_USE)) return;
        if (player.vehicle && (!player.vehicle.valid || [1, 2].indexOf(player.seat) == -1)) return;
        if ((!state && !player?.hasStreamSyncedMeta(YACA_META.MEGAPHONE_ACTIVE)) || (state && player?.hasStreamSyncedMeta("yaca:megaphoneactive"))) return;

        YaCAServerModule.changeMegaphoneState(player, state);
    }

    /**
     * Apply the megaphone effect on a specific player.
     *
     * @param {alt.Player} player - The player to apply the megaphone effect on.
     * @param {boolean} state - The state of the megaphone effect.
     * @param {boolean} [forced=false] - Whether the change is forced. Defaults to false if not provided.
     */
    static changeMegaphoneState(player: alt.Player, state: boolean, forced: boolean = false) {
        if (!state && player.hasStreamSyncedMeta(YACA_META.MEGAPHONE_ACTIVE)) {
            player.deleteStreamSyncedMeta(YACA_META.MEGAPHONE_ACTIVE);
            if (forced) player.setLocalMeta(YACA_META.MEGAPHONE_LAST_STATE, false);
        } else if (state && !player.hasStreamSyncedMeta(YACA_META.MEGAPHONE_ACTIVE)) {
            player.setStreamSyncedMeta(YACA_META.MEGAPHONE_ACTIVE, 30);
        }
    }

    /**
     * Kick player if he doesn't have the voice plugin activated.
     *
     * @param {alt.Player} player - The player to check for the voice plugin.
     */
    playerNoVoicePlugin(player: alt.Player) {
        //TODO: Multilanguage Support!
        if (player?.valid) player.kick("Dein Voiceplugin war nicht aktiviert!");
    }

    /**
     * Used if a player reconnects to the server.
     *
     * @param {alt.Player} player - The player who reconnected.
     * @param {boolean} isFirstConnect - Whether this is the player's first connection.
     */
    playerReconnect(player: alt.Player, isFirstConnect: boolean) {
        if (!player?.valid || !player.voiceSettings.voiceFirstConnect) return;

        if (!isFirstConnect) {
            const name = this.generateRandomName(player);
            if (!name) return;

            YaCAServerModule.nameSet.delete(player.voiceSettings?.ingameName);
            player.voiceSettings.ingameName = name;
        }

        this.connect(player);
    }

    /**
     * Change the voice range of a player.
     *
     * @param {alt.Player} player - The player whose voice range is to be changed.
     * @param {number} range - The new voice range.
     */
    changeVoiceRange(player: alt.Player, range: number) {
        // Sanitycheck to prevent hackers or shit
        //TODO Make max range configurable!
        if (player.voiceSettings.maxVoiceRangeInMeter < range) return player.emitRaw(YACA_EVENTS.CLIENT_SET_MAX_VOICE_RANGE, 15);

        player.voiceSettings.voiceRange = range;
        player.setStreamSyncedMeta(YACA_META.VOICE_RANGE, player.voiceSettings.voiceRange);

        if (player.voiceplugin) player.voiceplugin.range = range;
    }

    /**
     * Sends initial data needed to connect to teamspeak plugin.
     *
     * @param {alt.Player} player - The player to connect.
     */
    connect(player: alt.Player) {
        player.voiceSettings.voiceFirstConnect = true;

        player.emitRaw(YACA_EVENTS.CLIENT_INIT, {
            suid: settings.UNIQUE_SERVER_ID,
            chid: settings.CHANNEL_ID,
            deChid: settings.DEFAULT_CHANNEL_ID,
            channelPassword: settings.CHANNEL_PASSWORD,
            ingameName: player.voiceSettings.ingameName,
            useWhisper: settings.USE_WHISPER
        });
    }

    /**
     * Add new player to all other players on connect or reconnect, so they know about some variables.
     *
     * @param {alt.Player} player - The player to add.
     * @param {number} clientId - The client ID of the player.
     */
    addNewPlayer(player: alt.Player, clientId: number) {
        if (!player?.valid || !clientId) return;

        player.voiceplugin = {
            clientId: clientId,
            forceMuted: player.voiceSettings.forceMuted,
            range: player.voiceSettings.voiceRange,
            playerId: player.id,
            mutedOnPhone: player.voiceSettings.mutedOnPhone
        };

        player.setStreamSyncedMeta(YACA_META.VOICE_RANGE, player.voiceSettings.voiceRange);

        alt.emitAllClientsRaw(YACA_EVENTS.CLIENT_ADD_PLAYERS, player.voiceplugin);

        const allPlayers = alt.Player.all;
        let allPlayersData = [];
        for (const playerServer of allPlayers) {
            if (!playerServer.voiceplugin || playerServer.id == player.id) continue;

            allPlayersData.push(playerServer.voiceplugin);
        }

        player.emitRaw(YACA_EVENTS.CLIENT_ADD_PLAYERS, allPlayersData);
    }

    /* ======================== RADIO SYSTEM ======================== */
    /**
     * Checks if a player is permitted to use long radio.
     *
     * @param {alt.Player} player - The player to check.
     */
    static isLongRadioPermitted(player: alt.Player) {
        player.radioSettings.hasLong = true //Add some checks if you want shortrange system;
    }

    /**
     * Enable or disable the radio for a player.
     *
     * @param {alt.Player} player - The player to enable or disable the radio for.
     * @param {boolean} state - The new state of the radio.
     */
    enableRadio(player: alt.Player, state: boolean) {
        if (!player?.valid) return;

        player.radioSettings.activated = state;
        YaCAServerModule.isLongRadioPermitted(player);
    }

    /**
     * Change the radio frequency for a player.
     *
     * @param {alt.Player} player - The player to change the radio frequency for.
     * @param {number} channel - The channel to change the frequency of.
     * @param {string} frequency - The new frequency.
     */
    changeRadioFrequency(player: alt.Player, channel: number, frequency: string) {
        if (!player?.valid) return;
        if (!player.radioSettings.activated) return AthenaServer.player.emit.notification(player, AthenaServer.locale.get(player, LOCALES_KEYS.RADIO_IS_OFF));
        if (isNaN(channel) || channel < 1 || channel > settings.maxRadioChannels) return AthenaServer.player.emit.notification(player, AthenaServer.locale.get(player, LOCALES_KEYS.RADIO_CHANNEL_ERROR));

        // Leave radiochannel if frequency is 0
        if (frequency == "0") return YaCAServerModule.getInstance().leaveRadioFrequency(player, channel, frequency);

        if (player.radioSettings.frequencies[channel] != frequency){
            YaCAServerModule.getInstance().leaveRadioFrequency(player, channel, player.radioSettings.frequencies[channel]);
        }

        // Add player to channel map, so we know who is in which channel
        if (!YaCAServerModule.radioFrequencyMap.has(frequency)) { 
            YaCAServerModule.radioFrequencyMap.set(frequency, new Map());
        }

        YaCAServerModule.radioFrequencyMap.get(frequency).set(player.id, { muted: false });

        player.radioSettings.frequencies[channel] = frequency;

        player.emitRaw("client:yaca:setRadioFreq", channel, frequency)

        //TODO: Add radio effect to player in new frequency
        // const newPlayers = this.getPlayersInRadioFrequency(frequency);
        // if (newPlayers.length) alt.emitClientRaw(newPlayers, "client:yaca:setRadioEffectInFrequency", frequency, player.id);
    }

    /**
     * Make a player leave a radio frequency.
     *
     * @param {alt.Player} player - The player to make leave the radio frequency.
     * @param {number} channel - The channel to leave.
     * @param {string} frequency - The frequency to leave.
     */
    leaveRadioFrequency(player: alt.Player, channel: number, frequency: string) {
        if (!player?.valid) return;

        frequency = frequency == "0" ? player.radioSettings.frequencies[channel] : frequency;

        if (!YaCAServerModule.radioFrequencyMap.has(frequency)) return;

        const allPlayersInChannel = YaCAServerModule.radioFrequencyMap.get(frequency);

        player.radioSettings.frequencies[channel] = "0";

        let players = [];
        let allTargets = [];

        allPlayersInChannel.forEach((value, key) => {
            const target = alt.Player.getByID(key);
            if (!target?.valid) return;
        
            players.push(target);
        
            if (key === player.id) return;
        
            allTargets.push(target.id);
        });

        //TODO: to clarfiy why this is not working!
        // for (const [key, value] of allPlayersInChannel) {
        //     const target = alt.Player.getByID(key)
        //     if (!target?.valid) continue;

        //     players.push(target);

        //     if (key == player.id) continue;

        //     allTargets.push(target.id);
        // }

        if (!settings.USE_WHISPER && players.length) alt.emitClientRaw(players, YACA_EVENTS.CLIENT_LEAVE_RADIO_CHANNEL, player.voiceplugin.clientId, frequency);
        if (settings.USE_WHISPER) alt.emitClientRaw(player, YACA_EVENTS.CLIENT_RADIO_TALKING_WHISPER, allTargets, false);

        allPlayersInChannel.delete(player.id);
        if (!YaCAServerModule.radioFrequencyMap.get(frequency).size) YaCAServerModule.radioFrequencyMap.delete(frequency)
    }

    /**
     * Mute a radio channel for a player.
     *
     * @param {alt.Player} player - The player to mute the radio channel for.
     * @param {number} channel - The channel to mute.
     */
    radioChannelMute(player: alt.Player, channel: number) {
        if (!player?.valid) return;

        const radioFrequency = player.radioSettings.frequencies[channel];
        const foundPlayer = YaCAServerModule.radioFrequencyMap.get(radioFrequency)?.get(player.id);
        if (!foundPlayer) return;

        foundPlayer.muted = !foundPlayer.muted;
        player.emitRaw(YACA_EVENTS.CLIENT_RADIO_MUTE_STATE, channel, foundPlayer.muted)
    }

    /**
     * Change the active radio channel for a player.
     *
     * @param {alt.Player} player - The player to change the active radio channel for.
     * @param {number} channel - The new active channel.
     */
    radioActiveChannelChange(player: alt.Player, channel: number) {
        if (!player?.valid || isNaN(channel) || channel < 1 || channel > settings.maxRadioChannels) return;

        player.radioSettings.currentChannel = channel;
    }

    /**
     * Change the talking state of a player on the radio.
     *
     * @param {alt.Player} player - The player to change the talking state for.
     * @param {boolean} state - The new talking state.
     */
    radioTalkingState(player: alt.Player, state: boolean) {
        if (!player?.valid) return;
        if (!player.radioSettings.activated) return;

        const radioFrequency = player.radioSettings.frequencies[player.radioSettings.currentChannel];
        if (!radioFrequency) return;

        const playerID = player.id;

        const getPlayers = YaCAServerModule.radioFrequencyMap.get(radioFrequency);
        let targets = [];
        let targetsToSender = [];
        let radioInfos: RadioInfos = {};

        getPlayers.forEach((values, key) => {
            if (values.muted) {
                if (key == player.id) {
                    targets = [];
                    return;  // Equivalent to 'break' in a 'for' loop
                }
                return;  // Equivalent to 'continue' in a 'for' loop
            }
        
            if (key == playerID) return;  // Equivalent to 'continue' in a 'for' loop
        
            const target = alt.Player.getByID(key);
            if (!target?.valid || !target.radioSettings.activated) return;  // Equivalent to 'continue' in a 'for' loop
        
            const shortRange = !player.radioSettings.hasLong && !target.radioSettings.hasLong;
            if ((player.radioSettings.hasLong && target.radioSettings.hasLong) || shortRange) {
                targets.push(target);
        
                radioInfos[target.id] = {
                    shortRange: shortRange,
                };
        
                targetsToSender.push(target.id);
            }
        });
        
        //TODO: Clarfiy why this is not working!
        // for (const [key, values] of getPlayers) {
        //     if (values.muted) {
        //         if (key == player.id) {
        //             targets = [];
        //             break;
        //         }
        //         continue;
        //     }

        //     if (key == playerID) continue;

        //     const target = alt.Player.getByID(key)
        //     if (!target?.valid || !target.radioSettings.activated) continue;

        //     const shortRange = !player.radioSettings.hasLong && !target.radioSettings.hasLong;
        //     if ((player.radioSettings.hasLong && target.radioSettings.hasLong)
        //         || shortRange
        //     ) {
        //         targets.push(target);

        //         radioInfos[target.id] = {
        //             shortRange: shortRange,
        //         }

        //         targetsToSender.push(target.id);
        //     }
        // }

        if (targets.length) alt.emitClientRaw(targets, YACA_EVENTS.CLIENT_RADIO_TALKING, player.id, radioFrequency, state, radioInfos);
        if (settings.USE_WHISPER) alt.emitClientRaw(player, YACA_EVENTS.CLIENT_RADIO_TALKING_WHISPER, targetsToSender, state);
    };

    /* ======================== PHONE SYSTEM ======================== */
    /**
     * Call another player.
     *
     * @param {alt.Player} player - The player who is making the call.
     * @param {alt.Player} target - The player who is being called.
     * @param {boolean} state - The state of the call.
     */
    callPlayer(player: alt.Player, target: alt.Player, state: boolean) {
        if (!player?.valid || !target?.valid) return;

        alt.emitClientRaw(target, YACA_EVENTS.CLIENT_PHONE, player.id, state);
        alt.emitClientRaw(player, YACA_EVENTS.CLIENT_PHONE, target.id, state);

        if (!state) {
            this.muteOnPhone(player, false, true);
            this.muteOnPhone(target, false, true);

            player.voiceSettings.inCallWith.push(target.id);
            target.voiceSettings.inCallWith.push(player.id);
        } else {
            if (player.hasStreamSyncedMeta(YACA_META.PHONE_SPEAKER)) this.enablePhoneSpeaker(player, true, [player.id, target.id]);

            player.voiceSettings.inCallWith = player.voiceSettings.inCallWith.filter(id => id !== target.id);
            target.voiceSettings.inCallWith = target.voiceSettings.inCallWith.filter(id => id !== player.id);
        }
    }

    /**
     * Apply the old effect to a player during a call.
     *
     * @param {alt.Player} player - The player to apply the old effect to.
     * @param {alt.Player} target - The player on the other end of the call.
     * @param {boolean} state - The state of the call.
     */
    callPlayerOldEffect(player: alt.Player, target: alt.Player, state: boolean) {
        if (!player?.valid || !target?.valid) return;

        alt.emitClientRaw(target, YACA_EVENTS.CLIENT_PHONE_OLD, player.id, state);
        alt.emitClientRaw(player, YACA_EVENTS.CLIENT_PHONE_OLD, target.id, state);

        if (!state) {
            this.muteOnPhone(player, false, true);
            this.muteOnPhone(target, false, true);

            player.voiceSettings.inCallWith.push(target.id);
            target.voiceSettings.inCallWith.push(player.id);
        } else {
            if (player.hasStreamSyncedMeta(YACA_META.PHONE_SPEAKER)) this.enablePhoneSpeaker(player, true, [player.id, target.id]);

            player.voiceSettings.inCallWith = player.voiceSettings.inCallWith.filter(id => id !== target.id);
            target.voiceSettings.inCallWith = target.voiceSettings.inCallWith.filter(id => id !== player.id);
        }
    }

    /**
     * Mute a player during a phone call.
     *
     * @param {alt.Player} player - The player to mute.
     * @param {boolean} state - The mute state.
     * @param {boolean} [onCallStop=false] - Whether the call has stopped. Defaults to false if not provided.
     */
    muteOnPhone(player: alt.Player, state: boolean, onCallStop: boolean = false) {
        if (!player?.valid) return;

        player.voiceSettings.mutedOnPhone = state;
        alt.emitAllClientsRaw(YACA_EVENTS.CLIENT_PHONE_MUTE, player.id, state, onCallStop);
    }

    /**
     * Enable or disable the phone speaker for a player.
     *
     * @param {alt.Player} player - The player to enable or disable the phone speaker for.
     * @param {boolean} state - The state of the phone speaker.
     * @param {number[]} phoneCallMemberIds - The IDs of the members in the phone call.
     */
    enablePhoneSpeaker(player: alt.Player, state: boolean, phoneCallMemberIds: number[]) {
        if (!player?.valid) return;

        if (state) {
            player.setStreamSyncedMeta(YACA_META.PHONE_SPEAKER, phoneCallMemberIds);
        } else {
            player.deleteStreamSyncedMeta(YACA_META.PHONE_SPEAKER);
        }
    }
}
