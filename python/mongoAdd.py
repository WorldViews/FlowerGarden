

import pymongo

def insert():
    print("Hello Mongo")
    client = pymongo.MongoClient('localhost', 27017)
    print(client)
    db = client.db1
    print(db)
    flowers = db.flowers
    print(flowers)
    recs = [
        {'name': 'shawna', 'flower': 'tulip'},
        {'name': 'enock', 'flower': 'daisy'},
        {'name': 'mary', 'flower': 'rose'}
    ]
    flowers.insert(recs)

insert()

