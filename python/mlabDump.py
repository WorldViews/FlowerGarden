

import pymongo

URL = 'mongodb+srv://donkimber:mlab1234@virtual-flowers-ezlpw.mongodb.net/virtual-flowers?retryWrites=true&w=majority'

def dump():
    print("dump flowers")
    client = pymongo.MongoClient(URL, 27017)
    print(client)
    db = client['virtual-flowers']
    print("db:", db)
    print("getting flowers")
    flowers = db.flowers
    print(flowers)
    for flower in flowers.find():
        print(flower)


dump()


