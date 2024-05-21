<template>
    <v-app>
        <div class="radioDiv">
            <div class="content">
                <img
                        alt=" "
                        :src="ResolvePath(`@plugins/images/gp-voice-yaca/radio.png`)"
                        class="radio_responsive"
                        :width="xlAndDown ? 150 : 200"
                />
                <!-- <v-img :src="values.radiobackground" :width="xlAndDown ? 150 : 200"></v-img> -->
                <div class="btnOverContent">
                    <v-row no-gutters>
                        <v-col cols="6" class="clickCols" :style="[xlAndDown ? 'height: 50px' : 'height: 65px']"
                            @click="btnExecute('volumeUp')" @contextmenu.prevent="btnExecuteRightClick('volumeDown')">
                        </v-col>
                        <v-col cols="6"
                            :style="[xlAndDown ? 'height: 50px' : 'height: 35px', 'align-self: end', 'display: flex', 'flex-wrap: wrap']"
                            class="clickCols" @click="btnExecute('onOff')">
                        </v-col>
                    </v-row>
                </div>
                <div class="btnContent">
                    <v-row no-gutters v-for="(button, index) in btn" :key="index">
                        <v-col cols="4" :style="[xlAndDown ? 'height: 25px' : 'height: 30px']" v-for="item in button"
                            :key="item.key" @click="btnExecute(item.key)" class="clickCols"></v-col>
                    </v-row>
                </div>
                <div class="activeRadio" v-if="isRadioActive" :style="['background-color: ' + color + '']">
                    <div class="volumeContent">
                        <v-row no-gutters v-for="item in volume" :key="item">
                            <v-col cols="12" class="radioVolume"></v-col>
                        </v-row>
                    </div>
                    <v-row no-gutters align="center" justify="center">
                        <v-col cols="12">
                            <div class="modeContent">
                                {{ "C" + channel }}
                            </div>
                        </v-col>
                        <v-col cols="12" style="padding: 0 1rem">
                            <v-divider class="border-opacity-50"></v-divider>
                        </v-col>
                        <v-col cols="12">
                            <div class="frequenzContent">
                                <input v-model="frequency" class="inputFrequenz" type="text"
                                    @input="event => frequenzRule(event.target['value'])"
                                    @focusin="handleInputFocus(true)"
                                    @focusout="handleInputFocus(false)"
                                />
                            </div>
                        </v-col>
                    </v-row>
                </div>
                <div v-else class="deactiveRadio"></div>
            </div>
        </div>
    </v-app>
</template>

<script lang="ts" set>
import WebViewEvents from '@ViewUtility/webViewEvents.js';
import { defineComponent } from 'vue';
import { useDisplay } from 'vuetify';
import ResolvePath from '@utility/pathResolver.js';
import { YACA_EVENTS } from '../shared/events';

const ComponentName = YACA_EVENTS.WEBVIEW_RADIO_VIEW_NAME;

// const { xlAndDown } = useDisplay();

export default defineComponent({
    name: ComponentName,
    components: {
    },
    data() {
        return {
            xlAndDown: useDisplay(),
            // isRadioOpen: false,
            isRadioActive: false,
            frequency: "0",
            frequencyValid: false,
            frequencyRegex: /^[0-9]{1,4},[0-9]{1,3}$/,
            channel: 1,
            maxChannel: 9,
            color: '#7c9d7d',
            volume: 6,
            maxVolumeSteps: 6,
            antiSpam: +new Date() - 1500,
            strgKeyDown: false,
            btn: [
                [
                    {
                        key: 'stereo_setting'
                    },
                    {
                        key: 'channel_up'
                    },
                    {
                        key: 'setFrequency'
                    },
                ],
                [
                    {
                        key: '' //TODO: speaker_setting
                    },
                    {
                        key: 'channel_down'
                    },
                    {
                        key: ''
                    },
                ]
            ]
        };
    },
    mounted() {
        if ('alt' in window) {
            if (!this.init) {
                //Not fresh page
                this.init = true;
                WebViewEvents.on(YACA_EVENTS.WEBVIEW_OPEN_STATE, this.openState);
                WebViewEvents.on(YACA_EVENTS.WEBVIEW_SET_CHANNEL_DATA, this.setChannelData);
                WebViewEvents.emitClient(YACA_EVENTS.WEBVIEW_RADIO_READY, this.ComponentName);
            }
        }
    },
    computed: {
        
    },
    methods: {
        ResolvePath,
        frequenzRule(value: string) {
            if ((this.frequencyRegex).test(value)) {
                this.color = '#7c9d7d';
                this.frequencyValid = true;
            } else {
                this.color = 'red';
                this.frequencyValid = false;
            }
        },
        btnExecuteRightClick (mode: string) {
            if (mode == "volumeDown") return this.volumeChange(mode);
        },
        btnExecute(mode: string) {
            if (!this.isRadioActive && mode != "onOff") return;

            switch (mode) {
                case "onOff":
                    if (this.antiSpam + 1500 > +new Date()) return;

                    if (this.isRadioActive) {
                        WebViewEvents.emitClient(YACA_EVENTS.WV_CLIENT_ENABLE_RADIO, false);
                    } else {
                        WebViewEvents.emitClient(YACA_EVENTS.WV_CLIENT_ENABLE_RADIO, true);
                    }

                    this.isRadioActive = !this.isRadioActive;
                    this.antiSpam = +new Date();
                    break;
                case "stereo_setting":
                    WebViewEvents.emitClient(YACA_EVENTS.WV_CLIENT_CHANGE_RADIO_CHANNEL_STEREO);
                    break;
                case "setFrequency":
                    if (!this.frequencyValid) return;
                    WebViewEvents.emitClient(YACA_EVENTS.WV_CLIENT_CHANGE_RADIO_FREQUENCY, this.frequency);
                    break;
                case "channel_up":
                case "channel_down":
                    this.channelSwitch(mode == "channel_up");
                    break;
                case "volumeUp":
                    this.volumeChange(mode);
                    break;
                case "speaker_setting":
                    WebViewEvents.emitClient(YACA_EVENTS.WV_CLIENT_CHANGE_RADIO_SPEAKER);
                    break;
            }
        },
        channelSwitch(up = true) {
            if (up) {
                this.channel++;
                if (this.channel > this.maxChannel) this.channel = 1;
            } else {
                this.channel--;
                if (this.channel < 1) this.channel = this.maxChannel;
            }
            WebViewEvents.emitClient(YACA_EVENTS.WV_CLIENT_CHANGE_ACTIVE_RADIO_CHANNEL, this.channel);
        },
        volumeChange(mode: string) {
            WebViewEvents.emitClient(YACA_EVENTS.WV_CLIENT_CHANGE_RADIO_CHANNEL_VOLUME, mode == "volumeUp");
        },
        handleInputFocus(state: boolean) {
            //TODO: no receiver!
            WebViewEvents.emitClient(YACA_EVENTS.WV_CLIENT_HARD_BLOCK_ALL_KEYS, "ui:radio", state);
        }
    },
});

