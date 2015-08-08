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
 * chrome [ext]ension [c]ontent [s]cript manager
 * @type {Object}
 */
var extCS = {
    noop: function() {},
    mouseEvent: [],

    altTarget: {},
    altShiftTarget: {},
    keysRegExp: '',

    /**
     * initialize extension content script
     */
    init: function() {
        // show pageAction icon
        chrome.extension.sendMessage({task: 'showPageAction'}, this.noop);

        this.setupMouseEventEmulator();
        this.initKeyMaps();
        this.listenKeyEvent();

        // add stylesheet
        var link = document.createElement('link'),
            lastLink = document.querySelectorAll('link:last-of-type')[0];

        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = chrome.extension.getURL('content.css');
        lastLink.parentNode.insertBefore(link, lastLink.nextSibling);
    },

    /**
     * create mouse event emulators and set to property of extCS
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
        var $ = document.getElementById.bind(document),
            $$ = document.querySelectorAll.bind(document),
            r = new RegExp(), keys = '', key;

        var langButtons = $$('#gt-langs .jfk-button:not([aria-hidden="true"]):not(#gt-swap):not(#gt-submit)');

        // [alt] + key
        this.altTarget = {
            0: $('gt-swap'),
            1: langButtons[0],
            2: langButtons[1],
            3: langButtons[2],
            4: langButtons[3],
            5: langButtons[4],
            6: langButtons[5],
            7: langButtons[6],
            8: $('gt-sl-gms'),
            9: $('gt-tl-gms'),
            A: $('gt-res-select'),
            D: $('gt-clear'),
            K: $('gt-src-listen'),
            L: $('gt-res-listen'),
            M: $('gt-speech'),
            P: $$('#gt-pb-star .goog-toolbar-button')[0]
        };

        // [alt] + [shift] + key
        this.altShiftTarget = {
            L: $('gt-src-listen')
        };

        // cache keys regexp
        for (key in this.altTarget) { keys += key }
        for (key in this.altShiftTarget) { if (keys.indexOf(key) < 0) {keys += key} }
        r.compile('^[' + keys + ']$', 'i');
        this.keysRegExp = r;
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

            btn = this.getTargetButton(evt);

            if (btn) {
                this.emulateClick(btn);
                evt.preventDefault();
            }
        }.bind(this);
    },

    getTargetButton: function(evt) {
        var key = String.fromCharCode(evt.keyCode),
            btn;

        // shift + enter => translate button
        if (evt.shiftKey && evt.keyCode == 13) {
            return document.getElementById('gt-submit');
        }

        // continue only if [alt] + (registered key) is pressed
        if (!key.match(this.keysRegExp) || !evt.altKey) { return; }

        if (evt.shiftKey) {
            btn = this.altShiftTarget[key];
        }

        if (!btn) {
            btn = this.altTarget[key];
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
            de(me['click']);
            de(me['mouseup']);
            de(me['mouseout']);
        }
    }
};

extCS.init();
