"""Synthetic QA for chromakey isolated painted Ranger imports."""
from pathlib import Path
import sys
import unittest
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"tools"))
from import_illustrated_ranger_pose import extract_rgba,place

class IllustratedRangerImportTest(unittest.TestCase):
 def painted_example(self):
  im=Image.new("RGB",(600,900),(255,0,255))
  d=ImageDraw.Draw(im)
  # Connected full body silhouette, hood, bow and travel cape.
  d.polygon([(160,330),(285,270),(360,310),(412,780),(255,790),(170,700)],fill="#376c4c")
  d.ellipse((225,150,338,301),fill="#cbb89e")
  d.polygon([(220,205),(263,92),(347,150),(348,230)],fill="#314b34")
  d.line((349,390,455,620),fill="#a57449",width=19)
  d.line((455,620,466,320),fill="#bd985b",width=15)
  d.polygon([(240,650),(295,660),(302,800),(250,800)],fill="#765a3a")
  d.polygon([(314,650),(365,655),(377,800),(322,800)],fill="#765a3a")
  return im
 def test_extract_and_place(self):
  cropped,meta=extract_rgba(self.painted_example())
  self.assertEqual(cropped.mode,"RGBA")
  self.assertGreater(cropped.width,50)
  self.assertGreater(meta["main_blob_px"],5000)
  staged,place_meta=place(cropped)
  self.assertEqual(staged.size,(512,768))
  self.assertEqual(staged.getpixel((0,0))[3],0)
  self.assertGreater(staged.getchannel("A").getbbox()[3],500)
  self.assertEqual(place_meta["pivot"],[256,740])
 def test_reject_gradient_poster(self):
  im=self.painted_example()
  im.putpixel((0,0),(0,0,0))
  with self.assertRaisesRegex(ValueError,"not flat chromakey"):
   extract_rgba(im)
 def test_reject_subject_clipping_edge(self):
  im=self.painted_example()
  d=ImageDraw.Draw(im);d.line((265,170,600,170),fill="#70a96b",width=25)
  with self.assertRaisesRegex(ValueError,"touches canvas edge"):
   extract_rgba(im)

if __name__=="__main__":unittest.main()
