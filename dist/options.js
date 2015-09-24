/*!
 * options.js
 * in "Keyboard Shortcuts for Google Translate" (Google Chrome Extension)
 * https://github.com/yamayamayamaji/Keyboard-Shortcuts-for-Google-Translate
 * Copyright 2015, Ryosuke Yamaji
 *
 * License: MIT
 */
(function() {
"use strict";

// utility functions
var $ = document.getElementById.bind(document),
    $$ = document.querySelectorAll.bind(document),
    iterateObject = function(obj, fn) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (fn.call(obj, key, obj[key], obj) === false) {
                    return;
                }
            }
        }
    };


/**
 * options page view manager
 * @type {Object}
 */
var KS4GT_OP_view = {
    STATUS_BOX_ID:     'status',
    SAVE_BTN_ID:       'save-btn',
    RESET_BTN_ID:      'reset-btn',
    ROW_CLS:           'row',
    BTN_ID_NAME:       'name',
    SHORTCUT_KEY_NAME: 'shortcut-key',
    SHIFT_NAME:        'with-shift',

    // default combination key used with shortcut key
    PIVOT_KEY: 'Alt',

    /**
     * initialize view contents
     * @param  {Object} config  configuration options
     * @param  {Object} config.defaultSettings  default setting values
     * @param  {Object} config.customSettings   custom setting values
     * @param  {String} config.pivotKey         string which represent pivot key
     */
    init: function(config) {
        var me = this,
            config = config || {},
            def = config.defaultSettings || {},
            custom = config.customSettings || {},
            pivot = config.pivotKey;

        if (pivot) {
            me.PIVOT_KEY = pivot;
        }

        me.drawBase();
        me.drawSettingTools(def, custom);
    },

    /**
     * insert base dom to <body>
     */
    drawBase: function() {
        document.body.insertAdjacentHTML('beforeend', this.baseTmpl());
    },

    /**
     * insert user option setting tools
     */
    drawSettingTools: function(defaultSettings, customSettings) {
        var me = this,
            groups = {};

        iterateObject(defaultSettings, function(name, settings) {
            var g = settings.group;

            if (!groups[g]) { groups[g] = []; }
            Object.assign(settings, customSettings[name]);
            groups[g].push(me.settingsTmpl(name, settings));
        });

        iterateObject(groups, function(group, html) {
            var container = $(group);
            container && container.insertAdjacentHTML('beforeend', html.join(''));
        });
    },

    /**
     * returns an HTML fragment of this template with the specified values applied
     * @return {String} HTML fragment
     */
    baseTmpl: function() {
        var me = this,
            h =
`<div class="toolbar">
  <div id="${me.RESET_BTN_ID}" class="tb-item tb-item-right">reset settings</div>
</div>
<div class="contents">
  <section id="lang" class="group-wrap">
    <h1 class="group-title">lang area</h1>
  </section>
  <section id="source" class="group-wrap">
    <h1 class="group-title">source area</h1>
  </section>
  <section id="result" class="group-wrap">
    <h1 class="group-title">result area</h1>
  </section>
</div>
<div class="toolbar">
  <div id="${me.STATUS_BOX_ID}" class="tb-item tb-item-left"></div>
  <button id="${me.SAVE_BTN_ID}" class="tb-item tb-item-right">Save</button>
</div>`

        return h;
    },

    /**
     * returns an HTML fragment of this template with the specified values applied
     * @param  {String} name     name of button
     * @param  {Object} settings template values of button setting
     * @return {String}          HTML fragment
     */
    settingsTmpl: function(name, settings) {
        var me = this,
            h =
`<h2 class="${me.ROW_CLS} row-wrap">
  <div class="btn-name-wrap">
    ${settings.alias || name}
    <input type="hidden" name="${me.BTN_ID_NAME}" value="${name}">
  </div>
  <div class="key-inputer-wrap">
    ${me.PIVOT_KEY} + 
    <input type="text" name="${me.SHORTCUT_KEY_NAME}" class="key-inputer-txt"
    value="${settings.shortcutKey}" maxlength="1">
  </div>
  <div class="with-shift-wrap">
    shift:
    <input type="checkbox" name="${me.SHIFT_NAME}" class="with-shift-cb"
    ${settings.shift ? 'checked' : ''}>
  </div>
</h2>`

        return h;
    },

    findRow: function(clue) {
        var elm = clue;

        while (!elm.classList.contains(this.ROW_CLS)) {
            elm = elm.parentElement;
        }
        return elm;
    },

    getRowItem: function(name, row) {
        return row.querySelector('[name=' + name + ']');
    },

    getBrother: function(name, clue) {
        return this.getRowItem(name, this.findRow(clue));
    },

    getResetBtn: function() {
        return $('reset-btn');
    },

    getSaveBtn: function() {
        return $('save-btn');
    },

    getStatusBox: function() {
        return $('status');
    },

    getAllRowElements: function() {
        return $$('.' + this.ROW_CLS);
    },

    getAllShorcutKeyElements: function() {
        return $$('[name=' + this.SHORTCUT_KEY_NAME + ']');
    },

    getBtnIdElm: function(row) {
        return this.getRowItem(this.BTN_ID_NAME, row);
    },

    getShorcutKeyElm: function(row) {
        return this.getRowItem(this.SHORTCUT_KEY_NAME, row);
    },

    getShiftElm: function(row) {
        return this.getRowItem(this.SHIFT_NAME, row);
    },

    getBtnId: function(row) {
        return this.getBtnIdElm(row).value;
    },

    getShorcutKey: function(row) {
        return this.getShorcutKeyElm(row).value;
    },

    getWithShift: function(row) {
        return !!this.getShiftElm(row).checked;
    }
};


