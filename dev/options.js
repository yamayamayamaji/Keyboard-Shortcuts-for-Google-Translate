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
const $ = document.getElementById.bind(document),
    $$ = document.querySelectorAll.bind(document),
    iterateObject = function(obj, fn) {
        for (let key in obj) {
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
const KS4GT_OP_view = {
    STATUS_BOX_ID:     'status',
    SAVE_BTN_ID:       'save-btn',
    RESET_BTN_ID:      'reset-btn',
    GROUP_CLS:         'group',
    ROW_CLS:           'row',
    RCV_ID_NAME:       'name',
    SHORTCUT_KEY_NAME: 'shortcut-key',
    SHIFT_NAME:        'with-shift',
    NAVI_DISP_NAME:    'navi-disp',

    NAVI_TYPE: {
        atAllTimes: 'at all times',
        whileHovering: 'while hovering',
        none: 'none'
    },

    // default combination key used with shortcut key
    pivotKey: 'Alt',

    /**
     * initialize view contents
     * @param  {Object} config  configuration options
     * @param  {Object} config.defaultSettings  default setting values
     * @param  {Object} config.customSettings   custom setting values
     * @param  {String} config.pivotKey         string which represent pivot key
     */
    init: function(config = {}) {
        const me = this,
            def = config.defaultSettings || {},
            custom = config.customSettings || {},
            pivotKey = config.pivotKey;

        if (pivotKey) {
            me.pivotKey = pivotKey;
        }

        me.drawBase();
        me.drawSettingTools(def, custom);
    },

    /**
     * insert base dom to <body>
     */
    drawBase: function() {
        document.body.insertAdjacentHTML('afterbegin', this.baseHtml());
    },

    /**
     * insert user option setting tools
     */
    drawSettingTools: function(defaultSettings, customSettings) {
        const me = this,
            groups = {};

        iterateObject(defaultSettings, function(name, settings) {
            const g = settings.group;

            if (!groups[g]) { groups[g] = []; }
            Object.assign(settings, customSettings[name]);

            const currentGroup = groups[g],
                navi = settings.naviDisp;

            currentGroup.push(me.keySettingsHtml(name, settings));

            if (navi && !currentGroup.naviDisp) {
                currentGroup.naviDisp = navi
            };
        });

        iterateObject(groups, function(groupName, groupValues) {
            const container = $(`group-${groupName}`),
                htmls = groupValues.slice(0, groupValues.length);

            if (!container) { return; };

            container.insertAdjacentHTML('beforeend', htmls.join(''));

            // set intial value
            const naviSelector = container.querySelector('[name=navi-disp]');
            naviSelector.value = groupValues.naviDisp;
        });
    },

    /**
     * returns an HTML fragment of this template with the specified values applied
     * @return {String} HTML fragment
     */
    baseHtml: function() {
        const me = this,
            html =
`<div class="toolbar">
  <div class="tb-item tb-item-left note">Pivot is ${me.pivotKey}</div>
  <div id="${me.RESET_BTN_ID}" class="tb-item tb-item-right">reset settings</div>
</div>
<div class="contents">
  ${me.groupHtml('lang')}
  ${me.groupHtml('source')}
  ${me.groupHtml('result')}
</div>
<div class="toolbar">
  <div id="${me.STATUS_BOX_ID}" class="tb-item tb-item-left"></div>
  <button id="${me.SAVE_BTN_ID}" class="tb-item tb-item-right">Save</button>
</div>`

        return html;
    },

    /**
     * returns an HTML fragment of this template with the specified values applied
     * @param  {String} group group name
     * @return {String}       HTML fragment
     */
    groupHtml: function(group) {
        const me = this,
            html =
`<section id="group-${group}" class="${me.GROUP_CLS} group-wrap">
  <h1 class="group-head">
    <span class="group-title">${group} area</span>
  </h1>
  <h2 class="${me.ROW_CLS} row-wrap">
    <span class="navi-disp-wrap">
      show key navigation:
      <select name="${me.NAVI_DISP_NAME}" class="navi-disp-sb">
        <option>${me.NAVI_TYPE.atAllTimes}
        <option>${me.NAVI_TYPE.whileHovering}
        <option>${me.NAVI_TYPE.none}
      </select>
    </span>
  </h2>
</section>`

        return html;
    },

    /**
     * returns an HTML fragment of this template with the specified values applied
     * @param  {String} name     name(as index) of reciever
     * @param  {Object} settings template values of reciever setting
     * @return {String}          HTML fragment
     */
    keySettingsHtml: function(name, settings) {
        const me = this,
            html =
`<h2 class="${me.ROW_CLS} row-wrap">
  <div class="rcv-name-wrap">
    ${settings.alias || name}
    <input type="hidden" name="${me.RCV_ID_NAME}" value="${name}">
  </div>
  <div class="key-inputer-wrap">
    Pivot + 
    <input type="text" name="${me.SHORTCUT_KEY_NAME}" class="key-inputer-txt"
    value="${settings.shortcutKey}" maxlength="1">
  </div>
  <div class="with-shift-wrap">
    shift:
    <input type="checkbox" name="${me.SHIFT_NAME}" class="with-shift-cb"
    ${settings.shift ? 'checked' : ''}>
  </div>
</h2>`

        return html;
    },

    findAncestor: function(cls, clue) {
        let elm = clue;

        while (!elm.classList.contains(cls)) {
            elm = elm.parentElement;
        }
        return elm;
    },

    findGroupContained: function(clue) {
        return this.findAncestor(this.GROUP_CLS, clue);
    },

    findRowContained: function(clue) {
        return this.findAncestor(this.ROW_CLS, clue);
    },

    getRowItem: function(name, row) {
        return row.querySelector('[name=' + name + ']');
    },

    getBrother: function(name, clue) {
        return this.getRowItem(name, this.findRowContained(clue));
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

    getRowElementsOfShortcutKeySetting: function() {
        return Array.from($$('.' + this.ROW_CLS)).filter(row => {
            return this.getShortcutKeyElm(row);
        });
    },

    getAllShortcutKeyElements: function() {
        return $$('[name=' + this.SHORTCUT_KEY_NAME + ']');
    },

    getRcvIdElm: function(row) {
        return this.getRowItem(this.RCV_ID_NAME, row);
    },

    getShortcutKeyElm: function(row) {
        return this.getRowItem(this.SHORTCUT_KEY_NAME, row);
    },

    getShiftElm: function(row) {
        return this.getRowItem(this.SHIFT_NAME, row);
    },

    getNaviDispElm: function(row) {
        const group = this.findGroupContained(row);
        return group.querySelector('[name=' + this.NAVI_DISP_NAME + ']');
    },

    getRcvId: function(row) {
        return this.getRcvIdElm(row).value;
    },

    getShortcutKey: function(row) {
        return this.getShortcutKeyElm(row).value;
    },

    getWithShift: function(row) {
        return !!this.getShiftElm(row).checked;
    },

    getNaviDisp: function(row) {
        return this.getNaviDispElm(row).value;
    }
};


/**
 * chrome extension options page manager
 * @type {Object}
 */
const KS4GT_OP = {
    // acceptableKeyRegExp: /^[0-9a-z]?$/,
    acceptableKeyRegExp: /^.?$/,
    userSettings: {},
    recievers: {},

    view: KS4GT_OP_view,

    /**
     * ready before initialize
     */
    ready: function() {
        const me = this;

        if (me.isReady) { return; }

        chrome.runtime.sendMessage({
                // load default settings from json file
                defaultSettings: null,
                // load user settings from extension sync storage
                userSettings: null,
                // get runtime platform infomation
                platformInfo: null
            },
            function(res) {
                me.recievers = res.defaultSettings || {};
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
        const me = this;
        let pivotKey;

        if (!me.isReady) {
            me.onReady = me.init.bind(me);
            me.ready();
            return;
        }

        pivotKey = (me.platformInfo.os === chrome.runtime.PlatformOs.MAC) ?
                    '[Option] or [Control]' : '[Alt]';

        // initialize view
        me.view.init({
            defaultSettings: me.recievers,
            customSettings:  me.userSettings,
            pivotKey:        pivotKey
        });

        // set listeners
        me.view.getResetBtn().addEventListener('click', me.deleteUserSettings.bind(me));
        me.view.getSaveBtn().addEventListener('click', me.saveUserSettings.bind(me));
        iterateObject(me.view.getAllShortcutKeyElements(), function(i, elm) {
            elm.addEventListener('keyup', me.onShortcutKeyChange.bind(me));
        });
    },

    /**
     * save user customize settings
     */
    saveUserSettings: function() {
        const me = this,
            us = {},
            invalidElements = me.validate();
        let msg = '';

        // if there are invalid input
        if (invalidElements && invalidElements.length) {
            iterateObject(invalidElements, function(i, elm) {
                msg += elm.validationMessage + '<br>';
            });
            me.showMessage(msg, 'bad');
            return false;
        }

        // read user input values
        iterateObject(me.view.getRowElementsOfShortcutKeySetting(), function(idx, row) {
            const name = me.view.getRcvId(row),
                shortcutKey = me.view.getShortcutKey(row),
                naviDisp = me.view.getNaviDisp(row),
                settings = {
                    shortcutKey: shortcutKey,
                    shift: me.view.getWithShift(row),
                    naviDisp: naviDisp
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
        const me = this;

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
    onShortcutKeyChange: function(evt) {
        const me = this,
            elm = evt.target,
            row = me.view.findRowContained(elm);
        let c;

        elm.value = c = me.correctShortcutKey(elm.value);

        if (me.validate(row, elm.name).length) {
            // invalid input
            me.showMessage(elm.validationMessage, 'bad', 1500);
        } else if (evt.shiftKey) {
            const cb = me.view.getBrother(me.view.SHIFT_NAME, elm);
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
        const me = this,
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
    correctShortcutKey: function(str) {
        return this.toHalf(str.substr(0, 1)).toLowerCase();
    },

    /**
     * validate specified (or all) rows input 
     * @param  {DomElements Array} rows  target rows
     * @param  {String}            name  name of target input
     * @return {DomElements Array}       array of invalid input elements (if exists)
     */
    validate: function(rows, name) {
        const me = this,
            view = me.view,
            invalidElements = [];

        if (!rows) {
            rows = Array.prototype.slice.call(view.getRowElementsOfShortcutKeySetting());
        } else if (!Array.isArray(rows)) {
            rows = [rows];
        }

        rows.forEach(function(row) {
            const elm = view.getShortcutKeyElm(row),
                val = view.getShortcutKey(row);

            // validate shortcut key
            if (!val.match(me.acceptableKeyRegExp)) {
                // elm.setCustomValidity('invalid shortcut key. only [a-z0-9] is OK');
                elm.setCustomValidity('invalid shortcut key.');
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