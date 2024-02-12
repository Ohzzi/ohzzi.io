---
title: "[Spring DI/IoC] 스프링의 의존성 주입 (1) - 의존성 주입 방법"
description: 이전 게시글에서 DI와 IoC가 어떤 개념인지에 대해 알아보았다. 그렇다면 우리가 알고 싶어하는 본론으로 들어가서, 스프링에서는 의존성 주입을 어떤 방식으로 사용하는지 알아보자.
date: 2022-05-04
update: 2024-02-10
series: Spring DI/IoC
tags:
  - Spring
---

~~그냥 주는 대로 먹자. 스프링의 의존성 주입 기능을 사용해서.~~

[이전 게시글](/what-is-ioc-di/)에서 DI와 IoC가 어떤 개념인지에 대해 알아보았다. 그렇다면 우리가 알고 싶어하는 본론으로 들어가서, 스프링에서는 의존성 주입을 어떤 방식으로 사용하는지 알아보자.

## Spring은 의존성을 자동으로 주입해준다.

```java
@RestController
@RequestMapping("/members")
public class MemberController {
    private final MemberService memberService;
    
    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }
    
    ...
}
```

위와 같은 Controller 클래스가 있다고 하자. `MemberController`는 `MemberService`를 의존하고 있으며, 어떤 `MemberService`에 의존할 지는 앞선 게시물에서 언급했던 의존성 주입 방법 중 생성자를 통한 주입 방법을 사용하고 있다. `MemberController` 내부에서는 `MemberService`를 직접 생성하고 있지 않다. 그렇다면 결국 Controller가 생성되는 시점에 외부로부터 특정한 `MemberService`를 주입받아야 한다는 의미가 된다. 그렇다면 `MemberController`보다 상위 계층의 메서드에 가보면 `new MemberService()`와 같은 코드를 볼 수 있을까? `MemberController`보다 상위 계층인 `DiApplication` 클래스(main 메서드를 포함하고 있는 임의의 클래스)로 가보자.

```java
@SpringBootApplication
public class DiApplication {

	public static void main(String[] args) {
		SpringApplication.run(DiApplication.class, args);
	}

}
```

어라? 놀랍게도 `MemberService`의 생성자를 찾을 수 없다. 심지어 `MemberController`도 생성하고 있지 않다. 이는 `MemberController` 클래스가 `@Component` 어노테이션(`@RestController` 어노테이션이 `@Component`를 포함)을 포함하고 있어 스프링 빈으로 등록되어 자동으로 생성되기 때문이다. `MemberService` 클래스도 빈으로 등록되어 있다면 스프링에 의해 자동으로 생성된다.

```java
@Service // @Component 어노테이션을 포함하고 있어 MemberService를 자동으로 빈 등록
public class MemberService {
    ...
}
```

자 그렇다면 빈으로 등록되어 있기 때문에 `MemberService`와 `MemberController`가 자동으로 생성된다는 것은 알 것 같은데, 문제는 의존관계가 포함되어 있는데 이를 어떻게 넣어주냐는 것이다. 이 역시 스프링에서 자동으로 해준다.

스프링 프레임워크는 DI 컨테이너(또는 IoC) 컨테이너를 통해 적절한 의존성을 자동으로 주입해준다. 스프링을 사용하지 않았을 때 우리가 생성자나 setter에 직접 의존 객체를 만들어서 주입해주던 일을 프레임워크가 대신 해주는 것이다. 앞서 DI가 IoC를 구현하는 방식 중 하나라고 했는데, 스프링에서 DI를 해줌으로써 의존관계의 제어권이 스프링 프레임워크로 넘어간 것이라고 볼 수 있다.

스프링이 컨테이너를 통해 자동으로 의존성을 주입 해주는 것은 알겠는데, 주입에도 어떠한 기준이 있어야 하지 않을까?

스프링이 자동으로 의존성 주입을 해주도록 하려면 `@Autowired` 어노테이션을 사용하면 된다.

### @Autowired

`@Autowired`에 대한 공식 문서를 보면 다음과 같이 설명이 되어 있다.

> Marks a constructor, field, setter method, or config method as to be autowired by Spring's dependency injection facilities.
>
> Spring의 의존성 주입 기능에 의해 자동으로 연결되도록 생성자, 필드, setter 메서드 또는 구성 메서드를 표시한다.

한마디로 `나는 여기에 스프링이 의존성을 자동으로 주입해 주기를 바란다.` 라고 명시하는 어노테이션이라고 볼 수 있다. 물론 편의를 위해 제공된 어노테이션인 만큼, 반드시 이 어노테이션을 통해서만 스프링의 의존성 주입 기능을 사용할 수 있는 것은 아니다. 위의 `MemberController`에 `MemberService`를 자동으로 주입받고자 한다면, `@Autowired` 없이도 자바 코드나 XML 파일을 통해 주입시킬 수 있다.

