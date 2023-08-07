# DB_prac

DBMS: MySQL

---

### 8/5<br>
---

HTML 파일 작성 (index.html):<br>
간단한 게시판 레이아웃을 작성.<br>
게시물을 보여주는 container와 새로운 게시물을 추가하는 form-container로 구성됨.

---
Express 서버 설정 (server.js):<br>
'/' 경로에 접속 시 index.html을 렌더<br>
게시물 조회와 게시물 추가를 위한 라우트 작성

---

MySQL 데이터베이스 설정 (db.js):<br>
MySQL 데이터베이스와의 연결.<br>
posts 테이블에 새로운 게시물을 추가하는 INSERT 쿼리를 작성.<br>
posts 테이블의 모든 데이터를 조회하는 SELECT 쿼리를 작성.

---

게시물 추가 기능 (server.js): <br>
/submit 경로에 POST 요청을 처리. <br>
폼에서 입력한 게시물의 제목과 내용을 데이터베이스의 posts 테이블에 추가.

database: bulletin_board

| Tables_in_bulletin_board |
|--------------------------|
| posts                    |

---

Table: posts

| id | title | content       | created_at         |
|----|-------|---------------|--------------------|
| 1  | 첫게시물  | (/*˘ ³˘)/♥ | 2023-08-05 17:30:59 |

---

EJS(Embedded JavaScript Template):<br>
ejs템플릿 파일 작성: <br>
index.html -> index.ejs<br>
서버에서 보낸 변수를 html 태그처럼 자바스크립트 내용을 삽입할 수 있다.<br>
<% 에서 변수를 선언하고 <%= 로 받아서 사용할 수 있다.<br>
ex)

```
<% posts.forEach((post) => { %>
<%= post.title %>
<%= post.content %>

```

### 8/6

사용자 정보를 담는 테이블 작성 : users <br>
회원가입 페이지 생성 : sign.html <br>
users 테이블에 회원가입 정보를 데이터베이스에 저장


### 8/7
bcrypt 모듈 사용 : <br>
해시함수로 비밀번호 암호화 <br>
회원가입 정보와 로그인 정보 일치 확인 <br>

---

express-session 미들웨어 사용: <br>
세션으로 로그인 인증 유지 <br>







