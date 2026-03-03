import json


def open_json(filename):
    with open(filename, encoding="utf-8") as f:
        data = json.load(f)
    return data


def new_file(filename, content):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(content, f, ensure_ascii=False, indent=2)


emd = open_json("emd.json")

for atleta in emd:
    if "_id" in atleta:
        atleta["id"] = atleta.pop("_id")

res = {}
res["emd"] = emd

new_file("emd_db.json", res)

