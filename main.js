const generateButton = document.getElementById('generate-button');
const numbersDisplay = document.getElementById('numbers-display');

generateButton.addEventListener('click', () => {
    const numbers = generateLottoNumbers();
    displayNumbers(numbers);
});

function generateLottoNumbers() {
    const numbers = new Set();
    while (numbers.size < 6) {
        const randomNumber = Math.floor(Math.random() * 45) + 1;
        numbers.add(randomNumber);
    }
    return Array.from(numbers).sort((a, b) => a - b);
}

function displayNumbers(numbers) {
    numbersDisplay.innerHTML = '';
    numbers.forEach(number => {
        const ball = document.createElement('div');
        ball.className = 'number-ball';
        ball.textContent = number;
        ball.style.backgroundColor = getBallColor(number);
        numbersDisplay.appendChild(ball);
    });
}

function getBallColor(number) {
    if (number <= 10) return '#f9c851'; // Yellow
    if (number <= 20) return '#51a7f9'; // Blue
    if (number <= 30) return '#f95151'; // Red
    if (number <= 40) return '#888888'; // Gray
    return '#51f9a7'; // Green
}
