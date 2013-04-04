/*!
 * Extension.js (Google Chrome Extension Class)
 * in "Keyboard Shortcuts for Google Translate" (Google Chrome Extension)
 * https://github.com/yamayamayamaji/Keyboard-Shortcuts-for-Google-Translate
 * Copyright 2013, Ryosuke Yamaji
 *
 * License: MIT
 */

/**
 * Extension Class
 */
var Extension = function(){
	return new Extension.prototype.init(arguments[0]);
}

/**
 * Extension prototype
 */
Extension.prototype = {
	constructor: Extension,
	/**
	 * @const
	 */
	STORE_KEY: {
		PREV_VERSION: 'prev_version'
	},

	/**
	 * class constructor
	 * @param  {object} options  instance options
	 * @return {object}          instance
	 */
	init: function(options){
		var details = this.getDetails();
		this.id = details.id;
		this.name = details.name;

		_.extend(this, options);

		//create mixin _get, _execute and get, execute in options
		_.each(['get', 'execute'], function(name, idx){
			this[name] = _.extend({}, this['_' + name], options[name]);
		}, this);

		//init version manager
		this.versionMgr.init();
		//reg message listner
		chrome.extension.onMessage.addListener(this.messageHandler.bind(this));

		return this;
	},

	/**
	 * revievers of "require" message from content script
	 * @type {Object}
	 */
	_get: {
		details: function(){
			return this.getDetails();
		},
		storage: function(opt){
			return this.getLocalStorage(opt.search);
		},
		isUpdated: function(){
			return this.versionMgr.isUpdated();
		}
	},

	/**
	 * revievers of "task" message from content script
	 * @type {Object}
	 */
	_execute: {
		showPageAction: function(opt, sender){
			this.showPageAction(sender.tab.id);
		},
		changePageActionIcon: function(opt, sender){
			this.changePageActionIcon(opt, sender.tab.id);
		},
		notifyIfUpgraded: function(){
			this.versionMgr.notifyIfUpgraded();
		},
		copyToClipBoard: function(opt){
			this.copyToClipBoard(opt.str);
		}
	},

	/**
	 * message communication with content script
	 * @param  {any} req          request message
	 * @param  {chrome.extension.MessageSender} sender message sender info
	 * @param  {function} sendResponse function using by response
	 */
	messageHandler: function(req, sender, sendResponse){
		if (!req) { sendResponse({}) }
		//extract task and require from message
		var task = req.task || [],
			require = req.require || [];
		//create and return Deferred object
		//that run recievers of works(tasks and requires)
		var deferredMaker = function(instance, work, name, args){
			var ext = instance;
			var fnc = instance[work][name];
			if (!_.isFunction(fnc)) { return {}; }

			var dfd = new _.Deferred();
			_.defer(function(){
				var res = {};

				switch (work) {
				case 'execute':
					try {
						fnc.call(instance, args, sender);
						res[name] = true;
					} catch (err) {
						console.log(err);
						res[name] = false;
					}
					break;
				case 'get':
					res[name] = fnc.call(instance, args, sender);
					break;
				}

				dfd.resolve(res);
			});

			return dfd.promise();
		};
		var deferreds = [];

		//handle tasks and requires
		_.each([task, require], function(works, idx){
			var i, w, name, args;
			if (!_.isArray(works)){ works = [works]; }

			for (i = 0; w = works[i++];) {
				if (_.isArray(w)) {
					name = w.shift();
					args = w;
				} else if (_.isObject(w)) {
					name = w.key;
					args = w;
				} else {
					name = w;
					args = null;
				}

				//recievers may include async processing, so use Deferred/Promise
				deferreds.push(deferredMaker(this,
					(idx == 0 ? 'execute' : 'get'), name, args));
			}
		}, this);

		//when recievers all done, response JSON of results
		_.when.apply(null, deferreds).then(function(){
			var res = {};
			_.each(arguments, function(obj){
				_.extend(res, obj);
			});
			sendResponse(res);
		});

		//return true as the return value of this event listener functino,
		//because sendResponse will execute after all recievers done.
		return true;
	},

	/**
	 * return detail info of extension(manifest info)
	 * if keys specified, return corresponding values, if not, return all values.
	 * @param  {string} key key of target info
	 * @return {any}        JSON of manifest info
	 */
	getDetails: function(key){
		if (!this.details) {
			this.details = chrome.app.getDetails();
		}
		if (key) {
			return this.details[key];
		} else {
			return this.details;
		}
	},

	/**
	 * return localStorage value
	 * @param  {string} search search string (get only a portion of the key will match this)
	 * @return {object}        JSON of localStorage values
	 */
	getLocalStorage: function(search){
		var obj = {}, val;
		for (var key in localStorage) {
			if (key.indexOf(search) !== -1) {
				val = localStorage[key];
				obj[key] = JSON.parse(val);
			}
		};
		return obj;
	},

	/**
	 * show pageAction icon
	 * @param  {integer} tabId　id of the target tab
	 */
	showPageAction: function(tabId){
		chrome.pageAction.show(tabId);
	},

	/**
	 * change pageAction icon
	 * @param  {object}  opt   options of new icon
	 * @param  {integer} tabId id of the target tab
	 */
	changePageActionIcon: function(opt, tabId){
		var details = {tabId: tabId};
		if (opt.path) {
			details.path = opt.path;
		} else {
			details.imageData = opt.imageData;
		}
		chrome.pageAction.setIcon(details, opt.callback);
	},

	/**
	 * version manager
	 * @type {Object}
	 */
	versionMgr: {
		//init
		init: function(){
			var ext = Extension.prototype,
				prevVer = ext.STORE_KEY.PREV_VERSION;
			this.prevVer = localStorage[prevVer];
			this.curVer = ext.getDetails().version;
		},
		//is extension updated
		isUpdated: function(){
			return !this.prevVer || (this.prevVer != this.curVer);
		},
		//update the information that has been recorded as a previous version
		updatePrevVersion: function(){
			localStorage[Extension.prototype.STORE_KEY.PREV_VERSION] = this.curVer;
		},
		//notify if extension is upgraded
		notifyIfUpgraded: function(){
			if (this.isUpdated()) {
				var id = Extension.prototype.getDetails('id');
				var n = webkitNotifications.createHTMLNotification(
					'update_notifier.html?prev=' + this.prevVer
				);
				//If notification is displayed, update the previous version information
				n.ondisplay = function(){
					this.updatePrevVersion();
					this.init();
				}.bind(this);
				//show box
				n.show();
				//close automatically
				setTimeout(function(){ n.cancel(); }, 7000);
			}
		}
	},

	/**
	 * copy to clip board
	 * @param  {string} str copy string
	 */
	copyToClipBoard: function(str){
		var _org = document.oncopy ? document.oncopy.bind(null) : null;
		document.oncopy = function(event) {
			var mimetype = 'text';
			event.clipboardData.setData(mimetype, str);
			if (_.isFunction(_org)) {_org(event);}
			event.preventDefault();
		};
		document.execCommand("Copy", false, null);
		document.oncopy = _org;
	}
};

Extension.prototype.init.prototype = Extension.prototype;
