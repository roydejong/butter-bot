const expect = require('chai').expect;
const ManifestTask = require('../src/Packages/ManifestTask');

describe('ManifestTask struct', () => {
    it('Can construct with basic input', () => {
        let mt = new ManifestTask("test-name", "test-require");

        expect(mt.name).to.equal("test-name");
        expect(mt.require).to.equal("test-require");
    });

    it('Validity checks: Both fields must have values', () => {
        expect(new ManifestTask(null, null).isValid()).to.equal(false);
        expect(new ManifestTask("", "").isValid()).to.equal(false);
        expect(new ManifestTask("a", "").isValid()).to.equal(false);
        expect(new ManifestTask("", "a").isValid()).to.equal(false);

        // --

        expect(new ManifestTask("a", "a").isValid()).to.equal(true);
    });

    it('Validity checks: Require path may not be absolute', () => {
        expect(new ManifestTask("valid-name", "/rel/path.js").isValid()).to.equal(false);

        // --

        expect(new ManifestTask("valid-name", "./rel/path.js").isValid()).to.equal(true);
        expect(new ManifestTask("valid-name", "rel/path.js").isValid()).to.equal(true);
    });

    it('Validity checks: Require path may not contain path traversals (../)', () => {
        expect(new ManifestTask("valid-name", "../rel/path.js").isValid()).to.equal(false);
        expect(new ManifestTask("valid-name", "/../rel/path.js").isValid()).to.equal(false);
        expect(new ManifestTask("valid-name", ".././rel/path.js").isValid()).to.equal(false);
    });

    it('Can be filled with fromObject()', () => {
        let expected = new ManifestTask("test-name", "test-require");
        let actual = ManifestTask.fromData({ name: "test-name", require: "test-require" });

        expect(expected.name).to.equal("test-name");
        expect(expected.require).to.equal("test-require");
    });
});
