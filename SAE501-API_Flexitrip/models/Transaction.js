class Transaction {
    static async find() { return []; }
    async save() { return this; }
}

module.exports = Transaction;
