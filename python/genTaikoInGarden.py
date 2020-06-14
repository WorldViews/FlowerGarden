
import json, os

class Garden:
    def __init__(self):
        self.flowers = []
    
    def addFlower(self, name, x, y):
        f = {'type': 'flower', 'x': x, 'y': y}
        self.flowers.append(f)
    
    def getRep(self):
        return {'flowers': self.flowers}
    
    def save(self, jsonPath):
        print("saving garden to", jsonPath)
        rep = self.getRep()
        json.dump(rep, open(jsonPath,'w'), indent=3)


def genTaikoGarden():
    g = Garden()
    names = os.listdir("taikoin")
    images = []
    for name in names:
        if name.lower().endswith('.jpg'):
            images.append(name)
    wid = 30
    x = 0
    y = 0
    for name in names:
        print(name)
        g.addFlower(name, x, y)
        x += wid


    g.save("taikoInGarden.json")

if __name__ == '__main__':
    genTaikoGarden()
