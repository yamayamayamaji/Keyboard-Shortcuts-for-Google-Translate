import KSRegister from 'ks4gt/dev/src/usecase/KSRegister.js';
import KSConfig from 'ks4gt/dev/src/usecase/KSConfig.js';

beforeAll(() => {
    document.body.innerHTML = [
        '<button id="button1" />',
        '<button id="button2" />',
    ].join('');
});

test('shortcut keys can be registered from the config object', () => {
    const btn1Selector = '#button1';
    const btn2Selector = '#button2';
    const configs = {
        // [alt + 1]
        button1: {
            'shortcut': {
                'key': '1',
                'alt': true
            },
            'behavior': 'click',
            'actionTarget': {
                'selector': btn1Selector
            }
        },
        // [alt + shift + a]
        button2: {
            'shortcut': {
                'key': 'a',
                'alt': true,
                'shift': true
            },
            'behavior': 'click',
            'actionTarget': {
                'selector': btn2Selector
            }
        }
    };
    const button1 = document.querySelector(btn1Selector);
    const button2 = document.querySelector(btn2Selector);
    button1.onclick = jest.fn();
    button2.onclick = jest.fn();

    const ksRegister = new KSRegister();
    const ksConfigs = [];
    Object.values(configs).forEach(config => {
        ksConfigs.push(KSConfig.fromObject(config));
    });
    ksRegister.register(ksConfigs);

    document.dispatchEvent(new KeyboardEvent('keydown', {key: '¡', code: 'Digit1', altKey: true}));
    expect(button1.onclick).toHaveBeenCalled();
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'A', code: 'KeyA', altKey: true, shiftKey: true}));
    expect(button2.onclick).toHaveBeenCalled();
});
