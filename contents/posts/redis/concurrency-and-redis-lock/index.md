---
title: "Redis를 활용하여 동시성 문제 해결하기"
date: 2022-12-10
update: 2024-02-12
tags:
  - Redis
  - 동시성
---

웹 서비스를 개발하다 보면 필연적으로 동시성 문제를 마주하게 됩니다. 기본적으로 웹 환경에서는 같은 시간에 여러 개의 요청이 들어올 수 있고, 스프링같은 멀티스레드 환경에서는 여러 스레드가 한 자원을 공유할 수 있어 데이터 정합성 문제가 발생할 수 있습니다. 때문에 백엔드 개발자라면 동시성을 문제에 대해 반드시 고려하고 넘어가야 합니다. [예전 게시물](https://velog.io/@ohzzi/%EB%8F%99%EC%8B%9C%EC%84%B1-%EA%B7%B8%EB%A6%AC%EA%B3%A0-%EC%A0%95%ED%95%A9%EC%84%B1-%EB%AC%B8%EC%A0%9C-%ED%95%B4%EA%B2%B0%EA%B8%B0)에서 비관적 락, 낙관적 락 등에 대한 고민과 결론적으로 데이터베이스의 원자적 연산 쿼리를 활용하는 방법으로 문제를 해결한 과정을 설명드렸는데요, 오늘은 조금 다른 방법으로 접근해보려고 합니다. 바로 Redis를 사용하는 방법입니다.

Redis는 **Re**mote **Di**ctionary **S**erver의 약자로서, "키-값" 구조의 비정형 데이터를 저장하고 관리하기 위한 오픈 소스 기반의 비관계형 데이터베이스 관리 시스템입니다. 저장소, 캐시, 메세지 브로커 등으로 사용되며, 보통은 캐시의 용도나 세션 저장소 등의 용도로 많이 쓰이는 소프트웨어입니다.

Redis로 어떻게 동시성을 제어한다는 것일까요? 바로 Redis를 활용한 **분산 락(Distributed Lock)**을 활용하면 됩니다. 분산 락은 이름 그대로 분산된 서버 또는 데이터베이스 환경에서도 동시성을 제어할 수 있는 방법인데요, 사실 반드시 Redis를 활용해서 분산 락을 구현할 필요는 없습니다. MySQL의 네임드 락 등을 활용해서도 충분히 구현할 수 있습니다. 오히려 이 쪽이 메모리 자원을 추가로 사용할 필요가 없다는 장점을 가지고 있기도 합니다. 그러나 기본적으로 디스크를 사용하는 데이터베이스보다 메모리를 사용하는 Redis가 더 빠르게 락을 획득 및 해제할 수 있기 때문에, 이번 시간에는 Redis로 동시성을 제어하는 방법을 예제를 통해 확인해보도록 하겠습니다.

## 예제 코드

서점의 재고 관리 시스템이라는 매우 간단한 예제를 통해 알아보도록 하겠습니다. 불필요한 요소들은 모두 쳐내고, `Book`과 `Stock`이라는 엔티티가 필요합니다.

```java
@Entity
@Table(name = "book")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "name", nullable = false)
    private String name;
    @Column(name = "price", nullable = false)
    private int price;
    @OneToOne(optional = false, cascade = CascadeType.ALL)
    @JoinColumn(name = "stock_id", nullable = false)
    private Stock stock;

    public Book(final String name, final int price, final Stock stock) {
        this.name = name;
        this.price = price;
        this.stock = stock;
    }

    public void purchase(final long quantity) {
        stock.decrease(quantity);
    }
}
```

먼저 도서 도메인을 나타내는 `Book` 엔티티입니다. 재고에 대해서는 별도의 테이블로 나누어 관리하기 위해 `@OneToOne`으로 일대일 관계를 나타내주었습니다.

```java
@Entity
@Table(name = "stock")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "quantity", nullable = false)
    private long remain;

    public Stock(final long remain) {
        this.remain = remain;
    }

    public void decrease(final long quantity) {
        if ((remain - quantity) < 0) {
            throw new IllegalArgumentException();
        }
        remain -= quantity;
    }
}
```

그리고 도서를 구매하는 서비스 로직도 작성해주도록 하겠습니다.

```java
@Service
public class BookService {

    private final BookRepository bookRepository;

    public BookService(final BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    @Transactional
    public void purchase(final Long bookId, final long quantity) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(IllegalArgumentException::new);
        book.purchase(quantity);
    }
}
```

위와 같은 예제 코드에서 중요한 비즈니스 로직은 무엇일까요?

- 도서 구매에 성공하면 재고가 1 감소해야 한다.
- 도서 구매 시 재고가 부족하면 예외를 반환한다.

간단하게 이 두 가지 요구사항을 확인할 수 있습니다. 그리고 이 요구사항에 동시성과 관련된 요구사항을 하나 추가한다면,

- 동시에 여러 명이 도서 구매 요청을 하더라도 재고의 정합성은 유지되어야 한다.

를 추가할 수 있습니다. 이는 N명이 동시에 어떤 도서를 한 권씩 구매한다고 했을 때, 해당 도서의 재고가 N개 줄어들어야 한다는 의미와 일맥상통합니다. 해당 요구사항을 만족시킬 수 있는지 테스트 코드를 통해 알아보도록 하겠습니다.

```java
@Test
void 동시에_100명이_책을_구매한다() throws InterruptedException {
    Long bookId = bookRepository.save(new Book("이펙티브 자바", 36_000, new Stock(100)))
            .getId();
    ExecutorService executorService = Executors.newFixedThreadPool(100);
    CountDownLatch countDownLatch = new CountDownLatch(100);

    for (int i = 0; i < 100; i++) {
        executorService.submit(() -> {
            try {
                bookService.purchase(bookId, 1);
            } finally {
                countDownLatch.countDown();
            }
        });
    }

    countDownLatch.await();
    Book actual = bookRepository.findById(bookId)
            .orElseThrow();

    assertThat(actual.getStock().getRemain()).isZero();
}
```

만약 동시성 문제가 잘 해결된다면, 100개의 도서에 대한 100명의 구매 요청이므로 재고는 0이 되어야 할 것입니다. 하지만 테스트 코드를 실행해보면

![](https://velog.velcdn.com/images/ohzzi/post/c035e692-0e96-4a65-b007-2df28f458524/image.png)

재고는 14개밖에 줄어들지 않았습니다. 즉, 총 86개에 대한 갱신 유실이 발생한 것입니다. 이는 한 트랜잭션이 커밋되기 전에 다른 트랜잭션이 변경하려는 값을 읽어버려서 생기는 문제입니다. 이제 Redis를 사용해 해당 문제를 해결해보도록 하겠습니다.

## Lettuce? Redisson?

그 전에 한 가지 고려해야 할 것이 있습니다. 자바에서 Redis를 쓸 수 있게 해주는 클라이언트에 대한 선택입니다. Redis 클라이언트로는 Lettuce와 Redisson이 있는데요, Spring Data Redis를 사용하면 기본적으로 지원하는 클라이언트는 Lettuce입니다. 때문에 좀 더 사용하기 편하다는 장점이 있습니다.

하지만 Lettuce로 분산 락을 구현하려면 반드시 스핀 락의 형태로 구현해야 한다는 단점이 있습니다. 스핀 락은 락을 획득하기 위해 `SETNX`라는 명령어로 계속해서 Redis에 락 획득 요청을 보내야 하는 구조입니다. 때문에 필연적으로 Redis에 많은 부하를 가하게 됩니다. 이를 방지하기 위해 락 획득 요청 사이 사이마다 `Thread.sleep`을 통해 부하를 줄여줘야 하고, 설령 sleep을 통해 줄여준다 하더라도 많은 부하가 가는 문제가 있습니다.

> 여기서 잠깐, SETNX란?
>
> **SET** if **N**ot e**X**ist의 줄임말로, 특정 key 값이 존재하지 않을 경우에 set 하라는 명령어 입니다. 특정 키에 대해 SETNX 명령어를 사용하여 value가 없을 때만 값을 세팅하는, 즉 락을 획득하는 효과를 낼 수 있습니다.

또한 스핀 락으로 구현하게 될 경우 락의 타임아웃을 처리하기 힘들어집니다. 스핀 락을 사용하는 Lettuce 코드의 경우, 자체적인 타임아웃 구현이 존재하지 않습니다. 때문에 락을 영원히 반환하지 않는다든가, 락을 획득하지 못해 무한 루프를 돈다든가 하는 문제를 해소하려면 애플리케이션 코드 상에서 타임아웃을 직접 구현해야 합니다.

반면 Redisson을 이용하면 부하와 타임아웃에 대한 문제를 해결할 수 있습니다. 먼저 Redis에 가해지는 부하의 측면에서 살펴보면, Redisson은 Lettuce처럼 주기적으로 락 획득 요청을 보낼 필요가 없습니다. Redis는 메시지 브로커의 역할을 할 수 있다고 말씀드렸는데요, 메시지에 대한 publish와 subscribe 기능을 지원합니다. Redisson은 이 기능을 통해 락을 획득 및 해제 하는 로직을 구현하고 있습니다.

조금 더 쉽게 설명하기 위해, 동시에 5개의 스레드가 락 획득을 위해 경합한다고 하겠습니다. 스레드 1번이 락을 획득하고 로직을 처리합니다. 그리고 대기하고 있는 스레드 2~5는 락 획득을 위해 특정 채널을 subscribe하고 있습니다. 로직의 처리가 완료되면 락을 해제합니다. 락이 해제되면 락이 해제되었다는 메시지를 대기 스레드들이 subscribe하고 있는 채널에 publish합니다. 이어서 대기 스레드 중 하나가 다시 락을 획득하고, 이 과정을 반복합니다.

또한 Redisson에서 제공하는 락 관련 기능은 락의 타임아웃도 구현해놨다는 장점이 있습니다. 무려 락을 획득했을 때의 타임아웃과, 락 대기 타임아웃 모두를요. 때문에 타임아웃 기능을 간편하게 사용할 수 있다는 장점도 있습니다.

다만 [Redisson은 Lettuce에 비해 사용이 어렵다는 후기](http://redisgate.kr/redis/clients/redisson_intro.php)도 존재합니다. 하지만 분산 락을 구현하기에 Redisson이 최적의 라이브러리라고 생각하여 Redisson을 사용하도록 하겠습니다.

## Redisson을 사용하여 분산 락 구현

우선 Redisson에 대한 의존성을 설정해주어야 합니다. 일반적으로 Redis를 사용할 때 많이 사용하는 Spring Data Redis는 기본 클라이언트로 Lettuce를 사용하기 때문에, Redisson은 추가적인 의존성을 추가해주어야 합니다.

```groovy
implementation 'org.redisson:redisson-spring-boot-starter:3.18.0'
```

redisson-spring-boot-starter는 Spring Data Redis의 기능들을 포함하고 있기 때문에, 굳이 spring-boot-starter-data-redis를 implementation 할 필요가 없습니다.

Redisson에는 RLock이라는 객체가 존재합니다. 이 객체를 통해 락을 컨트롤할 수 있습니다.

```java
public interface RLock extends Lock, RLockAsync {

    String getName();
    
    void lockInterruptibly(long leaseTime, TimeUnit unit) throws InterruptedException;
    
    boolean tryLock(long waitTime, long leaseTime, TimeUnit unit) throws InterruptedException;
    
    void lock(long leaseTime, TimeUnit unit);
    
    boolean forceUnlock();
    
    boolean isLocked();
    
    boolean isHeldByThread(long threadId);
    
    boolean isHeldByCurrentThread();
    
    int getHoldCount();
    
    long remainTimeToLive();
}
```

RLock을 얻기 위해서는 RedissonClient.getLock 메서드를 호출해주어야 합니다. (참고로, RedissonClient는 getSpinLock을 통해 앞서 Lettuce에서 언급했던 스핀 락을 얻을 수도 있습니다.)

```java
public interface RedissonClient {
    ...
    RLock getLock(String name);
}
```

그러면 Redisson을 통해 분산 락을 획득해보도록 하겠습니다.

```java
@Transactional
public void purchase(final Long bookId, final long quantity) {
    RLock lock = redissonClient.getLock(String.format("purchase:book:%d", bookId));
    try {
        boolean available = lock.tryLock(10, 1, TimeUnit.SECONDS);
        if (!available) {
            System.out.println("redisson getLock timeout");
            return;
        }
        Book book = bookRepository.findById(bookId)
                .orElseThrow(IllegalArgumentException::new);
        book.purchase(quantity);
    } catch (InterruptedException e) {
        throw new RuntimeException(e);
    } finally {
        lock.unlock();
    }
}
```

RedissonClient로부터 락 객체를 얻어온 뒤, try ~ catch 안에서 tryLock을 호출해주도록 하겠습니다. 락을 무사히 획득했다면, 기존에 작성되어있던 서비스 로직 코드가 호출됩니다. 그리고 finally 구문을 통해 락을 해제합니다. 락을 구현했으니 이제 테스트 코드도 잘 돌아가겠죠?

![](https://velog.velcdn.com/images/ohzzi/post/9758b39a-2f86-4fbe-8678-97f33202670a/image.png)

이전 코드에 비해 재고 감소량이 늘어났다는 점은 있지만, 이번에도 테스트 통과에 실패합니다. 왜 실패할까요? 답은 분산락 해제 시점과 트랜잭션 커밋 시점의 불일치 때문입니다. 코드를 보면 purchase 메서드에 `@Transactional` 어노테이션이 붙어 있습니다. 때문에 스프링 AOP를 통해 purchase 메서드 바깥으로 트랜잭션을 처리하는 프록시가 동작하게 됩니다. 반면 락 획득과 해제는 purchase 메서드 내부에서 일어납니다. 때문에 스레드 1과 스레드 2가 경합한다면 스레드 1의 락이 해제되고 트랜잭션 커밋이 되는 사이에 스레드 2가 락을 획득하게 되는 상황이 발생합니다. 데이터베이스 상으로 락이 존재하지 않기 때문에 스레드 2는 데이터를 읽어오게 되고, 스레드 1의 변경 내용은 유실됩니다. 때문에 락 범위가 트랜잭션 범위보다 크도록 Facade를 만들어주도록 하겠습니다.

```java
@Service
public class BookLockFacade {

    private final BookService bookService;
    private final RedissonClient redissonClient;

    public BookLockFacade(final BookService bookService, final RedissonClient redissonClient) {
        this.bookService = bookService;
        this.redissonClient = redissonClient;
    }

    public void purchase(final Long bookId, final int quantity) {
        RLock lock = redissonClient.getLock(String.format("purchase:book:%d", bookId));
        try {
            boolean available = lock.tryLock(10, 1, TimeUnit.SECONDS);
            if (!available) {
                System.out.println("redisson getLock timeout");
                throw new IllegalArgumentException();
            }
            bookService.purchase(bookId, quantity);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        } finally {
            lock.unlock();
        }
    }
}
```

서비스 코드에서는 Redisson을 사용한 코드를 제거해주도록 하겠습니다.

```java
@Service
public class BookService {

    private final BookRepository bookRepository;

    public BookService(final BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    @Transactional
    public void purchase(final Long bookId, final long quantity) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(IllegalArgumentException::new);
        book.purchase(quantity);
    }
}
```

테스트 코드는 BookService를 테스트하는 코드에서 BookLockFacade를 테스트하는 코드로 변경해주면 됩니다.

```java
@Test
void 동시에_100명이_책을_구매한다() throws InterruptedException {
    Long bookId = bookRepository.save(new Book("이펙티브 자바", 36_000, new Stock(100)))
            .getId();
    ExecutorService executorService = Executors.newFixedThreadPool(100);
    CountDownLatch countDownLatch = new CountDownLatch(100);

    for (int i = 0; i < 100; i++) {
        executorService.submit(() -> {
            try {
                bookLockFacade.purchase(bookId, 1);
            } finally {
                countDownLatch.countDown();
            }
        });
    }

    countDownLatch.await();
    Book actual = bookRepository.findById(bookId)
            .orElseThrow();

    assertThat(actual.getStock().getRemain()).isZero();
}
```

이제 테스트를 다시 실행해보도록 하겠습니다.

![](https://velog.velcdn.com/images/ohzzi/post/542e2cae-b438-4a75-80e3-1331f04c3d62/image.png)

테스트가 정상적으로 통과하는 것을 볼 수 있습니다.

## 개선 방향을 생각해보기

정상적으로 동작하는 코드를 만들었지만, 좀 더 개선할 부분을 생각해볼 수 있습니다. 우선 분산 락을 적용할 곳이 많을 경우입니다. 이런 경우, 위에 만들었던 퍼사드 코드가 계속해서 생길 수 밖에 없습니다. 중복 로직을 개선하기 위해서 AOP의 적용을 생각해볼 수 있습니다.

사실 중복 코드보다 더 문제가 될만한 부분도 존재합니다. 만약 해당 도서가 엄청 인기 있는 한정판 도서여서 오픈런이 열린다면 어떻게 될까요? 정말 엄청나게 많은 사람들이 동시에 요청을 한다고 가정해보도록 하겠습니다. 백만 명이 요청을 한다면, 백만개의 트랜잭션이 락 획득을 위한 대기를 해야 합니다. 또한 재고가 충분하고, 모든 트랜잭션이 락 획득에 성공하여 로직 수행에 성공한다면 데이터베이스에 단 건 업데이트 쿼리가 백만개가 들어가야 합니다. 이는 데이터베이스에 큰 부하입니다. 락 타임아웃을 적용한다고 하면 요청 다수가 실패하는 문제도 발생합니다. 이렇게 엄청난 트래픽이 몰리는 상황같은 특수한 케이스는 어떻게 해결해야 할까요? 이런 부분을 해결하기 위해 애초에 재고와 같은 수치를 Redis로 관리하는 방법을 생각할 수 있습니다.