---
title: "[Spring DI/IoC] IoC? DI? 그게 뭔데?"
description: 스프링 공부하다 보면 맨날 나오는 이야기 IoC, 그리고 DI. 그래서 그게 대체 뭔데요?
date: 2022-04-30
update: 2024-02-10
series: Spring DI/IoC
tags:
  - Spring
---

스프링을 공부하다 보면 꼭 나오는 이야기가 있다.

> _스프링은 IoC 컨테이너로 빈을 관리한다._
> _스프링은 DI를 사용한다._
> _DI 방법에는 생성자 주입, setter 주입, 필드 주입 등이 있다._
> _..._

아니 근데 대체 IoC는 뭐고 DI는 뭔데? 스프링을 공부하다 보면 IoC, DI 같은 개념이 계속해서 나오게 되고, 결국 이를 이해하지 않고서는 스프링을 이해할 수 없다. 결국 이 개념들을 한번 정리하고 이해하고 넘어가는 시간이 필요하다.

## Inversion of Control

> _"Don't call us. We'll call you." - Hollywood Principle_

Inversion of Control. 우리 말로 번역하면 **_제어의 역전_** 정도로 번역할 수 있을 것 같다. 아니 제어도 무슨 소린지 알겠고 역전도 무슨 뜻인지 알겠는데, 대체 무슨 제어가 역전된다는 것일까? 흔히 IoC를 설명할 때 위에 설명했던 `할리우드 원칙`을 들어서 설명하곤 한다. "Don't call us. We'll call you." 이는 제어의 역전에 대한 비유적 표현으로, 본래 오디션에 떨어진 배우들에게 영화사에서 하던 말이 프로그래밍 용어로 변형되어 사용되고 있다고 한다. 말 그대로 배우들(객체)에게 영화사에서 필요하면 연락할테니 먼저 연락하지 말라는 뜻이 된다.

좀 더 자세히 이해해보기 위해 프레임워크를 적용하지 않은, 우리가 그동안 작성해왔던 일반적인 프로그램을 생각해보자. 객체의 생명주기(객체의 생성, 초기화, 소멸, 메서드 호출 등)를 클라이언트 구현 객체가 직접 관리한다. 또한 다른 사람이 작성한 외부 코드(라이브러리)를 호출하더라도 해당 코드의 호출 시점 역시 직접 관리한다. 하지만 이러한 생명주기를 직접 관리하지 않는 경우라면? 스프링과 같은 프레임워크를 사용할 때를 생각해보자. Controller, Service 같은 객체들의 동작을 우리가 직접 구현하기는 하지만, 해당 객체들이 어느 시점에 호출될 지는 신경쓰지 않는다. 단지 프레임워크가 요구하는대로 객체를 생성하면, 프레임워크가 해당 객체들을 가져다가 생성하고, 메서드를 호출하고, 소멸시킨다. 프로그램의 제어권이 역전된 것이다.

때문에 프레임워크와 라이브러리는 어떤 차이가 있는지에 대해 IoC를 통해 설명이 가능하다. 라이브러리를 사용하는 애플리케이션은 제어 흐름을 라이브러리에 내주지 않는다. 단지 필요한 시점에 라이브러리에 작성된 객체를 적재적소에 가져다 쓸 뿐이다. 하지만 프레임워크를 사용한 애플리케이션의 경우, 애플리케이션 코드에 작성한 객체들을 프레임워크가 필요한 시점에 가져다 프로그램을 구동하기 때문에 프로그램의 제어권이 프레임워크로 역전된다.

예를 들어, 우리가 테스트에 JUnit 프레임워크를 사용할 때를 생각해보자. 개발자는 각각의 테스트 메서드를 작성하지만, 해당 메서드들에 대한 제어권은 JUnit 프레임워크에 있다. 이 때 우리가 직접 해당 테스트 메서드를 호출하는 것이 아니라, `@Test` 어노테이션을 붙이기만 하면 JUnit 프레임워크가 해당 메서드를 호출한다. `@BeforeEach`나 `@AfterEach` 어노테이션이 붙은 메서드들에 대해서도 마찬가지다. 해당 메서드가 각 테스트의 이전과 이후에 호출된다는 호출 시점은 JUnit 프레임워크가 정의한 내용이다. 제어권이 JUnit 쪽으로 역전되었다.

또다른 예제를 보자. 템플릿 메서드 패턴(Template Method Pattern)이다. 템플릿 메서드 패턴이란 `알고리즘의 구조를 메서드에 정의하고, 하위 클래스에서 알고리즘 구조의 변경없이 알고리즘을 재정의 하는 패턴`이다.

