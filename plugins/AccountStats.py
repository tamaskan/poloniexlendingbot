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

    def after_lending(self):
        self.update_history()

    # noinspection PyAttributeOutsideInit
    def init_db(self):
        self.db = sqlite3.connect(r'market_data\loan_history.sqlite3')
        self.db.execute(DB_CREATE)
        self.db.commit()

    def update_history(self):
        # timestamps are in UTC
        last_time_stamp = "2009-01-03 18:15:05"
        cursor = self.db.execute(DB_GET_LAST_TIMESTAMP)
        row = cursor.fetchone()
        if row[0] is not None:
            last_time_stamp = row[0]
        self.log.log(last_time_stamp)
        cursor.close()

        history = self.api.return_lending_history(Poloniex.create_time_stamp(last_time_stamp)
                                                  , sqlite3.time.time(), 10000000)
        loans = []
        for loan in reversed(history):
            loans.append(
                [loan['id'], loan['open'], loan['close'], loan['duration'], loan['interest'],
                 loan['rate'], loan['currency'], loan['amount'], loan['earned'], loan['fee']])
        self.db.executemany(DB_INSERT, loans)
        self.db.commit()
        self.log.log(str(len(loans)))