```java
@Configuration
public class ApplicationConfig {
    @Bean
    public MemberService memberService() {
        return new MemberService();
    }
    
    @Bean
    public MemberController memberController() {
        return new MemberController(memberService());
    }
}
```

`@Configuration` 어노테이션과 `@Bean` 어노테이션을 활용한 빈 생성 메서드를 통해 `MemberController`에 `MemberService`를 주입해줄 수 있다. 하지만 이런 방식으로 의존성을 주입해 주는 것은 너무 불편하다. `@Autowired` 어노테이션을 사용하면 굉장히 간편하게 의존성을 주입해 줄 수 있다. 물론 이 경우, `@Bean` 어노테이션이 붙은 생성 메서드가 없기 때문에 `@Component` 또는 해당 어노테이션을 상속받은 다른 어노테이션(`@Controller`, `@Service`, `@Repository` 또는 커스텀 어노테이션)을 주입시키고자 하는 클래스에 붙여서 스프링 빈으로 등록해주어야 한다.

```java
@RestController
@RequestMapping("/members")
public class MemberController {
    @Autowired
    private MemberService memberService;
    ...
}
```

이렇게 `@Autowired` 어노테이션을 붙여주는 것 만으로도 복잡한 설정 파일이나 XML 파일을 작성할 필요 없이 자동으로 의존성을 주입시킬 수 있다.

## Spring의 의존성 주입 방법

`@Autowired`를 사용하면 간편하게 의존성을 주입할 수 있다는 것을 알아보았다. 그런데 `@Autowired`를 사용하는 위치에 따라 여러 방법으로 의존성을 주입할 수 있다. 이에 대해 알아보자.

### 필드 주입

가장 간단한 방법이지만 가장 추천되지 않는 방법으로 필드 주입이 있다. 필드 주입 방법은 간단하다. 바로 이전의 `MemberController` 예제처럼 의존성을 주입할 필드 위에 `@Autowired` 어노테이션을 붙이면 된다. 이 때 필드는 public일 필요가 없다.

하지만 필드 주입은 이제 더이상 추천되지 않는다. 심지어 IntelliJ에서는 필드 주입을 사용하면 경고를 띄워준다.

