---
title: "전략 패턴, 코틀린과 스프링으로 효율적으로 써보자"
date: 2024-03-01
update: 2024-03-01
tags:
  - Spring
  - 디자인패턴
---

먼저 이 글은 Kotlin + Spring 기준으로 작성된 글임을 알립니다.

코드를 작성하다 보면 여러 분기에 따라서 다른 로직을 적용해야 하는 경우를 심심찮게 볼 수 있습니다. 간단한 예시를 만들어보겠습니다. 쇼핑몰 등 결제가 필요한 서비스에서 신용카드, 휴대폰결제, 간편결제, 무통장입금 이렇게 네 가지 결제 방식을 지원한다고 해보겠습니다. 그리고 최대한 코드를 간소화해서 다음과 같은 서비스를 만들어보겠습니다. 실제 결제 등의 동작은 1도 없고, 분기처리하는 것에만 집중해주세요.

```kotlin
enum class PaymentType {
    CARD,
    PHONE,
    EASY_PAY,
    ;
}

data class PaymentRequest(
    val paymentType: PaymentType,
    val amount: Long,
)

@Service
class PaymentService {
    fun payment(
        paymentRequest: PaymentRequest,
    ) {
        when (paymentRequest.paymentType) {
            PaymentType.CARD -> {
                println("카드로 ${paymentRequest.amount}원 결제")
            }

            PaymentType.PHONE -> {
                println("휴대폰으로 ${paymentRequest.amount}원 결제")
            }

            PaymentType.EASY_PAY -> {
                println("간편결제 서비스로 ${paymentRequest.amount}원 결제")
            }
        }
    }
}
```

paymentRequest의 paymentType 이라는 enum 값을 기준으로 분기를 태웁니다. 그리고 각 분기 안에 코드를 작성합니다. 이렇게 구성하면 어떤 단점이 있을까요? 
- 여러 타입의 모든 로직이 한 곳에 모여 있고, 결제 정책 내부의 로직이 복잡해지면 코드가 크고 방대해저 분석 및 유지보수 하기가 어렵습니다.
- 결제 정책이 추가되면 분기가 또 하나 늘어나게 됩니다.

이런 경우 우리는 전략 패턴을 도입해볼 수 있습니다.

## 전략 패턴의 도입

> **전략 패턴(Strategy Pattern)**  
>  
> 전략 패턴 또는 정책 패턴은 실행 중에 알고리즘을 선택할 수 있게 하는 행위 소프트웨어 디자인 패턴이다. 전략 패턴은 특정한 계열의 알고리즘들을 정의하고 각 알고리즘을 캡슐화하며 이 알고리즘들을 해당 계열 안에서 상호 교체가 가능하게 만든다.  
>  
> [출처 위키백과]

### 구체적인 로직에 대한 책임 이관

우선 전략을 정의해줄 인터페이스를 하나 만들어주겠습니다.

```kotlin
interface PaymentStrategy {
    fun pay(amount: Long)
}
```

그리고 이 인터페이스의 구현체들을 만들어줍니다.

```kotlin
class CardPaymentStrategy : PaymentStrategy {
    override fun pay(amount: Long) {
        println("신용카드로 ${amount}원 결제")
    }
}

class PhonePaymentStrategy : PaymentStrategy {
    override fun pay(amount: Long) {
        println("휴대폰으로 ${amount}원 결제")
    }
}

class EasyPayPaymentStrategy : PaymentStrategy {
    override fun pay(amount: Long) {
        println("간편결제 서비스로 ${amount}원 결제")
    }
}
```

이제 기존 PaymentService에서 이 전략들을 사용해야겠죠? 그냥 단순히 생각한다면 객체를 각 분기마다 생성해서 처리해줄 수 있습니다.

```kotlin
@Service
class PaymentService {
    fun payment(
        paymentRequest: PaymentRequest,
    ) {
        when (paymentRequest.paymentType) {
            PaymentType.CARD -> {
                CardPaymentStrategy().pay(paymentRequest.amount)
            }

            PaymentType.PHONE -> {
                PhonePaymentStrategy().pay(paymentRequest.amount)
            }

            PaymentType.EASY_PAY -> {
                EasyPayPaymentStrategy().pay(paymentRequest.amount)
            }
        }
    }
}
```

이렇게 하면 기존에 짚어봤던 문제점 중 결제 정책 내부의 로직이 복잡해지면 코드가 크고 방대해저 분석 및 유지보수 하기가 어렵다는 부분을 해결할 수 있습니다. 결제 정책 내부 로직은 각각의 Strategy 클래스에 들어가 있으니까요. 

