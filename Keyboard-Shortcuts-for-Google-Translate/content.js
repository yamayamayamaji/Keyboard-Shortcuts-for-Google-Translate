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

		//insert stylesheet
		$('<link rel="stylesheet" type="text/css">')
			.attr('href', chrome.extension.getURL('content.css'))
			.insertAfter('link:last');
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
		var btns = document.querySelectorAll('.goog-inline-block.goog-toolbar-button-inner-box'),
			r = new RegExp();
		r.compile('^[1-' + btns.length + ']$');

		document.onkeydown = function(evt){
			var idx = String.fromCharCode(evt.keyCode);
			//continue [alt] + [1-(button length)] is pressed
			if ( !idx.match(r) || !evt.altKey ) { return; }

			var btn = btns[idx - 1];
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
