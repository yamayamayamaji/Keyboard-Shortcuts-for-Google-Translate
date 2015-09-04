/*!
 * content.js
 * in "Keyboard Shortcuts for Google Translate" (Google Chrome Extension)
 * https://github.com/yamayamayamaji/Keyboard-Shortcuts-for-Google-Translate
 * Copyright 2013, Ryosuke Yamaji
 *
 * License: MIT
 */
"use strict";

var util = {
    /**
     * capitalize string
     * @param  {String} str  target string
     * @return {String} capitalized string
     */
    capitalize: function(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
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


/**
 * chrome extension content script manager
 * @type {Object}
 */
var KS4GT = {
    STORAGE_KEY: 'ks4gt',

    noop: function() {},
    mouseEvent: [],

    altTarget: {},
    altShiftTarget: {},
    keysRegExp: '',
    userSettings: {},

    /**
     * shortcut key target buttons 
     */
    targetButtons: (function() {
        var $ = document.getElementById.bind(document),
            $$ = document.querySelectorAll.bind(document),
            langButtons = $$('#gt-langs .jfk-button:not([aria-hidden="true"]):not(#gt-swap):not(#gt-submit)');

        var buttons = {
            swap:       { shortcutKey: '0', alt: true, elm: $('gt-swap') },
            lang1:      { shortcutKey: '1', alt: true, elm: langButtons[0] },
            lang2:      { shortcutKey: '2', alt: true, elm: langButtons[1] },
            lang3:      { shortcutKey: '3', alt: true, elm: langButtons[2] },
            lang4:      { shortcutKey: '4', alt: true, elm: langButtons[3] },
            lang5:      { shortcutKey: '5', alt: true, elm: langButtons[4] },
            lang6:      { shortcutKey: '6', alt: true, elm: langButtons[5] },
            lang7:      { shortcutKey: '7', alt: true, elm: langButtons[6] },
            slGms:      { shortcutKey: '8', alt: true, elm: $('gt-sl-gms'),
                            capTarget: $$('#gt-sl-gms .goog-flat-menu-button-dropdown')[0] },
            tlGms:      { shortcutKey: '9', alt: true, elm: $('gt-tl-gms'),
                            capTarget: $$('#gt-tl-gms .goog-flat-menu-button-dropdown')[0] },
            clear:      { shortcutKey: 'd', alt: true, elm: $('gt-clear') },
            speech:     { shortcutKey: 'm', alt: true, elm: $('gt-speech') },
            srcRoman:   { shortcutKey: '',  alt: true, elm: $('gt-src-roman') },
            // srcListen:  { shortcutKey: 'k', alt: true, elm: $('gt-src-listen') },
            srcListen:  { shortcutKey: 'l', alt: true, elm: $('gt-src-listen'), shift: true  },
            resSelect:  { shortcutKey: 'a', alt: true, elm: $('gt-res-select') },
            resCopy:    { shortcutKey: 'c', alt: true, elm: $('gt-res-copy') },
            resRoman:   { shortcutKey: '',  alt: true, elm: $('gt-res-roman') },
            resListen:  { shortcutKey: 'l', alt: true, elm: $('gt-res-listen') },
            pbStar:     { shortcutKey: 'p', alt: true, elm: $$('#gt-pb-star .goog-toolbar-button')[0] }
        };

        // remove if the button no longer exists 
        util.iterateObject(buttons, function(name, btn) {
            if (!btn.elm) { delete buttons[name]; }
        });

        return buttons;
    })(),

    /**
     * initialize extension content script
     */
    init: function() {
        var me = this;

        // show pageAction icon
        chrome.extension.sendMessage(
            { require: [['storage', 'ks4gt']], task: 'showPageAction' },
            function(res) {
console.log(res);

            }
        );

        me.setupMouseEventEmulator();

        me.loadUserSetting();
        me.applyUserSetting();

        me.initKeyMaps();
        me.listenKeyEvent();

        me.injectStyleSheet(chrome.extension.getURL('content.css'));
        me.setKeyCaption();
    },

    /**
     * load user custom settings from localStorage
     */
    loadUserSetting: function() {
        var me = this,
            s = localStorage.getItem(me.STORAGE_KEY);

        if (s) {
            me.userSettings = JSON.parse(s).userSettings;
        }
    },

    /**
     * apply user custom settings to extension
     */
    applyUserSetting: function() {
        var me = this,
            userSettings = me.userSettings;

        // apply user customization to button settings
        util.iterateObject(userSettings, function(name, setting) {
            me.targetButtons[name].shortcutKey = setting.key.toLowerCase();
            me.targetButtons[name].alt = setting.alt;
            me.targetButtons[name].shift = setting.shift;
        });

    },

    /**
     * display shortcut key character to each button
     */
    setKeyCaption: function() {
        var me = this;

        util.iterateObject(me.targetButtons, function(name, btn) {
            var key = btn.shortcutKey;

            // continue if shortcut key is not assigned
            if (!key) { return; }

            if (btn.shift === true) {
                key = key.toUpperCase();
            }

            // set data-key-navi attribute
            (btn.capTarget || btn.elm).dataset.keyNavi = '(' + key + ')';
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
     * create mouse event emulators and set to property of KS4GT
     */
    setupMouseEventEmulator: function() {
        var events = ['mousedown', 'mouseup', 'mouseout', 'mouseover', 'click'];

        for (var i = 0, e; e = events[i++];) {
            this.mouseEvent[e] =  document.createEvent('MouseEvents');
            this.mouseEvent[e].initEvent(e, true, false);
        }
    },

    /**
     * initialize {shortcut key: button selector} map
     */
    initKeyMaps: function() {
        var me = this,
            r = new RegExp(), keys = '', key;

        util.iterateObject(me.targetButtons, function(name, btn) {
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
        var translateBtn = document.getElementById('gt-submit');

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

            btn = this.getAssignedButton(evt);

            if (btn) {
                this.emulateClick(btn);
                evt.preventDefault();
            }
        }.bind(this);
    },

    /**
     * return target button assigned the event
     * @param  {Event}  evt  triggered event
     * @return {Object} button (return undefined if not assigned any)
     */
    getAssignedButton: function(evt) {
        var me =this,
            key = String.fromCharCode(evt.keyCode).toLowerCase(),
            btn;

        // shift + enter => translate button
        if (evt.shiftKey && evt.keyCode == 13) {
            return document.getElementById('gt-submit');
        }

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
    emulateClick:function(elm) {
        if (elm) {
            var de = elm.dispatchEvent.bind(elm),
                me = this.mouseEvent;
            de(me['mouseover']);
            de(me['mousedown']);
            de(me['mouseup']);
            de(me['mouseout']);
        }
    }
};

KS4GT.init();
