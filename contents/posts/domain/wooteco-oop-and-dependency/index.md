---
title: "우테코 마지막 미션 후기 - 객체 지향과 의존성"
date: 2022-11-12
update: 2024-02-12
tags:
  - Domain
  - 의존성
  - 우아한테크코스
---

우아한테크코스 마지막 미션인 레거시 코드 리팩토링하기 미션의 마지막 4단계 PR을 제출했습니다. 이번 미션은 우테코를 하면서 가장 많이 고민한 미션이 아니었나 싶은데요, 그동안 우테코에서 `객체 지향 프로그래밍`에 대해 많이 배웠다고 생각했는데, 이번 미션을 하면서 사실 진짜 객체 지향에 대한 깊은 고민은 아직 해보지 않았다는 것을 느꼈습니다. 고민한 것도 많고, 얻은 것도 많기 때문에 미션을 진행하면서 새로 얻은 지식이나 고민한 결과를 기록으로 남기기로 결정했습니다.

이번 미션은 [우아한객체지향](https://www.youtube.com/watch?v=dJ5C4qRqAgA)이라는 우아한테크세미나 내용을 바탕으로 공부한 내용이 많습니다. 함께 참고하시면 좋을 것 같아요 :)

# 도메인은 벌크업, 서비스는 다이어트

아무 생각 없이 코드를 짜다 보면, 온갖 비즈니스 로직이 다 서비스에 들어가 있고 정작 도메인은 데이터를 담는 VO의 역할밖에 하지 않는 경우가 있습니다. 검증 로직도, 도메인 변경 로직도 다 서비스에 있고 도메인은 그냥 DB에 저장만 하게 되는 것이죠. 이것은 좋은 설계는 아니라고 생각합니다.

애플리케이션 로직이 간단할 때는 크게 문제가 없을 거라고 생각합니다. 하지만 비즈니스 로직이 많아지게 되면, 서비스가 굉장히 비대해지고 난잡한 코드가 되게 될 가능성이 높습니다. 이는 가독성의 저해와 유지보수의 어려움을 가져오게 됩니다. 이 로직들을 최대한 도메인으로 넣을 수 있다면 어떨까요? 각각의 도메인 객체에 관련된 로직이 한 곳으로 모이게 되어 응집성이 증가하는 것은 물론이고, 서비스는 도메인의 로직을 호출만 하면 되기 때문에 서비스를 얇게 만들 수 있습니다. 또한 도메인에 로직이 다 들어가 있기 때문에 여러 서비스에서 도메인을 가져다 쓰면 되어 재사용성도 좋아집니다. 그리고 테스트 하기 좋은 코드가 됩니다. 도메인 객체를 테스트하는데는 스프링 프레임워크도, mockito도 필요하지 않습니다. 그저 연관된 객체들을 생성해서 테스트 하기만 하면 됩니다. 반면 로직이 서비스에 있을 경우 모킹을 활용하든 통합 테스트를 하든 무언가 다른 프레임워크의 도움을 받아 테스트를 하게되어 테스트하기 더 불편해집니다.

이번 미션의 2단계가 마침 서비스 리팩토링이라는 주제로 서비스 로직을 최대한 도메인 로직으로 밀어넣는 과제였고, 반드시 repository를 호출해서 검증해야 할 필요가 있는 로직같이 도메인으로 들어가기 힘든 로직들을 제외하고 최대한 로직을 도메인으로 밀어넣는 코드를 작성하려고 노력했습니다.

이게 보통 힘든 일이 아니더라고요. 우선 설계를 고민하는데 정말 많은 시간과 노력이 필요합니다. 각각의 도메인 객체에 대한 깊은 이해가 선행되지 않으면 로직이 있어야 할 곳에 있지 못하고 흩어지게 되고, 의존성도 꼬여서 하나를 수정하면 다른 객체들도 연쇄적으로 수정되는 등 오히려 변경 및 확장에 더 유연하지 못한 코드가 되어 버리게 됩니다.

# 의존성

의존성이 꼬이게 된다고 했는데, 의존성이란 무엇일까요? 의존성이란 변경이 전파된다는 의미입니다. 즉, `A가 B에 의존한다.`는 `B가 변하면 A도 변한다.`라는 의미가 됩니다. 이는 변경에 유연한 설계를 하기 위해서는 의존성을 최대한 약하게 유지해야 한다는 의미가 됩니다.

사실 위에서 말한 서비스 로직을 도메인 로직으로 옮기는 것을 아주 간단하게 해결하는 방법이 있습니다. 필요한 객체를 전부 의존하면 됩니다. 이번 미션을 예로 들어보겠습니다. 이번 미션에는 다음과 같은 도메인들이 있었습니다.

- MenuGroup
- Menu
- MenuProduct
- Product
- Order
- OrderLineItem
- OrderTable
- TableGroup

그리고 레거시 상태로 받아봤을 때 이 객체들은 다음과 같은 관계를 맺고 있었습니다.

![](https://velog.velcdn.com/images/ohzzi/post/2d3f2a75-6801-43bf-b9ee-f908e7ea73e7/image.png)

실선은 객체 참조, 점선은 id를 통한 간접 참조입니다.

말씀드린대로 서비스 로직을 도메인 로직으로 옮기는 것은 필요한 객체를 전부 의존하도록 바꾸면 해결됩니다. 즉, 보이는 다이어그램에서 점선을 전부 실선으로 바꾸면 해결됩니다. 그렇게 되면 객체 그래프 탐색을 통해 다른 도메인의 데이터를 가져올 수 있고, 그 값을 통해 검증이 가능합니다. 예를 들어보겠습니다. Menu를 만들 때, `MenuProduct의 가격 총 합보다 Menu의 가격이 작아야 한다.` 라는 비즈니스 로직이 있습니다.

```java
final List<MenuProduct> menuProducts = menu.getMenuProducts();

BigDecimal sum = BigDecimal.ZERO;
for (final MenuProduct menuProduct : menuProducts) {
    final Product product = productDao.findById(menuProduct.getProductId())
            .orElseThrow(IllegalArgumentException::new);
    sum = sum.add(product.getPrice().multiply(BigDecimal.valueOf(menuProduct.getQuantity())));
}

if (price.compareTo(sum) > 0) {
    throw new IllegalArgumentException();
}
```

이 로직을 위해서는 반드시 각각의 MenuProduct마다 가진 productId를 바탕으로 ProductDao(ProductRepository)에서 Product를 조회 한 뒤, 가격 총합을 해서 Menu의 가격과 비교하는 로직을 `서비스`에서 실행해줘야 합니다. 이 로직을 도메인으로 넣으려면 어떻게 해야 할까요? 도메인 안으로 들어가려면 Menu 안에서 MenuProduct 가격 총합을 계산해서 스스로의 Price와 비교할 수 있어야 합니다. 그런데 각각의 MenuProduct는 가격을 직접 알지 못하고, 단지 연관된 productId를 가지고 있을 뿐입니다. 그래서 MenuProduct가 직접 가격을 계산하려면 MenuProduct가 Product를 연관관계로 가지고 있어야 한다는 결과가 나옵니다.

이렇게 되면 강한 의존성을 가지게 되어 변경에 유연하지 못한 코드가 됩니다. 게다가 MenuProduct - Product 뿐 아니라 다른 도메인들도 검증 로직에 필요한 도메인을 서로 다 직접 참조 해버리면 JPA 마이그레이션 시 조회 범위를 어디까지 할 것인가에 대한 성능 문제가 발생하기도 합니다. 그렇다고 서비스 로직으로 validation을 내보내기는 싫습니다. 어떻게 해결할 수 있을까요? 

미션을 어려워하는 크루들을 위해 **제이슨** 코치님이 직접 라이브 코딩으로 보여주셨습니다. 이미 정해져있는 객체 구조와 데이터베이스 구조를 유지하면서 하려던 제게 이 라이브 코딩 과정이 큰 깨달음을 주었는데요, MenuProduct가 Product로부터 필요한 값은 Price입니다. 라이브 코딩 과정에서 제이슨은 Product의 Price를 복사해서 MenuProduct가 가지도록 했습니다. (DB 스키마의 수정도 필요합니다. 일종의 반정규화(비정규화)입니다.) 이렇게 하니 MenuProduct - Product의 의존 문제가 간단히 풀리게 되었습니다.

```java
@Entity
@Table(name = "menu_product")
public class MenuProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long seq;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "menu_id", nullable = false)
    private Menu menu;
    @Column(name = "product_id", nullable = false)
    private Long productId;
    @Embedded
    private Quantity quantity;
    @Embedded
    private Price price;

	...
}
```
MenuProduct는 생성 시점에 Price까지 받아와서 직접 저장합니다. 이렇게 되면 MenuProduct는 Product를 직접 몰라도 되게 되고, Price의 경우 서비스에서 Product를 조회해서 가져오든 임의의 값을 넣든 MenuProduct가 모르는 상태가 됩니다. 의존성을 약하게 만들 수 있습니다.

Order 쪽은 조금 다른 고민이 있었는데요, 3단계 요구사항 중 `메뉴의 이름과 가격이 변경되면 주문 항목도 함께 변경된다. 메뉴 정보가 변경되더라도 주문 항목이 변경되지 않게 구현한다.`라는 부분이 있었습니다. 지금은 Order가 menuId로 Menu를 간접참조 하고 있었는데요, 아이디만 가지고 있고 정보는 전혀 가지고 있지 않기 때문에 Menu 정보를 불러오려면 반드시 Menu 테이블을 조회해와야 하고, 그로 인해 DB의 Menu 정보가 바뀌면 Order도 변하게 되는 것이죠. 객체적으로는 간접 참조지만 실제로는 어쨌든 의존성이 있는 상황이었습니다. 결국 이 문제도 반정규화를 통해 풀어낼 수 있었습니다. 메뉴의 이름과 가격을 OrderLineItem이 가지도록 해서 말이죠.

```java
@Entity
@Table(name = "order_line_item")
public class OrderLineItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long seq;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    @Embedded
    private Quantity quantity;
    @Embedded
    private OrderedMenu orderedMenu;
    
    ...
}

@Embeddable
public class OrderedMenu {

    @Column(name = "menu_name", nullable = false)
    private String name;
    @Embedded
    @AttributeOverride(name = "value", column = @Column(name = "menu_price"))
    private Price price;
    
    ...
}
```

Order를 생성하는 시점에 Menu를 조회해와서 그 값을 가지고 OrderedMenu를 만들어주고, 이를 바탕으로 Order를 생성하면 Order는 메뉴를 직접 알지 않으면서도 Menu의 내용을 저장하며, Menu가 변하더라도 Order는 변하지 않게 됩니다.

자, 이제 의존성이 잘 짜여진 코드처럼 보일 수 있습니다만, 서비스까지 포함시켜보면 다릅니다. 저는 비슷한 도메인들끼리의 집합, 바운디드 컨텍스트를 정의했습니다.

![](https://velog.velcdn.com/images/ohzzi/post/8bcf9325-26cc-4914-8ca8-16d1c9ee0aae/image.png)

빨간색 점선 화살표가 컨텍스트 간 의존성 화살표입니다. 저는 이번 3단계의 목표를 두 가지로 잡았습니다.

- 서로 다른 컨텍스트의 객체 끼리는 강한 결합(필드 매핑을 통한 연관관계)을 가지지 않는다.
- 컨텍스트 간 의존성은 단방향으로 흘러야 한다. 사이클이 생겨서는 안된다.

그런데 위 다이어그램을 보시면 아시겠지만 Order 컨텍스트와 Table 컨텍스트가 서로 양방향 의존을 하고 있다는 문제가 있었습니다.

> 여기서 잠깐
> 같은 컨텍스트 내에서 객체끼리 양방향 의존하는 것은 해결해야 할 문제로 치지 않았습니다. 이는 JPA를 사용할 때 일대다 단방향 매핑 시 불필요한 쿼리가 추가적으로 나가는 문제를 해결하기 위해 생기는 양방향이기 때문입니다. 또한 같은 컨텍스트 내에서는 서로가 서로를 알더라도 크게 문제가 되지 않을 것이라고 판단했습니다.

Order와 Table에 왜 양방향 의존이 생겼을까요? 이는 다음과 같은 검증 로직 때문입니다.

- Order를 생성할 때, Order가 속한 OrderTable의 empty 값이 true면 안된다.
- OrderTable의 empty값을 변경할 때, OrderTable에 속한 Order 중 status가 COOKING이나 MEAL인 Order가 있으면 안된다.
- TableGroup을 해제할 때, TableGroup으로 묶인 OrderTable에 속한 Order 중 status가 COOKING이나 MEAL인 Order가 있으면 안된다.

컨텍스트간 객체 직접 참조는 끊어놨지만, 서로 다른 컨텍스트의 값이 필요하기 때문에 서비스 -> 레포지토리 의존을 통해 의존하고 있습니다. 문제는 이 방향이 양방향이라는 것이죠. 이 문제를 해결하기 위해 여러 가지 방법을 생각해보았습니다.

- Validator를 사용
- 이벤트 방식 사용

여기서 첫 번째 Validator 방식은, 저는 개인적으로 도메인의 순수성을 해치는 것 같아 손이 가지 않았습니다. 그래서 처음에는 이벤트 발행 방식을 고려했습니다. 그러나, 이 경우 다음과 같은 문제가 있었습니다.

- 이벤트는 상태 전파에 사용하는 것인데 이벤트를 validation에 사용. 사용은 가능하지만 본래 의도에 맞지 않음.
- ApplicationEventPublisher를 사용할 경우, 이벤트 발행 로직을 서비스로 보내주어야 함. 도메인 자체에서 로직을 처리하지 못함.
- 도메인에서 이벤트를 생성하는 AbstractAggregateRoot가 있지만, 이 경우 반드시 JpaRepository의 save 또는 delete를 호출해줘야 하므로 역시 서비스에 의존적이게 됨. 또한 JPA의 더티 체킹을 사용할 수 없음.

앞서 말했듯 `도메인은 벌크업, 서비스는 다이어트` 원칙까지 지키면서 구현해야 했고, 이벤트의 본래 의도와도 맞지 않았기 때문에 3단계 PR을 보낸 후 이벤트 방식을 폐기하기로 결정했습니다. 그렇다면 과연 어떤 식으로 해결할 수 있을지, 같은 백엔드 크루 차리와 거의 1~2시간은 토의하면서 고민한 것 같습니다. 제가 내린 결론은 다음과 같습니다.

`또 한번 데이터베이스 반정규화하고, 중간 객체를 활용하자.`

앞서 MenuProduct - Product 관계를 끊는 부분을 제이슨이 라이브 코딩으로 보여줬다는 부분을 기억하시나요? 그 때 나왔던 기법에 우아한객체지향에서 본 중간 객체라는 개념을 하나 얹었습니다. 우선 Order는 생성 시점에 OrderTable이 반드시 필요하기 때문에 Order -> Table 컨텍스트 의존성은 그대로 유지하기로 하고, Table -> Order 의존성을 끊기로 결정했습니다. 이 때 Table의 상태를 바꾸거나 단체 지정을 해제할 때, 포함된 Order의 OrderStatus가 문제가 되는 것인데요. 저는 Order 생성 시점에 OrderStatus를 복사해서 중간 객체로 만들어 DB에 저장하는 것으로 해결했습니다.

![](https://velog.velcdn.com/images/ohzzi/post/ddda69c4-4a42-47f6-ab3d-f77ca872c525/image.png)

우아한객체지향에 나온 위 이미지 같은 느낌이 됩니다. 구현 코드는 다음과 같습니다.

```java
@Entity
@Table(name = "order_status_record")
public class OrderStatusRecord implements Persistable<Long> {

    @Id
    @Column(name = "order_id")
    private Long orderId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_table_id", nullable = false)
    private OrderTable orderTable;
    @Enumerated(value = EnumType.STRING)
    @Column(name = "order_status")
    private OrderStatus orderStatus;
    
    ...
}
```

중간 객체 OrderStatusRecord입니다. 그리고 이 중간 객체는,

```java
@Entity
@Table(name = "order_table")
public class OrderTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_group_id")
    private TableGroup tableGroup;
    @Embedded
    private NumberOfGuests numberOfGuests;
    @Column(name = "empty", nullable = false)
    private boolean empty;
    @BatchSize(size = 100)
    @OneToMany(mappedBy = "orderTable", cascade = {CascadeType.PERSIST, CascadeType.REMOVE}, orphanRemoval = true)
    private List<OrderStatusRecord> orderStatusRecords = new ArrayList<>();
    ...
}
```

OrderTable에서 가지도록 했습니다. 이렇게 되면,

```java
    ...
    private void validateCookingOrMealOrderNotExistsWhenChangeEmpty() {
        if (orderStatusRecords.stream().anyMatch(OrderStatusRecord::isNotCompleted)) {
            throw new CookingOrMealOrderTableCannotChangeEmptyException();
        }
    }
    ...
```
이렇게 검증 로직을 OrderTable안에 작성할 수 있고, TableGroup 역시 객체 그래프 탐색을 통해 들어가서 검증 로직을 도메인 안으로 넣을 수 있습니다.

최종적으로는 다음과 같은 의존성 구조를 가지게 되었습니다.

![](https://velog.velcdn.com/images/ohzzi/post/fc581448-e15e-418f-8fb4-f090f3443cad/image.png)

# 느낀 점

`의존성을 고려하면서 설계해야지`라는 다짐을 했던 적은 많았는데, 정작 정말 의존성을 고려하면서 설계하려고 하니 여간 쉬운 일이 아니라는 것을 느꼈습니다. 그리고 미션을 하고 나니까 레벨 3, 레벨 4에서 진행한 프로젝트 코드가 의존성을 많이 고려하지 않고 있다는 느낌도 받았습니다. 미션에는 적용했다가 다시 롤백했지만, 이벤트 방식에 대해서 관심을 가질 수도 있어서 좋은 기회였습니다. 또한 DDD의 기초 개념 정도는 살짝 찍먹해본 것 같아 그 부분에서도 재밌는 미션이었다고 생각합니다.

> 코드가 궁금하시다면?  
> [GitHub](https://github.com/Ohzzi/jwp-refactoring/tree/ohzzi)  