---
title: "[Java Generic] (2) 사용할 때 주의해야 할 것"
date: 2022-04-17
update: 2024-02-11
tags:
  - Java
---

1편에서 제네릭의 기초적인 사용법과 작동 원리를 보았다. 하지만 우리는 아직 어떤 상황에서 어떻게 제네릭을 사용해야 효과적인 사용이 될지 알지 못한다. 2편에서는 제네릭의 실체화, 가변성, 한정적 와일드카드 등의 키워드를 통해 제네릭의 효과적이 사용 방법을 알아보는 시간을 가져보자.

## 제네릭을 실체화 하기

자바의 제네릭은 기본적으로 실체화 불가 타입이다. 따라서 제네릭을 가지고 객체, 배열을 생성할 수 없으며 클래스 리터럴로 사용을 할 수 없다. 당연하게도, 제네릭은 여러 타입을 포괄적으로 사용하기 위해 만든 것이지 그 자체로 어떤 클래스 정보가 들어있는 것이 아니기 때문이다.

```java
T genericVar = new T(); // 불가능하다.
T[] arr = new T[]; // 불가능하다.
Class<?> c = T.class; // 불가능하다.
```

그렇다면 이런 문제가 생긴다. 기본적으로 컬렉션은 자바에서 기본적으로 제공하는 자료형이 아니다. 따라서 컬렉션을 만들려면 자바에서 제공하는 기본 타입인 배열을 사용해야 한다. 하지만 바로 전에 제네릭으로는 배열을 생성할 수 없다고 말했지 않은가? 그렇다면 어떻게 해야 할까?

우선 제네릭을 사용하지 않고 컬렉션을 만들어보자.

```java
public class Stack {
    private Object[] elements;
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;
    
    public Stack() {
        elements = new Object[DEFAULT_INITIAL_CAPACITY];
    }
    
    public void push(Object item) {
        ensureCapacity();
        elements[size++] = item;
    }
    
    public Object pop() {
        if (size == 0) throw new EmptyStackExcetpion();
        Object result = elements[--size];
        elements[size] = null;
        return result;
    }
    
    ...
}
```

하지만 이 Stack은 push로 넣은 데이터의 타입과 pop으로 꺼내려는 데이터의 타입이 다르면 ClassCastException이 발생하게 된다. 따라서 이 Stack을 제네릭을 사용하는 클래스로 바꾸어줘야 한다.

이제 이 클래스를 제네릭으로 바꾸려고 하면, 문제가 발생한다.

```java
public class Stack<E> {
    private E[] elements;
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;
    
    public Stack() {
        elements = new E[DEFAULT_INITIAL_CAPACITY]; // 컴파일 에러 발생
    }
    
    public void push(E item) {
        ensureCapacity();
        elements[size++] = item;
    }
    
    public E pop() {
        if (size == 0) {
            throw new EmptyStackException();
        }
        E result = elements[--size];
        elements[size] = null;
        return result;
    }
    
    ...
}
```

E[] 타입의 배열을 생성하려고 하니 제네릭이 컴파일 불가 타입이어서 컴파일 에러가 발생한다. 따라서 이렇게 제네릭을 활용한 배열을 사용해 주려면 컴파일러를 속이는 우회 방법을 사용해야 한다.

- 배열을 Object 배열로 생성하고 제네릭으로 형변환

```java
@SuppressWarnings("unchecked")
public Stack() {
    elements = (E[]) new Object[DEFAULT_INITIAL_CAPACITY];
}
```

E[] 타입으로 실체화가 불가능하니, 우선 Object[] 타입으로 생성을 해두고 E[] 타입으로 비검사 형변환을 해주는 방법으로 우회할 수 있다. 이렇게 하려면 생성자에서 elements를 초기화 하는 부분만 제네릭을 쓰기 전 코드처럼 Object 배열을 생성해준 뒤 앞에 E[] 로의 형변환, 그리고 메서드 위에 @SuppressWarnings("unchecked") 를 사용해 주기만 하면 된다.

이 방법을 사용하면 어쨌든 elements의 타입은 E[] 이기 때문에 E타입만 받을 수 있음을 명시할 수 있다는 장점이 있고(타입 안전), 형변환도 최초 객체 생성 시 1회만 해주면 된다는 장점이 있다. 하지만 E[] 타입으로 선언을 해도 타입 소거 때문에 런타임에는 Object[]로 동작하며, 이로 인해 힙 오염의 가능성이 존재한다는 단점이 있다.(힙 오염에 대해서는 후술하겠다.)

