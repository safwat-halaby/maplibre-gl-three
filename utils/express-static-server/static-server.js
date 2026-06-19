const express = require('express');
if (!process.argv[2]) {
    console.error('Usage: node run.js <PORT>')
    return -1;
}
const PORT = parseInt(process.argv[2]);
const app = express();
app.use(express.static('www'));
app.use(express.static('src'));
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});