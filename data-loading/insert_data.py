import json

import psycopg2

data = json.loads(open("./2017oscars.json").read())

dbh = psycopg2.connect(database="oscars")

for category in data:
    print category["category"]
    c = dbh.cursor()
    q = "INSERT into oscars.category (name, points) values (%s, %s) returning id"
    c.execute(q, (category["category"], category["points"]))
    cat_id = c.fetchone()[0]
    print "catid", cat_id
    for nom in category["nominees"]:
        qnom = "INSERT into oscars.nominee (name, category_id) values (%s, %s)"
        c.execute(qnom, (nom["label"], cat_id))

dbh.commit()
