const Database = require('sync-json-database');
const SokobanDB = new Database('./databases/sokoban-db-mubi.json');

// the only reason this file exists is to just make using this db thing easier
// originally this used JoshDB but that is entirely non-standard from the rest of the codebase so this is here now
module.exports = SokobanDB;
