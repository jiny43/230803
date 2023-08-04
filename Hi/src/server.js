const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// 정적 파일을 제공하는 미들웨어 설정
app.use(express.static(path.join(__dirname, 'public')));

// '/' 경로에 index.html 파일을 띄우기 위한 라우트 설정
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
