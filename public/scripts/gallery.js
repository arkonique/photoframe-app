// Image loader
async function loadImages() {
    try {
        const response = await fetch('/images');
        const images = await response.json();
        const gallery = document.getElementById('gallery');
        gallery.innerHTML = '';
        images.forEach(image => {
            const img = document.createElement('img');
            img.src = `uploads/${image}`;
            img.alt = image;
            img.style.border = '7px solid #444';
            gallery.appendChild(img);
        });
        addEventListenersToImages();
    } catch (error) {
        console.error('Error loading images: ',error);
    }
}

// Image upload preview
document.getElementById('imageInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    const preview = document.getElementById('preview');
    preview.innerHTML = ''; // Clear previous preview
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = file.name;
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
});

// Image upload form

document.getElementById('uploadButton').addEventListener('click', async () => {
    const formData = new FormData();
    const fileInput = document.getElementById('imageInput');
    formData.append('image', fileInput.files[0]);

    const progressBar = document.getElementById('progressBar');
    const preview = document.getElementById('preview');

    try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload', true);

        // Update progress bar
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                progressBar.value = percentComplete;
                progressBar.style.display = 'block';
            }
        };

        xhr.onloadend = () => {
            progressBar.style.display = 'none';
            if (xhr.status === 200) {
                //alert('File uploaded successfully');
                loadImages(); // Reload the gallery to show the new image
                preview.innerHTML = '<img src="images/default_plus.png" alt="Placeholder">'; // Clear the preview section
                fileInput.value = ''; // Clear the file input
            } else {
                alert('Failed to upload file');
            }
        };

        xhr.send(formData);
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('An error occurred while uploading the file');
    }
});

// Image event listeners
function addEventListenersToImages() {
    const images = document.querySelectorAll('#gallery img');
    images.forEach(img => {
        const imageFilename = img.alt;
        img.addEventListener('click', () => {handleImageClick(img, imageFilename)});
        img.addEventListener('mouseover', () => {handleImageMouseOver(img)});
        img.addEventListener('mouseout', () => {handleImageMouseOut(img)});
        img.addEventListener('mousemove', (e) => {handleImageMouseMove(e,img)});
    });
}

async function handleImageClick(img,image) {
    try {
        const response = await fetch('/receive', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ filename: image })
        });

        if (!response.ok) {
            alert('Failed to send image');
        }
    } catch (error) {
        console.error('Error sending image to /receive endpoint:', error);
        alert('An error occurred while sending the image');
    }

    const images = document.querySelectorAll("#gallery img");
    images.forEach(img => {
        img.classList.remove('selected');
        img.style.border = '7px solid #444';
    });
    img.style.border = '7px solid gold';
    img.classList.add('selected');
}

function handleImageMouseOver(img) {
    const images = document.querySelectorAll("#gallery img");
    images.forEach(img => {
        img.classList.remove('hovered');
    });
    img.classList.add('hovered');
}

function handleImageMouseOut(img) {
    img.classList.remove('hovered');
    if (!img.classList.contains('selected')) {
        img.style.border = '7px solid #444';
    }
    else{
        img.style.border = '7px solid gold';
    }
    const modal = document.getElementById("modal");
    modal.style.display = "none";
}

function handleImageMouseMove(e,image) {
    const modal = document.getElementById("modal");
    const modalImage = document.querySelector("#modal img");
    if (image.classList.contains("hovered")) {
        if (image.classList.contains("selected")) {
            image.style.border = "7px solid gold";
        } else {
            image.style.border = "7px solid teal";
        }
        const w = window.innerWidth;
        const h = window.innerHeight;
        // Do all this only if device is not mobile
        if (w < 800) {
            return;
        }

        modal.style.display = "block";
        modalImage.style.display = "block";
        modalImage.src = image.src;
        if (e.clientX > w / 2) {
            modal.style.right = e.pageX+ 300 + "px";
        } else {
            modal.style.left = e.pageX + 10 + "px";
        }
        if (e.clientY > h / 2) {
            modal.style.bottom = h - e.pageY + 10 + "px";
        } else {
            modal.style.top = e.pageY + 10 + "px";
        }
    }
}

// Slideshow checkbox
document.getElementById('slideshowCheckbox').addEventListener('change', async (event) => {
    const isChecked = event.target.checked;
    try {
        const response = await fetch('/slideshow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ slideshow: isChecked ? 1 : 0 })
        });

        if (!response.ok) {
            alert('Failed to update slideshow state');
        }
        const slideshowButton = document.querySelector('.left .slider label')
        if (isChecked) {
            slideshowButton.style.backgroundColor = '#39df39';
            slideshowButton.style.boxShadow = '0 0 10px #39df39';
            slideshowButton.style.color = 'white';
            document.querySelector('.left .slider label div').style.color = 'black';
            document.querySelector('.left .slider label div').innerHTML = '&nbsp;ON&nbsp;';
        } else {
            slideshowButton.style.backgroundColor = 'white';
            slideshowButton.style.color = 'black';            
            slideshowButton.style.boxShadow = '0 0 10px  red';
            document.querySelector('.left .slider label div').style.color = 'red';
            document.querySelector('.left .slider label div').innerHTML = '&nbsp;OFF';
        }
    } catch (error) {
        console.error('Error updating slideshow state:', error);
        alert('An error occurred while updating the slideshow state');
    }
});

// Show a custom context menu on right-click
let contextMenuImage = null;

document.addEventListener('contextmenu', (event) => {
    if (event.target.tagName === 'IMG' && event.target.parentElement.id === 'gallery') {
        event.preventDefault();
        contextMenuImage = event.target;
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${event.pageX}px`;
        contextMenu.style.top = `${event.pageY}px`;
    } else {
        hideContextMenu();
    }
});

document.addEventListener('click', () => {
    hideContextMenu();
});

function hideContextMenu() {
    const contextMenu = document.getElementById('contextMenu');
    contextMenu.style.display = 'none';
    contextMenuImage = null;
}


// Handle the delete image action
document.getElementById('deleteImage').addEventListener('click', async () => {
    if (contextMenuImage) {
        const filename = contextMenuImage.alt;
        const response = await fetch(`/delete/${filename}`, {
            method: 'DELETE'
        });
        hideContextMenu();
        await loadImages(); // Reload the gallery 
    }
});

// Page load event to load images
window.addEventListener('load', loadImages);


// Hambuger menu
document.addEventListener('DOMContentLoaded', function() {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const leftDiv = document.querySelector('.left');

    hamburgerMenu.addEventListener('click', function() {
        leftDiv.classList.toggle('active');
        hamburgerMenu.classList.toggle('inactive');
    });
});