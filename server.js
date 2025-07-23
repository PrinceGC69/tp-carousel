require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/generate', async (req, res) => {
  const prompt = req.body.prompt;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  console.log('Starting image generation with prompt:', prompt);

  try {
    const urls = [];
    for (let i = 0; i < 3; i++) {
      console.log(`Generating image ${i + 1}/3...`);
      
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt,
          n: 1,
          size: '1024x1024',
          quality: 'high'
        })
      });

      console.log(`Response ${i + 1} status:`, response.status);
      
      const data = await response.json();
      console.log(`Response ${i + 1} data:`, JSON.stringify(data, null, 2));

      if (data.error) {
        console.error(`Error image ${i+1}:`, data.error.message);
        return res.status(500).json({ error: data.error.message });
      }

      // Check all possible response formats
      console.log('Checking response structure...');
      console.log('data:', Object.keys(data));
      console.log('data.data:', data.data);
      console.log('data.images:', data.images);
      
      // GPT-Image-1 returns base64 encoded images
      let url = null;
      if (data.data && data.data[0] && data.data[0].b64_json) {
        // Convert base64 to data URL
        url = `data:image/png;base64,${data.data[0].b64_json}`;
        console.log('Found base64 image, converted to data URL');
      } else if (data.data && data.data[0] && data.data[0].url) {
        url = data.data[0].url;
        console.log('Found URL in data.data[0].url:', url);
      } else if (data.images && data.images[0] && data.images[0].url) {
        url = data.images[0].url;
        console.log('Found URL in data.images[0].url:', url);
      } else if (data.url) {
        url = data.url;
        console.log('Found URL in data.url:', url);
      } else {
        console.log('No URL found in response');
      }
      
      if (url) {
        urls.push(url);
        console.log(`Successfully added image ${i + 1}, total images:`, urls.length);
      }
    }

    console.log('Final URLs array:', urls);
    
    if (urls.length === 0) {
      return res.status(500).json({ error: 'No images were generated - check server logs for API response details' });
    }

    res.json({ images: urls });

  } catch (err) {
    console.error('Generation failed:', err);
    res.status(500).json({ error: 'Image generation failed.' });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 running at http://0.0.0.0:${PORT}`));