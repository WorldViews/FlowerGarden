
import pyrebase
import json

firebaseConfig = {
    "apiKey": "AIzaSyBqAsqHaBZGT-UsC82ShV3koGWWgu-l8to",
    "authDomain": "fir-helloworld-39759.firebaseapp.com",
    "databaseURL": "https://fir-helloworld-39759.firebaseio.com",
    'projectId': "fir-helloworld-39759",
    'storageBucket': "fir-helloworld-39759.appspot.com",
    'messagingSenderId': "1080893233748",
    'appId': "1:1080893233748:web:1614aab0d167c094322bc1",
    'serviceAccount': "firebaseServiceAccountKey.json"
}

class FireDB:
    def __init__(self):
        print("config:", firebaseConfig)
        self.firebase = pyrebase.initialize_app(firebaseConfig)
        self.auth = self.firebase.auth()
        print("got auth:", self.auth)
        #user = auth.sign_in_with_email_and_password("donkimber@gmail.com", "chickenlittle")
        self.user = self.auth.sign_in_with_email_and_password("donkimber@gmail.com", "xxxxxx")
        print("user", self.user)
        self.token = self.user['idToken']
        print("token", self.token)
        print("fb", self.firebase)

        # Get a reference to the database service
        db = self.firebase.database()
        self.db = db
        print("db", db)

    def dump(self, jsonPath=None):
        print("-------------------")

        #obj = db.child("text").get(token)
        objRef = self.db.get(self.token)
        #objRef = self.db.get()
        obj = objRef.val()
        print("obj:", obj)
        jstr = json.dumps(obj, indent=3)
        print(jstr)
        if jsonPath:
            open(jsonPath, 'w').write(jstr)

    def saveProjects(self, jsonPath=None):
        print("-------------------")

        #obj = db.child("text").get(token)
        objRef = self.db.get(self.token)
        obj = objRef.val()
        #print("obj:", obj)
        projObjs = obj['topics']
        jstr = json.dumps(projObjs, indent=3)
        print(jstr)
        if jsonPath:
            open(jsonPath, 'w').write(jstr)

    def saveDB(self, jsonPath=None):
        print("--------save DB -----------")

        #obj = db.child("text").get(token)
        objRef = self.db.get(self.token)
        obj = objRef.val()
        jstr = json.dumps(obj, indent=3)
        print(jstr)
        if jsonPath:
            open(jsonPath, 'w').write(jstr)

    def addUser(self):
        # data to save
        data = {
            "name": "Mortimer 'Morty' Smith"
        }

        # Pass the user's idToken to the push method
        results = self.db.child("users").push(data, self.token)
        print("reseults", results)

    def addProjects(self, jsonPath="../projects.json"):
        obj = json.loads(open(jsonPath, "r").read())
        print(obj)
        # Pass the user's idToken to the push method
        #results = self.db.child("activities").push(obj, self.token)
        results = self.db.child("topics").set(obj, self.token)
        print("results", results)


if __name__ == '__main__':
    fdb = FireDB()
    fdb.dump()
    #fdb.dump("firebase.db.json")
    #fdb.saveProjects("../projects.bak.json")
    #fdb.addProjects()
    #fdb.addProjects("../projects.bak.json")
    #fdb.addUser()

