"use strict";
// Const declarations
const mysql = require('mysql');
// this variable can change
var _config = null;
var _connection = null;
// Our main class object
class MySQL {
    // Setters
    set setMySQL_config(value) {
        _config = value;
    }
    set setMySQL_connection(value) {
        _connection = value;
    }
    // Getters
    get getMySQL_connection() {
        return _connection;
    }
    get getMySQL_config() {
        return _config;
    }
    // This callback getter will be wrapped inside a promise.
    initializeConnection(conf) {
        return new Promise((resolve, reject) => {
            function addDisconnectHandler(conn) {
                conn.on("error", function(error) {
                    if (error instanceof Error) {
                        if (error.code === "PROTOCOL_CONNECTION_LOST") {
                            console.error(error.stack);
                            console.log("Lost connection. Reconnecting...");
                            initializeConnection(conn.config);
                        } else if (error.fatal) {
                            reject(error);
                        }
                    }
                });
            }
            let conn = mysql.createConnection(conf);

            // Add handlers.
            addDisconnectHandler(conn);

            conn.connect();
            resolve(conn);
        });
    }
    // Construct the listener for our ssl socket
    constructor(config) {
        this.setMySQL_config = config;
    }
    changeDatabase(db) {
        return new Promise((resolve, reject) => {
            let conn = this.getMySQL_connection;
            conn.changeUser({
                database: db
            }, function(error) {
                if (error) reject(error);
                resolve();
            });
        });
    }
    // Querying sql
    query(sql, params, db) {
        if (this.getMySQL_connection == null) {
            return this.initializeConnection(this.getMySQL_config).then((connObj) => {
                this.setMySQL_connection = connObj;
                let conn = this.getMySQL_connection;
                return new Promise((resolve, reject) => {
                    conn.query(sql, params, function(error, rows, fields) {
                        if (error) {
                            return reject(error);
                        }
                        resolve(rows);
                    });
                });
            });
        } else {
            let conn = this.getMySQL_connection;
            return new Promise((resolve, reject) => {
                conn.query(sql, params, function(error, rows, fields) {
                    if (error) {
                        return reject(error);
                    }
                    resolve(rows);
                });
            });
        }
    }
}

module.exports = MySQL;
