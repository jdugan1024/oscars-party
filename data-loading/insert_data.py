import json
import psycopg2
dbh = psycopg2.connect(database="oscars")
cursor = dbh.cursor()

data = json.loads(open("2018.json").read())


def insert_data():
    for c in data:
        name = c["name"]
        points = c["points"]
        order = c["order"]
        print u"{} {} {}".format(name, points, order)
        q = "INSERT into oscars.category (name, points, display_order) values (%s, %s, %s) returning id"
        cursor.execute(q, (name, points, order))
        cat_id = cursor.fetchone()[0]
        print "catid", cat_id
        for n in c["nominees"]:
            print u"    {}".format(n)
            qnom = "INSERT into oscars.nominee (name, category_id) values (%s, %s)"
            cursor.execute(qnom, (n, cat_id))

    dbh.commit()

insert_data()
