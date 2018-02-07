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

    /**
     * ready before initialize
     */
    ready: function() {
        const me = this;

        if (me.isReady) { return; }

        chrome.extension.sendMessage({
                // load default settings from json file
                defaultSettings: null,
                // load user settings from extension sync storage
                userSettings: null,
                // get runtime platform infomation
                platformInfo: null
            },
            function(res) {
                me.setupRecievers(res.defaultSettings || {});
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
    init: function() {
        const me = this;

        if (!me.isReady) {
            me.onReady = me.init.bind(me);
            me.ready();
            return;
        }

        me.setupMouseEventEmulator();

        me.applyUserSettings();

        me.initKeyMaps();
        me.listenKeyEvent();

        me.injectStyleSheet(chrome.extension.getURL('content.css'));
        me.setKeyCaption();
    },

    /**
     * setup recievers object from setting file
     * @param  {Object} settingsJson JSON of default settings
     */
    setupRecievers: function(settingsJson) {
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

            // remove if the target element no longer exists
            if (!settings.elm) { delete settingsJson[name]; }
        });

        me.recievers = settingsJson;
    },

    /**
     * apply user custom settings to extension
     */
    applyUserSettings: function() {
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
                shift: setting.shift
            });
        });
    },

    /**
     * display shortcut key character to each target
     */
    setKeyCaption: function() {
        const me = this;

        me.iterateObject(me.recievers, function(name, rcv) {
            let key = rcv.shortcutKey;

            // continue if shortcut key is not assigned
            if (!key) { return; }

            if (rcv.shift === true) {
                key = key.toUpperCase();
            }

            // set data-key-navi attribute
            (rcv.capElm || rcv.elm).dataset.keyNavi = '(' + key + ')';
        });
    },

    /**
     * inject style sheet
     * @param {String} url
     */
    injectStyleSheet: function(url) {
        const link = document.createElement('link'),
            lastLink = document.querySelectorAll('link:last-of-type')[0];

        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = url;
        lastLink.parentNode.insertBefore(link, lastLink.nextSibling);
    },

    /**
     * create mouse event emulators and set to property of KS4GT_CS
     */
    setupMouseEventEmulator: function() {
        const events = ['mousedown', 'mouseup', 'mouseout', 'mouseover', 'click'];

        for (let i = 0, e; e = events[i++];) {
            this.mouseEvent[e] =  document.createEvent('MouseEvents');
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
    initKeyMaps: function() {
        const me = this,
            re = new RegExp();
        let keys = '';

        me.iterateObject(me.recievers, function(name, rcv) {
            const key = rcv.shortcutKey,
                reciever = { elm: rcv.elm, cmd: rcv.cmd };

            if (!key) { return; }

            // [alt] + [shift] + key
            if (rcv.shift === true) {
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
    listenKeyEvent: function() {
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
    getAssignedReciever: function(evt) {
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
    emulate: function(cmd = 'mouseDownUp', elm) {
        if (elm) {
            const me = this;

            if (!cmd) {
                cmd = 'mouseDownUp';
            }

            me['emulate' + me.camelize(cmd)](elm);
        }
    },

    /**
     * emulate mousedown and mouseup (simmulate click) event
     * @param  {Object} elm HTML Element
     */
    emulateMouseDownUp: function(elm) {
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
    emulateClick: function(elm) {
        if (elm) {
            elm.click();
        }
    },

    /**
     * emulate focus
     * @param  {Object} elm HTML Element
     */
    emulateFocus: function(elm) {
        if (elm) {
            elm.focus();
        }
    },

    /**
     * iterates through an object and invokes the given callback function for each iteration
     * @param {Object}   obj  object to iterate
     * @param {Function} fn   callback function
     */
    iterateObject: function(obj, fn) {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (fn.call(obj, key, obj[key], obj) === false) {
                    return;
                }
            }
        }
    },

    camelize: function(str) {
        return str.replace(/(?:^|[-_])(\w)/g, function(_, c) {
            return c ? c.toUpperCase() : '';
        });
    }
};

// document.addEventListener('DOMContentLoaded', KS4GT_CS.init.bind(KS4GT_CS));
KS4GT_CS.init();