### 스프링 DI를 활용하여 불필요한 객체 생성 방지

하지만 이런 방식은 매 번 전략 클래스를 생성해야 한다는 문제가 있습니다. 때문에 클래스를 미리 만들어놓고 런타임에 결정할 수 있도록 해주어야 합니다. 여기서 스프링 빈과 DI를 사용할 수 있습니다. 만들어놓은 전략 구현체들을 모두 스프링 빈으로 만들어줍니다.

```kotlin
@Service
class CardPaymentStrategy : PaymentStrategy {
    override fun pay(amount: Long) {
        println("신용카드로 ${amount}원 결제")
    }
}

@Service
class PhonePaymentStrategy : PaymentStrategy {
    override fun pay(amount: Long) {
        println("휴대폰으로 ${amount}원 결제")
    }
}

@Service
class EasyPayPaymentStrategy : PaymentStrategy {
    override fun pay(amount: Long) {
        println("간편결제 서비스로 ${amount}원 결제")
    }
}
```

이제 PaymentService에서는 이 빈들을 DI 기능을 활용해 주입받을 수 있습니다.

```kotlin
@Service
class PaymentService(
    private val cardPaymentStrategy: CardPaymentStrategy,
    private val phonePaymentStrategy: PhonePaymentStrategy,
    private val easyPayPaymentStrategy: EasyPayPaymentStrategy,
) {
    fun payment(
        paymentRequest: PaymentRequest,
    ) {
        when (paymentRequest.paymentType) {
            PaymentType.CARD -> {
                cardPaymentStrategy.pay(paymentRequest.amount)
            }

            PaymentType.PHONE -> {
                phonePaymentStrategy.pay(paymentRequest.amount)
            }

            PaymentType.EASY_PAY -> {
                easyPayPaymentStrategy.pay(paymentRequest.amount)
            }
        }
    }
}
```

### 스프링 DI 기능을 활용하여 다형성 활용하기

그러나 아직 문제는 남아있습니다. when을 비롯한 분기문은 그대로 남아있습니다. 결제 방식이 추가된다면 when 아래 분기문이 더 늘어나게 되겠죠? 또한 DI를 인터페이스가 아닌 구체 타입으로 받고 있습니다. 이렇게 되면 테스트 시 가짜 객체를 사용하기도 어렵고, 무엇보다 결제 방식이 추가된다면 메서드 파라미터의 개수가 계속해서 늘어나게 됩니다.

다행히도, 스프링에서는 인터페이스의 list 또는 map을 통해서 구현체들을 모두 주입받을 수 있는 기능을 제공하고 있습니다. 우선 list로 주입받아보도록 하겠습니다. list로 주입받기 때문에 각 전략에는 전략을 선택하는데 참고할 수 있는 보조 로직이 들어있어야 합니다.

```kotlin
interface PaymentStrategy {
    fun canPay(paymentType: PaymentType): Boolean
    fun pay(amount: Long)
}

@Service
class CardPaymentStrategy : PaymentStrategy {
    override fun canPay(paymentType: PaymentType): Boolean {
        return paymentType == PaymentType.CARD
    }

    override fun pay(amount: Long) {
        println("신용카드로 ${amount}원 결제")
    }
}

@Service
class PhonePaymentStrategy : PaymentStrategy {
    override fun canPay(paymentType: PaymentType): Boolean {
        return paymentType == PaymentType.PHONE
    }
    
    override fun pay(amount: Long) {
        println("휴대폰으로 ${amount}원 결제")
    }
}

@Service
class EasyPayPaymentStrategy : PaymentStrategy {
    override fun canPay(paymentType: PaymentType): Boolean {
        return paymentType == PaymentType.EASY_PAY
    }
    
    override fun pay(amount: Long) {
        println("간편결제 서비스로 ${amount}원 결제")
    }
}
```

PaymentType을 받아서 해당 타입에 대해 처리를 할 수 있는 canPay 메서드를 만들어줬습니다. 그리고 사용하는 쪽에서는 list로 빈들을 주입받은 뒤, 순회하면서 canPay가 true를 반환하는 전략을 찾아주면 됩니다.

