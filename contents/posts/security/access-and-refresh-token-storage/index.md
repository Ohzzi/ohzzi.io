---
title: "Access Token과 Refresh Token을 어디에 저장해야 할까?"
date: 2022-09-14
update: 2024-02-12
tags:
  - 보안
---

F12 팀 프로젝트는 JWT 토큰을 Access Token으로 하는 인증 인가 서비스를 구현하고 있습니다. 로그인을 하면 백엔드 서버에서 토큰을 만들어 보내주고, 이후 클라이언트에서 보내는 요청의 `Authorization` 헤더에 토큰을 담아서 보내면 서버에서 토큰을 디코딩하여 로그인한 회원을 확인하는 방식입니다.

보통 Access Token은 서버 쪽에서 따로 로그아웃을 시켜줄 수 없다 보니(토큰 블랙리스트를 만드는 방식으로 가능하긴 합니다.) 보안 상의 이유로 만료 기간을 짧게 가져가는 편인데요, 이로 인해 시간이 조금만 지나면 로그인을 새로 해야 하는 불편함이 있습니다. 이를 보완하기 위해 Refresh Token을 함께 사용하지만, 레벨 3 기간동안 F12 프로젝트는 Refresh Token을 도입하지 않았습니다.

그러나 실제 사용을 해보니 로그인을 자주 해야 하는 불편함은 상당히 컸습니다. 로그인이 유지되고 있는 줄 알고 리뷰를 작성하거나 내 페이지를 들어가려고 하는데 `로그인이 필요합니다.` 메시지가 뜨면서 거부당하고, 결국 로그인 버튼을 눌러서 로그인 한 뒤 다시 가려던 페이지를 찾아 들어가는 것은 여간 귀찮은 일이 아니죠. 그래서 레벨 4에서는 Refresh Token을 도입하기로 결정했습니다.

