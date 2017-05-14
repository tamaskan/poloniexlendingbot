# coding=utf-8
from plugins.Plugin import Plugin
import modules.Poloniex as Poloniex
import sqlite3

DB_CREATE = "CREATE TABLE IF NOT EXISTS history(" \
            "id INTEGER UNIQUE, open TIMESTAMP, close TIMESTAMP," \
            " duration NUMBER, interest NUMBER, rate NUMBER," \
            " currency TEXT, amount NUMBER, earned NUMBER, fee NUMBER )"
DB_INSERT = "INSERT OR REPLACE INTO 'history'" \
            "('id','open','close','duration','interest','rate','currency','amount','earned','fee')" \
            " VALUES (?,?,?,?,?,?,?,?,?,?);"
DB_GET_LAST_TIMESTAMP = "SELECT max(close) as last_timestamp FROM 'history'"


class AccountStats(Plugin):
    def on_bot_init(self):
        super(AccountStats, self).on_bot_init()
        self.init_db()
        self.update_history()

    def on_bot_loop(self):
        pass

    # noinspection PyAttributeOutsideInit
    def init_db(self):
        self.db = sqlite3.connect(r'market_data\loan_history.sqlite3')
        self.db.execute(DB_CREATE)
        self.db.commit()

    def update_history(self):
        cursor = self.db.execute(DB_GET_LAST_TIMESTAMP)
        self.log.log(cursor.fetchone()[0])
        cursor.close()

        history = self.api.return_lending_history(Poloniex.create_time_stamp("2017-05-13 00:00:00")
                                                  , Poloniex.create_time_stamp("2017-05-15 00:00:00"))
        for loan in history:
            self.db.execute(DB_INSERT, [loan['id'], loan['open'], loan['close'], loan['duration'], loan['interest'],
                                        loan['rate'], loan['currency'], loan['amount'], loan['earned'], loan['fee']])
        self.db.commit()
        self.log.log(str(len(history)))
