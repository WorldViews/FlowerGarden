
import json, os

class Garden:
    def __init__(self):
        self.flowers = []
        self.pictures = []
    
    def addFlower(self, name, x, y):
        f = {'type': 'flower', 'id': name, 'x': x, 'y': y}
        self.flowers.append(f)
    
    def addPicture(self, name, url, x, y, width, height):
        p = {'type': 'Pic', 'name': name,
             'url': url, 'x': x, 'y': y, 'width': width, 'height': height}
        self.pictures.append(p)

    def getRep(self):
        return {'flowers': self.flowers, 'pictures': self.pictures}
    
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
    wd = 100
    ht = 100
    x = 0
    y = 0
    for name in names:
        print(name)
        g.addFlower(name, x, y)
        x += wd
        url = 'python/taikoin/'+name
        g.addPicture(name, url, x, y+ht, wd, ht)


    g.save("../gardens/taikoInGarden.json")

if __name__ == '__main__':
    genTaikoGarden()
