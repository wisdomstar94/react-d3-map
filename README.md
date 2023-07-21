# react-d3-map
본 레포지토리는 특정 geo json 파일들을 로드하여 d3 를 이용해 지도를 그리는 기능을 제공해주는 리액트 컴포넌트의 레포지토리 입니다.

<br />

# test
각 기능들 별로 별도의 테스트 페이지를 만들어 두었습니다. 본 프로젝트를 pull 받아 로컬에서 구동하시고 "http://localhost:3330" 에 접근하시면 각 테스트 페이지로 이동할 수 있는 버튼들이 표시됩니다.

<br />

# example code
예제 코드는 본 레포지토리의 src/app/test/* 경로를 참조해주세요.

<br />

# require key
본 레포지토리를 구동하기 위해 필요한 .env 내에 있어야 할 키-값 들은 다음과 같습니다. 
|key|value|
|---|---|
|NEXT_PUBLIC_KOREA_SIDO_GEO_JSON_URL|geo json 파일 url|
|NEXT_PUBLIC_KOREA_EMD_GEO_JSON_URL|geo json 파일 url|
