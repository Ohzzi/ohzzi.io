---
title: "[Spring DI/IoC] 스프링의 의존성 주입 (2) - DI/IoC 컨테이너와 우선순위"
description: 이전 게시글을 통해 @Autowired 등을 사용한 스프링의 자동 의존성 주입 방법을 알아보았다. 그렇다면 스프링의 어떤 부분이 의존성을 자동으로 주입해줄 수 있는 것일까?
date: 2022-05-05
update: 2024-02-10
series: Spring DI/IoC
tags:
  - Spring
---

이전 게시글을 통해 `@Autowired` 등을 사용한 스프링의 자동 의존성 주입 방법을 알아보았다. 그렇다면 스프링의 어떤 부분이 의존성을 자동으로 주입해줄 수 있는 것일까?

## IoC를 담당하는 스프링 컨테이너

스프링 프레임워크는 객체의 생성, 관계설정, 사용, 제거 등의 작업을 애플리케이션과 독립된 컨테이너를 통해 실행한다. 우리가 일반적으로 작성하던 코드에서 new 키워드 등을 이용해서 객체를 생성하고, 의존성을 주입해주고, 연관관계를 맺어주었다면 스프링은 스프링 빈으로 등록하는 것 만으로 컨테이너에게 객체들을 관리받을 수 있다. 이전 게시글에서 보았던 의존성 자동 주입 역시 컨테이너에 의해 이루어진다. 즉, 애플리케이션에 대한 제어권을 컨테이너가 가져가는 것이다. 때문에 제어의 역전(Inversion of Control)이 일어난 컨테이너라고 해서 이 컨테이너를 `IoC 컨테이너` 또는 의존성 주입에 초점을 맞춘다면 `DI 컨테이너`라고 부른다.

> The `org.springframework.beans` and `org.springframework.context` packages are the basis for Spring Framework’s IoC container. The `BeanFactory` interface provides an advanced configuration mechanism capable of managing any type of object. `ApplicationContext` is a sub-interface of `BeanFactory`.  
> In short, the `BeanFactory` provides the configuration framework and basic functionality, and the `ApplicationContext` adds more enterprise-specific functionality. The `ApplicationContext` is a complete superset of the `BeanFactory` and is used exclusively in this chapter in descriptions of Spring’s IoC container. 
>
> `org.springframework.beans` 및 `org.springframework.context` 패키지는 Spring Framework의 IoC 컨테이너의 기초이며, `BeanFactory` 인터페이스는 모든 유형의 객체를 관리할 수 있는 고급 구성 메커니즘을 제공한다. `ApplicationContext`는 `BeanFactory`의 하위 인터페이스다.  
> 간단히 말해서 `BeanFactory`는 구성 프레임워크와 기본 기능을 제공하고 `ApplicationContext`는 더 많은 엔터프라이즈별 기능을 추가한다. `ApplicationContext`는 `BeanFactory`의 완전한 상위 집합이며 이 장의 Spring의 IoC 컨테이너 설명에서 독점적으로 사용된다다.

물론 이 컨테이너가 단순히 DI 가능만을 갖추고 있는 것은 아니다. 컨테이너도 여러 가지 계층으로 이루어져 있는데, 빈을 생성하고 의존성을 주입하는 기능을 담당하는 `BeanFactory`가 있고, 거기에 애플리케이션을 동작시키기 위한 여러 기능들이 추가된 `ApplicationContext`가 존재한다. 따라서 순수히 `DI 컨테이너`라고 부른다면 이는 DI 작업에만 관련된 `BeanFactory`를 지칭한다고 볼 수 있다. 다만 `BeanFactory`를 `ApplicationContext`가 포함하기 때문에 `ApplicationContext`도 DI 컨테이너로서의 역할을 한다고 볼 수 있다.

`BeanFactory`와 `ApplicationContext`는 각각 동명의 인터페이스로 정의되어 있고, `ApplicationContext` 인터페이스는 `BeanFactory` 인터페이스를 비롯한 몇몇 인터페이스를 상속하여 확장시켜놓은 형태다.