템플릿 메서드 패턴을 적용하게 되면 상위의 추상 클래스에 흐름을 제어하는 메서드를 정의해두고, 해당 템플릿 메서드에서 사용할 하위 메서드들은 변경이 필요 없으면 공통 메서드로, 변경이 필요하면 추상 메서드로 정의해둔다. 그 뒤 해당 클래스를 상속받는 클래스에서 추상 메서드를 구현하여 사용하게 된다. 이렇게 될 경우 하위 클래스에서 메서드의 실제 구현을 하기는 하지만, 해당 메서드의 호출 제어권은 상위의 추상 클래스에 있게 되어 제어의 역전이 일어나는 것이다.

그렇다면 IoC라는 개념을 도입함으로써 무엇을 얻을 수 있을까?

- 프로그램의 진행 흐름과 구체적인 구현을 분리시킬 수 있다.
- 개발자는 비즈니스 로직에 집중할 수 있다.
- 구현체 사이의 변경이 용이하다.
- 객체 간 의존성이 낮아진다.

## Dependency Injection

흔히들 IoC와 DI(Dependency Injection: 의존성 주입)을 헷갈려하거나, 동일시하고는 한다. 하지만 사실 IoC와 DI는 다른 개념이다. **절대 IoC == DI가 아니다! (DI ⊂ IoC 라면 몰라도)** DI 없이도 IoC를 만족하는 프로그램을 만들 수 있다. IoC는 프로그램 제어권을 역전시키는 개념이고, DI는 해당 개념을 구현하기 위해 사용하는 디자인 패턴 중 하나로, 이름 그대로 객체의 의존관계를 외부에서 주입시키는 패턴을 말한다. 때문에 DI와 IoC는 같은 개념이 아니면, 시간이 지나면서 가장 간편하고 대중화된 방법이 DI이기 때문에 IoC를 만족시키는 방법으로 대부분 DI를 사용할 뿐이기에 우리가 DI와 IoC를 같은 내지 비슷한 개념이라고 착각할 뿐이다.

