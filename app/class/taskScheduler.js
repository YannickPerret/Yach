const Task = require('./task');

class TaskScheduler {
    constructor() {
        if (TaskScheduler.instance) {
            return TaskScheduler.instance;
        }

        this.tasksQueue = [];
        TaskScheduler.instance = this;
    }

    addTask(interval, taskFunc, config = {}) {
        const task = new Task({
            calendar: config.calendar,
            name: config.name || 'Unnamed Task',
            expression: interval
        });

        task.start(taskFunc);
        this.tasksQueue.push(task);
        console.debug(`Cron - Calendar ${config.name} add sync to queue`)
        return task;
    }

    removeTask(task) {
        const index = this.tasksQueue.indexOf(task);
        if (index !== -1) {
            this.tasksQueue[index].remove();
            this.tasksQueue.splice(index, 1);
        }
    }

    showTasks() {
        this.tasksQueue.forEach((task, index) => {
            console.log(`Task ${index + 1}: ${task.getStatus()}`);
        });
    }


    static getInstance() {
        if (!this.instance) {
            this.instance = new TaskScheduler();
        }
        return this.instance;
    }
}


module.exports = TaskScheduler;