![](https://velog.velcdn.com/images/ohzzi/post/5891bae9-44c4-4882-92e6-c1ce2fa8446d/image.png)

실제로 `org.springframework.context` 패키지를 들어가서 `ApplicationContext`의 다이어그램을 보면 `BeanFactory`를 상속한 인터페이스인 `HierachicalBeanFactory`, `ListableBeanFactory`를 상속한 것을 볼 수 있고, 그 외에 메시지, 이벤트 관련된 기능을 하는 인터페이스를 상속받아 `ApplicationContext`를 구성하는 것을 볼 수 있다.

또한 다양한 기능을 구현해 놓은 것 외에도 차이점이 있는데, `ApplicationContext`의 구현체들은 적절한 `BeanFactory` 구현체를 내부에 조합하고 있고, `BeanFactory` 인터페이스로부터 받은 동작들에 대한 요청을 내부의 `BeanFactory` 구현체로 위임하여 처리한다는 점이 다르다.

또한 `BeanFactory`는 `Lazy-loading` 방식을 사용하여, 빈에 대한 요청이 들어올 때에 빈 객체의 인스턴스를 생성하고 등록하지만, `ApplicationContext`는 `Pre-loading` 방식으로 컨텍스트가 로딩될 때 모든 빈에 대해 인스턴스를 생성하고 등록해둔다는 차이가 있다. 스프링에서는 공식적으로 대부분의 경우에 `BeanFactory` 대신 `ApplicationContext`를 사용하라고 권장하고 있다.

> Because an `ApplicationContext` includes all the functionality of a `BeanFactory`, it is generally recommended over a plain `BeanFactory`, except for scenarios where full control over bean processing is needed. Within an `ApplicationContext` (such as the `GenericApplicationContext implementation`), several kinds of beans are detected by convention (that is, by bean name or by bean type — in particular, post-processors), while a plain `DefaultListableBeanFactory` is agnostic about any special beans.
>
> `ApplicationContext`는 `BeanFactory`의 모든 기능을 포함하기 때문에 일반적으로 빈 처리에 대한 완전한 제어가 필요한 경우를 제외하고 일반 `BeanFactory`보다 권장된다. `ApplicationContext`(`GenericApplicationContext` 구현체와 같은) 내에서 여러 종류의 빈이 관례에 의해 감지되는 반면(즉, 빈 이름 또는 빈 타입 —  특히 후처리기) 일반 `DefaultListableBeanFactory`는 모든 특수 빈에 대해 불가지론적(존재를 확신할 수 없다. - 역자 주)이다.

우리가 일반적으로 말하는 스프링 컨테이너, 또는 IoC 컨테이너는 바로 이 `ApplicationContext`를 확장, 구현한 구현체를 일컫는다. 이 구현체에는 다양한 종류가 있으며, 하나의 스프링 애플리케이션이 한 개가 넘는 컨텍스트를 보유할 수도 있다.

## ApplicationContext의 동작

> The `org.springframework.context.ApplicationContext` interface represents the Spring IoC container and is responsible for instantiating, configuring, and assembling the beans. The container gets its instructions on what objects to instantiate, configure, and assemble by reading configuration metadata. The configuration metadata is represented in XML, Java annotations, or Java code. It lets you express the objects that compose your application and the rich interdependencies between those objects.
>
> Several implementations of the `ApplicationContext` interface are supplied with Spring. In stand-alone applications, it is common to create an instance of `ClassPathXmlApplicationContext` or `FileSystemXmlApplicationContext`. While XML has been the traditional format for defining configuration metadata, you can instruct the container to use Java annotations or code as the metadata format by providing a small amount of XML configuration to declaratively enable support for these additional metadata formats.
>
> `org.springframework.context.ApplicationContext` 인터페이스는 Spring IoC 컨테이너를 나타내며 빈의 인스턴스화, 설정 및 조합을 담당한다. 컨테이너는 설정 메타데이터를 읽어 인스턴스화, 설정 및 어셈블링할 객체에 대한 지침을 얻는다. 설정 메타데이터는 XML, Java 어노테이션 또는 Java 코드로 표시된다. 이를 통해 응용 프로그램을 구성하는 객체와 이러한 객체 간의 풍부한 상호 종속성을 표현할 수 있다.
>
> `ApplicationContext` 인터페이스의 여러 구현이 Spring과 함께 제공된다. 독립 실행형 응용 프로그램에서는 `ClassPathXmlApplicationContext` 또는 `FileSystemXmlApplicationContext`의 인스턴스를 만드는 것이 일반적이다. XML은 설정 메타데이터를 정의하는 전통적인 형식이었지만 이러한 추가 메타데이터 형식에 대한 지원을 선언적으로 활성화하기 위해 소량의 XML 구성을 제공하여 컨테이너에 메타데이터 형식으로 Java 어노테이션 또는 코드를 사용하도록 지시할 수 있다.

기본적으로 `ApplicationContext`는 XML, 어노테이션, 자바 코드 등으로 만들어진 설정 메타데이터를 읽어와서 프로그램을 구성한다. 스프링의 전통적인 방식으로는 XML 파일을 이용해서 메타데이터를 구성하고, 컨텍스트를 로딩하지만, 스프링 부트를 사용하는 경우 기본적으로 properties 파일과 `@Configuration` 어노테이션이 붙은 설정 파일, `@Component` 어노테이션을 이용한 빈 설정 등을 활용~~(주의: 스프링 부트가 아닌 전통적 스프링에서 어노테이션을 활용하지 않는 것은 아니다)~~한다. 설정에 거의 대부분 어노테이션을 사용하기 때문에 공식 문서에서 설명하는 XML 관련 구현체들이 아니라 어노테이션을 기반으로 하는 컨텍스트 구현체들을 사용한다. 특히 우리가 자주 사용하게 되는 웹 애플리케이션일 경우 기본적으로 `ServletWebServerApplicationContext`의 구현체인 `AnnotationConfigServletWebServerApplicationContext`를 생성해서 사용하게 된다.

이렇게 생성된 `ApplicationContext`는 `BeanFactory`의 하위 인터페이스이기 때문에 XML, 자바 설정 파일, `@Component` 어노테이션이 붙은 클래스 등 빈 설정 메타데이터들을 이용해 스프링 빈 들을 만들고, 그 과정에서 필요한 곳에 빈 의존성을 주입해주는 `BeanFactory`의 역할을 한다. 이 때, 다이어그램을 다시 보면 `ApplicationContext`는 `HierachicalBeanFactory`, `ListableBeanFactory`는 상속하고 있지만, `@Autowired` 어노테이션에 대한 DI를 처리하는 `AutowireCapableBeanFactory`는 상속하고 있지 않다. 하지만 `@Autowired` 어노테이션이 붙은 곳에 대해 의존성 주입이 가능한데, 이는 `AutowireCapableBeanFactory`를 상속이 아닌 조합의 형태로 가지고 있기 때문이다.

```java
public interface ApplicationContext extends EnvironmentCapable, ListableBeanFactory, HierarchicalBeanFactory,
		MessageSource, ApplicationEventPublisher, ResourcePatternResolver {

	@Nullable
	String getId();

	String getApplicationName();

	String getDisplayName();

	long getStartupDate();
    
	@Nullable
	ApplicationContext getParent();
    
	AutowireCapableBeanFactory getAutowireCapableBeanFactory() throws IllegalStateException;

}
```

빈 생성 및 의존성 주입 만으로 `ApplicationContext`의 역할이 끝나지는 않는다. 여기까지 진행된 작업들만으로는 애플리케이션이 동작하지 않기 때문에, 자바 애플리케이션의 main 메서드처럼 특정 빈의 메서드를 호출함으로써 애플리케이션을 동작시킨다. 초기에 빈들을 생성하고 의존성 주입 작업을 해준 뒤 애플리케이션을 실행시킬 빈을 제공해 주는 것 까지가 IoC 컨테이너로써의 `ApplicationContext`의 역할이다.

참고로, IoC 컨테이너 즉, `ApplicationContext`는 자기 자신도 빈으로 등록시켜놓는다. 때문에 `ApplicationContext`, `BeanFactory` 역시 `@Autowired`로 받아올 수 있다. 기본적으로 `ApplicationContext`는 `ApplicationContext`, `BeanFactory`, `ResourceLoader`, `ApplicationEventPublisher`, `systemProperties`, `systemEnvironment` 빈을 자동으로 등록한다. 앞의 네 개의 빈들은 IoC 컨테이너 스스로의 역할(`ApplicationContext`가 저들을 모두 상속한다.)이기 때문에 등록되며, 뒤의 두 빈은 시스템 설정 및 환경변수를 불러오기 위해 자동으로 빈으로 등록한다.

## IoC 컨테이너는 어떤 기준으로 빈을 주입해주는가?

이제부터 설명하는 스프링 IoC 컨테이너의 의존성 주입은 모두 어노테이션을 사용하는 것을 기준으로 한 것임을 미리 밝힌다. (자주 쓰이지는 않으나 컨텍스트에 직접 접근해서 빈을 가져오는 방법도 있다.)

앞서 `ApplicationContext`는 `AutowireCapableBeanFactory`를 조합의 형태로 가지고 있기 때문에 `@Autowired`를 처리해줄 수 있다고 설명했다. 그렇다면 `@Autowired` 시에는 어떤 기준으로 적절한 의존성을 주입해 주는 걸까?

먼저 `@Autowired`는 의존성을 주입받는 곳에 명시된 타입을 기준으로 빈을 찾는다. 예를 들어, `MemberService`라는 타입에 대해 의존성 주입을 받겠다고 `@Autowired`를 선언해두면, IoC 컨테이너가 등록된 빈들 중에 `MemberService`타입의 빈들(인터페이스인 경우 해당 인터페이스의 구현체 빈들)을 찾아서 주입해주게 된다.

하지만 같은 타입의 빈이 여러개일 수 있다는 점이 문제가 된다. `@Component` 어노테이션이 아니라 자바 설정 파일을 통한 빈 등록을 할 경우, 같은 타입에 대해 서로 다른 인스턴스를 모두 빈으로 등록할 수도 있고, `@Component` 어노테이션을 클래스에 붙여서 빈으로 등록하는 경우에도 해당 빈이 인터페이스의 구현체일 경우, 같은 인터페이스의 여러 구현체가 빈으로 등록되어 있을 경우가 있다.

이렇게 같은 타입에 대해 여러 빈이 등록되어 있을 경우, 컨테이너는 그 다음으로 이름을 기준으로 찾는다. `PayService`라는 타입에 대해 그 구현체인 `NaverPayService`와 `KakaoPayService`가 모두 빈으로 등록되어 있다고 하자.

```java
@Controller
public class PayController {
    private final PayService payService;
    
    public PayController(PayService payService) {
        this.payService = payService;
    }
    ...
}
```

만약 위 코드처럼 `PayService`를 주입받으려고 한다면 `PayService` 타입으로 등록된 빈이 두 개이기 때문에 경고가 뜨며 애플리케이션을 실행하더라도 컴파일이 되지 않는다.

```
***************************
APPLICATION FAILED TO START
***************************

Description:

Parameter 0 of constructor in com.example.diioc.controller.PayController required a single bean, but 2 were found:
	- kakaoPayService: defined in file [.../KakaoPayService.class]
	- naverPayService: defined in file [.../NaverPayService.class]


Action:

Consider marking one of the beans as @Primary, updating the consumer to accept multiple beans, or using @Qualifier to identify the bean that should be consumed
```

`@Autowired`는 타입 다음으로 이름을 체크하기 때문에 주입되는 인자의 변수명을 빈의 이름과 맞춰줌으로써 원하는 의존성을 주입해 줄 수는 있다. (`@Component`로 빈 등록을 하게 되면 빈 이름은 클래스 이름에서 맨 앞 글자만 소문자로 바뀐 이름으로 등록된다.)

```java
@Controller
public class PayController {
    private final PayService payService;
    
    public PayController(PayService naverPayService) {
        this.payService = naverPayService;
    }
    ...
}
```
이렇게 `naverPayService`로 매개변수명을 바꿔주면 `NaverPayService` 빈이 주입이 되어 정상적으로 컴파일되게 된다. 하지만 이렇게 변수명을 이용하여 의존성을 주입하는 것은 의존성을 변경하는 경우, 굳이 인터페이스로 타입을 추상화 하는 의미가 있을까? 게다가 만약 스프링 DI를 사용하지 않고 `KaKaoPayService`를 직접 주입해주는 상황이 발생한다고 생각해보자. `naverPayService`라는 파라미터 자리에 `KaKaoPayService`가 들어가야 한다. 때문에 별로 권장하고 싶은 방법이 아니다.

이런 상황을 위해 스프링은 `@Qualifier`와 `@Primary` 라는 어노테이션을 제공한다. 둘 모두 타입이 같은 빈이 여러 개 있을 경우 의존성을 주입하는 기준을 제시해주는데, 둘을 비교해보자.

### @Primary vs @Qualifier

> Because autowiring by type may lead to multiple candidates, it is often necessary to have more control over the selection process. One way to accomplish this is with Spring’s `@Primary` annotation. `@Primary` indicates that a particular bean should be given preference when multiple beans are candidates to be autowired to a single-valued dependency. If exactly one primary bean exists among the candidates, it becomes the autowired value.
>
> 타입을 기반으로 한 의존성 자동 주입은 여러 후보로 이어질 수 있으므로 선택 프로세스를 더 많이 제어해야 하는 경우가 많다. 이를 수행하는 한 가지 방법은 Spring의 `@Primary` 어노테이션을 사용하는 것이다. `@Primary`는 여러 빈이 단일 값 의존성에 자동 연결될 후보인 경우 특정 빈에 우선 순위를 부여해야 함을 나타낸다. 후보 중 정확히 하나의 기본 빈이 존재하는 경우 자동 연결된 값이 됩니다.

`@Primary` 어노테이션은 이름에서 알 수 있듯이 "이 빈을 기본으로 주입해줘라." 라는 의미를 부여해주는 어노테이션이다. 빈을 등록할 때 붙여서 해당 빈이 같은 타입의 빈 중 가장 높은 우선순위를 가진다고 명시해준다.

```java
@Service
@Primary
public class NaverPayService implements PayService {
}
```

이렇게 `NaverPayService`에 `@Primary` 어노테이션을 붙여주게 되면, `PayService`를 주입받을 때 필드명을 변경해주지 않더라도 `NaverPayService`를 주입받을 수 있다.

```java
@Controller
public class PayController {
    private final PayService payService;
    
    public PayController(PayService payService) {
        this.payService = payService;
    }
    ...
}
```

이제 이 코드는 정상적으로 컴파일되며, `NaverPayService`의 인스턴스가 `PayController`에 주입된다.

그렇다면 `@Qualifier` 어노테이션은 무엇일까?

> `@Primary` is an effective way to use autowiring by type with several instances when one primary candidate can be determined. When you need more control over the selection process, you can use Spring’s `@Qualifier` annotation. You can associate qualifier values with specific arguments, narrowing the set of type matches so that a specific bean is chosen for each argument.
>
> `@Primary`는 하나의 기본 후보를 결정할 수 있는 경우 여러 인스턴스에서 자동 주입을 사용하는 효과적인 방법이다. 선택 프로세스를 더 많이 제어해야 하는 경우 Spring의 `@Qualifier` 어노테이션을 사용할 수 있다. 한정자 값을 특정 인수와 연관시켜 유형 일치 세트를 좁혀 각 인수에 대해 특정 빈이 선택되도록 할 수 있다.

`@Qualifier` 어노테이션은 컨테이너가 한 타입에 대해 여러 빈을 찾았을 때, 그 빈들 중 어떤 빈을 선택할 지 기준을 부여해주는 어노테이션이다. `@Primary`는 기본 빈을, `@Qualifier`는 선택 기준을 제공한다는 차이가 있다.

```java
@Service
@Qualifier("mainPayService")
public class NaverPayService implements PayService {
}

@Controller
public class PayController {
    private final PayService payService;
    
    public PayController(@Qualifier("mainPayService") PayService payService) {
        this.payService = payService;
    }
    ...
}
```

빈 등록시에 `@Qualifier("이름")` 어노테이션으로 선택 기준 이름을 등록해주고, 빈을 주입받는 곳에서 `@Qualifier("이름")`으로 원하는 선택 기준을 넣어주면 해당 이름으로 `@Qualifier`가 등록된 빈을 찾아서 주입해준다. 위 코드의 경우, `mainPayService`라는 이름으로 `NaverPayService`를 빈 등록했고, 생성자 매개변수로 `@Qualifier("mainPayService")`로 `mainPayService`를 찾아오라고 지정해 주었기 때문에 `NaverPayService`가 주입되게 된다.

`@Qualifer` 어노테이션은 `@Primary` 어노테이션보다 우선순위를 가지기 때문에, 주입하려는 타입의 빈들 중 `@Primary`가 붙어 있는 빈이 있더라도 무시하고 `@Qualifier`를 기준으로 의존성을 주입해준다.

정리하자면, `@Autowired`를 이용한 의존성 주입 시 컨테이너의 빈 탐색 기준은

- 타입을 기준으로 검색
- 해당 타입에 대해 등록된 빈이 여러 개일 경우 `@Qualifier`가 지정되어 있는 지 확인
- `@Qualifier`가 없으면 `@Primary`로 지정된 빈이 있는지 확인
- `@Primary`도 없으면 매개변수 이름을 기준으로 빈을 확인

이 된다.

> **참고 자료**
>
> [Spring.io - Core Technologies](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html)  
> [[Spring] 애플리케이션 컨텍스트(Application Context)와 스프링의 싱글톤(Singleton)](https://mangkyu.tistory.com/151)  
> [[Spring] SpringBoot 소스 코드 분석하기, 애플리케이션 컨텍스트(Application Context)와 빈팩토리(BeanFactory) - (2)](https://mangkyu.tistory.com/210)  
> [@Autowired에서 이름을 이용한 의존 설정을 선호하지 않는 이유?](https://javacan.tistory.com/entry/Reason-Why-I-dont-use-name-based-Autowiring)  
> 토비의 스프링 3.1, Vol.1  
