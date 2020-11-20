/*!
 * content.js
 * in "Keyboard Shortcuts for Google Translate" (Google Chrome Extension)
 * https://github.com/yamayamayamaji/Keyboard-Shortcuts-for-Google-Translate
 * Copyright 2013, Ryosuke Yamaji
 *
 * License: MIT
 */
"use strict";


/**
 * chrome extension content script manager
 * @type {Object}
 */
const KS4GT_CS = {
    mouseEvent: [],

    altTarget: {},
    altShiftTarget: {},
    keysRegExp: '',

    userSettings: {},
    recievers: {},

    NAVI_TYPE: {
        atAllTimes:    'at all times',
        whileHovering: 'while hovering',
        none:          'none'
    },

    domUpdateObserver: () => {},

    /**
     * There may be more than one version of the UI, depending on the user's environment,
     * such as a transitional period when the UI of the Google Translate page is changing.
     * Configure each version of UI here.
     */
    uiVersionConfig: {
        latest: {
            cssFileName: 'content.css',
            defaultSettingsBaseName: 'default_settings',
            /**
             * observe dom updated.
             *   if updated source footer area and result area, resetting recievers and key captions.
             *   if updated language menu button area, resetting key captions.
             */
            domUpdateObserver() {
                {
                    const sourceFooter = document.querySelector('.FFpbKc'),
                        resultContainer = document.querySelector('.dePhmb'),
                        initializer = new MutationObserver((MutationRecords, MutationObserver) => {
                            this.init();
                        });
                    sourceFooter && initializer.observe(resultContainer, {childList: true});
                    resultContainer && initializer.observe(sourceFooter, {childList: true, subtree: true});
                }
                {
                    const sourceLangMenuBtn = document.querySelectorAll('.szLmtb')[0],
                        targetLangMenuBtn = document.querySelectorAll('.szLmtb')[1],
                        captionReseter = new MutationObserver((MutationRecords, MutationObserver) => {
                            const m = MutationRecords[0];
                            if (!m.target.dataset.keyNavi) {
                                this.setKeyCaption();
                            }
                        });
                    sourceLangMenuBtn && captionReseter.observe(sourceLangMenuBtn, {subtree: true, attributeFilter: ['data-key-navi']});
                    targetLangMenuBtn && captionReseter.observe(targetLangMenuBtn, {subtree: true, attributeFilter: ['data-key-navi']});
                }
            },
        },
        202011: {
            cssFileName: 'content202011.css',
            defaultSettingsBaseName: 'default_settings202011',
            /**
             * observe dom updated in source footer area and result area.
             * if updated, resetting recievers and key captions.
            */
            domUpdateObserver() {
                const sourceFooter = document.querySelector('.source-or-target-footer'),
                    resultContainer = document.querySelector('.tlid-results-container'),
                    initializer = new MutationObserver((MutationRecords, MutationObserver) => {
                        this.init();
                    });
                sourceFooter && initializer.observe(resultContainer, {childList: true});
                resultContainer && initializer.observe(sourceFooter, {childList: true, subtree: true});
            },
        },
    },

    /**
     * ready before initialize
     */
    ready() {
        const me = this;

        if (me.isReady) { return; }

        const config = me.uiVersionConfig[me.getUiVersion()];

        me.injectStyleSheet(chrome.extension.getURL(config.cssFileName));
        me.domUpdateObserver = config.domUpdateObserver;
        me.observeDomUpdated();

        chrome.runtime.sendMessage({
                // load default settings from json file
                defaultSettings: {baseName: config.defaultSettingsBaseName},
                // load user settings from extension sync storage
                userSettings: null,
                // get runtime platform infomation
                platformInfo: null
            },
            function(res) {
                me.defaultSettings = res.defaultSettings || {};
                me.userSettings = res.userSettings || {};
                me.platformInfo = res.platformInfo || {};

                me.isReady = true;
                me.onReady();
            }
        );
    },

    /**
     * initialize extension content script
     */
    init() {
        const me = this;

        if (!me.isReady) {
            me.onReady = me.init.bind(me);
            me.ready();
            return;
        }

        me.setupMouseEventEmulator();

        me.setupRecievers(me.defaultSettings);
        me.applyUserSettings();

        me.initKeyMaps();
        me.listenKeyEvent();

        me.setKeyCaption();
    },

    /**
     * return version value indicating the version of Google Translate Page UI
     * @return {String} value indicating the version
     */
    getUiVersion() {
        if (document.querySelector('.jfk-button')) {
            return '202011';
        }
        return 'latest';
    },

    /**
     * observe dom updated.
     */
    observeDomUpdated() {
        this.domUpdateObserver();
    },

    /**
     * setup recievers object from setting file
     * @param  {Object} settingsJson JSON of default settings
     */
    setupRecievers(settingsJson) {
        const me = this,
            $ = document.querySelectorAll.bind(document);

        // add key:value pair under listed
        //  clickTarget: dom element matches selector and idx in settings
        //  captionTarget: dom element matches selector and idx in settings
        me.iterateObject(settingsJson, function(name, settings) {
            const cli = settings.clickTarget,
                cap = settings.captionTarget;

            settings.elm = $(cli.selector)[cli.idx || 0];
            if (cap) {
                settings.capElm = $(cap.selector)[cap.idx || 0];
            }
        });

        me.recievers = settingsJson;
    },

    /**
     * apply user custom settings to extension
     */
    applyUserSettings() {
        const me = this,
            userSettings = me.userSettings;

        // apply user customization to default settings
        me.iterateObject(userSettings, function(name, setting) {
            const rcv = me.recievers[name];

            // skip if the target element no longer exists
            if (!rcv) { return; }

            Object.assign(rcv, {
                shortcutKey: setting.shortcutKey && setting.shortcutKey.toLowerCase(),
                // alt: setting.alt,
                shift: setting.shift,
                naviDisp: setting.naviDisp
            });
        });
    },

    /**
     * display shortcut key character to each target
     */
    setKeyCaption() {
        const me = this,
            altCaption = (me.platformInfo.os === chrome.runtime.PlatformOs.MAC) ?
                        'option' : 'alt';

        me.iterateObject(me.recievers, function(name, rcv) {
            let key = rcv.shortcutKey;

            // continue if shortcut key is not assigned
            if (!key) { return; }

            const elm = rcv.capElm || rcv.elm;

            // continue if reciever element is not exists
            if (!elm) { return; }

            // set key navigation display
            switch (rcv.naviDisp) {
            case me.NAVI_TYPE.none:
                return;

            case me.NAVI_TYPE.whileHovering:
                let keyCombs = [];

                if (rcv.alt) { keyCombs.push(altCaption); }
                if (rcv.shift) { keyCombs.push('shift'); }
                keyCombs.push(key);

                if (!elm.dataset.tooltip) {
                    elm.dataset.tooltip = '';
                }
                elm.dataset.tooltip += `(${keyCombs.join(' + ')})`;
                break;

            // me.NAVI_TYPE.atAllTimes or undefined
            default:
                if (rcv.shift === true) {
                    key = key.toUpperCase();
                }

                // set data-key-navi attribute
                elm.dataset.keyNavi = `(${key})`;

                elm.classList.add('navi');
                break;
            }
        });
    },

    /**
     * inject style sheet
     * @param {String} url
     */
    injectStyleSheet(url) {
        const lastLink = document.querySelector('link:last-of-type');
        if (!lastLink) { return; }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = url;
        lastLink.parentNode.insertBefore(link, lastLink.nextSibling);
    },

    /**
     * create mouse event emulators and set to property of KS4GT_CS
     */
    setupMouseEventEmulator() {
        const events = ['mousedown', 'mouseup', 'mouseout', 'mouseover', 'click'];

        for (let i = 0, e; e = events[i++];) {
            this.mouseEvent[e] = document.createEvent('MouseEvents');
            this.mouseEvent[e].initEvent(e, true, false);
        }
    },

    /**
     * initialize shortcutkey-reciever map
     * {"shortcut key": {
     *     elm: "target element",
     *     cmd: "emulate command"
     * }}
     */
    initKeyMaps() {
        const me = this,
            re = new RegExp();
        let keys = '';

        me.iterateObject(me.recievers, function(name, rcv) {
            const key = rcv.shortcutKey,
                reciever = { elm: rcv.elm, cmd: rcv.cmd };

            if (!key) { return; }

            // [alt] + [shift] + key
            if (rcv.alt === true && rcv.shift === true) {
                me.altShiftTarget[key] = reciever;
                return;
            }
            // [alt] + key
            if (rcv.alt === true) {
                me.altTarget[key] = reciever;
            }
        });

        // cache keys regexp
        for (let key in me.altTarget) { keys += key }
        for (let key in me.altShiftTarget) { if (keys.indexOf(key) < 0) {keys += key} }
        re.compile('^[' + keys + ']$', 'i');
        me.keysRegExp = re;
    },

    /**
     * set listeners for shortcut key event
     */
    listenKeyEvent() {
        const me = this,
            translateRcv = me.recievers.translate;

        document.onkeydown = function(evt) {
            let rcv, t;

            // shift + enter => translate button
            if (evt.shiftKey && evt.key == 'Enter') {
                window.setTimeout(function() {
                    translateRcv.elm.focus();
                }, 0);
                rcv = { elm: translateRcv.elm, cmd: translateRcv.cmd };
            } else if (evt.key == 'Escape') {
                for (const cand of Object.values(me.recievers)) {
                    if (cand.shortcutKey !== 'ESC') { continue; }
                    const elm = document.querySelector(cand.clickTarget.selector);
                    // check element is visible 
                    if (elm && elm.offsetParent) {
                        rcv = { elm: elm, cmd: cand.cmd };
                        break;
                    }
                }
            } else {
                rcv = me.getAssignedReciever(evt);
            }

            if (rcv) {
                me.emulate(rcv.cmd, rcv.elm);
                evt.preventDefault();
            }
        };
    },

    /**
     * return target reciever info (element, command) assigned the event
     * @param  {Event}  evt  triggered event
     * @return {Object} reciver info (return undefined if not assigned any)
     */
    getAssignedReciever(evt) {
        const me = this,
            pivotKeyPressed = (me.platformInfo.os === chrome.runtime.PlatformOs.MAC) ?
                                evt.altKey || evt.ctrlKey : evt.altKey

        if (!pivotKeyPressed) { return; }

        let key = evt.key.toLowerCase(),
            reciever;

        // If there is no shortcut key matching the input character
        // Look for a shortcut key that matches the physical key
        // (on a QWERTY layout keyboard)
        if (!key.match(me.keysRegExp)) {
            const code = evt.code;
            if (code.match(/^(Key|Digit|Numpad)/)) {
                const physicalKey = code.slice(-1).toLowerCase();
                if (physicalKey.match(me.keysRegExp)) {
                    key = physicalKey;
                } else {
                    return;
                }
            }
        }

        if (evt.shiftKey) {
            reciever = me.altShiftTarget[key];
        }

        if (!reciever) {
            reciever = me.altTarget[key];
        }

        return reciever;
    },

    /**
     * emulate specified event
     * @param  {Srting} cmd name of emulate event
     * @param  {Object} elm HTML Element
     */
    emulate(cmd = 'click', elm) {
        if (elm) {
            this['emulate' + this.camelize(cmd)](elm);
        }
    },

    /**
     * emulate mousedown and mouseup (simmulate click) event
     * @param  {Object} elm HTML Element
     */
    emulateMouseDownUp(elm) {
        if (elm) {
            const de = elm.dispatchEvent.bind(elm),
                me = this.mouseEvent;
            de(me['mouseover']);
            de(me['mousedown']);
            de(me['mouseup']);
            de(me['mouseout']);
        }
    },

    /**
     * emulate click
     * @param  {Object} elm HTML Element
     */
    emulateClick(elm) {
        if (elm) {
            elm.click();
        }
    },

    /**
     * emulate focus
     * @param  {Object} elm HTML Element
     */
    emulateFocus(elm) {
        if (elm) {
            elm.focus();
        }
    },

    /**
     * iterates through an object and invokes the given callback function for each iteration
     * @param {Object}   obj  object to iterate
     * @param {Function} fn   callback function
     */
    iterateObject(obj, fn) {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (fn.call(obj, key, obj[key], obj) === false) {
                    return;
                }
            }
        }
    },

    camelize(str) {
        return str.replace(/(?:^|[-_])(\w)/g, function(_, c) {
            return c ? c.toUpperCase() : '';
        });
    }
};

// document.addEventListener('DOMContentLoaded', KS4GT_CS.init.bind(KS4GT_CS));
KS4GT_CS.init();
