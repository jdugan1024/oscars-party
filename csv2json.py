import csv
import json

items = []

with open('2017oscars.csv', 'rb') as f:
    for row in csv.reader(f):
        if row[0] in ["Category", "Tiebreaker"]:
            continue
        nominees = []
        i = 1
        for nominee in row[2:]:
            if nominee == "":
                continue

            nominees.append({
                "id": i,
                "label": nominee.strip(),
            })
            i += 1

        items.append({
            "category": row[0],
            "points": int(row[1]),
            "nominees": nominees
        })

with open("2017oscars.json", "w") as f:
    f.write(json.dumps(items, indent=4))

