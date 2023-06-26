import KS4GT from 'ks4gt/dev/src/KS4GT.js';

jest.mock('ks4gt/dev/src/config/ConfigLoader.js')

beforeAll(() => {
    document.body.innerHTML = [
        '<button id="button1" />',
        '<button id="button2" />',
    ].join('');

});

test('extension initialized', async() => {
    const button1 = document.querySelector('#button1');
    const button2 = document.querySelector('#button2');
    button1.onclick = jest.fn();
    button2.onclick = jest.fn();

    const ks4gt = new KS4GT();
    await ks4gt.init();

    document.dispatchEvent(new KeyboardEvent('keydown', {key: '¡', code: 'Digit1', altKey: true}));
    expect(button1.onclick).toHaveBeenCalled();
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'A', code: 'KeyA', altKey: true, shiftKey: true}));
    expect(button2.onclick).toHaveBeenCalled();
});
