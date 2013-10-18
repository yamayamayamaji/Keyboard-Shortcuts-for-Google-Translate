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
	noop: function(){},
	mouseEvent: [],

	/**
	 * initialize extension content script
	 */
	init: function(){
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
	setupMouseEventEmulator: function(){
		var events = ['mousedown', 'mouseup', 'mouseout'];

		for (var i = 0, e; e = events[i++];) {
			this.mouseEvent[e] =  document.createEvent('MouseEvents');
			this.mouseEvent[e].initEvent(e, true, false);
		}
	},

	/**
	 * set listeners for shortcut key event
	 */
	listenKeyEvent: function(){
		var slice = Array.prototype.slice,
			swapBtn = document.querySelectorAll('#gt-swap'),
			langBtns = document.querySelectorAll('#gt-langs .jfk-button:not([aria-hidden="true"]):not(#gt-swap)'),
			btns = slice.call(swapBtn).concat(slice.call(langBtns)),
			r = new RegExp();
		r.compile('^[0-' + btns.length + ']$');

		document.onkeydown = function(evt){
			var idx = String.fromCharCode(evt.keyCode);
			//continue only if [alt] + [0 to (button length)] is pressed
			if ( !idx.match(r) || !evt.altKey ) { return; }

			var btn = btns[idx];
			if (btn) { this.emulateClick(btn); }
		}.bind(this);
	},

	/**
	 * emulate click event
	 * @param  {Object} elm HTML Element
	 */
	emulateClick:function(elm){
		if (elm) {
			elm.dispatchEvent(this.mouseEvent['mousedown']);
			elm.dispatchEvent(this.mouseEvent['mouseup']);
			elm.dispatchEvent(this.mouseEvent['mouseout']);
		}
	}
};

extCS.init();
