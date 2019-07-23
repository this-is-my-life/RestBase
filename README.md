RestBase
=========
Automatic Rest API + DB Manager
-------------------------------

# KR

## 소개
이번 레포지트는 **자동 Rest + DB 생성기**를 만들어보았습니다<br />
초보자도 간단히 만들 수 있도록 설계되었습니다

## 실행방법

### 다운로드
[ZIP으로 다운로드](https://github.com/PMHStudio/RestBase/archive/master.zip) 받으시거나, 터미널에서
```
git clone https://github.com/PMHStudio/RestBase.git
```
를 입력해주세요

--------------------------------------


### 페키지 설치
RestBase를 돌리기에 필요한 페키지들을 설치하기 위해 터미널에서
```
npm install
```
혹은
```
yarn
```
을 입력해주세요

--------------------------------------


### 설정파일 생성
```
node manage
```
를 입력해 RestBase 메니저로 들어간뒤
``settings``를 실행해주세요

--------------------------------------

### 설정파일 유효 확인
```
node manage
``` 
를 입력해 RestBase메니저로 들어간뒤
``startServer``를 실행해주세요

--------------------------------------


### 서버 시작
```
node start
```
를 입력해 서버를 시작합니다!

------------------------------

## 사용법
* / : 사용할 수 있는 DB목록을 보여줍니다
* /&lt;DB이름&gt; : DB의 값들을 보여줍니다
* /admin : 관리자 페이지입니다