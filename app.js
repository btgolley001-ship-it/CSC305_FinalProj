const express = require('express');
const app = express();
const port = 3000;

app.set('view engine', 'pug');
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/role', (req, res) => {
  const { id, role } = req.body;

  if (role === 'student') {
    res.render('student', { id });
  } else if (role === 'teacher') {
    res.render('teacher', { id });
  } else {
    res.send('Invalid role');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
