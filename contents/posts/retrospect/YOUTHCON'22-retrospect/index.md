---
title: "YOUTHCON'22 연사 후기"
description: "혹시 YOUTHCON(이하 유스콘)에 대해 알고 계신가요? 주니어 개발자를 위한 컨퍼런스 유스콘에서 연사로 발표한 후기를 들려드립니다."
date: 2023-01-03
update: 2024-02-09
series: 회고
tags:
  - 회고
---

![](https://velog.velcdn.com/images/ohzzi/post/3c5302d9-1e7a-4e5e-a7c5-6faee4458644/image.png)
혹시 YOUTHCON(이하 유스콘)에 대해 알고 계신가요?

> 유쾌한 스프링방에서 탄생한 유스콘은 👨‍🎓 젊은 개발자와 👨‍🏫 선배 개발자가 함께 가치 있는 기술에 관한 정보와 경험을 공유하는 콘퍼런스입니다. 여기서 발표하는 사람들을 잘 기억해 주세요. 가까운 미래에는 DEVIEW, if(kakao), SPRINGCAMP의 주인공이 될 개발자입니다.
>
> [YOUTHCON'22](https://frost-witch-afb.notion.site/YOUTHCON-22-a18e4511463a416e8befd99993355215)

한 해를 마무리하는 12월 31일. YOUTHCON'22가 진행됐습니다.

유스콘에 대해 처음 알게된 것은 모 개발자 오픈 톡방에서 추석 선물로 유스콘'21 다시보기 영상을 보게 되면서였습니다. `젊은 개발자와 선배 개발자가 함께 가치 있는 기술에 대한 정보와 경험을 공유`한다는 말이 굉장히 인상깊었습니다. DEVIEW, if, SPRINGCAMP, SLASH, WOOWACON 등 개발자 업계에는 다양한 컨퍼런스와 세미나, 발표가 존재합니다. 하지만 유스콘은 그들과 조금 다른데요, 보통 어느 정도 경력을 갖추신 선배 개발자분들께서 발표하시는 것과 다르게(무조건 다 그런 것은 아닙니다만) 유스콘은 선배 개발자가 멘토가 되어 주니어 개발자가 발표자가 된다는 점입니다. 실제로 유스콘'21 연사 명단을 보면 우아한테크코스 3기 분들도 많이 계셨습니다.

저는 마침 유쾌한 스프링방에 있기도 했고, 유스콘의 개최를 담당하시는 **괴물 개발자 제이슨**이 우테코 코치시기 때문에 유스콘'22 공고가 뜨자마자 바로 제이슨께 발표하고싶다고 말씀드렸습니다. 근처에 있던 베루스를 꼬셔서요(ㅋㅋ). 처음 베루스와 발표를 하기로 했을 때부터 `테스트`에 관한 내용을 발표하기로 마음먹었습니다. 그동안 테코톡이나 아고라같이 발표할 일이 있을 때 기술적인 부분에 대해서는 이야기를 많이 한 것 같은데 테스트에 관련해서는 이야기해보지 않은 것 같아서였습니다. 마침 같이 발표하기로 한 베루스는 우테코 4기 공인 `테스트에 미친 남자`입니다.

사실 준비 과정이 쉽지는 않았습니다. 바로 취업 과정과 겹쳤기 때문입니다... 원래 유스콘'22는 12월 18일로 예정되어 있었는데요, 11월 말 우테코를 수료하고 12월 초에 준비하자니 취업 준비와 겹쳐서 굉장히 빡빡한 일정이었습니다. 토스뱅크 면접이 12월 1일과 14일에 있었고, 그 사이에는 모 스타트업과의 면접도 있었던데다가 모 핀테크 기업의 과제전형도 진행했기 때문이죠. 덕분에 처음 예정되었던 12월 18일 전까지 발표 준비가 많이 되어 있지 않은 상황이었습니다.

그나마 다행이랄까요? 오프라인 행사 준비와 전체적인 발표 퀄리티의 문제로 행사가 12월 31일로 밀리게 되었고, 저와 베루스는 좀 더 사람들의 이목을 끌 수 있을만한 발표 컨셉으로 변경해서 다시 준비하게 되었습니다. 베루스의 출근 이슈(...)가 있긴 했지만, 어찌어찌 잘 준비해서 발표 준비를 마무리 할 수가 있었습니다.

아, 참고로 유스콘'21까지는 온라인 행사로 진행되었는데요, 유스콘'22는 처음으로 오프라인 행사로 열리게 되어 한국루터회관 14층 우아한테크코스 교육장에서 진행되었습니다. 오프라인 참여자를 추첨으로 100여명 선정했고, 아쉽게도 당첨되지 못한 분들을 위해 zoom을 통해 실시간 온라인 송출도 함께 진행했습니다. 그리고 유스콘'22의 축사는 무려 백기선님께서 축사 영상으로 해주셨습니다. (다음 유스콘때는 오프라인으로 오셔서 수많은 주니어 개발자들의 멘토링을 해주시는 기선님을 기대..해도 되겠죠...?) 연사들의 발표 외에도 중간 중간 멘토링도 있었습니다. 많은 분들이 멘토링을 신청해 주셨지만 여건 상 모두 다 멘토링을 받지는 못했고, 일부 인원들이 포비 박재성님과 같은 분들께 좋은 말씀을 들었습니다.

## Unit Test Puzzler

저와 베루스가 준비한 발표는 바로 `Unit Test Puzzler`입니다.

![](https://velog.velcdn.com/images/ohzzi/post/2955defe-235d-43a6-9391-7a8b3048f6cf/image.png)

~~뻥 뚫어주는 멘트 제가 적은거 아닙니다~~

굳이 퀴즈 형식을 통해 발표를 하게 된 건, 어떻게 하면 좀 더 쉽고 재밌게 단위 테스트에 대해 발표할 수 있을까 하다가 우테코 데일리 미션으로 몇 번 해봤던 `자바 퍼즐러`같은 형식이 떠올랐기 때문입니다. 퀴즈 형식으로 발표를 하게 되면 청중들이 좀 더 생각하면서 발표를 들을 수 있고 집중도가 높아질 것이라고 생각했습니다.

사실 퀴즈 형식으로 한다는 것은 일종의 도박이기도 했습니다. 왜냐면 청중들에게 발표자가 질문을 하고, 그에 대해 청중들이 답변하는 포맷이 들어가 있기 때문에 만약 청중의 호응을 끌어내지 못한다면 분위기가 싸해지는 역효과도 날 수 있었기 때문입니다. 그래서 유스콘 오프라인에 당첨된 동료 교육생들을 몇 명 미리 섭외하여 퀴즈의 답이 나오지 않으면 답을 말해달라고 했습니다. (하지만 입도 뻥긋하지 않은 K모 크루... 내가 기억하겠다...) 동료 교육생 외에도 다른 발표자분의 멘토로 참여해주신 갓-쿄잉님께서 퀴즈에 대한 대답을 잘 해주셔서 무사히 넘어갈 수 있었습니다.

![](https://velog.velcdn.com/images/ohzzi/post/e0f42299-12ba-4b27-a331-5a4557cf035d/image.png)

유스콘은 두 개의 트랙으로 나누어져 동시에 진행되었는데요, 트랙 1은 대강의장, 트랙 2는 소강의장에서 진행하게 되었습니다. 저희 발표는 트랙 2에서 진행했습니다. 트랙 2가 트랙 1의 절반도 안되는 크기여서 오히려 발표의 부담은 덜할 거라고 생각했는데, 반은 맞고 반은 틀렸습니다. 발표를 시작할 3시쯤 되니 밖에서 쉬고 있던 많은 분들께서 우르르 들어오셨습니다. 소강의장의 몇 안되는 자리는 다 채워졌고, 강의장 뒷편과 문 바깥에까지 발표를 듣고 싶어하신 분들이 서 계셨습니다. 테스트라는 꽤나 핫한 주제, 거기에 퀴즈 형식인 것이 많은 분들에게 듣고 싶은 발표로 다가갔던 것 같습니다. 중간에 잠깐 확인해보니 온라인으로도 쉰 여 명이나 되는 많은 분들이 들어주셨습니다. 부족한 발표였음에도 불구하고 재밌게 들어주신 분들이 많았습니다. 모든 분께 너무나 감사드립니다 :)

행사가 다 끝난 후 행사 참여자들은 구글 폼으로 후기를 작성했는데, Unit Test Puzzler 발표가 좋았고 얻어가는 것도 많았다는 후기가 보여서 특히나 더 좋았습니다.

발표 내용을 모두 이 글에 담기에는 페이지가 너무 부족하여, 발표 마지막에 나왔던 각 퀴즈별 요약을 담아보도록 하겠습니다. 언젠가 시간이 난다면 발표를 줄글로 컴팩트하게 요약해 볼 수 있을지도 모르겠네요.

1. 한 테스트에서는 한 케이스만 검증해야 한다.
2. 매개변수화 테스트로 중복을 제거할 수 있다.
3. 테스트에서 if문을 제거한다.
4. 테스트의 실행 구문은 한 줄이어야 한다.
5. private 메서드 테스트를 지양할 것.
6. 테스트하기 어려운 로직은 외부로 분리하거나 추상화한다.
7. 중복을 제거하기 위해 테스트 간 데이터 세팅이 결합되어서는 안된다.

발표를 준비하면서 `좋은 단위 테스트란 무엇일까?`에 대해서 많은 고민을 했습니다. 저와 베루스가 1년 가까이 우아한테크코스를 진행하면서 작성했던 단위 테스트를 처음부터 돌아봤고, 문제가 있어 보이는 단위 테스트를 골라내는데 주력했습니다. 그러려면 어떤 테스트가 나쁜지, 어떤 테스트가 좋은지 확실하게 알고 있어야겠죠? 그래서 블라디미르 코리코프의 `단위 테스트` 책을 구매해서 읽어보기도 했습니다.

![](https://velog.velcdn.com/images/ohzzi/post/609c52d7-c565-487a-87cb-3e4bd17ee676/image.png)

~~뒷광고 아닙니다. 내돈내산입니다.~~

혹시나 단위 테스트에 대해서 공부해보고 싶으신 분이라면 이 책을 구매해서 읽어보시는 것을 정말 강추드립니다.

## 다른 발표들은?

트랙 1은 일반적인 발표 위주로, 트랙 2는 핸즈온 위주로 진행되었습니다. 저희 발표가 트랙 2에서 진행하게 된 것은 트랙 2에 OOP Start! 라는 핸즈온이 있었기 때문에, OOP -> 단위 테스트로 진행되는 빌드업을 위해서였습니다. 우아한테크코스 크루들도 꽤 많이 발표를 했는데요, 저희 발표 뿐 아니라 로마와 페퍼의 **Java 17 vs Kotlin 1.7**, 애쉬와 파랑의 **우아한테크코스 지원자 모두에게 프리코스 기회를 주기까지**, 우디의 **신입 개발자, 팀에 안정적으로 착륙하기** 발표가 있었습니다. 애쉬, 파랑의 발표는 제 발표와 시간이 겹쳐서, 우디의 발표는 제 발표가 끝나고 기진맥진해 있느라 듣지 못한 것이 아쉽습니다. 로마와 페퍼의 발표는 현장에서 들었는데, 확실히 발표에 재능이 있는 친구들이라 그런지 티키타카를 해나가면서 사람들을 집중하게 만드는 재밌는 발표였습니다. 일단 주제 자체가 자바의 최신 LTS 버전과 요즘 핫한 언어 코틀린을 비교해나가는 주제여서 그런지 청중도 많고 반응도 좋았습니다. 들어간 회사가 코틀린을 사용하기 때문에 

우테코 크루의 발표 외에는 [망나니개발자](https://mangkyu.tistory.com/)님의 **Introduce to Clean Architecture** 발표가 인상깊었습니다. 우테코 팀 프로젝트를 하면서부터 좋은 아키텍처 구조에 대해서 많은 고민을 하게 되었지만 계층형(layered) 아키텍처에서 벗어나지는 못했습니다. 계속 계층형 아키텍처를 사용하다 보며 계층형 아키텍처의 불편한 점이나 문제점들을 어느 정도는 체감하게는 되었지만 아직 다른 아키텍처에 대해 고민해보지는 못했는데, 망나니개발자님의 발표를 듣고 클린 아키텍처에 대해서 조금이나마 이해하게 된 것 같아 좋았습니다. 개인적으로 기억에 남는건 SRP가 `하나의 책임을 가진다`가 아니라 `변경의 이유가 하나여야 한다`쪽이 더 적당하다라는 내용이었습니다. 발표를 듣긴 했지만 아직은 클린 아키텍처가 어려운 것 같기는 합니다. (애초에 발표 대상이 실무 3년차 이상이었으니 당연할지도...?) 차차 공부해봐야겠습니다.

나머지 발표들도 현장에서 보거나 현장에서 보지 못한 발표들은 리허설로 지켜봤었는데요, 내용과 구성 모두 알찬 발표였습니다. 다들 주니어 개발자, 발표 경험이 많지 않은 개발자라고는 믿기지 않을 정도로 발표를 능숙하게 해 주셨고 내용도 꼭 한번 들어볼 만한 주제들이었습니다. 개인적으로 편집본이 유튜브로 올라오거나 하면 좋겠지만... 여건상 그것은 쉽지 않을 것 같아 아쉽긴 합니다.

## 유스콘'22 진짜 후기!

살면서 처음으로 개발자 컨퍼런스의 연단에 서보니 감회가 새롭습니다. 이전까지 했던 발표라고는 10분 테코톡이나 우테코 크루들을 대상으로 한 아고라 정도였는데, 처음 뵙는 수많은 개발자 분들 앞에서 발표를 하니 확연히 다른 느낌이고 떨렸습니다. 실수하거나 하는 것 없이 발표를 무사히 마친 것 같아 다행이라고 생각합니다. 그리고 이런 발표를 무사히 마칠 수 있을 정도로 한 걸음 더 성장했다는 생각이 들기도 합니다. 한 두 해 전의 저였다면 무대에 서기는 커녕 세션을 들으면서도 무슨 내용인지 이해하지도 못했을 텐데 말이죠. 덕분에 개발 관련 내용을 발표하는 것에 대해 자신감이 좀 더 붙었습니다. 다만 나중에 영상을 다시 돌려보니 말을 천천히 한다고 했는데도 여전히 말이 조금 빠른 것은 아쉬웠습니다.

그리고 많은 개발자분들을 실제로 만나뵐 수 있어서 좋았습니다. 오픈채팅방에서만 봤지 실제로는 뵙지 못했던 분들, 이제 들어가게 될 회사의 선배 개발자 분들, 여러 기업에서 개발자로서의 길을 걷고 계신 분들을 만나게 되어 뭔가 `아, 나도 개발자구나` 하는 실감이 다시 한번 나게 된 하루였습니다. 행사가 끝나고 회식도 하고, 2023년 카운트다운을 함께 하기도 해서 더 그랬던 것 같습니다. (한 해 마지막 순간까지 개발자들과 함께하는 사람이 있다? ㅋㅋㄹㅃㅃ) 개인적으로 너무 만족스러워서 시간이 난다면 유스콘'23에는 스태프든 청중이든 꼭 참여하고 싶다는 생각도 하게 되었습니다. (아쉽게도 발표는 불가능합니다. 살면서 한 번 주어지는 기회라더군요...)

끝으로 유스콘의 성공적인 개최를 위해 노력해주신 스태프와 멘토분들, 컨퍼런스에 참석해 주신 많은 분들, 그리고 몇 년째 유스콘이라는 좋은 기회를 만들어주고 계신 제이슨께 감사하다는 말씀을 드리고 싶습니다.

유스콘'23도 많이 기대해주세요!