- 배열의 타입을 Object 배열로 바꾸고 실제 사용 시에 제네릭으로 형변환

```java
public E pop() {
    if (size == 0) throw new EmptyStackException();
    
    @SuppressWarnings("unchecked")
    E result = (E) elements[--size];

    elements[size] = null;
    return result;
}
```

어차피 Object는 E의 상위 타입일 테니 elements 배열이 Object[] 타입이어도 push 메서드에서 E를 집어넣는데는 문제가 없다. 다만 Object[] 이기 때문에 꺼낼 때 Object 타입으로 꺼내진다는 문제가 있는데, 이 부분을 실제로 데이터를 꺼내는 pop 메서드에서 형변환을 통해 E 타입으로 바꿔주는 방법이다. 컴파일러는 이 형변환을 안전하지 않은 형변환으로 취급한다. 그러나, 우리는 어차피 push할 때 E 타입만 허용하도록 구현했으니 elements 내의 모든 데이터는 E 타입임이 보장되어 있으므로(주의: 위에서 구현한 push 외에 배열에 데이터를 집어넣는 메서드가 구현되어 있거나, 배열에 대한 setter가 외부로 노출되어 있거나, 배열 자체가 외부로 노출되어 있다면 이는 보장할 수 없다.), 이 데이터는 타입 안전하며 비검사 경고는 무시할 수 있다.

이 방법을 사용하면 힙 오염의 가능성이 원천 차단된다는 장점이 있다. 하지만 메서드 호출 시 마다 타입 캐스팅을 해주어야 한다는 단점이 존재한다.

## 힙 오염(Heap Pollution)

그래서 대체 힙 오염이 뭔데? 라고 생각할 수 있다. 힙 오염이란 매개변수 유형이 다른 서로 다른 타입을 참조할 때 발생하는 문제로, 컴파일은 되지만 런타임에 문제가 생기게 된다(ClassCastException의 발생). 예를 들어, List<Integer\> a 를 선언해놨는데, List<String\> 으로 선언된 다른 변수 b가 a를 참조할 경우, a는 int의 list이므로 int를 넣고 꺼내야 하고, b는 String list이기 때문에 String을 넣고 꺼내야 한다. 하지만 a와 b의 참조 대상이 같으므로 a에 int를 넣고 b에서 꺼낼 때는 String으로 꺼낼 수 있는 등 실제로 넣고 꺼내는 타입이 달라질 수 있다. 이 경우, List<String\>에서 String으로 꺼내므로 컴파일은 정상적으로 되지만, 실제 데이터가 int이므로 ClassCastException이 발생하게 된다.

## 제네릭 메서드를 사용하기

```java
public static <T>
int binarySearch(List<? extends Comparable<? super T>> list, T key) {
    if (list instanceof RandomAccess || list.size() < BINARYSEARCH_THRESHOLD)
        return Collections.indexedBinarySearch(list, key);
    else
        return Collections.iteratorBinarySearch(list, key);
}
```

이번에는 제네릭을 클래스 단위가 아닌 메서드에서도 사용해보자. Collections.binarySearch 메서드는 제네릭을 사용해 작성되어있다. 일반적으로 리스트에서 이진 탐색을 하기 위해서는 리스트 내부 원소의 타입이 다 같아야 하고 비교 정렬할 수 있어야 하며, 찾으려는 원소와 같은 타입이어야 한다. 하지만 리스트의 구성 요소와 찾으려는 요소의 타입이 같기만 하면 될 뿐 이 타입을 특정지어줄 필요는 없다. 따라서 타입을 제네릭으로 만들어서 사용해줄 필요가 있다.

메서드에 제네릭을 사용할 때도 클래스에 제네릭을 사용했던 것 처럼 타입이 오는 자리에 제네릭을 넣어주면 된다. 다만, 메서드에 제네릭을 사용할 때는 메서드의 제한자와 반환 타입 사이에 타입 매개변수 목록을 넣어주어야 한다는 것을 잊지 말아야 한다.

예를 들어, 앞선 binarySearch에서

