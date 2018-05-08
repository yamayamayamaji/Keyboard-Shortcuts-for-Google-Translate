/*!
 * background.js
 * in "Keyboard Shortcuts for Google Translate" (Google Chrome Extension)
 * https://github.com/yamayamayamaji/Keyboard-Shortcuts-for-Google-Translate
 * Copyright 2013, Ryosuke Yamaji
 *
 * License: MIT
 */

/**
 * When the extension is installed or upgraded
 * Replace all rules with a new rule
 */
chrome.runtime.onInstalled.addListener(function() {
    var dc = chrome.declarativeContent;
    dc && dc.onPageChanged.removeRules(undefined, function() {
        dc.onPageChanged.addRules([{
            conditions: [
                new dc.PageStateMatcher({
                    pageUrl: { hostContains: 'translate.google.' },
                })
            ],
            actions: [ new dc.ShowPageAction() ]
        }]);
    });
});


KS4GT_BP = {
    /**
     * initialize extension background script
     */
    init: function() {
        var me = this;

        //register message listener
        chrome.runtime.onMessage.addListener(me.onMessage.bind(me));

        return me;
    },

    /**
     * listeners map of request message from content script
     * @type {Object}
     */
    listeners: {
        userSettings: function(opt) {
            return this.getUserSettings(opt && opt.search);
        },
        defaultSettings: function(opt) {
            return this.getDefaultSettings();
        },
        platformInfo: function(opt) {
            return this.getPlatformInfo();
        }
    },

    /**
     * message communication with content script
     * @param  {Mixed} message request message
     * @param  {chrome.runtime.MessageSender} sender message sender info
     * @param  {Function} sendResponse function using by response
     */
    onMessage: function(message, sender, sendResponse) {
        var me = this,
            promises = new Map();

        if (!message) { sendResponse({}); }

        if (typeof(message) === 'string') {
            message = {message: null};
        }

        me.iterateObject(message, function(req, opt) {
            var f = me.listeners[req];
            promises.set(req, f && f.call(me, opt, sender));
        });

        // when promises are all done, response of results
        Promise.all(promises.values())
        .then(function(res) {
            var ret = {}, i = 0;
            promises.forEach(function(v, k) {
                ret[k] = res[i++];
            });

            sendResponse(ret);
        });

        // return true as the return value of this function,
        // because sendResponse will execute after all Promises done.
        return true;
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

    /**
     * return userSettings
     * @return {Promise/Object(when promise resolved)} userSettings
     */
    getUserSettings: function() {
        var me = this;

        return me.getStorage('userSettings');
    },

    /**
     * return sync.storage of extension
     * @param  {String/Array/Object} search search values (get only a portion of the key will match this)
     * @return {Promise/Object(when promise resolved)} userSettings
     */
    getStorage: function(search) {
        var me = this;

        return new Promise(function(resolve, reject) {
            chrome.storage.sync.get(search, function(items) {
                items = items || {};
                if (typeof(search) === 'string') {
                    items = items[search];
                }
                resolve(items);
            });
        });
    },

    /**
     * load JSON file of default settings
     * @return {Promise/JSON(when promise resolved)} JSON of default settings
     */
    getDefaultSettings: function() {

        return fetch(chrome.extension.getURL('default_settings.min.json'))
                .then(function(res) {
                    return res.json();
                });
    },

    /**
     * returns information about the current platform
     * @return {Promise/JSON(when promise resolved)} object of platform information
     */
    getPlatformInfo: function() {

        return new Promise(function(resolve, reject) {
            chrome.runtime.getPlatformInfo(function(pi){
                resolve(pi);
            });
        });
    }

};

KS4GT_BP.init();