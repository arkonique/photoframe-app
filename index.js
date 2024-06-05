//---------------- imports -----------------//
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');

//--------------- app setup ----------------//
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = 3000;
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let currentFilename = '';
let currentSlideshow = 0;

//---------------- Middleware ----------------//

// Broadcast function
const broadcast = (data) => {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

// Multer function
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads/'));
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });

//--------------- Endpoints ----------------//

// Default endpoint
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'gallery.html'));
});

// Routes to serve display.html
app.get(['/disp', '/display', '/display.html', '/d'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'display.html'));
});

// Receive endpoint to accept filename and broadcast it
app.post('/receive', (req, res) => {
    currentFilename = req.body.filename;
    broadcast({ filename: currentFilename });
    res.sendStatus(200);
});

// Get endpoint to fetch the current filename
app.get('/filename', (req, res) => {
    res.status(200).json({ filename: currentFilename });
});

// Upload endpoint to handle image uploads
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.status(200).send('File uploaded successfully.');
});

// Slideshow endpoint to handle image slideshows by accepting a number and broadcasting it
app.post('/slideshow', (req, res) => {
    currentSlideshow = req.body.slideshow;
    broadcast({ slideshow: currentSlideshow });
    res.sendStatus(200);
});

// Images endpoint to list all images in the uploads folder
app.get('/images', (req, res) => {
    fs.readdir(path.join(__dirname, 'uploads'), (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory');
        }
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
        res.status(200).json(imageFiles);
    });
});

// Uploads endpoint to serve uploaded images
app.get('/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    res.sendFile(filePath);
});


// Delete endpoint to delete an image
app.delete('/delete/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).send('Failed to delete image');
        }
        broadcast({ type: 'delete', filename: filename });
        res.status(200).send('Image deleted');
    });
});

//------------- Start server --------------//

// WebSocket connection handler
wss.on('connection', ws => {
    ws.send(JSON.stringify({ filename: currentFilename }));
    ws.send(JSON.stringify({ slideshow: currentSlideshow }));
    const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
        }
    }, 60000);

    ws.on('close', () => {
        clearInterval(pingInterval);
    });
});

// server listener
server.listen(process.env.PORT || port, () => {
    console.log(`Server is listening on port ${process.env.PORT || port}`);
  });