```java
public static
int binarySearch(List<? extends Comparable<? super T>> list, T key) {
    ...
}
```

와 같이 public static과 int 사이에 <T\>를 쓰지 않게 되면 Cannot resolve symbol 'T' 라는 경고가 뜨며 컴파일 할 수 없게 된다.

만약 메서드에 여러 개의 서로 다른 제네릭 타입을 사용해야 한다면 사용하는 모든 타입 매개변수를 <\> 사이에 넣어서 명시해주어야 한다.

단, 클래스가 제네릭을 사용하는 클래스라면, 메서드에서 같은 제네릭을 사용할 때는 타입 매개변수를 지정해주지 않아도 된다.

```java
public class Stack<E> {
    private E[] elements;

    ...
    public E pop() {
        if (size == 0) {
            throw new EmptyStackException();
        }
        E result = elements[--size];
        elements[size] = null;
        return result;
    }

    ...
}
```

pop 메서드는 E라는 타입을 반환한다. 위에서 본 제네릭 메서드 규칙에 의하면 public <E\> pop() 이 되어야 할 것 같지만, Stack 클래스 선언 자체에 지정된 E 타입을 사용해주기 위해 매겨변수 목록으로 <E\>를 넣어주게 되면 오히려 기존에 클래스에서 유지하고 있던 제네릭 E와 같은 타입이 아니라고 판단하게 된다.

그러나 제네릭을 사용하는 클래스 내에 정의된 메서드라 하더라도, static으로 선언된 메서드는 반드시 타입 매개변수 목록을 작성해주어야 한다. 생각해보면 당연한 이야기인데, 클래스에 들어오는 제네릭의 타입은 객체가 생성되는 시점에 정해지는데 반해 정적 메서드는 객체의 생성 시점보다 이전에 생성되므로, 해당 클래스가 사용하는 제네릭의 타입을 알아낼 수 없기 때문이다.
  
## 제네릭과 타입의 제한

기본적으로 제네릭에 참조 타입만 들어올 수 있다는 제약 외에 제네릭의 타입 제약은 없다. 참조 타입이기만 하면 어떤 타입이든지 제네릭으로 들어올 수 있다. 그렇다면 기본 타입은? 자바에는 기본 타입을 참조 타입으로 사용할 수 있도록 박싱된 클래스들(int - Integer, long - Long, float - Float, double - Double)이 존재하기 때문에 해당 클래스들을 사용해 참조 타입만 사용할 수 있다는 제약을 우회할 수 있다. 하지만 만약 참조 타입 중에서도 특정 타입만 받고 싶을 경우에는 타입을 제한할 방법이 필요하다.

제네릭의 타입 제한을 사용하기 위해서는 우선 변성(variance)에 대해 이해할 필요가 있다. 변성에는 공변(covariant)와 반공변(contravariant)이 존재한다. 무슨 뜻일까?

제네릭 타입 S와 T가 있고, T가 S의 하위 타입이라고 하자. S와 T를 사용하는 Container라는 컬렉션 클래스가 있을 때, T와 S의 하위 타입일 때 Container<T\>가 Container<S\>의 하위 타입임이 보장된다면 이를 공변적이라고 표현한다. 하위 클래스로 대체가 가능하면 공변, 상위 클래스로 대체가 가능하면 반공변 이라고 이해하면 쉽다.

기본적으로 자바의 제네릭은 불공변, 또는 무공변(invariant)이다. 즉, 타입 S와 T가 상속관계여도, Container<S\>와 Container<T\>는 아무런 관계가 없다.

예를 들어보자. Object와 String은 기본적으로 상속관계다. 또한 자바의 배열은 공변이기 때문에 Object[]와 String[]도 상속 관계를 가지고 있다. 즉, Object[] 자리에 String[]이 들어올 수 있다는 이야기다. 하지만 제네릭을 사용하는 제네릭 컬렉션의 경우는 다르다. List<Object\> 자리를 List<String\>이 대체할 수 없다.

하지만 불공변인 제네릭이라도 공변성과 반공변성을 만들어줄 수 있다. 바로 한정적 와일드카드를 사용하는 방법이다.

자바 API를 보다보면 제네릭 자리에 ?가 들어간 것을 볼 수 있을 것이다.

