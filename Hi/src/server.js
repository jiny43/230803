const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;
const db = require('../db');

//전송받은 폼을 읽기위해 POST 요청 본문을 파싱하는 미들웨어
app.use(express.urlencoded({ extended: false }));
// 정적 파일을 제공하는 미들웨어 설정
app.use(express.static(path.join(__dirname, 'public')));

// '/' 경로에 index.html 파일을 띄우기 위한 라우트 설정
app.get('/', (req, res) => {
  db.query('SELECT * FROM posts', (err,results) => {
    if (err) throw err;
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });
});

// 새로운 게시물 추가를 위한 라우트와 핸들러(post요청을 보낼 경로)
app.post('/submit', (req, res) => {
  const { title, content } = req.body;
  // 새로운 게시물을 데이터베이스에 추가
  db.query('INSERT INTO posts (title, content) VALUES (?, ?)', [title, content], (err) => {
    if (err) throw err;
    res.redirect('/');
  });
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
