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
    targetButtons: {},

    /**
     * ready before initialize
     */
    ready: function() {
        var me = this;

        if (me.isReady) { return; }

        chrome.extension.sendMessage({
                // load buttons settings from json file
                targetButtons: null,
                // load user settings from extension sync storage
                userSettings: null,
                // show pageAction icon
                showPageAction: null
            },
            function(res) {
                me.setupTargetButtons(res.targetButtons);
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
     * setup button settings from buttons_default.json
     */
    setupTargetButtons: function(buttonJson) {
        var me = this,
            $ = document.querySelectorAll.bind(document);

        // add key:value pair under listed
        //  clickTarget: dom element matches selector and idx in settings
        //  captionTarget: dom element matches selector and idx in settings
        me.iterateObject(buttonJson, function(name, settings) {
            var cli = settings.clickTarget,
                cap = settings.captionTarget;

            settings.elm = $(cli.selector)[cli.idx || 0];
            if (cap) {
                settings.capElm = $(cap.selector)[cap.idx || 0];
            }

            // remove if the button no longer exists
            if (!settings.elm) { delete buttonJson[name]; }
        });

        me.targetButtons = buttonJson;
    },

    /**
     * apply user custom settings to extension
     */
    applyUserSettings: function() {
        var me = this,
            userSettings = me.userSettings;

        // apply user customization to button settings
        me.iterateObject(userSettings, function(name, setting) {
            var btn = me.targetButtons[name];

            // continue the button no longer exists
            if (!btn) { return; }

            Object.assign(btn, {
                shortcutKey: setting.shortcutKey && setting.shortcutKey.toLowerCase(),
                // alt: setting.alt,
                shift: setting.shift
            });
        });
    },

    /**
     * display shortcut key character to each button
     */
    setKeyCaption: function() {
        var me = this;

        me.iterateObject(me.targetButtons, function(name, btn) {
            var key = btn.shortcutKey;

            // continue if shortcut key is not assigned
            if (!key) { return; }

            if (btn.shift === true) {
                key = key.toUpperCase();
            }

            // set data-key-navi attribute
            (btn.capElm || btn.elm).dataset.keyNavi = '(' + key + ')';
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
     * initialize {"shortcut key": "button selector"} map
     */
    initKeyMaps: function() {
        var me = this,
            r = new RegExp(), keys = '', key;

        me.iterateObject(me.targetButtons, function(name, btn) {
            var key = btn.shortcutKey,
                elm = btn.elm;

            if (!key) { return; }

            // [alt] + [shift] + key
            if (btn.shift === true) {
                me.altShiftTarget[key] = elm;
                return;
            }
            // [alt] + key
            if (btn.alt === true) {
                me.altTarget[key] = elm;
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
            translateBtn = me.targetButtons.translate.elm;

        document.onkeydown = function(evt) {
            var btn;

            // shift + enter => translate button
            if (evt.shiftKey && evt.keyCode == 13) {
                window.setTimeout(function() {
                    translateBtn.focus();
                }, 0);
                translateBtn.click();
                evt.preventDefault();
                return;
            }

            btn = me.getAssignedButton(evt);

            if (btn) {
                me.emulateClick(btn);
                evt.preventDefault();
            }
        };
    },

    /**
     * return target button assigned the event
     * @param  {Event}  evt  triggered event
     * @return {Object} button (return undefined if not assigned any)
     */
    getAssignedButton: function(evt) {
        var me = this,
            key = String.fromCharCode(evt.keyCode).toLowerCase(),
            btn;

        // continue only if [alt] + (registered key) is pressed
        if (!key.match(me.keysRegExp) || !evt.altKey) { return; }

        if (evt.shiftKey) {
            btn = me.altShiftTarget[key];
        }

        if (!btn) {
            btn = me.altTarget[key];
        }

        return btn;
    },

    /**
     * emulate click event
     * @param  {Object} elm HTML Element
     */
    emulateClick: function(elm) {
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
    }
};

// document.addEventListener('DOMContentLoaded', KS4GT_CS.init.bind(KS4GT_CS));
KS4GT_CS.init();