```java
public static <T>
int binarySearch(List<? extends Comparable<? super T>> list, T key) {
    if (list instanceof RandomAccess || list.size()<BINARYSEARCH_THRESHOLD)
        return Collections.indexedBinarySearch(list, key);
    else
        return Collections.iteratorBinarySearch(list, key);
}
```

앞서 제네릭 메서드의 예시로 들었던 binarySearch 메서드를 다시 가져와보자. 이진 탐색을 하기 위해서는 기본적으로 탐색하려는 컬렉션 내의 원소들이 모두 특정한 기준에 의해 비교 및 정렬이 가능해야 한다. 앞서 binarySearch 예시를 들면서 모두 같은 타입의 원소를 비교해야 하므로 제네릭을 사용해 준다고 했는데, 만약 이 때 제네릭에 들어오는 타입이 비교가 불가능한 타입이라면? 당연히 비교가 불가능하다. 따라서 타입을 Comparable을 구현한 타입으로 제한해 줄 필요가 있는데 그 역할을 한정적 와일드카드가 해준다.

한정적 와일드 카드에는 extends와 super 두 가지를 이용해서 공변, 반공변을 나타낼 수 있다.

- 공변 (? extends T 형태)
  - ? 자리에 T를 상속받은 타입만 올 수 있다.
  - T로 타입 업캐스팅한 데이터는 read-only 이므로 런타임에서 잘못된 형변환을 걱정할 필요가 없다.

- 반공변 (? super T 형태)
  - ? 자리에 T의 상위 타입만 올 수 있다.
  - T로 타입 다운캐스팅한 데이터는 write-only 이므로 런타임에서 잘못된 형변환을 걱정할 필요가 없다.
  
### Producer Extends, Consumer Super

이펙티브 자바의 저자 조슈아 블로크는 이에 대해 PECS라는 공식으로 정리했다. 이는 Producers Extends, Consumer Super의 줄임말로, 매개변수화 타입 T가 데이터를 공급하는 역할이라면 extends를, 데이터를 소비 역할이라면 super를 사용하라는 공식이다. 앞서 만들었던 제네릭 Stack에 pushAll 메서드를 만들어서 알아보자.

```java
public class Stack<E> {
    ...
    public void pushAll(Iterable<E> src) {
        for (E e : src) {
            push(e);
        }
    }
}
```

한정적 와일드카드를 사용하지 않고 pushAll 메서드를 만들었다. 이 경우에 문제가 되는 것은, 만약 Stack을 Stack<Number\>로 생성해놓고 pushAll에 Number의 하위 타입인 Integer의 Iterable을 넣었을 때 컴파일 에러가 난다는 것이다. 단순히 생각해보면 Integer는 Number의 하위 타입이므로 Number의 Stack에 넣어도 문제가 없어야 할 텐데, 제네릭이 불공변이기 때문에 컬렉션 사이에는 상하위 타입 관계가 존재하지 않아서 생기는 문제다.

따라서 한정적 와일드카드를 사용해 주어야 하는데, PECS 공식에 따르면 pushAll의 매개변수인 src가 Stack에 데이터를 공급(Produce)하므로 PE, extends를 사용해주면 된다.

```java
public void pushAll(Iterable<? extends E> src) {
    for (E e : src) {
        push(e);
    }
}
```

반대의 경우, 즉 CS의 경우도 살펴보자. 이번에는 popAll 이라는 메서드를 만들어보자.

```java
public void popAll(Collection<E> dst) {
    while (!isEmpty()) {
        dst.add(pop());
    }
}
```

이 경우, Stack이 Number형을 받도록 생성되어 있다면, Object는 Number의 상위 타입이지만 Object 타입을 받는 컬렉션으로는 popAll을 호출할 수 없다. pushAll 때와 마찬가지로 제네릭의 불공변성 때문에 불가능하다. PECS 공식에 맞추어 메서드를 바꿔보자. 매개변수로 들어가는 dst는 Stack 클래스의 데이터를 소비(consume)하므로 CS, super를 해주면 된다.

```java
public void popAll(Collection<? super E> dst) {
    while (!isEmpty()) {
        dst.add(pop());
    }
}
```

그렇다면 왜 이런식으로 작동하는걸까? 