이쪽 분야의 권위자, [마틴 파울러의 글](https://martinfowler.com/articles/injection.html#InversionOfControl)에서 IoC와 DI가 다른 의미임을 알 수 있다.

> As a result I think we need a more specific name for this pattern. `Inversion of Control` is too generic a term, and thus people find it confusing. As a result with a lot of discussion with various IoC advocates we settled on the name `Dependency Injection`.
>
> 그 결과 이 패턴에 대해 좀 더 구체적인 이름이 필요하다고 생각한다. `Inversion of Control`은 너무 일반적인 용어이기 때문에 사람들은 그것을 혼동한다. 그 결과 다양한 IoC 옹호자들과 많은 논의를 거쳐 `Dependency Injection`이라는 이름을 정했다.

DI에 대해 살펴보기에 앞서, 우선 `의존성`이란 무엇인지부터 간단하게 짚고 넘어가자.

> _의존대상 B가 변하면, 그것이 A에 영향을 미친다._
>
> **\- 이일민, 토비의 스프링 3.1, 에이콘(2012), p113**

```java
public class A {
    private B b = new B();
}
```

위와 같은 A라는 클래스가 있다고 하자. 이 클래스는 B라는 클래스를 필드로 가진다. 그런데 만약 B에 final 필드가 추가되는 변경이 일어난다면 어떨까? `new B()` 부분에서 컴파일 에러가 나게 될 것이다. B 내부의 변경이 일어났는데, A에도 영향을 미치게 되는 것이다. 이런 경우를 `A가 B에 의존한다.` 라고 한다. 그렇다면 `의존성 주입`이란? 자연스럽게 이 의존성을 외부에서 주입해준다는 의미가 된다. 지금은 A 클래스 내부에서 B 객체를 생성하고 있기 때문에 A가 반드시 내부에서 생성한 B 인스턴스에 의존하는 것으로 의존관계가 고정된다. 하지만 다음의 코드라면 어떨까?

```java
public class A {
    private B b;
    
    public A(B b) {
        this.b = b;
    }
}
```

`A가 B에 의존한다.` 라는 의존성은 이전의 코드와 같다. 여전히 B가 변경되면 A의 내용도 변경된다. 하지만 의존 대상을 직접 생성(결정)하는 것이 아니라 외부로부터 주입받는다. 의존성을 외부로부터 주입받는다고 할 수 있다. 지금은 주입 대상인 B 인스턴스들간의 상태 차이만 있을 뿐이지만 만약 B를 인터페이스로 추상화하고 하면 다양한 구현체가 들어옴으로써 의존성을 다각화할 수 있다. 토비의 스프링에서는 의존성 주입을 다음과 같이 설명하고 있다.

> - 클래스 모델이나 코드에는 런타임 시점의 의존관계가 드러나지 않는다. 그러기 위해서는 인터페이스만 의존하고 있어야 한다.
> - 런타임 시점의 의존관계는 컨테이너나 팩토리 같은 제3의 존재가 결정한다.
> - 의존관계는 사용할 오브젝트에 대한 레퍼런스를 외부에서 제공(주입)해줌으로써 만들어진다.
>
> **\- 이일민, 토비의 스프링 3.1, 에이콘(2012), p114**

또한 앞서 DI가 IoC를 구현하는 디자인 패턴이라고 했는데, 

그렇다면 의존성 주입 방법에는 생성자를 통한 주입만 있을까? 그건 아니다. 다시 [마틴 파울러의 글](https://martinfowler.com/articles/injection.html#InversionOfControl)로 돌아가보면, 의존성 주입 방법에는 세 가지가 있다.

> _There are three main styles of dependency injection. The names I'm using for them are Constructor Injection, Setter Injection, and Interface Injection._
>
> 의존성 주입에는 세 가지 주요 스타일이 있다. 내가 사용하고 있는 이름은 생성자 주입, 세터 주입, 인터페이스 주입이다.

### 생성자 주입(Constructor Injection)

```java
public class A {
    private B b;
    
    public A(B b) {
        this.b = b;
    }
}
```
스프링에서 권장하는 방식이다. (스프링의 Dependency Injection은 다음 게시물에서 설명)

### Setter 주입(Setter Injection)

```java
public class A {
    private B b;
    
    public void setB(B b) {
        this.b = b;
    }
}
```

### 인터페이스 주입(Interface Injection)

```java
public interface BInjection {
    void inject(B b);
}

public A implements BInjection {
    private B b;
    
    @Override
    public void inject(B b) {
        this.b = b;
    }
}
```
어떤 의존성을 주입할 것인지를 인터페이스에 명시하고, 의존성을 주입받는 클래스는 해당 인터페이스의 구현체로 만든다. setter 주입과 비슷하다.

그렇다면 DI를 사용하면 어떤 장점이 있을까?

> Code is cleaner with the DI principle, and decoupling is more effective when objects are provided with their dependencies. The object does not look up its dependencies and does not know the location or class of the dependencies. As a result, your classes become easier to test, particularly when the dependencies are on interfaces or abstract base classes, which allow for stub or mock implementations to be used in unit tests.
>
> DI 원칙으로 코드가 더 깔끔해지고, 객체에 의존성이 제공될 때 분리하는 것이 더 효과적입니다. 객체는 의존성을 조회하지 않으며 의존성의 위치나 클래스를 알지 못합니다. 결과적으로, 특히 의존성이 인터페이스 또는 추상 기본 클래스에 있는 경우 클래스를 테스트하기가 더 쉬워지며, 이를 통해 단위 테스트에서 스텁 또는 모의 구현을 사용할 수 있습니다.

- 의존성이 줄어든다. (변경에 덜 취약해진다.)
- 모의 객체를 주입할 수 있기 때문에 단위 테스트가 쉬워진다.
- 가독성이 높아진다.
- 재사용성이 높아진다.

이번 글에서는 IoC와 DI의 개념을 간단히 (최대한 스프링과의 연계를 빼고) 정리해보는 시간을 가졌다. 다음 게시물에서는 스프링이 어떻게 IoC와 DI를 사용하는지 살펴보도록 하자.

> 참고 자료  
> 토비의 스프링 3.1, Vol.1  
> [의존관계 주입(Dependency Injection) 쉽게 이해하기](https://tecoble.techcourse.co.kr/post/2021-04-27-dependency-injection/)  
> [의존성 주입, Dependency Injection에 관한 고찰🔎 With OOP](https://hue-dev.site/springframework/2021/05/03/Dependency-Injection-%EC%9D%B4-%EB%AD%90%EC%97%90%EC%9A%94.html)  
> [InversionOfControl](https://martinfowler.com/bliki/InversionOfControl.html)  
> [Inversion of Control Containers and the Dependency Injection pattern](https://martinfowler.com/articles/injection.html)  
> [Core Technologies](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#beans-factory-collaborators)  