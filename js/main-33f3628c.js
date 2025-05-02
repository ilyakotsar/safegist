/**
 * 
 * @returns {string}
 */
function generateSaltB64() {
    let salt = CryptoJS.lib.WordArray.random(32);
    let saltB64 = CryptoJS.enc.Base64.stringify(salt);
    return saltB64;
}

/**
 * 
 * @param {string} password 
 * @param {string} saltB64 
 * @param {number|string} iterations 
 * @returns {object}
 */
function getEncryptionKey(password, saltB64, iterations) {
    let salt = CryptoJS.enc.Base64.parse(saltB64);
    let key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: Number(iterations),
    });
    return key;
}

/**
 * 
 * @param {string} plaintext 
 * @param {object} key 
 * @returns {[string, string]}
 */
function encryptText(plaintext, key) {
    let iv = CryptoJS.lib.WordArray.random(16);
    let encrypted = CryptoJS.AES.encrypt(plaintext, key, {iv: iv});
    let ivB64 = CryptoJS.enc.Base64.stringify(iv);
    let ciphertextB64 = CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
    return [ivB64, ciphertextB64];
}

/**
 * 
 * @param {string} ivB64 
 * @param {string} ciphertextB64 
 * @param {object} key 
 * @returns {string}
 */
function decryptText(ivB64, ciphertextB64, key) {
    let iv = CryptoJS.enc.Base64.parse(ivB64);
    let decrypted = CryptoJS.AES.decrypt(ciphertextB64, key, {iv: iv});
    let plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    return plaintext;
}

/**
 * 
 * @param {HTMLElement} btn 
 */
function addLoader(btn) {
    btn.innerHTML += '<span class="loader"></span>';
}

let loadGistBtn = document.getElementById('load-gist');
loadGistBtn.addEventListener('click', function() {
    let gistLink = document.getElementById('gist-link').value;
    if (!gistLink) {
        return;
    }
    addLoader(loadGistBtn);
    let requestLink;
    if (gistLink.includes('https://gist.github.com')) {
        let path = gistLink.split('https://gist.github.com')[1];
        requestLink = 'https://gist.githubusercontent.com' + path;
    } else {
        requestLink = gistLink;
    }
    fetch(requestLink)
        .then(response => {
            if (!response.ok) {
                loadGistBtn.innerText = loadGistBtn.innerText;
                throw new Error('Error');
            }
            return response.text();
        })
        .then(data => {
            document.getElementById('input-text').value = data;
            loadGistBtn.innerText = loadGistBtn.innerText;
        })
        .catch(error => {
            console.error(error);
            loadGistBtn.innerText = loadGistBtn.innerText;
        });
});

let encryptBtn = document.getElementById('encrypt');
encryptBtn.addEventListener('click', function() {
    let inputText = document.getElementById('input-text').value;
    let password = document.getElementById('password').value;
    let iterations = document.getElementById('iterations').value;
    if (!inputText || !password || iterations < 50000 || iterations > 1000000) {
        return;
    }
    addLoader(encryptBtn);
    let salt = generateSaltB64();
    setTimeout(() => {
        let key = getEncryptionKey(password, salt, iterations);
        let [iv, ciphertext] = encryptText(inputText, key);
        let encrypted = [iterations, salt, iv, ciphertext].join('_');
        document.getElementById('output-text').value = encrypted;
        encryptBtn.innerText = encryptBtn.innerText;
    }, 1);
});

let decryptBtn = document.getElementById('decrypt');
decryptBtn.addEventListener('click', function() {
    let inputText = document.getElementById('input-text').value;
    let password = document.getElementById('password').value;
    let inputTextArray = inputText.split('_');
    let iterations = inputTextArray[0];
    let salt = inputTextArray[1];
    let iv = inputTextArray[2];
    let ciphertext = inputTextArray[3];
    if (!inputText || !password || iterations < 50000 || iterations > 1000000) {
        return;
    }
    addLoader(decryptBtn);
    setTimeout(() => {
        let key = getEncryptionKey(password, salt, iterations);
        let plaintext = decryptText(iv, ciphertext, key);
        document.getElementById('output-text').value = plaintext;
        document.getElementById('iterations').value = iterations;
        decryptBtn.innerText = decryptBtn.innerText;
    }, 1);
});

let passwordToggle = document.getElementById('password-toggle');
passwordToggle.addEventListener('click', function() {
    let password = document.getElementById('password');
    if (password.type === 'password') {
        password.type = 'text';
        passwordToggle.checked = true;
    } else {
        password.type = 'password';
        passwordToggle.checked = false;
    }
});

document.getElementById('copy').addEventListener('click', function() {
    let outputText = document.getElementById('output-text').value;
    if (!outputText) {
        return;
    }
    navigator.clipboard.writeText(outputText).then(() => {
        let btnText = this.innerText;
        this.innerText = 'Copied';
        setTimeout(() => {
            this.innerText = btnText;
        }, 1000);
    });
});