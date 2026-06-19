document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');
    const clearBtn = document.getElementById('clear-btn');
    const resultDisplay = document.getElementById('prediction-result');
    const statusText = document.getElementById('status-text');
    const predictionBox = document.querySelector('.prediction-display');

    // Drawing state
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let timeoutId = null;

    // Set up canvas
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 24;
    ctx.strokeStyle = 'white';
    
    // Fill canvas with black initially (though CSS makes it black, 
    // the image data needs actual black pixels, not transparent)
    // Actually, we'll keep it transparent and let backend handle it, 
    // or fill with black. Let's keep it transparent so backend composite works perfectly.

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function startDrawing(e) {
        if (e.type !== 'touchstart') e.preventDefault();
        isDrawing = true;
        const pos = getMousePos(e);
        lastX = pos.x;
        lastY = pos.y;
        
        // Draw a dot just in case it's a single click
        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.arc(lastX, lastY, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        
        clearTimeout(timeoutId);
    }

    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        
        const pos = getMousePos(e);
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        
        lastX = pos.x;
        lastY = pos.y;
    }

    function stopDrawing() {
        if (!isDrawing) return;
        isDrawing = false;
        
        // Wait a bit before predicting to allow multi-stroke digits
        clearTimeout(timeoutId);
        timeoutId = setTimeout(sendPredictionRequest, 800);
    }

    // Event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing, {passive: false});
    canvas.addEventListener('touchmove', draw, {passive: false});
    canvas.addEventListener('touchend', stopDrawing);

    clearBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        resultDisplay.textContent = '?';
        predictionBox.classList.remove('has-result');
        statusText.textContent = 'Draw a digit to see the prediction...';
        clearTimeout(timeoutId);
    });

    async function sendPredictionRequest() {
        // Don't send empty canvas
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let isCanvasEmpty = true;
        for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 0) {
                isCanvasEmpty = false;
                break;
            }
        }
        
        if (isCanvasEmpty) return;

        statusText.textContent = 'Predicting...';
        
        const dataURL = canvas.toDataURL('image/png');
        
        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: dataURL })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                resultDisplay.textContent = result.digit;
                predictionBox.classList.add('has-result');
                statusText.textContent = 'Prediction complete!';
                
                // Pop animation
                predictionBox.classList.remove('pop');
                void predictionBox.offsetWidth; // trigger reflow
                predictionBox.classList.add('pop');
            } else {
                statusText.textContent = result.error || 'Error predicting digit.';
            }
        } catch (error) {
            console.error('Error:', error);
            statusText.textContent = 'Failed to connect to server.';
        }
    }
});
