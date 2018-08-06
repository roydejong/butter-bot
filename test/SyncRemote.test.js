const expect = require('chai').expect;
const SyncRemote = require('../src/Sync/SyncRemote');

describe('SyncRemote.fromDsn()', () => {
    it('Throws error for invalid URLs', () => {
        expect(() => { SyncRemote.fromDsn(null) }).to.throw();
        expect(() => { SyncRemote.fromDsn("") }).to.throw();
        expect(() => { SyncRemote.fromDsn("asdf") }).to.throw();
    });

    it('Throws error for invalid protocols', () => {
        expect(() => { SyncRemote.fromDsn("ftp://abc@bla.com/123") }).to.throw();
    });

    it('Parses DSN without API key correctly', () => {
        let expected = new SyncRemote("https://bla.com", null);
        expect(SyncRemote.fromDsn("https://bla.com")).to.deep.equal(expected);
    });

    it('Parses DSN with API key correctly', () => {
        let expected = new SyncRemote("https://bla.com", "123456");
        expect(SyncRemote.fromDsn("https://123456@bla.com")).to.deep.equal(expected);
    });

    it('Removes trailing slash from parsed DSN', () => {
        let expected = new SyncRemote("https://bla2.com", "123456");
        expect(SyncRemote.fromDsn("https://123456@bla2.com/")).to.deep.equal(expected);
    });
});

describe('SyncRemote: magic getters', () => {
    it('.protocol property', () => {
        expect((new SyncRemote("https://bla.com", null)).protocol).to.equal("https");
        expect((new SyncRemote("http://bla.com", "123456")).protocol).to.equal("http");
    });

    it('.path property', () => {
        expect((new SyncRemote("https://bla.com", "123456")).path).to.equal("bla.com");
        expect((new SyncRemote("https://bla.com", null)).path).to.equal("bla.com");
    });

    it('.dsn property', () => {
        expect((new SyncRemote("https://bla.com", "123456")).dsn).to.equal("https://123456@bla.com");
        expect((new SyncRemote("https://bla.com", null)).dsn).to.equal("https://bla.com");
    });

    it('.isSecure property', () => {
        expect((new SyncRemote("https://bla.com", "123456")).isSecure).to.equal(true);
        expect((new SyncRemote("https://bla.com", null)).isSecure).to.equal(true);

        expect((new SyncRemote("http://bla.com", "123456")).isSecure).to.equal(false);
        expect((new SyncRemote("http://bla.com", null)).isSecure).to.equal(false);
    });

    it('.websocketUrl property', () => {
        expect((new SyncRemote("https://bla.com", "123456")).websocketUrl).to.equal("wss://bla.com/ws-api");
    });
});
