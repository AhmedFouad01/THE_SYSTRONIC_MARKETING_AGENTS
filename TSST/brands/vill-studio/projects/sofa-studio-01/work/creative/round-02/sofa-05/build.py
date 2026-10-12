from pathlib import Path
import json
from PIL import Image
p = Path(__file__).parent
m = json.loads((p / 'layers.json').read_text(encoding='utf-8'))
Image.open(p / m['layers'][0]['file']).save(p / m['output'])
