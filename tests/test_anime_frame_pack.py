"""Self-contained CI QA for illustrated PNG frame packing; no actual art needed."""
import json
from pathlib import Path
import tempfile
import unittest

from PIL import Image,ImageDraw

import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/"tools"))
import pack_anime_illustrated_frames as pack


class FramePackingTest(unittest.TestCase):
    def test_valid_ranger_pack_preserves_alpha_and_cells(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            for action,num in pack.ACTIONS.items():
                folder=root/"in"/"ranger"/action
                folder.mkdir(parents=True)
                for i in range(num):
                    pic=Image.new("RGBA",(256,384),(0,0,0,0))
                    d=ImageDraw.Draw(pic)
                    left=100+(i%3)
                    d.polygon(((left,30),(left+42,34),(left+51,320),(left+6,366)),
                              fill=(45,135,90,255))
                    pic.save(folder/f"{i:03}.png")
            meta=pack.pack("Ranger",root/"in",root/"out",verbose=False)
            self.assertEqual(len(meta),6)
            self.assertEqual(sum(x["frames"] for x in meta.values()),59)
            self.assertEqual(meta["walk"]["source_size"],[256,384])
            with Image.open(root/"out"/"ranger"/"attack.png") as sheet:
                self.assertEqual(sheet.size,(1536,192))
                self.assertEqual(sheet.mode,"RGBA")
                self.assertEqual(sheet.getpixel((0,0))[3],0)
                self.assertGreater(sheet.getchannel("A").getbbox()[2],120)

    def test_rejects_opaque_background(self):
        with tempfile.TemporaryDirectory() as tmp:
            f=Path(tmp)/"000.png"
            Image.new("RGBA",(128,192),(100,100,100,255)).save(f)
            with self.assertRaisesRegex(ValueError,"opaque top"):
                pack.require_frame(f)

    def test_rejects_cropped_weapon_or_backdrop(self):
        with tempfile.TemporaryDirectory() as tmp:
            f=Path(tmp)/"000.png"
            x=Image.new("RGBA",(128,192),(0,0,0,0))
            ImageDraw.Draw(x).rectangle((0,32,40,180),fill=(75,110,80,255))
            x.save(f)
            with self.assertRaisesRegex(ValueError,"horizontal source-frame edge"):
                pack.require_frame(f)

    def test_rejects_bad_size_and_missing_class(self):
        with tempfile.TemporaryDirectory() as tmp:
            f=Path(tmp)/"000.png"
            Image.new("RGBA",(129,193),(0,0,0,0)).save(f)
            with self.assertRaisesRegex(ValueError,"Unexpected frame size"):
                pack.require_frame(f)
            with self.assertRaisesRegex(ValueError,"Not an existing Dungeonfront class"):
                pack.pack("Berserker",Path(tmp),Path(tmp),verbose=False)


if __name__=="__main__":
    unittest.main(verbosity=2)
