const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
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

//crypto 세션 데이터 비밀키
const secretKey = crypto.randomBytes(32).toString('hex');
// 세션 미들웨어 설정
app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: true,
}));

app.get('/', (req, res) => {
    // 게시글 정보와 작성자 이름을 가져오는 SQL 쿼리
    const query = `
    SELECT posts.*, users.username
    FROM posts
    INNER JOIN users ON posts.user_id = users.id
  `;
  db.query(query, (err, results) => {
    if (err) throw err;
    // 여기서 사용자 정보 조회 및 설정
    const userId = req.session.userId;
    if (userId) {
      db.query('SELECT username FROM users WHERE id = ?', [userId], (userErr, userResults) => {
        if (userErr) {
          console.error('Error while fetching user information:', userErr);
        } else {
          const username = userResults[0].username;
          res.locals.user = { username }; // user 정보를 res.locals에 설정
        }
        // 조회한 결과를 res.locals에 저장
        res.locals.posts = results;
        // index.ejs 파일을 렌더링하여 클라이언트에 전송
        res.render('index');
      });
    } else {
      res.locals.user = {}; // 빈 객체를 설정하여 user 변수가 정의되도록 함
      res.locals.posts = results;
      res.render('index');
    }
  });
});
// 게시글 작성 라우트 핸들러
app.post('/submit', (req, res) => {
  const { title, content } = req.body;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(403).send('You are not logged in.');
  }

  // 사용자 아이디를 이용하여 데이터베이스에서 사용자 정보 조회
  db.query('SELECT username FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
      console.error('Error while fetching user information:', err);
      return res.status(500).send('Error while fetching user information.');
    }

    // const username = results[0].username;

    // 게시글을 데이터베이스에 추가
    db.query('INSERT INTO posts (title, content, user_id ) VALUES (?, ?, ?)', 
      [title, content, userId], 
      (err) => {
        if (err) {
          console.error('Error while adding a new post:', err);
          return res.status(500).send('Error while adding a new post.');
        }

        res.redirect('/');
      }
    );
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
           // 로그인이 성공한 경우, 사용자 ID를 세션에 저장
      req.session.userId = results[0].id;
          // 메인페이지로 이동
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


app.get('/checkLoggedIn', (req, res) => {
    if (req.session.userId) {
        // 로그인 상태인 경우 응답으로 성공 상태 코드(200)를 보냄
        res.sendStatus(200);
    } else {
        // 로그인 상태가 아닌 경우 응답으로 실패 상태 코드(401)를 보냄
        res.sendStatus(401);
    }
});

// 로그아웃 처리 라우트와 핸들러
app.post('/logout', (req, res) => {
  // 세션을 삭제하여 로그아웃 처리
  req.session.destroy((err) => {
      if (err) {
          // 에러가 발생한 경우 에러 처리
          console.error('로그아웃 오류:', err);
          res.status(500).send('로그아웃 중 오류가 발생했습니다.');
      } else {
          // 세션 삭제가 성공한 경우
          res.redirect('/'); 
      }
  });
});

// 마이페이지 라우트 핸들러
app.get('/mypage', (req, res) => {
  // 로그인된 사용자의 아이디를 세션에서 가져옴 (로그인 상태가 아닌 경우 undefined일 수 있음)
  const userId = req.session.userId;

  // 사용자 아이디를 이용하여 데이터베이스에서 사용자 정보 조회
  db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
      console.error('Error while fetching user information:', err);
      return res.status(500).send('Error while fetching user information.');
    }

    // 사용자 정보를 템플릿에 전달하여 마이페이지 템플릿 렌더링
    res.render('mypage', { user: results[0] }); 
  });
});

// 사용자 정보 업데이트 라우트 핸들러
app.post('/update', (req, res) => {
  const userId = req.session.userId;
  const { username, email } = req.body;

  // 데이터베이스에서 사용자 정보 업데이트
  db.query('UPDATE users SET username = ?, email = ? WHERE id = ?', [username, email, userId], (err) => {
    if (err) {
      console.error('Error while updating user information:', err);
      return res.status(500).send('Error while updating user information.');
    }

    // 사용자 정보 업데이트 후, 마이페이지로 이동
    res.redirect('/mypage');
  });
});


// 삭제 라우트 핸들러
app.post('/delete/:postId', (req, res) => {
  const postId = req.params.postId;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(403).send('You are not logged in.');
  }

  // 게시물 작성자인지 확인
  db.query('SELECT user_id FROM posts WHERE id = ?', [postId], (err, results) => {
    if (err) {
      console.error('Error while fetching post information:', err);
      return res.status(500).send('Error while fetching post information.');
    }

    if (results.length === 0 || results[0].user_id !== userId) {
      return res.status(403).send('삭제할 수 있는 권한이 없습니다.');
    }

    // 게시물 삭제 쿼리 실행
    db.query('DELETE FROM posts WHERE id = ?', [postId], (deleteErr) => {
      if (deleteErr) {
        console.error('Error while deleting post:', deleteErr);
        return res.status(500).send('삭제하지 못했습니다.');
      }

      res.sendStatus(204); // No Content 응답을 보냄 (성공적으로 삭제된 경우)
    });
  });
});

app.post('/update/:postId', (req, res) => {
  const postId = req.params.postId;
  const userId = req.session.userId;
  const { title, content } = req.body;

  // 게시물 작성자인지 확인
  db.query('SELECT user_id FROM posts WHERE id = ?', [postId], (err, results) => {
      if (err) {
          console.error('Error while fetching post information:', err);
          return res.status(500).send('Error while fetching post information.');
      }

      if (results.length === 0 || results[0].user_id !== userId) {
          return res.status(403).send('You do not have permission to edit this post.');
      }

      // 게시물 수정 쿼리 실행
      db.query('UPDATE posts SET title = ?, content = ? WHERE id = ?', [title, content, postId], (updateErr) => {
          if (updateErr) {
              console.error('Error while updating post:', updateErr);
              return res.status(500).send('수정하지 못했습니다.');
          }

          res.redirect('/'); // 수정 완료 후 메인 페이지로 이동
      });
  });
});


// 서버 실행
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
