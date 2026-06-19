import os
import base64
from io import BytesIO
import numpy as np
from PIL import Image
from flask import Flask, render_template, request, jsonify
from Core.Prediction import predict

app = Flask(__name__)

# Load Model Weights
# We'll load them once on startup
print("Loading model weights...")
try:
    Theta1 = np.loadtxt('Core/Theta1.txt')
    Theta2 = np.loadtxt('Core/Theta2.txt')
    print("Model weights loaded successfully.")
except Exception as e:
    print("Warning: Could not load Theta files. Make sure Main.py has finished training.")
    Theta1, Theta2 = None, None

def process_image(img_data_b64):
    """
    Processes the base64 image from the canvas into a 784-length vector 
    matching the MNIST dataset preprocessing exactly.
    """
    # Decode base64 image
    img_data = base64.b64decode(img_data_b64.split(',')[1])
    img = Image.open(BytesIO(img_data))
    
    # The canvas is RGBA. The drawing is white with transparent background.
    # Convert transparent background to black.
    background = Image.new("RGBA", img.size, (0, 0, 0, 255))
    composite = Image.alpha_composite(background, img)
    img_l = composite.convert('L')
    
    # 1. Bounding box crop
    bbox = img_l.getbbox()
    if bbox is None:
        return None # Nothing drawn
        
    cropped = img_l.crop(bbox)
    
    # 2. Scale so max dimension is 20 pixels
    w, h = cropped.size
    max_dim = max(w, h)
    scale = 20.0 / max_dim
    new_w = max(1, int(w * scale))
    new_h = max(1, int(h * scale))
    cropped = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # 3. Center inside 28x28 black image
    final_img = Image.new("L", (28, 28), "black")
    paste_x = (28 - new_w) // 2
    paste_y = (28 - new_h) // 2
    final_img.paste(cropped, (paste_x, paste_y))
    
    # 4. Flatten row-by-row (C-order)
    x = np.asarray(final_img)
    vec = np.zeros((1, 784))
    k = 0
    for i in range(28):
        for j in range(28):
            vec[0][k] = x[i][j]
            k += 1
            
    return vec / 255.0

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict_digit():
    global Theta1, Theta2
    if Theta1 is None or Theta2 is None:
        # Try reloading in case training finished after server started
        try:
            Theta1 = np.loadtxt('Core/Theta1.txt')
            Theta2 = np.loadtxt('Core/Theta2.txt')
        except:
            return jsonify({'error': 'Model weights are not trained yet. Please wait for Main.py to finish.'}), 503

    data = request.json
    if 'image' not in data:
        return jsonify({'error': 'No image data provided'}), 400
        
    vec = process_image(data['image'])
    if vec is None:
        return jsonify({'error': 'Canvas is empty'}), 400
        
    prediction = predict(Theta1, Theta2, vec)
    digit = int(prediction[0])
    
    return jsonify({'digit': digit})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