</script>

<style scoped>
.radioDiv {
    position: fixed;
    top: 5rem;
    left: 4rem;
    height: 100vh;
    display: flex;
    justify-content: start;
    align-items: center;
}

.content {
    position: relative;
    left: 5rem;
    bottom: 10rem;
}

@media(min-width: 2560px) {
    .content {
        left: 5rem;
        bottom: 16rem;
    }
}

.activeRadio {
    font-family: 'DSEG7 Modern';
    width: 114px;
    height: 60px;
    position: absolute;
    left: 18px;
    top: 190px;
    font-size: 0.75rem;
    line-height: 0;
    text-shadow: 2px 2px 2px #116119;
    color: #21311d;
}

@media(min-width: 2560px) {
    .activeRadio {
        width: 152px;
        height: 79px;
        left: 24px;
        top: 253px;
        font-size: 1rem;
        line-height: 0.25rem;
    }
}

.deactiveRadio {
    background-color: black;
    width: 114px;
    height: 60px;
    position: absolute;
    left: 18px;
    top: 190px;
    font-size: 0.75rem;
    line-height: 0;
}

@media(min-width: 2560px) {
    .deactiveRadio {
        width: 152px;
        height: 79px;
        left: 24px;
        top: 253px;
    }
}

.frequenzContent {
    font-size: 1.25rem;
    display: flex;
    justify-content: center;
}

.inputFrequenz {
    color: #21311d;
    text-align: center;
    padding: 2px;
    font-size: 0.75rem;
    width: 100px;
    text-shadow: 2px 2px 2px #116119;
}

@media(min-width: 2560px) {
    .inputFrequenz {
        font-size: 1rem;
    }
}

.inputFrequenz:focus {
    outline: none;
}

.inputFrequenz::-webkit-outer-spin-button,
.inputFrequenz::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.btnContent {
    position: absolute;
    width: 100px;
    height: 50px;
    top: 255px;
    left: 25px;
}

@media (min-width: 2560px) {
    .btnContent {
        width: 130px;
        height: 60px;
        top: 342px;
        left: 35px;
    }
}

.btnOverContent {
    position: absolute;
    width: 100px;
    height: 50px;
    top: 100px;
    left: 45px;
}


@media (min-width: 2560px) {
    .btnOverContent {
        width: 132px;
        height: 65px;
        top: 130px;
        left: 60px;
    }
}

.clickCols {
    cursor: pointer;
}

.radioVolume {
    position: relative;
    display: block;
    float: left;
    width: 5px;
    height: 5px;
    margin: 2px;
    background: #63d265;
}

@media (min-width: 2560px) {
    .radioVolume {
        width: 7px;
        height: 7px;
    }
}

.volumeContent {
    position: absolute;
    display: block;
    top: 0px;
    left: 2px;
    padding: 2px;
    width: 9px;
    height: 60px;
    transform: rotate(180deg);
}

@media(min-width: 2560px) {
    .volumeContent {
        height: 80px;
    }
}
</style>