```kotlin
@Service
class PaymentService(
    private val paymentStrategies: List<PaymentStrategy>,
) {
    fun payment(
        paymentRequest: PaymentRequest,
    ) {
        // 모든 PaymentType에 대해 구현체가 빈으로 만들어져 있지 않을 수 있으므로,
        // 실제로는 first를 사용하지 않고 firstOrNull + null 예외처리 등을 사용해야 한다.
        paymentStrategies.first { it.canPay(paymentRequest.paymentType) }
            .pay(paymentRequest.amount)
    }
}
```

이렇게 하면 PaymentStrategy의 다형성을 활용할 수 있고, 새로 PaymentType이 추가되더라도 PaymentService 쪽은 수정할 필요가 없고 새로운 구현체만 만들어주면 됩니다. 코드를 유지보수하기 매우 쉬워지는 것이죠.

다만 이렇게 하더라도 아쉬운 점은 남습니다. list 순회는 시간복잡도가 O(N)으로, 절대 효율적인 방식은 아닙니다. `N 모수 자체가 작기 때문에 큰 성능 차이는 없는 것 아니야?` 라고 말할 수도 있습니다. 하지만 작은 차이라도 반복이 되면 합쳐저서 큰 차이가 될 수도 있는 것이기 때문에 미리 효율적인 코드를 짜는 것이 더 좋다고 생각합니다. 트래픽이 많아질수록 이 차이는 점점 벌어지겠죠. 또한 map의 O(1)이라는 매우 효율적인 방식을 두고 굳이 O(N)을 택할 필요는 없는 것도 맞습니다.

그래서 이번에는 list가 아니라 map을 주입받아보도록 하겠습니다. 스프링은 빈들을 map으로 주입 받을 때 빈 이름을 key로, 빈 객체를 value로 주입받습니다. 때문에 list 주입을 받을 때와는 조금 다른 방식으로 전략을 선택해야 합니다.

가장 간단한 방법은 선택자가 되는 PaymentType이 선택할 빈 이름을 프로퍼티로 가지고 있는 것입니다.

```kotlin

enum class PaymentType(
    val strategyName: String,
) {
    CARD("cardPaymentStrategy"),
    PHONE("phonePaymentStrategy"),
    EASY_PAY("easyPayPaymentStrategy"),
    ;
}

@Service
class PaymentService(
    private val paymentStrategies: Map<String, PaymentStrategy>,
) {
    fun payment(
        paymentRequest: PaymentRequest,
    ) {
        paymentStrategies[paymentRequest.paymentType.strategyName]
            ?.pay(paymentRequest.amount)
    }
}
```

기본적으로 빈 이름은 구체클래스의 이름으로 지정됩니다. (맨 앞 글자는 소문자로 치환됩니다.) 따라서 해당 구체클래스의 이름을 PaymentType에 프로퍼티로 넣어주고, 사용하는 쪽에서는 그 값을 꺼내어서 주입받은 map에 넣어주면 전략을 런타임에 꺼낼 수 있습니다. 이렇게 하면 기존 list를 사용할 때의 장점은 모두 유지하면서, 전략을 고르는 시간 복잡도를 O(1)으로 개선할 수 있습니다.

### 좀 더 개선해보기

하지만 여전히 아쉬운 점은 있습니다. 만약 CardPaymentStrategy의 클래스 이름이 CreditCardPaymentStrategy로 변경된다면 어떻게 될까요? PaymentType.CARD의 strategyName을 `"creditCardPaymentStrategy"`로 변경해주어야 런타임에 예상치 못한 버그가 발생하지 않습니다. 만약 변경을 빠뜨리게 된다면 카드 타입에 대한 전략 선택에 버그가 생기게 되겠죠. 물론 `@Bean` 어노테이션에 빈의 이름일 직접 명시하여 클래스 이름이 바뀌더라도 빈의 이름이 변경되지 않도록 해줄 수는 있겠습니다만, 역으로 PaymentType 쪽이 변경될 수도 있는 문제는 해결하지 못할 뿐더러 클래스 이름과 strategyName간의 괴리를 가져올 수 있는 방법입니다.

저는 그래서 항상 가능한 구체적인 타입을 통해 구분을 지으려고 합니다. IDE 기능의 도움을 받기도 좋으니까요. 이런 상황에서는 enum을 기준으로 전략을 선택하는 것이 매우 합리적입니다. 그런데 위에서 봤다싶이 enum에 strategyName 프로퍼티를 넣지 않고 enum 자체를 사용해서 전략을 선택하려면 list를 사용해야 해서 비효율적일 수 있습니다.

