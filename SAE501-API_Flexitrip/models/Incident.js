class Incident {
  static async find() { return []; }
  static async findOne() { return null; }
  static async findById() { return null; }
  static async create() { return null; }
  async save() { return this; }
}

module.exports = Incident;