Access Token과 Refresh Token을 함께 사용하는 이유에 대해서는 [잘 정리된 Stack Overflow 문서](https://stackoverflow.com/questions/3487991/why-does-oauth-v2-have-both-access-and-refresh-tokens/12885823)나 [우아한테크코스 크루의 블로그 글](https://hudi.blog/refresh-token/)이 있으니 참고해 보셔도 좋을 것 같습니다.

## 본론. Access Token과 Refresh Token을 어디에 저장해야 할까?

이제 또다른 문제가 있습니다. Access Token과 Refresh Token을 어디에 저장해야 할까요?

### 기호 1번. 로컬 스토리지 or 세션 스토리지

로컬 스토리지와 세션 스토리지의 차이는 데이터의 영구성 정도이기 때문에 함께 알아보도록 하겠습니다. 기존에 Access Token만 사용할 때는 브라우저의 세션 스토리지에 담고 있었습니다. 로그인 성공 시 받아온 토큰을 세션 스토리지에 저장한 뒤, 요청을 보낼 때 자바스크립트로 꺼내서 보내는 방식입니다.

로컬 스토리지나 세션 스토리지에 저장하는 방식은 어떤 문제가 있을까요? `자바스크립트로 토큰 값을 꺼내서 보내는 방식`이라는 점에서 그 답을 알 수 있습니다. 로컬 스토리지나 세션 스토리지에 저장하는 방식은 **XSS(Cross Site Scripting)** 공격에 취약합니다. React를 사용하기 때문에 XSS 공격을 막아준다고는 하지만, 이것이 항상 통하는 것은 아니기 때문에 스토리지에 저장하는 것은 안전하지 않다고 생각했습니다.

### 기호 2번. 쿠키(HTTP Only)

![](https://velog.velcdn.com/images/ohzzi/post/507e40d0-8349-43ac-b715-2cf5c6ab85de/image.png)

~~배고파도 식사가 없고 목말라도 음료가 없는 이 쿠키는 아닙니다.~~

쿠키에 담을 수도 있습니다. 단, 쿠키 역시 자바스크립트로 접근이 가능하므로 `HTTP Only` 옵션을 걸어주어야 합니다. 또한 HTTPS가 적용되지 않은 이미지 등으로 인해 쿠키를 탈취당할 수 있으므로 `secure` 옵션도 걸어주어야 합니다. 이렇게 해주면 쿠키를 탈취당할 위험도 방지할 수 있고, 자바스크립트로 쿠키 값을 취득하는 것도 막을 수 있습니다. HTTP 통신 자체를 하이재킹 당하더라도, HTTPS로 암호화가 되어 있기 때문에 쿠키 값을 알아낼 수는 없습니다.

그렇다면 쿠키는 무한정 안전할까요? 그렇지 않습니다. 쿠키에 토큰을 담으면 **CSRF(Cross-Site Request Forgery)** 공격에 취약합니다. XSS 공격을 당하는 것과는 상황이 조금 다른데요, XSS 공격을 통해서는 `토큰 값` 자체를 가져올 수 있지만 CSRF 공격을 통해서는 `로그인 된 상태로 특정 위험한 동작을 하게 만든다`고 생각하시면 될 것 같습니다. 즉, CSRF 공격으로 쿠키에 저장되어 있는 토큰 값 자체를 가져오는 것은 아닙니다. (물론 애플리케이션 설계와 공격 형태에 따라 토큰 값도 가져올 수는 있겠죠.)

그래서 Refresh Token은 쿠키에 저장해도 된다는 판단을 내렸습니다. 왜냐면 Refresh Token으로 Access Token을 재발급 받는 요청 외에 인증 인가가 필요한 작업들에 Refresh Token으로는 접근할 수 없기 때문입니다. 물론 Access Token 재발급 요청은 할 수 있기 때문에 이에 대한 적절한 방어는 필수입니다.

쿠키에 저장하면 값 자체의 탈취를 할 수 없다고 했지만, 만에 하나 어떠한 방법으로든 Refresh Token 탈취가 된다는 가정 하에, 위험성을 최대한 줄이기 위해 RTR(Refresh Token Rotation)이라는 방식을 도입하기도 합니다. 이 방법은 Refresh Token을 통해 Access Token을 재발급 할 때 Refresh Token을 새 것으로 교체해서 단 한번만 사용할 수 있도록 하는 방식입니다. (여기에 이미 사용된 Refresh Token으로 요청이 들어오면 모든 Refresh Token을 폐기하는 보안 조치도 추가로 넣어준다고 하네요.) 이렇게 하더라도 사용하지 않은 Refresh Token을 탈취하면 한 번은 Access Token을 발급받을 수 있지만, 탈취된 Refresh Token이 무한정 사용되는 것은 막을 수 있습니다.

하지만 Access Token마저 쿠키에 담아버리면 CSRF 공격을 통해 인증 인가 과정으로 보호된 동작을 실행해버릴 수 있으니 Refresh Token과 Access Token을 모두 한 번에 쿠키에 담으면 안되겠죠?

### 그럼 Access Token은 어디에 저장해야 하나요?

F12는 이 문제를 해결하기 위해 Access Token을 `자바스크립트 private 변수로 저장`하는 방법을 선택했습니다. private 변수로 저장된 Access Token은 XSS 공격으로 탈취할 수 없고, 당연히 CSRF 공격을 당할 가능성도 없습니다.

그런데 페이지를 이동할 때 마다 토큰이 날아가지 않냐고요? 하지만 우리는 `React`를 사용하고 있고, 리액트는 SPA(Single Page Application)이므로, 페이지를 이동하는 것처럼 보여도 페이지가 실제로 이동하는 것이 아니기 때문에 private 변수가 그대로 유지됩니다. 단, 새로고침을 하면 변수가 날아갑니다. 때문에 이 경우에 추가로 Refresh Token만 가지고 Access Token을 발급받는 API를 만들어주어야 합니다.

## 정리

이러한 내용들을 바탕으로 F12 팀의 인증 인가 정책을 고민해보았고, 결론적으로는 다음과 같은 방식을 사용하기로 결정했습니다.

- 로그인 시 유효 기간이 매우 짧은 Access Token과 유효 기간이 긴 Refresh Token을 함께 발급.
- Refresh Token은 서버에 저장하여 관리
- 클라이언트는 Access Token을 private 변수로 저장
- Refresh Token은 HTTP Only 쿠키에 저장
- Access Token이 만료되면 Refresh Token을 통해 새 Access Token과 새 Refresh Token을 재발급
- 새로고침으로 Access Token 값이 없어지면 Refresh Token을 통해 새 Access Token과 새 Refresh Token을 발급

완벽한 보안은 아니겠지만, 이 과정을 통해 가능한 공격의 수를 최대한 줄여서 좀 더 안전한 애플리케이션을 만들 수 있을 것 같습니다.

> **참고 자료**
>
> [[프로젝트] Refresh Token 적용하기](https://pomo0703.tistory.com/208#recentComments)
> [refresh token 도입기](https://tecoble.techcourse.co.kr/post/2021-10-20-refresh-token/)
> [Access Token의 문제점과 Refresh Token](https://hudi.blog/refresh-token/)