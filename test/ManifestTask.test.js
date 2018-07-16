const expect = require('chai').expect;
const ManifestTask = require('../src/Packages/ManifestTask');

describe('ManifestTask struct', () => {
    it('Can construct with basic input', () => {
        let mt = new ManifestTask(null, "test-name", "test-require");

        expect(mt.taskName).to.equal("test-name");
        expect(mt.requirePath).to.equal("test-require");
    });

    it('Validity checks: Both fields must have values', () => {
        expect(new ManifestTask(null, null, null).isValid()).to.equal(false);
        expect(new ManifestTask(null, "", "").isValid()).to.equal(false);
        expect(new ManifestTask(null, "a", "").isValid()).to.equal(false);
        expect(new ManifestTask(null, "", "a").isValid()).to.equal(false);

        // --

        expect(new ManifestTask(null, "a", "a").isValid()).to.equal(true);
    });

    it('Validity checks: Require path may not be absolute', () => {
        expect(new ManifestTask(null, "valid-name", "/rel/path.js").isValid()).to.equal(false);

        // --

        expect(new ManifestTask(null, "valid-name", "./rel/path.js").isValid()).to.equal(true);
        expect(new ManifestTask(null, "valid-name", "rel/path.js").isValid()).to.equal(true);
    });

    it('Validity checks: Require path may not contain path traversals (../)', () => {
        expect(new ManifestTask(null, "valid-name", "../rel/path.js").isValid()).to.equal(false);
        expect(new ManifestTask(null, "valid-name", "/../rel/path.js").isValid()).to.equal(false);
        expect(new ManifestTask(null, "valid-name", ".././rel/path.js").isValid()).to.equal(false);
    });

    it('Can be filled with fromObject()', () => {
        let expected = new ManifestTask(null, "test-name", "test-require");
        let actual = ManifestTask.fromData(null, { name: "test-name", require: "test-require" });

        expect(expected.taskName).to.equal("test-name");
        expect(expected.requirePath).to.equal("test-require");
    });
});
