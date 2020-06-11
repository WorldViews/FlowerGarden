
import pymongo

def clear():
    print("Remove Flowers")
    client = pymongo.MongoClient('localhost', 27017)
    print(client)
    db = client.db1
    print(db)
    flowers = db.flowers
    print(flowers)
    flowers.remove()

clear()