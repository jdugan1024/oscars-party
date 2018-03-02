import json

# from http://d37lefl1k5vay2.cloudfront.net/api/1.0/pages/nominees%2F2018/
data = json.loads(open("./2018oscars_raw.json").read())
categories = json.loads(open("category-points.json").read())

def reformat(section):
    return " ".join([x.capitalize() for x in section.split("-")])

class Category(object):
    def __init__(self, name, points, order, nominees):
        self.name = name
        self.points = points
        self.order = order
        self.nominees = nominees

    def to_json(self):
        return dict(
            name=self.name,
            points=self.points,
            order=self.order,
            nominees=self.nominees,
        )

cat_list = []
for cat, v in data["data"]["sections"]["nominees"].items():
    category = reformat(cat)
    points = categories[category]
    order = v["order"]
    cat_obj = Category(category, points, order, [])
    print category, points, order
    for nominee in v["result"]:
        nom = u"{} ({})".format(nominee["post_title"], nominee["nominee_description"])
        cat_obj.nominees.append(nom)
    cat_list.append(cat_obj)

cat_json = [x.to_json() for x in cat_list]
open("2018.json", "w").write(json.dumps(cat_json, indent=4))