위에서 정리한 부분을 다시 보자. 공변의 형태에서는 T로 타입 업캐스팅한 데이터가 read-only이고, 반공변의 형태에서는 T로 타입 다운캐스팅한 데이터는 write-only 이므로 런타임에서 잘못된 형변환을 걱정할 필요가 없다고 했다.

먼저 공변의 경우를 살펴보자. PE의 경우, 즉 데이터를 공급해주는 경우에는 하위 타입이기만 하면 어떤 타입이든지 집어 넣어줘도 상관이 없다. 왜냐하면 하위 타입은 이미 상위 타입이 가지고 있는 모든 요소를 가지고 있기 때문이다. 불공변이 아닌 공변성을 가지고 있는 배열에 빗대어 살펴보면, Object[] 배열에는 Object의 하위 타입인 어떤 타입도 들어갈 수 있다.

반공변의 경우, 데이터를 소비하는 경우에는 해당 데이터의 상위 타입으로 꺼내주기만 하면 어떤 타입으로 꺼내주든 상관이 없다. 마찬가지로 배열에 빗대어 살펴보면, String[] 배열에 있는 데이터를 꺼내면서 Object로 형변환 해주어도 아무런 문제가 생기지 않는다. 이 역시 하위 타입은 상위 타입이 가지고 있는 모든 요소를 가지고 있기 때문이다.

하지만, 만약 데이터 공급의 경우에 상위 타입을 넣어준다면? String[] 배열에 Object 타입을 넣어준다고 생각해보자. 전혀 자연스럽지 않고 실제로 Object 타입이 본래 String 타입이 아니라면 예외가 발생할 것이다. 제네릭의 경우도 마찬가지다.

```java
public void pushAll(Iterable<? super E> src) {
    for (E e : src) {
        push(e);
    }
}

---

Stack<Number> stack = new Stack<>();
List<Object> objects = List.of(new Object(), new Object());
stack.pushAll(objects);
```

만약 공급자의 경우에 super가 허용된다면 위와 같은 코드가 가능해야 한다. 이 경우, 앞서 배열에서 언급했던 것 처럼 Number 타입의 컬렉션에 더 상위의 타입인 Object 타입을 넣어주게 된다. 그런데, pushAll에 넣어준 objects 안의 데이터들은 Number로 치환할 수 없는 Object 타입이다. (Number -> Object -> Number 의 타입캐스팅 과정을 거치지 않았으므로) 따라서 ClassCastException이 발생할 것이다.

```java
public void popAll(Collection<? extends E> dst) {
    while (!isEmpty()) {
        dst.add(pop());
    }
}

---

Stack<Number> stack = new Stack<>();
List<Integer> ints = new ArrayList<>();
stack.popAll(ints);
```

소비자의 경우에 extends가 허용되는 경우도 생각해보자. extends가 허용된다면 위와 같은 코드가 가능해야 한다. 이 경우, Integer 타입의 컬렉션에 더 상위의 타입인 Number 타입이 들어가게 된다. 이 역시 타입 캐스팅에 오류가 발생하게 된다.

때문에 한정적 와일드카드를 사용할 때는 기억하자. Producer Extends, Consumer Super.

## 제네릭과 가변인수

제네릭을 사용할 때 또 하나의 주의할 점이 있다. 바로 가변인수로 제네릭을 사용할 때는 반드시 주의해야 한다는 점이다. 이는 제네릭이 실체화 불가 타입임에서 기인한다. 제네릭과 같은 실체화 불가 타입은 런타임에 컴파일타임보다 타입 정보가 적다. 때문에 메서드의 선언 시 실체화 불가 타입으로 가변인수 매개변수를 선언하거나, 가변인수 메서드를 호출할 때 매개변수가 실체화 불가 타입으로 추론 될 경우 힙 오염이 발생할 수 있다. 다음의 코드를 보자.

```java
public static void dangerous(List<String>... stringLists) {
    List<Integer> integers = Collections.singletonList(42);
    Object[] objects = stringLists;
    objects[0] = integers;              // 힙 오염 발생
    String s = stringLists[0].get(0);  // ClassCastException
}
```

이 코드는 문제없이 컴파일이 되며, 명시적인 형변환을 해주지 않았음에도 불구하고 ClassCastException이 발생한다. 이는 사실 이 코드의 마지막 줄에 컴파일러가 임의로 해주는 형변환이 숨겨져 있기 때문으로, 그로 인해 힙 오염이 발생하여 예외가 발생하게 된다.

