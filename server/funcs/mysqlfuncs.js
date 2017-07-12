'use strict';
import mysql from 'mysql';
import { _config } from './db_config.js'
// this variable can change
var _connection = null;
// Our main class object
class MySQLHandler {
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
            if (_connection != null && _connection.state == 'authenticated') resolve(conn);
            let conn = mysql.createConnection(conf);
            addDisconnectHandler(conn);
            conn.connect(function(error) {
                if (error) reject(error);
                resolve(conn);
            });

        });
    }
    constructor() {
        //unused
    }
    changeDatabase(db) {
        return new Promise((resolve, reject) => {
            _connection.changeUser({
                database: db
            }, function(error) {
                if (error) reject(error);
                resolve();
            });
        });
    }
    // Querying sql
    query(sql, params, db) {
        let _query = () => {
            return new Promise((resolve, reject) => {
                _connection.query(sql, params, function(error, rows, fields) {
                    if (error) {
                        return reject(error);
                    }
                    resolve(rows);
                });
            });
        };
        return this.initializeConnection(_config).then((conn) => {
            _connection = conn;
        }).then(_query);

    }
}

export { MySQLHandler };
