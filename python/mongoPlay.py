

import pymongo

print("Hello Mongo")
client = pymongo.MongoClient('localhost', 27017)
print(client)

db = client.db1

print(db)
flowers = db.flowers
print(flowers)
flowers.insert_one({'name': 'don', 'flower': 'rose'})
recs = [
    {'name': 'shawna', 'flower': 'tulip'},
    {'name': 'enock', 'flower': 'daisy'},
    {'name': 'mary', 'flower': 'rose'}
]
flowers.insert(recs)
for flower in flowers.find():
    print(flower)
print("------------------")
for flower in flowers.find({'flower': 'rose'}):
    print(flower)


