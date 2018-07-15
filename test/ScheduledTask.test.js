const expect = require('chai').expect;
const ScheduledTask = require('../src/Tasks/ScheduledTask');
const hash = require('object-hash');

describe('ScheduledTask struct', () => {
    it('Can be initialized with properties', () => {
        let sTask = new ScheduledTask({
            "taskName": "some-task",
            "properties": {
                "do": "things"
            }
        });

        expect(sTask.taskName).to.equal("some-task");
        expect(sTask.properties.do).to.equal("things");
    });

    it('Provides an automatic discriminator', () => {
        let inputTask = "test-task-123";
        let inputProps = {
            "my": "propset123"
        };

        let sTask = new ScheduledTask({
            "taskName": inputTask,
            "properties": inputProps
        });
        let actual = sTask.discriminator;

        let expected = [
            inputTask,
            hash.MD5(inputProps)
        ].join('@');

        expect(actual).to.equal(expected);
    });

    it('Cannot be initialized with non-whitelisted properties', () => {
        let sTask = new ScheduledTask({
            "someProp": "someVal",
            "taskName": "someVal"
        });

        expect(sTask.someProp).to.be.an('undefined');
        expect(sTask.taskName).to.equal('someVal');
    });

    it('Can be serialized into simple database object', () => {
        let sTask = new ScheduledTask({
            "packageName": "bb-test-pkg",
            "taskName": "some-task"
        });

        let actual = sTask.asDatabaseObject();

        let expected = {
            id: sTask.discriminator
        };

        expect(actual).to.deep.equal(expected);
    });
});