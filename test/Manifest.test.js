const expect = require('chai').expect;
const path = require('path');
const Manifest = require('../src/Packages/Manifest');
const ManifestTask = require('../src/Packages/ManifestTask');

describe('Manifest struct', () => {
    it('Can parse task list from file on disk', () => {
        let expected = new Manifest();
        expected.tasks.push(new ManifestTask(expected, "sample-file-task", "sample-file-req"));

        let actual = Manifest.parseFromPath(path.join(__dirname, "./samples/sample-manifest.json"));

        // normalize so chai doesn't break
        actual.tasks[0].manifest = null;
        expected.tasks[0].manifest = null;

        expect(actual.tasks).to.deep.equal(expected.tasks);
    });

    it('Validity checks: Blank manifest is valid (baseline test)', () => {
        let mf = new Manifest();
        expect(mf.isValid()).to.equal(true);
    });

    it('Validity checks: If invalid tasks are held, manifest is invalid', () => {
        let mf = new Manifest();
        mf.tasks.push(new ManifestTask(null, null));
        expect(mf.isValid()).to.equal(false);
    });
});