그래서 제가 제시하는 방법은 이렇습니다. 주입은 list로 받되, 별도의 map을 생성하는 것입니다. 그렇게 하면 최초 1회만 list 순회를 하면 되고, 이후로는 조회에 list 대신 map을 사용할 수 있게 됩니다. 자바에서도 이런 방법이 가능한데, 코틀린은 여러 기능을 통해 좀 더 손쉽게 strategy map을 만들 수 있습니다. 코드로 보시죠.

```kotlin
interface PaymentStrategy {
    val paymentType: PaymentType
    
    fun pay(amount: Long)
}

@Service
class CardPaymentStrategy : PaymentStrategy {
    override val paymentType: PaymentType
        get() = PaymentType.CARD

    override fun pay(amount: Long) {
        println("신용카드로 ${amount}원 결제")
    }
}

@Service
class PhonePaymentStrategy : PaymentStrategy {
    override val paymentType: PaymentType
        get() = PaymentType.PHONE

    override fun pay(amount: Long) {
        println("휴대폰으로 ${amount}원 결제")
    }
}

@Service
class EasyPayPaymentStrategy : PaymentStrategy {
    override val paymentType: PaymentType
        get() = PaymentType.EASY_PAY

    override fun pay(amount: Long) {
        println("간편결제 서비스로 ${amount}원 결제")
    }
}
```

코틀린은 인터페이스 추상 프로퍼티를 선언해줄 수 있습니다. 인터페이스에 프로퍼티를 선언하고 구현체에서 오버라이딩하여 커스텀 게터를 구현하거나 주 생성자에 선언하여 주입해주는 방식이죠. 이 방식으로 우리는 각각의 PaymentStrategy 구현체가 paymentType이라는 프로퍼티를 가지도록 강제해주고, PaymentStrategy 인터페이스 타입으로 사용할 때도 해당 프로퍼티를 사용할 수 있게 됩니다. 자바를 사용하는 경우라면 추상 프로퍼티 선언은 못하겠지만 getter를 인터페이스에 선언하는 방식으로 비슷한 효과를 낼 수 있습니다.

```kotlin
@Service
class PaymentService(
    paymentStrategies: List<PaymentStrategy>
) {
    private val paymentStrategyMap = paymentStrategies.associateBy { it.paymentType }

    fun payment(
        paymentRequest: PaymentRequest,
    ) {
        paymentStrategyMap[paymentRequest.paymentType]
            ?.pay(paymentRequest.amount)
    }
}
```

서비스 코드가 조금 변경됩니다. 우선 `paymentStrategies: List<PaymentStrategy>`를 프로퍼티로 선언할 필요가 없습니다. 실제 객체 생성 이후로 프로퍼티로 사용할 것은 list가 아니라 map이고, list는 map을 구성하는데 일회성으로 필요한 데이터이기 때문에 val을 붙이지 않고 주 생성자의 메서드 파라미터로만 사용하면 됩니다.

그리고 paymentStrategyMap이라는 map 프로퍼티를 선언해주는데요, 코틀린은 컬렉션의 확장함수로 associateBy라는 함수를 제공합니다. associateBy는 람다식에 T를 전달하고, 람다식으로부터 K를 반환받아 K가 key, T가 value가 되는 map을 구성하게 됩니다. associateBy를 통해 우리는 간편하게 list를 map으로 바꿀 수 있었습니다. `List<PaymentStrategy>` 순회는 PaymentService 객체를 생성하는 이 한 번이 유일합니다. 이후로는 paymentStrategyMap에 key로 PaymentType enum을 넣어 전략을 선택할 수 있게 됩니다.

만약 그런데 PaymentService 이외에도 PaymentStrategy를 사용할 곳이 있다면 어떡할까요? 아래처럼 Selector를 만들어서 빈으로 등록하는 방법을 생각할 수 있겠죠? 특히나 Kotlin의 연산자 오버로딩을 이럴 때 유용하게 활용해볼 수 있습니다.

```kotlin
@Service
class PaymentStrategySelector(
    paymentStrategies: List<PaymentStrategy>
) {
    private val paymentStrategyMap = paymentStrategies.associateBy { it.paymentType }

    operator fun get(paymentType: PaymentType): PaymentStrategy {
        return paymentStrategyMap[paymentType] ?: throw IllegalArgumentException("...")
    }
}

@Service
class PaymentService(
    private val paymentStrategySelector: PaymentStrategySelector,
) {
    fun payment(
        paymentRequest: PaymentRequest,
    ) {
        paymentStrategySelector[paymentRequest.paymentType]
            .pay(paymentRequest.amount)
    }
}
```