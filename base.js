var EventEmitter = require("events").EventEmitter;

module.exports = class IJSBase extends EventEmitter {
    constructor() {
        super(...arguments);
    }
}