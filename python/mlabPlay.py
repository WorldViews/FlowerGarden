

import pymongo

#URL = 'mongodb+srv://donkimber:mlab1234@virtual-flowers-ezlpw.mongodb.net/<dbname>?retryWrites=true&w=majority'
URL = 'mongodb+srv://virtual-flowers-ezlpw.mongodb.net/virtual-flowers?retryWrites=true&w=majority'
#URL = 'localhost'

class MongoGardenDB:
    def __init__(self, url, dbName='virtual-flowers'):
        self.url = url
        print("Connecting to", url)
        self.client = pymongo.MongoClient(url, 27017)
        self.db = self.client['virtual-flowers']
        print("db:", self.db)
        if not self.db:
            print("*** server has no DB named", dbName)
            raise "No DB"

    def dump(self, collectionName='flowers'):
        print("dumping collection", collectionName)
        docs = self.db[collectionName]
        print(docs)
        for doc in docs.find():
            print(doc)

    def addJunk(self):
        recs = [
            {'name': 'shawna', 'flower': 'tulip'},
            {'name': 'enock', 'flower': 'daisy'},
            {'name': 'mary', 'flower': 'rose'}
        ]
        print("Adding recs to flowers.  recs:", recs)
        #self.db.flowers.insert_many(recs)
        for rec in recs:
            print("inserting rec", rec)
            self.db.flowers.insert_one(rec)
 

def foo():
    mgdb = MongoGardenDB(URL)
    mgdb.addJunk()
    mgdb.dump()

if __name__ == '__main__':
    foo()



