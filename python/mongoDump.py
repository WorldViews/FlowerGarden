

import pymongo


def dump():
    print("dump flowers")
    client = pymongo.MongoClient('localhost', 27017)
    print(client)
    db = client.db1
    print(db)
    flowers = db.flowers
    for flower in flowers.find():
            print(flower)


dump()


