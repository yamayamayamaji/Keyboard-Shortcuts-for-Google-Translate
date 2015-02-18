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

    /**
     * initialize extension content script
     */
    init: function() {
        //show pageAction icon
        chrome.extension.sendMessage({task: 'showPageAction'}, this.noop);

        this.setupMouseEventEmulator();
        this.listenKeyEvent();

        //add stylesheet
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
        var events = ['mousedown', 'mouseup', 'mouseout'];

        for (var i = 0, e; e = events[i++];) {
            this.mouseEvent[e] =  document.createEvent('MouseEvents');
            this.mouseEvent[e].initEvent(e, true, false);
        }
    },

    /**
     * set listeners for shortcut key event
     */
    listenKeyEvent: function() {
        var swapButton = document.getElementById('gt-swap'),
            langButtons = document.querySelectorAll('#gt-langs .jfk-button:not([aria-hidden="true"]):not(#gt-swap)'),
            topButtons = [swapButton].concat(Array.prototype.slice.call(langButtons)),
            r = new RegExp(), keys = '', key;

        //[alt] + key
        var altTarget = {
            A: document.getElementById('gt-res-select'),
            D: document.getElementById('gt-clear'),
            K: document.getElementById('gt-src-listen'),
            L: document.getElementById('gt-res-listen'),
            M: document.getElementById('gt-speech'),
            P: document.querySelectorAll('#gt-pb-star .goog-toolbar-button')[0]
        };
        topButtons.forEach(function(k, i) { altTarget[i] = k; });

        //[alt] + [shift] + key
        var altShiftTarget = {
            L: document.getElementById('gt-src-listen')
        };

        for (key in altTarget) { keys += key }
        for (key in altShiftTarget) { if (keys.indexOf(key) < 0) {keys += key} }
        r.compile('^[' + keys + ']$', 'i');

        document.onkeydown = function(evt) {
            var key = String.fromCharCode(evt.keyCode),
                t;
            //continue only if [alt] + (registered key) is pressed
            if (!key.match(r) || !evt.altKey) { return; }

            if (evt.shiftKey) {
                t = altShiftTarget[key];
            }

            if (!t) {
                t = altTarget[key];
            }

            if (t) {
                this.emulateClick(t);
            }
            evt.preventDefault();
        }.bind(this);
    },

    /**
     * emulate click event
     * @param  {Object} elm HTML Element
     */
    emulateClick:function(elm) {
        if (elm) {
            elm.dispatchEvent(this.mouseEvent['mousedown']);
            elm.dispatchEvent(this.mouseEvent['mouseup']);
            elm.dispatchEvent(this.mouseEvent['mouseout']);
        }
    }
};

extCS.init();
