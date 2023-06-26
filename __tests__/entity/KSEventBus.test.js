import KSEvent from 'ks4gt/dev/src/entity/KSEvent.js';
import KSEventBus from 'ks4gt/dev/src/entity/KSEventBus.js';


test('can dispatch registered event', () => {
    const ksEventBus = new KSEventBus();
    const reciever = {action: jest.fn()};
    const ksEvent = new KSEvent({alt: true, key: 'a'});
    ksEventBus.addListener(ksEvent, reciever);

    ksEventBus.dispatch(ksEvent);
    expect(reciever.action).toHaveBeenCalled();
});
