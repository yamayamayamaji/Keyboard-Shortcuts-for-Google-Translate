import KSReciever from 'ks4gt/dev/src/entity/KSReciever.js';


beforeAll(() => {
    document.body.innerHTML = [
        '<button id="button1" />',
        '<button id="button2" />',
    ].join('');
});

test('alt+1 is assigned button1 click', () => {
    const selector = '#button1';
    const reciever = new KSReciever({
        name: 'button1',
        actionTarget: {
            selector: selector,
        },
    });
    const btn = document.querySelector(selector);
    btn.onclick = jest.fn();

    reciever.action();
    expect(btn.onclick).toHaveBeenCalled();
});

test('alt+2 is assigned button2 mouse-down-up', () => {
    const selector = '[id*=button]';
    const idx = 1;
    const reciever = new KSReciever({
        name: 'button2',
        actionTarget: {
            selector: selector,
            idx: idx,
        },
        behavior: 'mouseDownUp',
    });
    const btn = document.querySelectorAll(selector)[idx];
    const mouseEvents = ['onmouseover', 'onmousedown', 'onmouseup', 'onmouseout'];
    mouseEvents.forEach(evt => {btn[evt] = jest.fn();});
    
    reciever.action();
    mouseEvents.every(evt => {
        expect(btn[evt]).toHaveBeenCalled();
    });
});
