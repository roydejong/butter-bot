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
        let inputSched = "every minute on sunday";
        let inputPrio = 123;

        let sTask = new ScheduledTask({
            "taskName": inputTask,
            "properties": inputProps,
            "scheduleExpression": inputSched,
            "priority": inputPrio
        });

        let actual = sTask.discriminator;

        let expected = [
            inputTask,
            hash.MD5(inputProps),
            inputSched,
            inputPrio
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
            "taskName": "some-task",
            "scheduleExpression": "every day",
            "priority": 1234,
            "properties": {"a": "b", "c": 123}
        });

        let actual = sTask.asDatabaseObject();

        let expected = {
            "id": sTask.discriminator,
            "taskName": "some-task",
            "scheduleExpression": "every day",
            "priority": 1234,
            "properties": {"a": "b", "c": 123}
        };

        expect(actual).to.deep.equal(expected);
    });
});
