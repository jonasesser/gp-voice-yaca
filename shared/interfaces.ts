export interface iPlayerSettings {
    suid: string;
    chid: string;
    deChid: string;
    channelPassword: string;
    ingameName: string;
    useWhisper: boolean;
}

export interface FrequenceValueMap {
    muted: boolean;
}

export interface RadioInfoValue {
    shortRange: boolean;
}

export interface RadioInfos {
    [key: number]: RadioInfoValue
}

export interface PlayerLocalVoicePlugin {
    canChangeVoiceRange: boolean;
    maxVoiceRange: number;
    lastMegaphoneState: boolean;
    canUseMegaphone: boolean;
}

export interface PlayerVoicePlugin {
    remoteID?: number;
    playerId?: number;
    clientId: number;
    forceMuted: boolean;
    range: number;
    isTalking?: boolean;
    phoneCallMemberIds?: number[];
    mutedOnPhone: boolean;
}

export interface PlayerVoiceSettings {
    voiceRange: number,
    voiceFirstConnect: boolean,
    maxVoiceRangeInMeter: number,
    forceMuted: boolean,
    ingameName: string,
    inCallWith: number[],
    mutedOnPhone: boolean
}

export interface PlayerRadioSettings {
    activated: boolean,
    currentChannel: number,
    hasLong: boolean,
    frequencies: { [key: number]: string }
}