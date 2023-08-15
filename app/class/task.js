const cron = require('node-cron');

class Task {
    constructor(config) {
        this.calendar = config.calendar;
        this.name = config.name;
        this.expression = config.expression;
        this.task = null;
    }

    start(taskFunc) {
        if (!this.task) {
            if (cron.validate(this.expression) === false) throw new Error('Invalid cron expression');
            this.task = cron.schedule(this.expression, () => {
                taskFunc()
            });
        }
    }

    stop() {
        if (this.task) {
            this.task.stop();
        }
    }

    remove() {
        if (this.task) {
            this.task.destroy();
            this.task = null;
        }
    }

    getStatus() {
        return this.task ? "Started" : 'Not started';
    }
}

module.exports = Task;