가변인수로 들어오는 인수들은 자동으로 배열로 바뀌어서 들어온다. 그런데 앞서 제네릭 클래스를 만드는 예시에서 언급했듯이, 실체화 불가 타입인 제네릭으로는 배열을 생성할 수 없다고 하지 않았는가? 하지만 이 경우에는 허용된다. 제네릭을 가변인수에 허용하므로써 얻는 이득이 더 크기 때문이다.

다만 위에 보이는 코드처럼 힙 오염의 가능성이라는 부작용을 내포하고 있기 때문에, 메서드를 작성 및 사용할 때 타입 안정성이 깨지지 않도록 설계해 줄 필요가 있다.

실제로 제네릭 가변인수를 사용하는 Arrays.asList, Collections.addAll과 같은 메서드들은 타입 안전이 보장되어 있어 문제 없이 사용할 수 있다.

제네릭 가변인수를 사용할 경우에는 컴파일러의 경고가 발생하기 때문에, 원래는 @SuppressWarnings("unchecked")로 경고를 숨겨줘야 했다. 자바 7부터는 @SafeVarargs라는 어노테이션이 생겨서 메서드 작성자가 직접 타입 안전을 보장할 수 있다. 다만 반드시 메서드 작성자가 타입 안전을 보장할 수 있을때만 사용할 수 있어야 한다는 주의점이 있다.

그렇다면 타입 안전을 어떻게 보장할 수 있을까? 여기에는 몇 가지 조건이 있다.
앞서 가변인수 메서드는 가변인수로 들어오는 매개변수들을 배열로 만든다고 했는데, 메서드가 이 배열에 아무것도 저장하지 않아야 한다. 즉, 매개변수들을 새로 덮어쓰거나 하는 일이 없어야 한다. 또한 가변인수를 담은 배열의 참조가 밖으로 노출되어서는 안된다. 이는 다시 말하자면 신뢰할 수 없는 코드가 배열에 접근하지 못하도록 해야 한다는 것을 의미한다.

정리하자면, 매개변수 배열이 순수하게 인수를 전달하는 역할을 했을때만 타입 안전하다고 볼 수 있다.

그런데 매개변수를 새로 덮어쓰는 일만 안하면 되지 왜 참조가 밖으로 노출되어서는 안된다고 하는 것일까? 이는 제네릭을 담기에 가장 구체적인 타입이 Object이므로 제네릭 배열이 자동으로 Object 배열이 되기 때문이다. 이 Object 배열을 String 배열과 같은 다른 참조 대상으로 지정하려고 하면 당연히 Object[]를 String[]으로 캐스팅할 수 없으므로 ClassCastException이 발생하여 안전하지 않은 메서드가 된다. 단, 이 경우에도 @SafeVarargs가 제대로 사용된 다른 타입 안전 메서드에 넘겨주거나, 배열 참조를 넘겨주더라도 가변인수 메서드 내에서 배열의 일부를 일반 매개변수 메서드에 넘겨주게 되면 안전하다.

```java
@SafeVarargs
public static <T> List<T> flatten(List<? extends T>... lists) {
     List<T> result = new ArrayList<>();
     for (List<? extends T> list : lists)
         result.addAll(list);
     return result;
 }
```

위 코드는 List 여러개를 가변인수로 받지만, 가변인수로 들어온 배열을 돌면서 List 하나 하나씩을 addAll 메서드에 인자로 넘겨준다. List.addAll 메서드는 가변인수 메서드가 아니고, list의 요소의 타입과 result의 요소의 타입이 extends T 로 타입 안전이 보장되므로 이 메서드는 타입 안전하다고 볼 수 있다.

정리하자면 제네릭을 가변인수 메서드에 사용하고 싶을 때는 반드시 타입 안전하도록 만들고, @SafeVarargs 어노테이션을 사용하여 해당 메서드 사용자에게 타입 안전이 보장됨을 알려주도록 하자.

---

## 참고 자료
> 이펙티브 자바
https://intrepidgeeks.com/tutorial/understand-and-overcome-janericks-limitations-and-precautions
https://asuraiv.tistory.com/16
https://sabarada.tistory.com/123
https://sabarada.tistory.com/124