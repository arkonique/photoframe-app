const ws = new WebSocket(`wss://${window.location.host}`);
let slideShowInterval;
let preLoadedImages = [];

ws.onopen = () => {
    console.log('Connected to WebSocket server');
};

ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'ping'){
        ws.send(JSON.stringify({type: 'pong'}));
    } 
    else if (data.type === 'delete') {
        await reloadDisplay();
    }
    else {
        if (data.slideshow !== undefined) {
            const SlideshowDiv = document.querySelector('.slideshow');
            if (data.slideshow === 1) {
                SlideshowDiv.style.display = 'flex';
                document.getElementById('currentImage').style.display = 'none';
                startSlideshow();
            }
            else {
                SlideshowDiv.style.display = 'none';
                document.getElementById('currentImage').style.display = '';
                stopSlideshow();

            }
        }
        if (data.filename) {
            document.getElementById('currentImage').src = `/uploads/${data.filename}`;
            document.getElementById('dispBody').style.backgroundImage = `url("/uploads/${data.filename}")`;
        }
    }
};

ws.onerror = (error) => {
    console.error('WebSocket Error:', error);
};

ws.onclose = () => {
    console.log('WebSocket connection closed');
};


async function fetchImages() {
    const response = await fetch('/images');
    const data = await response.json();
    return data;
}

async function preLoadImages(imageURLs) {
    preLoadedImages = [];
    imageURLs.forEach((imageURL) => {
        const wrapperDiv = document.createElement('div');
        const img = new Image();
        img.src = `uploads/${imageURL}`;
        wrapperDiv.appendChild(img);
        wrapperDiv.style.backgroundImage = `url("uploads/${imageURL}")`;
        preLoadedImages.push(wrapperDiv);
    });
}

async function startSlideshow() {
    fetchImages().then((images) => {
        console.log(images);
        preLoadImages(images);
        const slideshowDiv = document.querySelector('.slideshow');
        slideshowDiv.innerHTML = '';
        preLoadedImages.forEach((image) => {
            slideshowDiv.appendChild(image);
        });
        let currentIndex = 0;
        const imgElements = document.querySelectorAll('.slideshow div');
        if (imgElements.length > 0) {
            imgElements[currentIndex].classList.add('active');
            slideShowInterval = setInterval(() => {
                imgElements[currentIndex].classList.remove('active');
                currentIndex = (currentIndex + 1) % imgElements.length;
                imgElements[currentIndex].classList.add('active');
            }, 10000); // Change slide every 3 seconds
        }
    });
}

function stopSlideshow() {
    clearInterval(slideShowInterval);
    const imgElements = document.querySelectorAll('.slideshow img');
    imgElements.forEach((img) => {
        img.classList.remove('active');
    });
}

async function reloadDisplay() {
    const images = await fetchImages();
    if (images.length > 0) {
        document.getElementById('currentImage').src = `/uploads/${images[0]}`;
        document.getElementById('dispBody').style.backgroundImage = `url("/uploads/${images[0]}")`;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await reloadDisplay();
});