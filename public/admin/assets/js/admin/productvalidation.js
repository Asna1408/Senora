function displayError(inputField, message) {
    console.log("2")
    const errorMessage = inputField.nextElementSibling;
    if (errorMessage && errorMessage.classList.contains('error-message')) {
        errorMessage.textContent = message;
        errorMessage.style.color = 'red';
        setTimeout(function () {
            hideError(inputField);
            console.log("3")
        }, 5000);
    }
}


function validateProductForm() {
    console.log("1")
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
   
    const categoryInput = document.getElementById('category');
    const productPriceInput = document.getElementById('productPrice');
    const salePriceInput = document.getElementById('salePrice');
    const quantityInput = document.getElementById('quantity');
    const imageInput = document.getElementById('image');


    if (productPriceInput.value < 1) {
        displayError(productPriceInput, "Product price Cannot be less be 1 rupees");
        return false; // Prevent form submission
    }
    if (salePriceInput.value < 0) {
        displayError(salePriceInput, " Sale price Cannot be less than  1 rupees");
        return false; // Prevent form submission
    }
    if (salePriceInput.value > productPriceInput.value) {
        displayError(salePriceInput, " Sale price should be less than product price");
        return false; // Prevent form submission
    }
    
    if (quantityInput.value < 0) {
        displayError(quantityInput, " Quantity Cannot be less be 1 or negative value");
        return false; // Prevent form submission
    }

    if (titleInput.value.trim() === '') {
        displayError(titleInput, "Field is required");
        return false; // Prevent form submission
    }
    if (descriptionInput.value.trim() === '') {
        displayError(descriptionInput, "Field is required");
        return false; // Prevent form submission
    }
    
    if (categoryInput.value.trim() === '') {
        displayError(categoryInput, "Field is required");
        return false; // Prevent form submission
    }
    if (productPriceInput.value.trim() === '') {
        displayError(productPriceInput, "Field is required");
        return false; // Prevent form submission
    }
    if (salePriceInput.value.trim() == '') {
        displayError(salePriceInput, "Field is required");
        return false; // Prevent form submission
    }
    if (quantityInput.value.trim() == '') {
        displayError(quantityInput, "Field is required");
        return false; // Prevent form submission
    }
    if (imageInput.value.trim() === '') {
        displayError(imageInput, "Field is required");
        return false; // Prevent form submission
    }
    // const selectedFiles = imageInput.files;
    // const maxImageCount = 4;
    // const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    // if (selectedFiles.length > maxImageCount) {
    //     displayError(imageInput, `You can only upload up to ${maxImageCount} images.`);
    //     return false; // Prevent form submission
    // }
    // for (const file of selectedFiles) {
    //     const fileExtension = file.name.slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2);
    //     if (!allowedExtensions.includes(`.${fileExtension.toLowerCase()}`)) {
    //         displayError(imageInput, "Invalid file type. Only PNG, JPG, and WebP images are allowed.");
    //         return false; // Prevent form submission
    //     }
    // }


    return true;
}