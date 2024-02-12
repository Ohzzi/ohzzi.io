---
title: "도메인 이벤트 기반 MAT.ZIP 프로젝트 개선기"
date: 2022-11-08
update: 2024-02-12
tags:
  - Domain
  - Event
---

[MAT.ZIP](https://matzip.today) 프로젝트는 음식점 조회 시 별점을 기준으로 정렬하여 보여주는 기능이 있습니다.

![](https://velog.velcdn.com/images/ohzzi/post/1366808d-ada7-44e7-9964-0a3894d537ea/image.png)

그런데 별점의 정보는 음식점 테이블이 아닌 리뷰 테이블에 담겨 있습니다. 따라서 음식점 조회 시 리뷰 테이블을 조인하거나 서브쿼리를 사용해서 평균 별점을 계산해야 하는 문제가 있습니다. 지금은 음식점 개수가 많지 않고 리뷰 개수도 많지 않아 큰 문제가 없지만, 만약 서비스가 확장되어 음식점 개수가 많아지거나, 사용자가 많아져 리뷰 개수가 많아지게 될 경우 조회 성능이 저하되는 문제가 생기게 됩니다. 어떻게 하면 개선할 수 있을까요?

사실 답은 이미 나와 있습니다. [F12의 눈물나는 쿼리 개선기 - 이론편](https://velog.io/@ohzzi/F12%EC%9D%98-%EB%88%88%EB%AC%BC%EB%82%98%EB%8A%94-%EC%BF%BC%EB%A6%AC-%EA%B0%9C%EC%84%A0%EA%B8%B0-%EC%9D%B4%EB%A1%A0%ED%8E%B8)에서 설명한 것처럼 반정규화와 커버링 인덱스를 사용한 페이징을 적용하면 됩니다. [F12](https://f12.app) 프로젝트와 MAT.ZIP의 도메인 구조가 굉장히 유사하기 때문에, F12의 쿼리를 개선한 방법을 MAT.ZIP에도 비슷하게 적용할 수 있습니다.

이렇게 쿼리 성능 문제를 해결했으니, 다음은 그로 인한 동시성 문제에 초점을 맞춰 보겠습니다. 이 역시 F12에서 이미 겪은 문제였는데요, [동시성 그리고 정합성, 문제 해결기](https://velog.io/@ohzzi/%EB%8F%99%EC%8B%9C%EC%84%B1-%EA%B7%B8%EB%A6%AC%EA%B3%A0-%EC%A0%95%ED%95%A9%EC%84%B1-%EB%AC%B8%EC%A0%9C-%ED%95%B4%EA%B2%B0%EA%B8%B0) 포스팅에 그 내용이 자세히 나와 있습니다.

오늘은 단순히 성능 및 동시성 개선에서 더 나아가 관심사를 분리하여 조금 더 깔끔한 코드와 구조를 만드는 부분에 대해서 알아보겠습니다.

동시성 문제 포스팅에서 알 수 있듯이, 반정규화로 생긴 집계 컬럼 정보를 업데이트 할 때 동시성 문제가 생깁니다. 이 문제를 일단은 직접 업데이트 쿼리를 실행하는 방법으로 해결했습니다.

```java
@Service
public class ReviewService {
    ...
    @Transactional
    public void createReview(final String githubId, final Long restaurantId,
                             final ReviewCreateRequest reviewCreateRequest) {
        Member member = memberRepository.findMemberByGithubId(githubId)
                .orElseThrow(MemberNotFoundException::new);
        Review review = reviewCreateRequest.toReviewWithMemberAndRestaurantId(member, restaurantId);
        reviewRepository.save(review);
        restaurantRepository.updateRestaurantByReviewInsert(restaurantId, review.getRating());
    }
    ...
}
```

## 이벤트 사용하기

하지만, 다음과 같은 문제가 있습니다.

- ReviewService는 리뷰에 대한 비즈니스 로직을 다루는 서비스입니다. 그런데 주 관심사가 아닌 Restaurant에 대한 비즈니스 로직도 포함하고 있습니다.
- Review에 대한 로직과 Restaurant에 대한 로직이 같은 트랜잭션으로 묶여 있습니다. 리뷰를 작성하는 로직은 성공하고, 그 뒤 음식점의 리뷰 개수를 증가시키는 로직에서 예외가 발생했다고 가정하겠습니다. 이 경우, 서비스의 주 관심사인 `리뷰를 작성한다`는 문제없이 성공했음에도 불구하고 주 관심사가 아닌 `음식점의 리뷰 개수를 증가시킨다`의 실패로 인해 리뷰 작성마저 롤백되게 됩니다. 핵심 로직의 순수성을 유지하기 위해서 트랜잭션의 분리가 필요합니다.
- 트랜잭션을 불필요하게 길게 잡고 있습니다. 리뷰 작성, 수정, 삭제 쿼리가 완료되면 트랜잭션이 커밋되어도 무방한데, 음식점에 대한 쿼리를 추가로 날리기 위해 트랜잭션을 더 길게 유지합니다. 결국 사용자에게 가는 응답이 불필요하게 늦어지게 됩니다.

음식점에 대한 로직을 어떻게 하면 리뷰 로직에서 분리시킬 수 있을까요?

저희 MAT.ZIP 팀은 이 문제에 대한 해답으로 `이벤트`를 사용하기로 결정했습니다. 이벤트를 사용한 로직은 크게 두 부분, 발행과 구독으로 나누어집니다. 이벤트를 발행하는 쪽에서 특정 이벤트를 발행하면, 해당 이벤트에 대해 구독하고 있던 리스너가 이벤트를 받아서 그에 맞는 처리를 해주는 방식입니다.

스프링이 이벤트를 지원하기 때문에 이벤트 기능을 구현하는 것 자체는 어렵지 않습니다. 여기서 잠깐 스프링의 이벤트에 대해서 알아보고 넘어가도록 하겠습니다. 스프링에는 ApplicationEventPublisher라는 이벤트 발행 빈이 존재합니다. ApplicationEventPublisher의 publishEvent 메서드를 사용하면 이벤트를 발행할 수 있습니다.

이벤트를 발행하는 쪽이 있으면 구독하는 쪽도 있어야겠죠? 스프링에서 이벤트 리스너를 구현하는 방법은 몇 가지가 있지만, 가장 간단한 방법은 어노테이션을 기반으로 한 방법입니다. `@EventListener`, `@TransactionalEventListener` 어노테이션을 사용한 메서드를 통해 이벤트 구독을 할 수 있습니다.

```java
@Component
@Async
public class RestaurantEventListener {

    private final RestaurantService restaurantService;

    public RestaurantEventListener(final RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @TransactionalEventListener
    public void handleReviewCreateEvent(final ReviewCreatedEvent event) {
        Long restaurantId = event.getRestaurantId();
        int rating = event.getRating();
        restaurantService.updateWhenReviewCreate(restaurantId, rating);
    }

    @TransactionalEventListener
    public void handleReviewDeleteEvent(final ReviewDeletedEvent event) {
        Long restaurantId = event.getRestaurantId();
        int rating = event.getRating();
        restaurantService.updateWhenReviewDelete(restaurantId, rating);
    }

    @TransactionalEventListener
    public void handleReviewUpdateEvent(final ReviewUpdatedEvent event) {
        Long restaurantId = event.getRestaurantId();
        int ratingGap = event.getRatingGap();
        restaurantService.updateWhenReviewUpdate(restaurantId, ratingGap);
    }
}
```

이벤트 리스너를 만들어주었기 때문에, 기존에 직접 RestaurantRepository의 업데이트 메서드를 호출하던 부분을 이벤트 발행 부분으로 바꿔주면 됩니다.

```java
@Service
public class ReviewService {
    ...
    @Transactional
    public void createReview(final String githubId, final Long restaurantId,
                             final ReviewCreateRequest reviewCreateRequest) {
        Member member = memberRepository.findMemberByGithubId(githubId)
                .orElseThrow(MemberNotFoundException::new);
        Review review = reviewCreateRequest.toReviewWithMemberAndRestaurantId(member, restaurantId);
        reviewRepository.save(review);
        applicationEventPublisher.publishEvent(new ReviewCreatedEvent(restaurantId, review.getRating());
    }
    ...
}
```

자, 그런데 여기서 주목할 부분이 두 가지가 있습니다. 왜 이벤트 리스너는 `@TransactionalEventListener`일까요? 왜 `@Async`가 선언이 된 것일까요?

### 왜 비동기인가?

우선 `@Async`에 주목해보겠습니다. 이벤트 리스너에 `@Async`를 붙이고 `@EnableAsync`가 선언된 `@Configuration`이 존재할 경우, 이벤트 리스너가 비동기로 작동하게 됩니다.

비동기 처리를 한 이유는 크게 두 가지 입니다. 1. 리뷰 작성, 수정, 삭제에 대한 응답 latency를 줄인다., 2. 독립된 트랜잭션을 만든다.
만약 동기 처리를 하게 될 경우 발행한 이벤트 처리가 완료될 때 까지 메인 트랜잭션이 기다리게 될 것입니다. 하지만 주 관심사도 아닌 로직을 굳이 기다리지 않고 사용자에게 리뷰 작성, 수정, 삭제 요청에 대한 응답을 돌려주는 것이 더 자연스럽고 응답 시간도 더 빨라지게 됩니다. 때문에 비동기가 필요한 상황이라고 판단하여 적용했습니다.

완전히 독립된 트랜잭션을 만드는 것도 또 하나의 목적입니다. 트랜잭션 전파 레벨 중 REQUIRES_NEW를 사용하면 독립된 트랜잭션을 만드는 것 처럼 보이나 사실 그렇지 않습니다. 새 트랜잭션을 만드나 부모 트랜잭션과 독립된 트랜잭션은 아닙니다. REQUIRES_NEW로 새로 만든 트랜잭션의 예외가 부모 트랜잭션으로 전파될 수 있고, UncheckedException이 전파되면 부모 트랜잭션이 롤백됩니다. (때문에 동기 + REQUIRES_NEW를 사용하려면 자식 트랜잭션 쪽에서 예외 처리를 해서 전파가 안되게 해야 합니다.) 이는 트랜잭션의 롤백 및 예외 정보가 ThreadLocal로 관리되기 때문입니다. (관련 문서) 하지만 비동기 작업으로 진행하면 아예 다른 쓰레드에서 작업이 실행되기 때문에 독립된 트랜잭션에서 로직을 진행할 수 있습니다. (이는 스프링이 멀티쓰레드 - 단일 트랜잭션을 지원하지 않기 때문입니다.) 때문에 예외 전파를 걱정할 필요가 없습니다.

### 왜 @TransactionalEventListener인가?

비동기이기 때문에 굳이 TransactionalEventListener가 아닌 EventListener를 사용해도 되지 않을까라는 생각을 할 수도 있습니다. 하지만 다음과 같은 상황이 발생할 수 있습니다.

리뷰 작성 트랜잭션의 모든 작업 완료 -> 이벤트 발행 -> (비동기로 이벤트 처리 중) -> 트랜잭션 커밋 -> 커밋 중 모종의 이유로 커밋 실패 -> 리뷰 작성 트랜잭션 롤백 -> 이벤트를 처리하는 트랜잭션은 비동기이기 때문에 롤백하지 않음 -> 리뷰 작성이 실패했는데 리뷰 개수가 올라감

이런 예외가 자주 발생하지는 않겠지만, 가능성을 차단하기 위해서 반드시 리뷰 쪽 트랜잭션이 커밋되어 EventListener가 실행되어야 하는 상황임을 보장한 후 실행되도록 했습니다. (Default 옵션인 AFTER_COMMIT 옵션 적용)

### Async 쓰레드 풀 적용하기

비동기 이벤트 처리는 별도의 쓰레드에서 동작합니다. 이 때, 이벤트 처리마다 무한히 쓰레드를 생성하기 보다는 쓰레드 풀을 사용하여 관리하는 방법을 선택할 수 있습니다.

```java
@Configuration
@EnableAsync
public class AsyncEventConfig {

    @Bean(name = "asyncTaskExecutor")
    public ThreadPoolTaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor threadPoolTaskExecutor = new ThreadPoolTaskExecutor();
        threadPoolTaskExecutor.setCorePoolSize(10);
        threadPoolTaskExecutor.setMaxPoolSize(20);
        threadPoolTaskExecutor.setQueueCapacity(25);
        threadPoolTaskExecutor.initialize();
        return threadPoolTaskExecutor;
    }
}
```

`@Configuration`을 통해 쓰레드 풀을 빈으로 생성해줍니다. `@Async` 어노테이션에는 value를 넣는 부분이 있습니다. 이 부분에 저희가 생성한 쓰레드 풀 빈의 이름을 넣어주면, 비동기 동작이 해당 쓰레드 풀로부터 쓰레드를 얻어 진행하게 됩니다.

```java
@Component
@Async(value = "asyncTaskExecutor")
public class RestaurantEventListener {
    ...
}
```

(참고로, `@Async` 어노테이션은 클래스 레벨에 선언하면 내부의 모든 메서드가 비동기 처리가 되도록 동작합니다.)

## 이벤트 발행을 도메인에서 할 수는 없을까?

아직 아쉽습니다. Pull Request에 대해 다음과 같은 리뷰가 있었습니다.

![](https://velog.velcdn.com/images/ohzzi/post/e4334554-6bfb-4d08-b6c4-90cb743714bb/image.png)

곰곰히 생각해보면 맞는 이야기입니다. `리뷰가 작성되었습니다`라는 이벤트는 누가 이벤트를 구독하고 있든 구독하고 있지 않든 상관없이 항상 리뷰가 작성될 때마다 발행되어야 합니다. 하지만 만약 실수로 서비스에서 리뷰 생성 및 저장만 하고 이벤트를 발행하지 않는다면 어떻게 될까요? 아마 리뷰 작성 이벤트를 필요로 하는 로직들이 실행되지 않을 것입니다. 즉 리뷰를 작성한다 -> 리뷰 작성에 대한 이벤트를 발행한다 라는 하나의 작업의 원자성이 보장되지 않는 것입니다.

이 부분은 어떻게 개선할 수 있을까요? 이벤트 발행 로직을 도메인으로 이동시켜서 도메인 생성과 생성 이벤트 발행을 하나로 묶을 수는 없을까요? ApplicationEventPublisher를 사용할 수는 없습니다. Review가 ApplicationEventPublisher를 의존하는 순간 POJO가 아닌 스프링에 의존하는 객체가 되어버리고, 의존성의 방향도 뒤틀리게 됩니다.

다행히도 저희는 Spring Data JPA를 사용하고 있고, Spring Data에서는 AbstractAggregateRoot라는 도메인 이벤트 편하게 사용할 수 있는 클래스를 지원합니다. (AbstractAggregateRoot를 사용하지 않더라도, @DomainEvents와 @AfterDomainEventPublication 어노테이션을 활용하여 구현할 수 있습니다.) AbstractAggregateRoot에는 이벤트를 등록할 수 있는 protected registerEvent 메서드가 존재합니다. 도메인이 AbstractAggregateRoot를 상속받도록 하고, 내부에서 registerEvent 메서드를 호출해주면 원하는 이벤트를 등록할 수 있습니다. 이렇게 등록된 이벤트는 내부에 `@Transient`로 선언된 이벤트 리스트로 관리됩니다.

그런데 registerEvent는 이벤트를 등록만 할 뿐, 발행하지는 않습니다. 때문에 발행하는 작업이 필요한데요, Spring Data JPA에서는 repository의 save, saveAll, delete, deleteAll을 호출할 때 엔티티에 쌓여 있는 이벤트를 모두 발행합니다.

AbstractAggregateRoot 사용을 통해 코드를 다음과 같이 개선할 수 있습니다.
```java
@Entity
@Table(name = "review")
@EntityListeners(AuditingEntityListener.class)
@Getter
public class Review extends AbstractAggregateRoot<Review> {
    ...
    @Builder
    public Review(final Long id, final Member member, final Long restaurantId, final String content, final int rating,
                  final String menu, final LocalDateTime createdAt) {
        validateRating(rating);
        LengthValidator.checkStringLength(menu, MAX_MENU_LENGTH, "메뉴의 이름");
        LengthValidator.checkStringLength(content, MAX_CONTENT_LENGTH, "리뷰 내용");
        this.id = id;
        this.member = member;
        this.restaurantId = restaurantId;
        this.content = content;
        this.rating = rating;
        this.menu = menu;
        this.createdAt = createdAt;
        registerEvent(new ReviewCreatedEvent(restaurantId, rating));
    }
    ...
}
```

이벤트 등록 로직이 도메인으로 들어갑니다. 이벤트 발행은 reviewRepository.save 호출 시 이루어지는데, 어차피 영속화를 위해 서비스에서 호출하고 있으므로, 기존에 이벤트를 발행하던 ApplicationEventPublisher 로직만 지워주면 됩니다.

```java
@Service
public class ReviewService {
    ...
    @Transactional
    public void createReview(final String githubId, final Long restaurantId,
                             final ReviewCreateRequest reviewCreateRequest) {
        Member member = memberRepository.findMemberByGithubId(githubId)
                .orElseThrow(MemberNotFoundException::new);
        Review review = reviewCreateRequest.toReviewWithMemberAndRestaurantId(member, restaurantId);
        reviewRepository.save(review);
    }
    ...
}
```

이벤트 생성의 주체가 도메인으로 바뀌면서 서비스는 save 메서드를 호출하기만 할 뿐 이벤트 생성 및 발행의 책임은 가져가지 않게 되었습니다. 훨씬 더 깔끔한 코드가 되었네요.

### update의 경우에는 어떡하지?

리뷰 수정 이벤트의 경우에 약간의 문제가 있습니다. 기존에는 JPA의 변경 감지 기능을 사용해서 리뷰 정보를 수정했습니다. 하지만 앞서 말했듯이 AbstractAggregateRoot는 save 또는 delete 메서드를 호출할 때 도메인이 가지고 있는 이벤트들을 전부 발행합니다. 때문에 JPA의 변경 감지 기능은 사용할 수 없습니다. 대신 이 경우에도 save 메서드를 호출하는 방법을 사용해야 합니다. JpaRepository의 save 메서드는 비영속 상태의 엔티티가 아닌 경우 em.merge를 호출하여 수정 또는 삽입을 진행합니다. 때문에 변경 감지 기능을 포기하고 리뷰 수정 시에도 save 메서드를 호출하도록 하여 이벤트 발행을 보장하도록 하겠습니다.

```java
@Entity
@Table(name = "review")
@EntityListeners(AuditingEntityListener.class)
@Getter
public class Review extends AbstractAggregateRoot<Review> {
    ...
    public void update(final String githubId,
                       final String content,
                       final int rating,
                       final String menu) {
        validateOwner(githubId);
        validateRating(rating);
        LengthValidator.checkStringLength(menu, MAX_MENU_LENGTH, "메뉴의 이름");
        LengthValidator.checkStringLength(content, MAX_CONTENT_LENGTH, "리뷰 내용");
        registerEvent(new ReviewUpdatedEvent(restaurantId, calculateGap(rating)));
        this.content = content;
        this.rating = rating;
        this.menu = menu;
    }
    ...
}
```
```java
@Service
public class ReviewService {
    ...
    @Transactional
    public void updateReview(final String githubId,
                             final Long reviewId,
                             final ReviewUpdateRequest reviewUpdateRequest) {
        Member member = memberRepository.findMemberByGithubId(githubId)
                .orElseThrow(MemberNotFoundException::new);
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(ReviewNotFoundException::new);
        review.update(member.getGithubId(),
                reviewUpdateRequest.getContent(),
                reviewUpdateRequest.getRating(),
                reviewUpdateRequest.getMenu());
        reviewRepository.save(review);
    }
    ...
}
```

이렇게 해서 리뷰 수정 시에도 수정 이벤트를 발행할 수 있게 되었습니다.

### 삭제 시에는 어떻게...?

리뷰 작성이나 수정의 경우에는 쉽습니다. 왜냐면 생성자든, update 메서드든, 작성 및 수정이라는 로직을 담당하는 도메인 메서드가 존재하기 때문입니다. 하지만 삭제의 경우는 어떨까요? 만약 soft delete 방식을 채택하고 있었다면, 도메인 내에 deleted = true를 만드는 delete 메서드를 만들고 reviewRepository.save를 호출하면 될 문제였습니다. (삭제에 대해 save를 호출한다는 것이 조금 이상하지만요)

하지만 hard delete 방식을 사용하고 있기 때문에 삭제를 위해 도메인에서 호출할 메서드가 존재하지 않습니다. 그렇다고 이벤트를 등록하는 로직만 존재하는 메서드를 만들고, 이를 서비스에서 호출하는 것은 도메인 로직이 또다시 서비스 레이어로 분산된다는 점에서 고려하지 않았습니다. 이 부분을 어떻게 해결할 것인지 다양한 의견을 구해보았습니다. 처음 제가 생각한 방법은 [Spring Data JPA의 Repository 커스텀 기능](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/#repositories.custom-implementations)이었습니다.

```java
public interface ReviewDeleteRepository {

    void delete(Review review);
}

public class ReviewDeleteRepositoryImpl implements ReviewDeleteRepository {

    private final EntityManager em;

    public ReviewDeleteRepositoryImpl(final EntityManager em) {
        this.em = em;
    }

    @Override
    public void delete(final Review review) {
        검증 로직...
        review.이벤트 발행
        em.remove(em.contains(review) ? review : em.merge(review));
    }
}

public interface ReviewRepository extends Repository<Review, Long>, ReviewDeleteRepository {

    Review save(Review review);

    Optional<Review> findById(Long reviewId);

    List<Review> findAll();
    ...
}
```

이렇게 하면 delete 메서드를 호출하는 것 만으로 이벤트 등록, 발행, 엔티티 삭제를 모두 처리할 수 있습니다. 하지만 이런 의견도 있었습니다.

![](https://velog.velcdn.com/images/ohzzi/post/23dc4564-412d-4df1-bad0-c9685b2f1e4c/image.png)

여기서 두 의견이 충돌했습니다. 저는 `도메인은 순수해야 한다. 도메인이 리포지토리를 아는 것 보다 리포지토리가 도메인 로직을 사용하는 쪽이 더 맞는 것 같다.`의 의견을, 같은 팀 팀원 후니는 `레이어드 아키텍처에서 도메인 계층 아래에 인프라 계층(영속성 계층)이 존재하고 리포지토리는 엄밀히 따지면 해당 계층에 존재한다. 따라서 차라리 리포지토리에서 도메인의 로직을 사용하는 것은 맞지 않을 것 같다.` 라는 의견을 제시했습니다. 우아한테크코스 내 다른 크루(교육생)들의 의견을 구해보기도 했는데요, 의견이 분분해서 하나로 결론이 나지 않았습니다. 그러던 중, 제이슨 코치님이 해결책을 제시해주셨습니다.

> `@PreRemove`를 사용하는 방법도 있습니다

`@PreRemove`는 JPA 엔티티 생명 주기 이벤트 중의 하나입니다. [Baeldung](https://www.baeldung.com/jpa-entity-lifecycle-events)을 참고하면, 다음과 같은 어노테이션들이 존재합니다.
- before persist is called for a new entity – @PrePersist
- after persist is called for a new entity – @PostPersist
- before an entity is removed – @PreRemove
- after an entity has been deleted – @PostRemove
- before the update operation – @PreUpdate
- after an entity is updated – @PostUpdate
- after an entity has been loaded – @PostLoad

저희는 엔티티가 삭제 되기 전에 이벤트를 등록하고, 등록한 이벤트가 엔티티 삭제 시점에 발행되도록 해야 합니다. 때문에 이 어노테이션들 중 `@PreRemove`를 사용할 수 있습니다.

> **여기서 잠깐**
> 
> 만약 `@PostRemove`를 사용하면, 이벤트의 발행 로직이 호출되는 시점보다 이벤트의 등록 시점이 늦어지므로(`@PostRemove`의 호출 시점은 데이터베이스에서 실제로 데이터가 삭제되는 시점입니다. JPA 쓰기 지연으로 인해 delete 메서드가 종료된 후 트랜잭션이 커밋될 때 delete 쿼리가 나가므로 이벤트의 등록 시점보다 이벤트 발행 시점이 앞입니다.) 이벤트가 정상적으로 발행되지 않습니다.

Review 도메인에 이벤트를 등록하는 메서드를 만들고, `@PreRemove`를 붙여주도록 하겠습니다.

```java
@Entity
@Table(name = "review")
@EntityListeners(AuditingEntityListener.class)
@Getter
public class Review extends AbstractAggregateRoot<Review> {
    ...
    @PreRemove
    private void registerDeletedEvent() {
        registerEvent(new ReviewDeletedEvent(restaurantId, rating));
    }
    ...
}
```

이렇게 해서 리뷰가 영속성 컨텍스트에서 remove 처리되기 전에 이벤트가 등록되면서도, 이벤트 등록 메서드를 바깥에서 호출할 필요가 없도록 만들어줄 수 없습니다. 서비스에서는 전처럼 reviewRepository.delete만 호출해주면 됩니다.

```java
@Service
public class ReviewService {
    ...
    @Transactional
    public void deleteReview(final String githubId, final Long reviewId) {
        Member member = memberRepository.findMemberByGithubId(githubId)
                .orElseThrow(MemberNotFoundException::new);
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(ReviewNotFoundException::new);
        if (!review.isWriter(member.getGithubId())) {
            throw new ForbiddenException("리뷰를 삭제 할 권한이 없습니다.");
        }
        reviewRepository.delete(review);
    }
    ...
}
```

## 개선할 점

도메인 이벤트 발행과 비동기 이벤트 처리를 통해 리뷰를 작성, 수정, 삭제 하는 트랜잭션과 음식점의 집계 컬럼을 수정하는 트랜잭션을 물리적으로 분리하고 의존성도 끊었습니다. 이로써 구조상으로도 기존보다 한결 더 나은 코드가 되었고, 음식점 테이블에 걸리는 불필요한 락도 제거했으며, 트랜잭션을 유지하는 시간도 줄일 수 있었습니다. 하지만 아직 개선해야할 문제가 남아 있습니다.

`만약 비동기 이벤트 처리가 실패한다면 어떻게 할 것인가?`

지금은 별다른 처리를 하지 않았기 때문에 롤백을 하게 됩니다. 그렇게 되면, 실제 리뷰의 정보와 음식점이 가지고 있는 리뷰 정보의 정합성이 맞지 않는 상황이 발생하게 됩니다. 이를 방지하기 위해서 여러 방법이 있겠습니다만, 지금 고려할 수 있는 방법은 실패한 이벤트 정보를 저장한 뒤 나중에 스케줄러를 활용해 배치 처리를 하는 방법일 것 같습니다. 이 부분에 대해서는 어떤 식으로 구현할 것인지 아직은 감이 잡히지 않기 때문에 좀 더 학습하고, 고민할 필요가 있을 것 같습니다.

> 참고 자료
>
> [Baeldung](https://www.baeldung.com/spring-data-ddd)  
> [Spring Data JPA Reference Docs](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/)  
>
> Pull Request가 궁금하다면  
> [GitHub](https://github.com/The-Fellowship-of-the-matzip/mat.zip-back/pull/116)  