---
title: "Kotlin에서 operator fun invoke로 객체를 함수처럼 사용하기"
date: 2023-01-24
update: 2024-02-12
tags:
  - Kotlin
---

일하게 된 회사의 기술 스택이 코틀린이라 열심히 코틀린 공부를 하고 있습니다. 코틀린에는 자바만 하던 제가 정말 신기하게 느끼는 많은 기능들이 있습니다. 그 중에서도 연산자 오버로딩이라는 녀석이 있는데요, 아마 많은 분들이 아시는 기능일 겁니다. 만약 Money라는 클래스를 만들고 Money와 Money의 덧셈을 해야 한다면 자바에서는 어떻게 해야 할까요?

```java
public class Money {
    private final int value;
    
    public Money(int value) {
        this.value = value;
    }
    
    public Money sum(Money money) {
        return new Money(value + money.value);
    }
}
```

이렇게 클래스를 만들고,

```java
Money money1 = new Money(1_000);
Money money2 = new Money(500);

Money sum = money1.sum(money2);
```

이렇게 Money 클래스의 인스턴스의 메서드를 직접 호출해 사용해야 합니다. 그런데 어차피 덧셈인데 `money1 + money2`와 같이 사용할 수 있다면 좋지 않을까요?

코틀린에서는 가능합니다.

## 코틀린의 연산자 오버로딩

```kotlin
data class Money(
    val value: Int
) {
    operator fun plus(money: Money): Money = Money(value + money.value)
}
```

이렇게 plus라는 연산자를 오버로딩한 Money 클래스는 다음과 같이 쓸 수 있습니다. 함수 이름이 반드시 plus여야 합니다.

```kotlin
val money1 = Money(1_000)
val money2 = Money(500)
val sum = money1 + money2
```

만약 여러 값을 더해야 한다면 자바라면 계속 메서드 체이닝이 걸릴텐데, `+`만 쓰면 되는 코틀린의 방식이 훨씬 간결하고 깔끔합니다. 코틀린 연산자 오버로딩에는 plus 외에도 minus(`-`), times(`*`)... 와 같이 오버로딩 할 수 있는 많은 연산자들이 있습니다.

그런데 저는 대부분 산술 연산자들 쪽에만 관심을 가졌었는데요, 코드를 작성하던 중 사수분께 코드를 더 간략하고 알아보기 쉽게 할 수 있는 `invoke`에 대한 리뷰를 받게 되었습니다.

일반적으로 특정 함수나 기능을 실행시키는 용도로 invoke라는 이름을 많이 씁니다. 대표적인 예로 JDK Dynamic Proxy를 만들 때 오버라이딩 해야 하는 invoke 메서드 등이 있습니다. 굳이 동적 프록시 api까지 가지 않아도 스프링을 사용할 때 찍히는 많은 로그들에 invoke 메서드들에 대한 정보가 나와 있습니다.

코틀린에서는 아예 invoke라는 키워드 자체가 연산자이기 때문에 매우 색다르게 활용할 수 있습니다. 코틀린 공식 문서에는 invoke에 대해 다음과 같이 나와 있습니다.

> A value of a function type can be invoked by using its invoke(...) operator: f.invoke(x) or just f(x).

예시를 하나 들어보도록 하겠습니다.

```kotlin
object DoSomething {
    operator fun invoke() {
        println("do something")
    }
}
```

DoSomething이라는 object를 하나 만들어주도록 하겠습니다. object로 만들었기 때문에 자바의 static 처럼 인스턴스 생성 없이 함수를 호출할 수 있습니다. 다음과 같이 말이죠.

```kotlin
DoSomething.invoke() // "do something" 출력
```

하지만 앞서 말씀드렸듯이 코틀린의 invoke는 연산자입니다. 때문에 함수 호출 없이 사용할 수 있습니다. 함수 호출 없이 어떤 방식으로 사용하는 걸까요? invoke를 오버로딩 하게 되면 객체를 함수처럼 사용할 수 있습니다. 즉, 함수를 이름없이 사용할 수 있습니다.

```kotlin
DoSomething() // "do something" 출력
```

wow, 코드가 한 층 더 간결해졌습니다.

## 실전에서의 활용

실전에서 이 기능을 어떻게 활용할 수 있었을까요? 바로 함수형 인터페이스를 활용할 때 사용했습니다. 만약 연산자 오버로딩을 사용하지 않는다면 다음과 같이 사용해야 합니다.

(매우 비효율적이고 필요 없는 코드지만 이해를 위해 간단히 구성한 예시임을 이해 부탁드립니다.)

```kotlin
fun interface StringFormatter {
    fun format(string: String): String
}

class ToUpperCaseFormatter : StringFormatter {
    override fun format(string: String): String = string.toUpperCase()
}


val toUpperCaseFormatter = ToUpperCaseFormatter()
val result = toUpperCaseFormatter.format("abc") // "ABC"
```

변수명이나 함수명이 길어짐에 따라 위 코드는 점점 보기 어려운 코드가 되어갈 것입니다. invoke를 활용하면 훨씬 간결하면서 함수형 인터페이스의 이름을 객체처럼이 아니라 함수처럼 만들기에도 편합니다.

```kotlin
fun interface FormatString {
    operator fun invoke(string: String): String
}

class toUpperCase : FormatString {
    override fun invoke(string: String): String = string.toUpperCase()
}


val toUpperCase = ToUpperCase()
val result = toUpperCase("abc") // "ABC"
```

이런식으로 사용하면 `.xxx()`와 같이 호출할 필요가 없어 코드의 길이도 줄어들고, 함수형 인터페이스의 구현체인 toUpperCase를 객체.함수()로 호출하는 것이 아닌 toUpperCase 자체를 함수처럼 호출할 수 있어 네이밍이나 가독성 면에서도 장점을 가져갈 수 있습니다.

실제로 저는 실무 코드에서 변수명도 길고, 호출하는 메서드에 클래스 이름과 동일한 의미가 들어가 중복되는 의미로 네이밍이 길어지는 경우에 대해 함수형 인터페이스 + invoke 오버로딩의 조합으로 코드 길이를 줄이고 의미도 훨씬 더 잘 파악하게 할 수 있었습니다. (알려주신 메이트님 감사합니다.)

> 참고 자료  
> [코틀린 공식 문서](https://kotlinlang.org/docs/lambdas.html#inline-functions)  