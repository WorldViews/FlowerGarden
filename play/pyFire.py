
import pyrebase

firebaseConfig = {
    "apiKey": "AIzaSyBqAsqHaBZGT-UsC82ShV3koGWWgu-l8to",
    "authDomain": "fir-helloworld-39759.firebaseapp.com",
    "databaseURL": "https://fir-helloworld-39759.firebaseio.com",
    'projectId': "fir-helloworld-39759",
    'storageBucket': "fir-helloworld-39759.appspot.com",
    'messagingSenderId': "1080893233748",
    'appId': "1:1080893233748:web:1614aab0d167c094322bc1"
}

print("config:", firebaseConfig)
   
firebase = pyrebase.initialize_app(firebaseConfig)
auth = firebase.auth()
print("got auth:", auth)
#user = auth.sign_in_with_email_and_password("donkimber@gmail.com", "chickenlittle")
user = auth.sign_in_with_email_and_password("donkimber@gmail.com", "xxxyyy")
#print("user", user)
token = user['idToken']
print("token", token)
print("fb", firebase)

# Get a reference to the database service
db = firebase.database()
print("db", db)

print("-------------------")

#obj = db.child("text").get(token)
obj = db.get(token)
print("obj:", obj.val())


# data to save
data = {
    "name": "Mortimer 'Morty' Smith"
}

# Pass the user's idToken to the push method
results = db.child("users").push(data, token)

#results = db.child("users").push(data, token)
#results = db.child("users").push(data)