![](https://velog.velcdn.com/images/ohzzi/post/9ba75c38-2570-4ae5-9500-1e4712c403d9/image.png)

왜 필드 주입은 추천되지 않는걸까? 우선 필드 주입에 비해 다른 주입 방법들(특히 생성자 주입)이 훨씬 더 많은 장점을 가지고 있다. (해당 장점들은 해당 주입 방법에서 설명하도록 하겠다.)

하지만 그보다 더 큰 문제는, 필드 주입이 치명적인 단점을 가지고 있다는 것이다. 첫째로, 필드 주입을 하게 되면 외부 접근이 불가능하다. 일반적으로 필드 주입을 한다는 것은 해당 필드를 초기화하는 생성자도, 해당 필드에 값을 넣어주는 setter도 없다는 뜻이 되는데, 보통 필드는 private으로 선언하는 것이 권장된다는 것을 생각해보면 DI 프레임워크나 리플렉션 없이는 필드 값을 주입해 줄 방법이 없다는 의미가 된다. 따라서 의존성을 주입받아야 하는 객체가 프레임워크에 강하게 종속적인 객체가 되어버린다. 이렇게 되면 자동이 아니라 수동으로 특정한 의존성을 넣어주어야 할 필요가 생길 때, 대표적으로 테스트 코드를 작성할 경우 리플렉션 외에는 처리할 방법이 없다.

스프링부트 2.6 버전 이후로 순환 참조 금지가 기본 설정이 되어버렸기 때문에 더이상 문제점으로 꼽지는 않지만, 스프링부트 2.5 까지는 별도의 설정이 없다면 필드 주입을 사용할 때는 빈끼리 순환 참조를 하고 있더라도 스프링 애플리케이션이 정상적으로 뜨기 때문에 순환 참조를 방지할 수 없다는 문제가 있어서 더욱 선호되지 않기도 했다.

### setter 주입

setter 주입은 말 그대로 setter를 통해 주입하는 방식이다.

> Setter-based DI is accomplished by the container calling setter methods on your beans after invoking a no-argument constructor or a no-argument static factory method to instantiate your bean.
>
> setter 기반 DI는 빈을 인스턴스화하기 위해 인수가 없는 생성자 또는 인수가 없는 정적 팩토리 메서드를 호출한 후 빈에서 setter 메서드를 호출하는 컨테이너에 의해 수행됩니다.

setter 주입을 사용하기 위해서는 클래스에 빈 생성자 또는 빈 정적 팩토리 메서드가 정의되어 있어야 하며, setter 위에 `@Autowired` 어노테이션을 붙여서 사용한다. 당연한 이야기지만, 의존성을 주입해주려는 필드는 final일 수 없다.

```java
@RestController
@RequestMapping("/members")
public class MemberController {
    private MemberService
    
    @Autowired
    public void setMemberService(MemberService memberService) {
        this.memberService = memberService;
    }
    ...
}
```

setter 주입 역시 필드 주입과 마찬가지로 순환 참조 및 순환 호출의 문제가 발생할 수 있다. 그런데 왜 setter 주입은 필드 주입과 다르게 아직 남아있을까? 바로 `의존성을 수정할 수 있다.`라는 장점 때문이다. 그리고 setter 주입을 사용하면 의존성의 선택적 주입이 가능하다. (모든 의존성이 주입되지 않아도 빈이 생성될 수 있기 때문에) 물론 이는 주입되지 않은 의존성에 대한 참조를 호출할 때 NPE가 발생할 수 있기 때문에 단점이 될 수도 있다.

때문에 보통 setter 주입은 런타임에 의존성을 수정해야 할 필요가 있을 때 사용한다.

아, 참고로 메서드 이름이 전통적인 setter 방식(set + 필드 이름)을 따르지 않더라도 사용이 가능하다. **추천되는 방법은 아니지만.**

### 생성자 주입

드디어 스프링에서 공식적으로 추천하는 방법인 생성자 주입이다. 생성자 주입은 생성자를 통해 객체를 생성하는 시점에 모든 의존성을 주입해주는 방식이다.

```java
@RestController
@RequestMapping("/members")
public class MemberController {
    private final MemberService memberService;
    
    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }
    ...
}
```

생성자 주입을 사용할 경우, 의존성 주입이 최초 빈 생성 시 1회만 호출됨을 보장할 수 있다. (애초에 생성자는 1회만 호출되니까) 그리고 위 코드를 보면 기존의 주입 방식과는 다르게 필드를 final로 선언할 수 있는 것을 알 수 있다. 의존성 주입이 1회만 이루어지며 final 필드가 가능하기 때문에 의존성의 불변을 유지해줄 수 있다는 것이 생성자 주입의 큰 장점이다.

또한 생성자 주입을 사용할 경우, 특정 의존성이 없는 상태로 코드가 실행되지 않도록 의존성 주입을 강제할 수 있다는 장점도 가지고 있다.

참고로 다시 이야기하자면, 위에 필드 주입에서 설명했지만 필드 주입은 (그리고 setter 주입도) 스프링부트 2.5까지는 순환 참조를 잡아내지 않는다는 문제가 있었다. 하지만 생성자 주입은 순환 참조된 빈들이 있을 경우, 애플리케이션 실행 시에 스프링 실행 실패와 함께 애플리케이션이 종료되도록 한다는 장점을 가지고 있었다. 스프링부트 2.6 이후로는 주입 방법에 상관 없이 전부 스프링 실행 실패가 되어서 의미 없어졌지만.

그런데 위 예제를 보면 의문점이 하나 존재할 수 있다. 바로 `@Autowired` 어노테이션이 없다는 것. `@Autowired`가 없는데 어떻게 스프링이 의존성을 주입해줄 수 있었을까? 자바 설정 파일이라도 만든 것일까?

스프링이 공식적으로 생성자 주입을 권장하기 때문일까, 스프링 4.3 버전 이후부터는 단일 생성자에 대해서는 `@Autowired`를 붙이지 않더라도 자동으로 의존성을 주입하도록 설정되어있다. 일반적으로 스프링 빈의 생성자를 여러개 만드는 케이스는 많지 않으므로, 모든 필요한 의존성을 구성하는 단일 생성자 하나를 사용하여 어노테이션 없이 간편하게 생성자 주입을 할 수 있다.

### 생성자 주입을 할 때 주의점

`@Autowired` 어노테이션에는 required라는 속성이 있다. `@Autowired` 어노테이션이 붙어있는 의존성이 꼭 필요한 것인지를 나타내는 속성이다. 즉, `required=false` 의 속성을 가지는 경우 의존성을 찾지 못해도 스프링은 정상적으로 실행된다는 것이다. 디폴트 값은 true다. 아무래도 생성자 주입보다는 setter 혹은 필드 주입을 위한 용도로 사용되었던 것으로 보이며, 일반적으로는 건드릴 일이 없다. 생성자 주입을 할 때 주의해야할 점이 바로 이 부분과 관련된 것인데, `required=true` 속성의 `@Autowired` 어노테이션은 한 개만 존재해야 한다.

> Only one constructor of any given bean class may declare @Autowired with the required attribute set to true, indicating the constructor to autowire when used as a Spring bean. As a consequence, if the required attribute is left at its default value true, only a single constructor may be annotated with @Autowired. If multiple constructors declare the annotation, they will all have to declare required=false in order to be considered as candidates for autowiring (analogous to autowire=constructor in XML). The constructor with the greatest number of dependencies that can be satisfied by matching beans in the Spring container will be chosen. If none of the candidates can be satisfied, then a primary/default constructor (if present) will be used. Similarly, if a class declares multiple constructors but none of them is annotated with @Autowired, then a primary/default constructor (if present) will be used. If a class only declares a single constructor to begin with, it will always be used, even if not annotated. Note that an annotated constructor does not have to be public.
>
> 어떤 빈이든 오직 한 개의 생성자만 required 속성이 true인 어노테이션이 선언되어 있어야 하고, 이 생성자는 스프링 빈으로 사용될 때 자동 연결(autowire, 자동으로 의존성 주입)을 위한 생성자로 지정된다. 결과적으로, required 속성이 기본 값인 true로 남아있다면 오직 한 개의 생성자만 `@Autowired` 어노테이션을 달 수 있다. 만약 여러 생성자에 `@Autowired` 어노테이션을 선언한다면, 의존성 자동 연결(autowire) 후보로 여겨지기 위해 모든 어노테이션의 required 속성이 false 값이어야 한다. (XML 설정의 `autowire=constructor`와 유사) 스프링 컨테이너에서 빈을 일치시켜 충족할 수 있는 의존성이 가장 많은 생성자가 선택된다. 후보 중 어느 것도 만족할 수 없으면 주 생성자/기본 생성자(존재하는 경우)가 사용된다. 마찬가지로 클래스가 여러 생성자를 선언했지만 그 중 아무 것도 `@Autowired`가 붙지 않은 경우 주 생성자/기본 생성자(존재하는 경우)가 사용된다. 클래스가 의존성 주입에 사용할 단일 생성자만 선언하면 어노테이션이 없는 경우에도 항상 사용된다. 어노테이션이 달린 생성자는 public일 필요가 없다.

단일 생성자만 있을 때는 자동으로 해당 생성자에 `@Autowired`가 붙는다고 했는데, 문제는 생성자가 여러개 있는 빈이 있을 수도 있다는 점이다. 만약 생성자가 여러개 있을 경우, 스프링의 의존성 주입 기능을 사용할 생성자에 `@Autowired` 어노테이션을 붙여야 한다. `@Autowired`를 여러 생성자에 붙일 수도 있는데, 이 경우에는 모든 생성자에 required 속성을 false로 설정해줘야 생성자들이 의존성 주입의 후보가 될 수 있고, 이 경우 가장 많은 의존성을 주입할 수 있는 생성자를 사용한다. 만약 아무 생성자에도 `@Autowired`가 붙지 않거나, `@Autowired` 어노테이션이 붙은 어떤 생성자도 사용이 불가능하면 주 생성자 혹은 기본 생성자(있는 경우에만)를 사용한다. 그것조차 없다면? 당연히 빈이 생성이 되지 않고 애플리케이션이 정상적으로 실행되지 않는다.

### 생성자 주입 vs setter 주입

앞서 생성자 주입과 setter 주입의 사용법과 장단점을 알아보았다. 어떤 경우에 생성자 주입을 사용할지, 어떤 경우에 setter 주입을 사용할 지 어느정도 감이 왔겠지만, 공식 문서의 설명을 통해 다시 한번 되짚어보자.

> Since you can mix constructor-based and setter-based DI, it is a good rule of thumb to use constructors for mandatory dependencies and setter methods or configuration methods for optional dependencies. Note that use of the @Required annotation on a setter method can be used to make the property be a required dependency; however, constructor injection with programmatic validation of arguments is preferable.
>
> The Spring team generally advocates constructor injection, as it lets you implement application components as immutable objects and ensures that required dependencies are not null. Furthermore, constructor-injected components are always returned to the client (calling) code in a fully initialized state. As a side note, a large number of constructor arguments is a bad code smell, implying that the class likely has too many responsibilities and should be refactored to better address proper separation of concerns.
> 
> Setter injection should primarily only be used for optional dependencies that can be assigned reasonable default values within the class. Otherwise, not-null checks must be performed everywhere the code uses the dependency. One benefit of setter injection is that setter methods make objects of that class amenable to reconfiguration or re-injection later. Management through JMX MBeans is therefore a compelling use case for setter injection.
> 
> Use the DI style that makes the most sense for a particular class. Sometimes, when dealing with third-party classes for which you do not have the source, the choice is made for you. For example, if a third-party class does not expose any setter methods, then constructor injection may be the only available form of DI.
>
> 생성자 기반 및 설정자 기반 DI를 혼합할 수 있으므로 필수 의존성에는 생성자를 사용하고 선택적 의존성에는 setter 또는 구성 메서드를 사용하는 것이 좋다. setter 메서드에서 @Required 어노테이션을 사용하여 속성을 필수 의존성 만들 수 있다. 그러나 프로그래밍 방식의 인수 유효성 검사가 포함된 생성자 주입이 더 좋다.
> 
> Spring 팀은 일반적으로 생성자 주입을 추천한다. 생성자 주입을 사용하면 애플리케이션 구성 요소를 변경할 수 없는 객체로 구현할 수 있고 필요한 의존성이 null이 아님을 확인할 수 있기 때문이다. 또한 생성자 주입 구성 요소는 항상 완전히 초기화된 상태로 클라이언트(호출) 코드에 반환된다. 참고로 많은 수의 생성자 인수는 좋지 않은 패턴이며, 이는 클래스에 너무 많은 책임이 있을 수 있으며 적절한 문제 분리를 더 잘 처리하기 위해 리팩토링해야 함을 의미한다.
> 
> Setter 주입은 주로 클래스 내에서 합리적인 기본값을 할당할 수 있는 선택적 의존성에만 사용해야 한다. 그렇지 않으면 코드에서 해당 의존성을 사용하는 모든 곳에서 null이 아닌 검사를 수행해야 한다. setter 주입의 한 가지 이점은 setter 메서드가 해당 클래스의 개체를 나중에 재구성하거나 다시 주입할 수 있도록 만든다는 것이다. 따라서 JMX MBeans를 통한 관리는 setter 주입을 위한 매력적인 사용 사례다.
> 
> 특정 클래스에 가장 적합한 DI 스타일을 사용하라. 때로는 소스가 없는 외부 라이브러리 클래스를 처리할 때 선택이 이루어진다. 예를 들어, 외부 라이브러리의 클래스가 setter 메서드를 노출하지 않는 경우 생성자 주입이 유일하게 사용 가능한 DI 형식일 수 있다.

## 정리

스프링은 의존성을 자동으로 주입해주기 때문에, 스프링의 의존성 주입 방법을 사용하므로써 의존성 제어권을 프레임워크로 역전시킬 수 있다. 물론, 필요한 경우 개발자가 직접 수동으로 의존성을 주입해 줄 수도 있다.

스프링의 의존성 주입 기능을 사용하기 위해서는 주입하고자 하는 의존 객체가 스프링 빈으로 등록되어있어야 하며, 스프링 설정 클래스를 이용하거나 XML 파일을 이용, 또는 `@Autowired` 어노테이션을 이용하여 의존성을 주입시켜줄 수 있다.

스프링의 의존성 주입 방법으로는 생성자 주입, setter 주입, 필드 주입이 있으며, 필드 주입은 더이상 추천되지 않는 방법이므로 다른 주입 방법을 사용할 필요가 있다. 기본적으로는 생성자 주입이 추천되나, 생성자 주입을 사용하기 곤란한 경우도 존재하므로 생성자 주입과 setter 주입 중 상황에 맞는 주입 방법을 선택하여 사용하는 것이 추천된다.

다음 게시글에서는 DI/IoC 컨테이너를 알아보며 어떻게 스프링이 자동으로 의존성을 주입해 줄 수 있는지, 타입이나 이름 등이 겹칠 경우 어떤 우선순위로 의존성을 주입해주는 지에 대해 알아보도록 하겠다.

> **참고자료**
>
> [Spring.io - Core Technologies](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html)  
> [@Autowired](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/annotation/Autowired.html)  
> [[Spring] 다양한 의존성 주입 방법과 생성자 주입을 사용해야 하는 이유 - (2/2)](https://mangkyu.tistory.com/125)  
> [[Spring]@Autowired란 무엇인가?](https://devlog-wjdrbs96.tistory.com/166)  
> [DI(의존성 주입)가 필요한 이유와 Spring에서 Field Injection보다 Constructor Injection이 권장되는 이유](https://www.mimul.com/blog/di-constructor-injection/)
