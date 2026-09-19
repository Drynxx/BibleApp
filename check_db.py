import sqlite3; conn = sqlite3.connect('assets/db/cornilescu.sqlite'); cur = conn.cursor(); cur.execute('SELECT name FROM sqlite_master WHERE type="table"'); print(cur.fetchall());
