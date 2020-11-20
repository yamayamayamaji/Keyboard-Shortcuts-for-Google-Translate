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
    init() {
        //register message listener
        chrome.runtime.onMessage.addListener(this.onMessage.bind(this));

        return this;
    },

    /**
     * listeners map of request message from content script
     * @type {Object}
     */
    listeners: {
        userSettings(opt) {
            return this.getUserSettings(opt && opt.search);
        },
        defaultSettings(opt) {
            return this.getDefaultSettings(opt.baseName);
        },
        platformInfo(opt) {
            return this.getPlatformInfo();
        }
    },

    /**
     * message communication with content script
     * @param  {Mixed} message request message
     * @param  {chrome.runtime.MessageSender} sender message sender info
     * @param  {Function} sendResponse function using by response
     */
    onMessage(message, sender, sendResponse) {
        const promises = new Map();

        if (!message) { sendResponse({}); }

        if (typeof(message) === 'string') {
            message = {message: null};
        }

        this.iterateObject(message, (req, opt) => {
            const f = this.listeners[req];
            promises.set(req, f && f.call(this, opt, sender));
        });

        // when promises are all done, response of results
        Promise.all(promises.values())
        .then(function(res) {
            let ret = {}, i = 0;
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
    iterateObject(obj, fn) {
        for (let key in obj) {
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
    getUserSettings() {
        return this.getStorage('userSettings');
    },

    /**
     * return sync.storage of extension
     * @param  {String/Array/Object} search search values (get only a portion of the key will match this)
     * @return {Promise/Object(when promise resolved)} userSettings
     */
    getStorage(search) {
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
     * @param  {String} baseName base name of JSON file
     * @return {Promise/JSON(when promise resolved)} JSON of default settings
     */
    getDefaultSettings(baseName) {
        return fetch(chrome.extension.getURL(`${baseName}.min.json`))
                .then(function(res) {
                    return res.json();
                });
    },

    /**
     * returns information about the current platform
     * @return {Promise/JSON(when promise resolved)} object of platform information
     */
    getPlatformInfo() {
        return new Promise(function(resolve, reject) {
            chrome.runtime.getPlatformInfo(function(pi){
                resolve(pi);
            });
        });
    }

};

KS4GT_BP.init();