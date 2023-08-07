const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();
const PORT = 3000;
const db = require('../db');

// EJS 템플릿 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'..', 'public'));

// 전송받은 폼을 읽기위해 POST 요청 본문을 파싱하는 미들웨어
app.use(express.urlencoded({ extended: false }));

// 정적 파일을 제공하는 미들웨어 설정
app.use(express.static(path.join(__dirname,'..', 'public')));

// '/' 경로에 index.ejs 파일을 띄우기 위한 라우트 설정
app.get('/', (req, res) => {
  db.query('SELECT * FROM posts', (err, results) => {
    if (err) throw err;
    // 조회한 결과를 res.locals에 저장
    res.locals.posts = results;
    // index.ejs 파일을 렌더링하여 클라이언트에 전송
    res.render('index');
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

// 회원 가입 페이지를 보여주기 위한 라우트
app.get('/signup', (req, res) => {
  res.render('signup'); // signup.ejs 파일을 렌더링하여 회원 가입 페이지 보여줌
});

// 회원 가입 정보를 처리하는 핸들러
app.post('/signup', async (req, res) => {
  const { username, password, email } = req.body;
  try {
    // 비밀번호를 해시화하여 저장
    const hashedPassword = await bcrypt.hash(password, 10); // 10은 saltRounds, 해시 비용 설정
    // 회원 가입 정보를 데이터베이스에 삽입
    db.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, hashedPassword, email], (err) => {
      if (err) throw err;
      // 회원 가입 후 메인 페이지로 리다이렉션
      res.redirect('/');
    });
  } catch (err) {
    // 에러 처리
    console.error('Error during signup:', err);
    res.status(500).send('Error during signup.');
  }
});

// 로그인 페이지를 보여주기 위한 라우트
app.get('/login', (req, res) => {
  res.render('login'); // login.ejs 파일을 렌더링하여 로그인 페이지 보여줌
});

// 로그인 정보를 처리하는 핸들러
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    // 사용자의 회원 가입 정보를 데이터베이스에서 조회
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
      if (err) throw err;
      if (results.length === 0) {
        // 회원 정보가 없는 경우
        res.status(401).send('회원정보가 없습니다.');
      } else {
        // 데이터베이스에 저장된 해시화된 비밀번호와 입력받은 비밀번호 비교
        const isPasswordValid = await bcrypt.compare(password, results[0].password);
        if (isPasswordValid) {
          // 로그인 성공
          res.redirect('/');
        } else {
          // 비밀번호가 일치하지 않는 경우
          res.status(401).send('비밀번호가 일치하지 않습니다.');
        }
      }
    });
  } catch (err) {
    // 에러 처리
    console.error('Error during login:', err);
    res.status(500).send('Error during login.');
  }
});






// 서버 실행
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
