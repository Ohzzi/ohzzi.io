---
title: "@OneToMany 단방향 매핑의 update 쿼리를 없애려면 어떻게 해야 할까?"
date: 2022-11-12
update: 2024-02-12
tags:
  - JPA
---

## 전 분명 INSERT만 했는데요?

JPA의 다양한 연관관계 매핑 중 `@OneToMany`를 통한 일대다 단방향 매핑이 있습니다. 아마 JPA에 대해 조금이라도 공부하신 분들은 일대다 단방향 매핑에 대해 다음과 같은 단점을 들어보셨을테죠.

> 일대다 단방향 매핑의 단점은 매핑한 객체가 관리하는 외래 키가 다른 테이블에 있다는 점이다. 본인 테이블에 왜래 키가 있으면 엔티티의 저장과 연관관계 처리를 INSERT SQL 한 번으로 끝낼 수 있지만, 다른 테이블에 외래 키가 있으면 연관관계 처리를 위한 UPDATE SQL을 추가로 실행해야 한다.
>
> 김영한 저, 자바 ORM 표준 JPA 프로그래밍

즉, INSERT 쿼리만을 의도했지만 UPDATE 쿼리가 추가적으로 발생하는 단점이 있다는 것입니다.

![](https://velog.velcdn.com/images/ohzzi/post/e68c6eb0-a2e9-4b9e-a393-89834c71eff8/image.png)

~~심심하면 의도하지 않은 쿼리가 발생하는 JPA. 이때는 대략 정신이 멍해진다.~~

다음과 같은 엔티티를 통해 직접 확인해보도록 하겠습니다. 편의를 위해 롬복을 사용했습니다.

```java
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "team_id")
    private List<Player> players = new ArrayList<>();

    public Team(final String name) {
        this.name = name;
    }

    public void add(final Player player) {
        players.add(player);
    }

    public void remove(final Player player) {
        players.remove(player);
    }

    @Override
    public boolean equals(final Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Team)) {
            return false;
        }
        Team team = (Team) o;
        return Objects.equals(id, team.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}

@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;

    public Player(final String name) {
        this.name = name;
    }

    @Override
    public boolean equals(final Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Player)) {
            return false;
        }
        Player player = (Player) o;
        return Objects.equals(id, player.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
```

이 엔티티들을 테스트 코드를 통해 몇 개의 쿼리가 나가는지 체크해보도록 하겠습니다. 간단하게 쿼리 카운터를 구현할 수도 있긴 하지만, 어떤 쿼리가 나가는지 목적이므로 로그를 통해 확인하겠습니다.

```java
@DataJpaTest
class TeamRepositoryTest {

    @Autowired
    private TeamRepository teamRepository;

    @Test
    void oneToManyTest() {
        Team drx = new Team("DRX");
        Player deft = new Player("데프트");
        Player zeka = new Player("제카");
        drx.add(deft);
        drx.add(zeka);

        teamRepository.save(drx);
        // @DataJpaTest의 트랜잭션으로 인해 update 쿼리가 쓰기 지연 저장소에 있다 롤백됨
        // 이를 로그로 보여주기 위해 강제 flush
        teamRepository.flush();
    }
}
```

로그를 확인해볼까요?

![](https://velog.velcdn.com/images/ohzzi/post/47558c6c-0329-4489-9773-40a395efeb08/image.png)

drx, deft, zeka 각각에 대한 INSERT 쿼리만 실행되면 되는데 deft, zeka에 대한 UPDATE 쿼리가 추가로 발생했습니다. 이는 연관관계의 주인은 Team이지만 실제 테이블 매핑에서는 외래키를 Player쪽이 가지고 있기 때문에 발생하는 문제입니다. 실제로 쿼리를 보시면 알겠지만 Player를 INSERT할 때 id, name만 매핑하고 team_id값은 매핑하지 않는 것을 볼 수 있습니다. 즉, 처음 INSERT 시점에는 외래키 값을 모르므로 일단 NULL을 매핑하고 Team의 값으로 외래키를 UPDATE를 해주는 것을 볼 수 있습니다.

이 때문에 일대다 단방향 대신 양방향을 사용할 것이 권장되기도 합니다. 하지만 객체지향적인 관점에서 의존성의 순환을 끊어주기 위해 일대다 단방향 매핑을 선호하는 경우도 분명 있습니다. 실제로 우아한테크코스 프로젝트와 미션을 진행하면서, 쿼리 때문에 불필요한 객체 참조를 달아주는 것에 거부감을 느껴 단방향 매핑을 해주는 동료들이 꽤 있었습니다.

이들을 위한, UPDATE 쿼리를 없앨 방법은 없을까요?

앞서 쿼리를 보면 INSERT 쿼리로는 외래키에 NULL이 들어가게 됩니다. 여기서 NULL이 허용되지 않도록 NOT NULL 제약조건을 걸어주면 되지 않을까라는 생각을 해볼 수 있습니다. `@JoinColum`에 `nullable=false` 조건을 넣고 다시 해보겠습니다. 실제 값이 어떻게 매핑되는지도 확인하기 위해 쿼리 파라미터에 어떤 값이 들어가는지도 로그로 남도록 설정도 바꿔주겠습니다.

![](https://velog.velcdn.com/images/ohzzi/post/153e4c3e-b300-4b10-8a15-e6838128a95b/image.png)

기대한대로 INSERT 시점에 외래키 값이 들어가는 것을 확인할 수 있습니다. 하지만 그럼에도 불구하고 이미 매핑된 외래키 값을 다시 UPDATE하는 쿼리가 추가로 발생합니다. 이미 매핑이 된 컬럼인데 무의미한 UPDATE쿼리가 나가고 있습니다. 

![](https://velog.velcdn.com/images/ohzzi/post/93d14f13-57ae-4ffe-a41e-826529b97c36/image.png)

~~JPA 너란 녀석...~~

그렇다면 정말 UPDATE 쿼리를 없앨 방법이 없는 것일까요?

## 선생님은 이제부터 UPDATE를 할 수 없습니다

"UPDATE"가 문제라면 UPDATE를 할 수 없게 강제해버리면 되지 않을까요? JPA에는 마침 updatable이라는 옵션이 존재합니다. 뭔가 이 옵션을 false로 만들면 UPDATE 쿼리를 날리지 않을 것 같습니다.

```java
    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "team_id", nullable = false, updatable = false)
    private List<Player> players = new ArrayList<>();
```

updatable=false 옵션을 주고 다시 테스트코드를 실행해보도록 하겠습니다.

![](https://velog.velcdn.com/images/ohzzi/post/f09e8bea-102b-411b-bbb2-e3d72cfc754f/image.png)

드디어 저희가 원하는대로 INSERT 쿼리만 세 개 나가는 것을 볼 수 있습니다! 아예 UPDATE를 하지 못하도록 막아버리니 INSERT 한 번에 레코드가 완성될 수 있도록 쿼리를 구성하는 것을 볼 수 있습니다. (애초에 updatable 옵션을 true로 설정하지 않아도 의도대로 작동하면 얼마나 좋을까요...)

## 그런데 이러면 아예 수정을 못하잖아요

사실 이렇게 하면 문제가 하나 있습니다. `@JoinColumn`에 updatable=false를 걸어뒀기 때문에, team_id 컬럼은 삽입 및 조회만 가능하고 수정이 불가능한 컬럼이 됩니다. 코드를 통해 확인해보도록 하겠습니다.

```java
@Test
void oneToManyTest() {
    Team drx = new Team("DRX");
    Player deft = new Player("데프트");
    Player zeka = new Player("제카");
    drx.add(deft);
    drx.add(zeka);

    teamRepository.save(drx);

    Team t1 = new Team("T1");
    drx.remove(deft);
    t1.add(deft);

    // @DataJpaTest의 트랜잭션으로 인해 update 쿼리가 쓰기 지연 저장소에 있다 롤백됨
    // 이를 로그로 보여주기 위해 강제 flush
    teamRepository.flush();
}
```

![](https://velog.velcdn.com/images/ohzzi/post/a7a436bf-d48b-4c3f-a531-86a5b4f5683e/image.png)

deft를 drx에서 remove를 하고 t1에 add 했습니다. 연관관계의 주인이 Team이기 때문에 deft의 외래키가 drx의 id에서 t1의 id로 바뀌어야 하지만, `@JoinColumn`의 updatable=false 속성으로 인해 UPDATE 쿼리가 실행되지 않습니다. 즉, updatable=false로 지정하게 되면 한 번 정한 연관관계를 바꾸지 못하게 되는 것입니다. 이렇게 될 경우 수정 대신 기존의 엔티티를 삭제하고 연관관계를 제외한 나머지 속성들이 같은 새 엔티티를 만들어서 저장해주는 것으로 연관관계 수정과 비슷한 효과를 낼 수는 있습니다. 하지만 연관관계의 수정 자체는 불가능하게 됩니다.

또한 UPDATE 쿼리의 발생은 방지했지만 여전히 `연관관계의 주인과 외래키 관리의 책임 주체가 다르다`는 문제는 그대로입니다. 논리적으로 연관관계의 주인과 외래키가 속한 테이블을 일치시켜주고 싶다면 일대다 단방향은 사용할 수 없습니다.

## 어떨 때 써야 할까?

사실 정답은 없는 것 같습니다. 객체지향에 좀 더 많은 비중을 둔다면 일대다 단방향 매핑과 nullable=false, updatable=false를 활용할 수 있을 것이고, 객체지향을 좀더 포기하더라도 외래키의 관리를 용이하게 하고 UPDATE 쿼리를 발생시키지 않으면서 연관관계의 제약 조건도 없애고 싶다면 양방향 매핑을 사용할 수 있을 것입니다.

개인적으로 저라면 두 가지 상황에 따라 다르게 적용할 것 같습니다.

1. Many쪽 엔티티가 그 자체만으로 유의미한 엔티티일 경우

위에서 예시로 살펴본 Team - Player의 관계를 보겠습니다. Player는 Team의 하위 엔티티가 아닙니다. 언제든 Team을 바꿀 수 있고, Player 자체만으로 독립적인 의미를 갖습니다. 이런 경우라면 양방향 연관관계를 맺어주는 것이 더 편하고 개념적으로도 맞다고 생각합니다.

2. Many쪽 엔티티가 One쪽 엔티티의 하위 엔티티임이 명확한 경우

주문 도메인의 주문이라는 개념 자체와 주문 항목이라는 세부 사항이 있다고 하면, 보통 주문은 여러개의 주문 항목을 가지게 됩니다. 그리고 주문 항목은 단독으로 의미가 있기 보다는 주문과 생명주기가 일치하는 주문의 하위 엔티티라고 볼 수 있습니다. 이렇게 엔티티가 특정 엔티티의 생명주기의 엔티티에 의존하고, 개념적으로 특정 엔티티의 하위 항목을 나타낼 경우, 상위 엔티티에 의해 관리받는 일대다 단방향 매핑이 적당하다고 생각합니다. 어차피 특정 엔티티의 생명주기에 종속되므로 연관관계를 바꿔줄 필요가 존재하지 않아 nullable=false, updatable=false를 사용해도 문제가 없기 때문입니다. 게다가 하위 엔티티 -> 상위 엔티티로의 객체 그래프 탐색도 필요하지 않기 때문에 굳이 양방향 매핑을 해줄 필요가 없다는 점도 고려할 수 있습니다.