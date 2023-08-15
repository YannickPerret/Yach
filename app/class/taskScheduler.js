var cron = require('node-cron');

class taskScheduler {
    constructor(config) {
        this.cron = cron;
        this.queue = [];
        this.index = 0;

        this.init();
    }

    init() {
        this.cron.schedule('* * * * * *', () => {
            if (this.queue.length > 0){
                this.queue.forEach((task) => {
                    if (this.tasks[task] && this.interval[task]){
                        this.cron.schedule(this.interval[task], () => {
                            this.tasks[task]();
                        });
                    }
                });
            }
        });
    }

    //start, check if new task in schedule and start it
    start() {
         
    }

    static addTask(task) {
        taskScheduler.queue.push(task);
    }

    showQueue() {
        if (this.queue.length > 0){
            this.queue.forEach((task) => {
                console.log(task);
            });
        }
    }

    _currentTask() {
        
    }

    _startTask() {
        //start task
        this.cron.schedule(this._currentTask.getInterval()), () => {
            this._currentTask.run();
        }
    }


}



module.exports = taskScheduler;