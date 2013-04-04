/*!
 * settings.js (in Fancy Settings)
 * Fancy Settings by Frank Kohlhepp
 * Copyright (c) 2011 - 2012 Frank Kohlhepp
 * https://github.com/frankkohlhepp/fancy-settings
 */
window.addEvent("domready", function(){
    new FancySettings.initWithManifest(function(settings){
        var m = settings.manifest;

        //ミーティングモード設定の関連性制御
        if (!m.enableMeetingMode.element.checked) {
            m.meetingModeInterval.element.disabled = true;
        }
        m.enableMeetingMode.addEvent("action", function(){
            m.meetingModeInterval.element.disabled = !this.element.checked;
        });
    });
});
