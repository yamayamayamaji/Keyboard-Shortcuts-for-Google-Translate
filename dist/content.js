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
var KS4GT_CS = {
    noop: function() {},
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
        var me = this;

        if (me.isReady) { return; }

        chrome.extension.sendMessage({
                // load default settings from json file
                defaultSettings: null,
                // load user settings from extension sync storage
                userSettings: null
            },
            function(res) {
                me.setupRecievers(res.defaultSettings);
                me.userSettings = res.userSettings;

                me.isReady = true;
                me.onReady();
            }
        );
    },

    /**
     * initialize extension content script
     */
    init: function() {
        var me = this;

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
        var me = this,
            $ = document.querySelectorAll.bind(document);

        // add key:value pair under listed
        //  clickTarget: dom element matches selector and idx in settings
        //  captionTarget: dom element matches selector and idx in settings
        me.iterateObject(settingsJson, function(name, settings) {
            var cli = settings.clickTarget,
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
        var me = this,
            userSettings = me.userSettings;

        // apply user customization to default settings
        me.iterateObject(userSettings, function(name, setting) {
            var rcv = me.recievers[name];

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
        var me = this;

        me.iterateObject(me.recievers, function(name, rcv) {
            var key = rcv.shortcutKey;

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
        var link = document.createElement('link'),
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
        var events = ['mousedown', 'mouseup', 'mouseout', 'mouseover', 'click'];

        for (var i = 0, e; e = events[i++];) {
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
        var me = this,
            r = new RegExp(), keys = '', key;

        me.iterateObject(me.recievers, function(name, rcv) {
            var key = rcv.shortcutKey,
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
        for (key in me.altTarget) { keys += key }
        for (key in me.altShiftTarget) { if (keys.indexOf(key) < 0) {keys += key} }
        r.compile('^[' + keys + ']$', 'i');
        me.keysRegExp = r;
    },

    /**
     * set listeners for shortcut key event
     */
    listenKeyEvent: function() {
        var me = this,
            translateRcv = me.recievers.translate;

        document.onkeydown = function(evt) {
            var rcv, t;

            // shift + enter => translate button
            if (evt.shiftKey && evt.keyCode == 13) {
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
        var me = this,
            key = String.fromCharCode(evt.keyCode).toLowerCase(),
            reciever;

        // continue only if [alt] + (registered key) is pressed
        if (!key.match(me.keysRegExp) || !evt.altKey) { return; }

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
    emulate: function(cmd, elm) {
        if (elm) {
            var me = this,
                cmd = cmd || 'mouseDownUp' ;
            me['emulate' + me.camelize(cmd)](elm);
        }
    },

    /**
     * emulate mousedown and mouseup (simmulate click) event
     * @param  {Object} elm HTML Element
     */
    emulateMouseDownUp: function(elm) {
        if (elm) {
            var de = elm.dispatchEvent.bind(elm),
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
        for (var key in obj) {
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
