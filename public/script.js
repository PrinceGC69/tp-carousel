async function generateImage() {
  const prompt = document.getElementById('prompt').value.trim();
  const status = document.getElementById('status');
  const gallery = document.getElementById('gallery');

  if (!prompt) {
    showStatus("❌ Please enter a prompt", "error");
    return;
  }

  showStatus("⏳ Generating images...", "loading");
  gallery.innerHTML = '';

  try {
    console.log('Making request with prompt:', prompt);
    
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    console.log('Response status:', res.status);
    console.log('Response ok:', res.ok);

    const data = await res.json();
    console.log('Response data:', data);

    if (!res.ok) {
      throw new Error(data.error || 'Image generation failed');
    }

    if (!data.images || data.images.length === 0) {
      throw new Error('No images returned from API');
    }

    showStatus("✅ Images generated successfully!", "success");

    data.images.forEach((url, i) => {
      console.log(`Adding image ${i + 1}:`, url);
      
      const card = document.createElement('div');
      card.className = 'image-card';
      card.innerHTML = `
        <img src="${url}" alt="Generated image" onload="console.log('Image loaded successfully')" onerror="console.error('Image failed to load:', this.src)" />
        <div class="image-info">
          <div class="image-prompt">"${prompt}"</div>
          <button class="download-btn" onclick="downloadImage('${url}', 'image_${i + 1}.jpg')">📥 Download</button>
        </div>
      `;
      gallery.appendChild(card);
    });

  } catch (err) {
    console.error('Full error:', err);
    showStatus(`❌ ${err.message}`, "error");
  }
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.className = `status ${type}`;
  status.innerHTML = type === "loading" ? `<span class="spinner"></span>${message}` : message;
  status.style.display = 'block';
}

function downloadImage(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}