# Custom Neural Network Digit Recognizer

A modern, interactive web application that predicts handwritten digits using a **custom-built Neural Network** created entirely from scratch using raw mathematics in Python (NumPy) — no heavy ML frameworks like PyTorch or TensorFlow were used.

## Features

- **From-Scratch Machine Learning**: The core model is a Multi-Layer Perceptron (MLP) with 1 hidden layer consisting of 256 neurons, trained on the MNIST dataset using L-BFGS-B optimization and backpropagation written entirely in NumPy.
- **Robust Image Processing**: Built-in backend preprocessing mathematically crops, scales (preserving aspect ratio), and centers user-drawn digits to perfectly match the 28x28 MNIST format, ensuring high real-world accuracy.
- **Modern Web Interface**: A sleek, dark-mode glassmorphism UI built with vanilla HTML/CSS/JS.
- **Real-Time Predictions**: The canvas automatically sends the drawing to the Flask API the moment you stop drawing, delivering instant predictions without needing to click a "Submit" button.

## Architecture

- `Core/`
  - `Main.py`: The training pipeline. Loads the `.mat` dataset, handles optimization, and exports trained weights.
  - `Model.py`: Contains the core mathematical cost function (Cross-Entropy) and Backpropagation logic.
  - `Prediction.py`: The forward-propagation math used to infer results from the trained weights.
- `app.py`: The Flask Web Server that hosts the frontend and the `/predict` API.
- `static/` & `templates/`: The frontend UI.

## Getting Started

### 1. Install Dependencies
Make sure you have Python installed, then install the required libraries:
```bash
pip install -r requirements.txt
```

### 2. Run the Application
Start the Flask web server:
```bash
python app.py
```
Then, open your web browser and navigate to `http://localhost:5000`.

### 3. (Optional) Retrain the Model
If you want to tweak the hyperparameters or train the neural network from scratch yourself:
1. Ensure the `mnist-original.mat` dataset is inside the `Core/` folder.
2. Run:
```bash
cd Core
python Main.py
```
This will generate new `Theta1.txt` and `Theta2.txt` weight files.

## License
This project is open-source and available under the [MIT License](LICENSE).