/**
 * chrome extension options page manager
 * @type {Object}
 */
var KS4GT_OP = {
    acceptableKeyRegExp: /^[0-9a-z]?$/,
    userSettings: {},
    targetButtons: {},

    view: KS4GT_OP_view,

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
                // get runtime platform infomation
                platformInfo: null,
            },
            function(res) {
                me.targetButtons = res.targetButtons || {};
                me.userSettings = res.userSettings || {};
                me.platformInfo = res.platformInfo || {};

                me.isReady = true;
                me.onReady();
            }
        );
    },

    /**
     * initialize options page
     */
    init: function() {
        var me = this,
            pivotKey;

        if (!me.isReady) {
            me.onReady = me.init.bind(me);
            me.ready();
            return;
        }

        pivotKey = (me.platformInfo.os === chrome.runtime.PlatformOs.MAC) ?
                    'Option' : 'Alt';

        // initialize view
        me.view.init({
            defaultSettings: me.targetButtons,
            customSettings:  me.userSettings,
            pivotKey:        pivotKey
        });

        // set listeners
        me.view.getResetBtn().addEventListener('click', me.deleteUserSettings.bind(me));
        me.view.getSaveBtn().addEventListener('click', me.saveUserSettings.bind(me));
        iterateObject(me.view.getAllShorcutKeyElements(), function(i, elm) {
            elm.addEventListener('keyup', me.onShorcutKeyChange.bind(me));
        });
    },

    /**
     * save user customize settings
     */
    saveUserSettings: function() {
        var me = this,
            us = {},
            msg = '',
            invalidElements;

        invalidElements = me.validate();
        // if there are invalid input
        if (invalidElements && invalidElements.length) {
            iterateObject(invalidElements, function(i, elm) {
                msg += elm.validationMessage + '<br>';
            });
            me.showMessage(msg, 'bad');
            return false;
        }

        // read user input values
        iterateObject(me.view.getAllRowElements(), function(idx, row) {
            var name = me.view.getBtnId(row),
                sk = me.view.getShorcutKey(row),
                settings;

            settings = {
                shortcutKey: sk,
                shift: me.view.getWithShift(row)
            };

            us[name] = settings;
        });

        // save to chrome.storage.sync
        chrome.storage.sync.set({'userSettings': us}, function() {
            me.showMessage('options saved !', 'good', 1500);
        });
    },

    /**
     * delete user customize settings for resetting customization
     */
    deleteUserSettings: function() {
        var me = this;

        // remove from chrome.storage.sync
        chrome.storage.sync.remove('userSettings', function() {
            me.showMessage('options are reset.', 'good', 1000, function() {
                location.reload();
            });
        });
    },

    /**
     * listener function of shortcut key onChange
     * @param  {DomEvent Object} evt  onChange event
     */
    onShorcutKeyChange: function(evt) {
        var me = this,
            elm = evt.target,
            row = me.view.findRow(elm),
            c;

        elm.value = c = me.correctShorcutKey(elm.value);

        if (me.validate(row, elm.name).length) {
            // invalid input
            me.showMessage(elm.validationMessage, 'bad', 1500);
        } else if (evt.shiftKey) {
            var cb = me.view.getBrother(me.view.SHIFT_NAME, elm);
            cb && (cb.checked = true);
        }
    },

    /**
     * show message on status area
     * @param  {String}   msg      message
     * @param  {String}   state    className express state
     * @param  {Int}      lifetime message will be removed after lifetime millisec 
     * @param  {Function} callback will excute after message is removed
     */
    showMessage: function(msg, state, lifetime, callback) {
        var me = this,
            box = me.view.getStatusBox();

        // cache original classname
        if (!me._stateOrgClassName) {
            me._stateOrgClassName = box.className;
        }
        // reset className
        box.className = me._stateOrgClassName;

        if (typeof(state) === 'number') {
            lifetime = state;
            state = '';
        }

        state && box.classList.add(state);
        box.innerHTML = msg;

        if (lifetime) {
            setTimeout(function() {
                box.innerHTML = '';
                state && box.classList.remove(state);
                callback && callback();
            }, lifetime);
        }
    },

    /**
     * correct specified shortcut key string
     * @param  {String} str  character of shortcut key
     * @return {String}      corrected character
     */
    correctShorcutKey: function(str) {
        return this.toHalf(str.substr(0, 1)).toLowerCase();
    },

    /**
     * validate specified (or all) rows input 
     * @param  {DomElements Array} rows  target rows
     * @param  {String}            name  name of target input
     * @return {DomElements Array}       array of invalid input elements (if exists)
     */
    validate: function(rows, name) {
        var me = this,
            view = me.view,
            invalidElements = [];

        if (!rows) {
            rows = Array.prototype.slice.call(view.getAllRowElements());
        } else if (!Array.isArray(rows)) {
            rows = [rows];
        }

        rows.forEach(function(row) {
            var elm, val;

            // shortcut key validate
            elm = view.getShorcutKeyElm(row);
            val = view.getShorcutKey(row);
            if (!val.match(me.acceptableKeyRegExp)) {
                // elm.setCustomValidity('shortcut key must be alphanumeric 1 char');
                elm.setCustomValidity('invalid shortcut key. only [a-z0-9] is OK');
                invalidElements.push(elm);
            } else {
                elm.setCustomValidity('');
            }
        });

        return invalidElements;
    },

    /**
     * replace to single byte string if specified string includes multi byte strings
     * @param  {String} str  target string
     * @return {String}      replaced string
     */
    toHalf: function(str) {
        return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
            return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
        });
    }

};

// document.addEventListener('DOMContentLoaded', KS4GT_OP.init.bind(KS4GT_OP));
KS4GT_OP.init();

})();