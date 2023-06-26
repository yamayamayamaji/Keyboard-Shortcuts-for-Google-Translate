import KSEvent from 'ks4gt/dev/src/entity/KSEvent.js';


test('Check equality of KSEvent created from [alt + 1] KeyboardEvent', () => {
    const kbEvent = new KeyboardEvent('keydown', {key: '¡', code: 'Digit1', altKey: true}); // pressed [alt + 1]
    const ksEvent = KSEvent.fromKeyboardEvent(kbEvent);

    expect(ksEvent.equals(new KSEvent({
        alt: true,
        key: '1',
    }))).toBe(true);
    expect(ksEvent.equals(new KSEvent({
        alt: true,
        key: '¡',
    }))).toBe(true);

    expect(ksEvent.equals(new KSEvent({
        alt: true,
        shift: true,
        key: '1',
    }))).toBe(false);
    expect(ksEvent.equals(new KSEvent({
        alt: true,
        shift: true,
        key: '¡',
    }))).toBe(false);
    expect(ksEvent.equals(new KSEvent({
        key: '1',
    }))).toBe(false);
    expect(ksEvent.equals(new KSEvent({
        key: '¡',
    }))).toBe(false);
});
