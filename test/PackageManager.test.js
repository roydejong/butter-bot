const expect = require('chai').expect;
const PackageManager = require('../src/Packages/PackageManager');

describe('PackageManager', () => {
    it('getPackageName() calculates ID correctly from npm install request', () => {
        expect(PackageManager.getPackageName("test")).to.equal("test");
        expect(PackageManager.getPackageName("test@latest")).to.equal("test");
        expect(PackageManager.getPackageName("github:user/repo")).to.equal("repo");
        expect(PackageManager.getPackageName("/path/to/dir")).to.equal("dir");
        expect(PackageManager.getPackageName("/path/to/dir/")).to.equal("dir");
    });
});
