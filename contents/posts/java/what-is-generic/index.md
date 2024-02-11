---
title: "[Java Generic] (1) 제네릭은 무엇인가"
date: 2022-03-18
update: 2024-02-11
tags:
  - Java
---

## Generic, who are you?

제네릭(Generic). 사전을 찾아보면 `신약으로 개발한 약이 특허 기간이 만료되어 동일 성분으로 다른 회사에서 생산하는 약. 제형이 같을 수도 다를 수도 있지만, 약효 동등성이나 생동성 실험을 거쳐 생산되므로 약효는 본래의 약과 동일하다.` 라고 한다. 물론 지금 말하고자 하는 제네릭이 저거일 리는 없다. ~~나는 개발자지 약사가 아니다.~~

자바에서 말하는 제네릭도 사실 의약에서 말하는 제네릭과 그 의미 자체는 비슷하다고 할 수 있다. 제네릭을 직역하면 무엇인가?

> 1.포괄적인, 총칭[통칭]의  
‘Vine fruit’ is the generic term for currants and raisins.  
‘덩굴 열매’는 currants (작은 씨 없는 포도를 말린 건포도)와 raisins (조금만 말린 건포도)를 총칭한다. 
> 
> 2.회사 이름이 붙지 않은, 일반 명칭으로 판매되는  
The doctor offered me a choice of a branded or a generic drug.  
의사가 내게 상표명이 붙은 약이나 일반 약품 중에서 하나를 선택하라고 했다.

그렇다. 제네릭은 포괄적이라는 뜻이다. 그래서 약품의 제네릭이 "동일 성분을 가진 포괄적인 약품"을 가리키느라 제네릭이라는 단어를 쓰는 걸 지도 모르겠다.

다시 본론으로 돌아와서, JDK 1.5부터 도입된 자바의(물론 자바에서만 쓰이는 개념은 아니다.) 제네릭(포괄적)은 어떤 의미로 쓰이는 걸까? 답은 바로 **포괄적(일반화된) 타입**이다. 좀 더 쉽게 풀어서 말하자면 특정 타입을 미리 지정하는 것이 아니라 일반화(generalize)해서 사용하는 것이라고 할 수 있다. 제네릭을 사용하면 클래스 내부에서 사용할 타입을 외부에서 정의해줄 수 있다. 우리가 흔히 쓰는 List 타입을 보자. 라이브러리에 정의된 List 타입을 따라가 보면 다음과 같이 정의되어 있다.

```java
public interface List<E> extends Collection<E> {
    ...
}
```

List에서 <>안에 들어간 E가 바로 제네릭이다. 그렇다. 우리는 그동안 의식하지 않고도 제네릭을 사용하고 있었다.

## 제네릭은 왜 필요한가?

제네릭이 없다고 가정하자. 우리는 List 안에 들어갈 데이터의 타입을 정의하고 싶다. 만약 제네릭이 없다면 String을 가지는 List, int를 가지는 List... List 안에 들어갈 타입이 늘어날 때 마다 새로운 List를 정의해 주어야 한다. 또는, 모든 클래스의 상위 타입인 Object 타입을 가지는 List를 만들어야 한다. (실제로 JDK 1.5 이전의 컬렉션 - 로(Raw) 타입 - 은 이런식으로 구현이 되어 있다.)

모든 타입에 대한 컬렉션을 새로 구현해 주는 것은 말도 안되는 일이고, 만약 제네릭이 없어서 Object의 컬렉션으로 구현하게 되면 문제가 뭘까?

```java
public class WithoutGeneric {
    public static void main(String[] args) {
        List rawList = new ArrayList();
        rawList.add(1);
        int data = (int) rawList.get(0);
    }
}
```

제네릭이 없을 경우 리스트 안에는 Object 타입으로만 들어가므로, 넣어 준 자료를 꺼내고 나서 다시 int 형으로 변환해 주어야 한다. 이렇게 매번 형변환을 해주면 문제가 뭘까? 우선 자료를 기존 자료형으로 add할 때 Object로 변환하고, Object형을 다시 꺼내서 기존 타입으로 형변환 하는 과정이 모두 리소스를 소모하는 과정으로, 성능을 떨어뜨리는 원인이 된다. 하지만 진짜 문제는 성능에 있지 않다. (사실 하드웨어의 성능이 어느 정도 이상 궤도에 오른 오늘날 이런 사소한 성능 문제보다도 중요한 부분들이 많으므로) 바로 안정성이다. (기존 타입) -> Object로는 더 상위의 타입으로 형변환 하므로 문제가 생기지 않지만, 자료를 꺼낼 때 Object -> (기존 타입)으로 형변환 하는 변환 과정은 문제가 생길 수 있다. 만약 int형을 넣었는데 꺼내서 명시적 형변환을 String으로 해준다면?

당연히 int형을 String으로 형변환 하려고 하니 <span style="color:red">ClassCastException</span> 이 발생할 것이다. 만약 이 과정을 컴파일러가 잡아낼 수 있다면 차라리 다행이다. 컴파일 에러는 어플리케이션이 아예 돌아가지 않고 오류를 체크할 수 있기 때문에 가장 저렴한 에러라는 것을 기억하자. 하지만 이 형변환 과정은 컴파일 과정에서 체크조차 할 수 없다. 결국 멀쩡히 돌아가던 프로그램이 이 형변환 하나로 인해 심각한 오류를 마주하게 될 것 이다.

```java
public class WithoutGeneric {
    public static void main(String[] args) {
        List rawList = new ArrayList();
        rawList.add(1);
        String data = (String) rawList.get(0);
    }
}
```

**놀랍게도 컴파일에는 문제가 없다!** 단지 int로 집어넣은 자료를 꺼내면서 String 타입으로 형변환하려고 하니 해당 라인에서 예외가 발생할 뿐이다.

> Exception in thread "main" java.lang.ClassCastException: class java.lang.Integer cannot be cast to class java.lang.String (java.lang.Integer and java.lang.String are in module java.base of loader 'bootstrap')  at WithoutGeneric.main(WithoutGeneric.java:9)

9번 라인 `String data = (String) rawList.get(0)` 에서 ClassCastException이 발생하는 것을 볼 수 있다. 이처럼 Object -> 하위 타입 으로의 형변환은 비검사 형변환으로 컴파일러가 검사할 수 없기 때문에 안전하지 않으며 런타임에서 예외를 유발한다.

이펙티브 자바 같은 책에서 로 타입을 사용하지 말라고 하는 이유가 다 이런 이유다.
  
## 제네릭의 사용

자, 그렇다면 안전하지도 않고 성능이 뛰어나지도 않은 저 컬렉션을 제네릭을 사용하는 방식으로 바꿔보자. 사용법은 간단하다. 클래스나 메서드를 작성할 때 **List<E\>**와 같이 <> 사이에 제네릭 타입을 집어넣어주면 된다. 실제 코드에서 사용할 때는 <> 자리에 사용하고자 하는 타입을 넣어주면 된다. (ex_ **List<Integer\>**)

<> 사이에 들어가는 타입의 이름은 크게 상관이 없으며, 일반적으로 대문자 한 글자로 사용하지만 반드시 한 글자만 사용해야 할 이유는 없다. 예를 들어 <E\>가 될 수도, <El\>가 될 수도 있다. 다만 일반적으로 널리 쓰이는 제네릭 타입들이 존재한다.

|**타입**|**설명**|
|:-:|-|
|**<T\>**|**타입(Type)**의 의미로 사용|
|**<E\>**|**원소(Element)**의 의미로 사용|
|**<K\>**|**키(Key)**의 의미로 사용|
|**<V\>**|**값(Value)**의 의미로 사용|
|**<N\>**|**숫자(Number)**의 의미로 사용|
|**<S\>, <U\>, <V\>**|**두 번째, 세 번째, 네 번째에 선언된 타입의 의미로 사용**|

또한 제네릭 자리에는 특별히 제한되어 있지 않다면 모든 참조 타입이 올 수 있다. int, double과 같은 기본 타입(Primitive)은 올 수 없다. 이 타입들을 사용하기 위해서는 박싱된 기본 타입인 Integer, Double 등을 사용해 우회해야 한다.

바로 사용해보자.

```java
public class WithGeneric {
    public static void main(String[] args) {
        List<Integer> genericList = new ArrayList<>(); // T 자리에 Integer가 들어감
        genericList.add(1);
        String data = genericList.get(0); // 컴파일 오류가 난다.
        String data2 = (String) genericList.get(1); // 마찬가지로 형변환도 안 된다.
    }
}
```

리스트를 제네릭 리스트로 만들어 줬더니, int로 집어넣은 자료를 String으로 꺼내려고 하니 타입이 다르다면서 컴파일이 되지 않는다. 그렇다고 String으로 강제로 형변환을 해주려고 하니 형변환도 되지 않는다. (상위 - 하위 타입 관계에서는 비검사 형변환이 가능하지만 int와 String 사이에는 불가능하다.) 이번엔 올바르게 사용해보자.

```java
public class WithGeneric {
    public static void main(String[] args) {
        List<Integer> genericList = new ArrayList<>(); // T 자리에 Integer가 들어감
        genericList.add(1);
        int data = genericList.get(0); // 컴파일 오류가 나지 않는다.
    }
}
```

컴파일 오류 없이 정상적으로 작동하며, 제네릭을 사용하지 않았을 때 처럼 올바른 타입으로 설정하더라도 형변환을 해줘야 하는 부가적인 작업이 없다. 제네릭 사용을 통해 우리는 불필요한 비검사 형변환을 제거했으며, 안전하지 않은 타입이 들어오는 것을 컴파일 시점부터 막아 타입 안정성을 확보했다.

## 제네릭의 작동 원리

분명히 클래스를 정의할 때는 **T** 라고 한 글자 넣었을 뿐인데 실제 코드에서 <> 안에 Integer를 넣어주니 Integer만 넣고 뺄 수 있는 컬렉션이 되었다. 대체 제네릭은 어떻게 동작할까?

### 뭐야 내 제네릭 돌려줘요

![](https://images.velog.io/images/ohzzi/post/33662f6c-968f-4a9e-b6db-394c9352a143/image.png)
~~_컴파일러: 이게 당신의 제네릭입니다
나: 뭐야 내 제네릭 돌려줘요_~~

제네릭의 동작을 알기 위해서는 먼저 타입 소거(Type Erasure)라는 개념에 대해 알아야 한다. 놀랍게도, 우리가 아무리 제네릭을 써줘도 실제 코드는 런타임에 타입에 대한 정보가 소거된다.

자바 컴파일러는 코드를 검사하여 타입 오류가 없으면 제네릭을 Object 타입으로 치환하여 소거한다.

```java
public class ArrayList<E> extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable {
    ...
    E elementData(int index) {
        return (E) elementData[index];
    }
    ...
}
```

이 코드가

```java
public class ArrayList extends AbstractList
        implements List, RandomAccess, Cloneable, java.io.Serializable {
    ...
    Object elementData(int index) {
        return elementData[index];
    }
    ...
}
```
이렇게 변한다. (타입 소거 이전의 코드에서 (E) 로 비검사 형변환을 해주는 부분이 있는 것에 대한 의문을 가질 수 있는데, ArrayList 안의 필드들은 기본적으로 Object로 선언되어 있어서 내보낼 때 형변환을 해주어야 한다. 이에 대한 이유와 형변환 방법 역시 다음 게시물에서 후술하도록 하겠다.)

다시 말하자면 앞서 신나게 까댔던 로 타입과 마찬가지로 제네릭을 사용한 모든 타입이 Object 타입으로 변한다는 소리다. (Object 타입으로 변하지 않는 경우도 있는데, 이 경우에 대해서는 다음 게시물에서 후술하기로 한다.)

`아니 이게 무슨 소리야? 분명히 제네릭으로 타입 안정성을 확보한다며? 타입 정보를 소거하면 어떻게 안정성을 확보할건데?`

일단 진정하자. 런타임에 타입 소거를 한다고 해도, 컴파일 시점에 타입을 특정하여 안전하지 않은 타입이 들어오지 못하도록 하는 것 만으로 타입 안정성은 확보가 됐다. 런타임은 별개의 문제다. 코드를 다시 보자.

```java
public class WithoutGeneric {

    public static void main(String[] args) {
        List rawList = new ArrayList();
        rawList.add(1);
        String data = (String) rawList.get(0);
    }
}
```

앞서 이 코드가 왜 위험했을까? int -> Object -> String 이라는 잘못된 형변환을 컴파일러가 잡아내지 못하기 때문이다. 지금은 저 형변환이 컴파일러가 잡아내지 못하는 비검사 형변환이지만, 만약 data를 꺼낼 때 잘못된 타입이라고 컴파일러가 경고해 준다면? 사용자는 당연히 컴파일을 위해 올바른 타입인 int로 형변환을 할 것이다. 자, 그럼 문제는 사라졌다.

당연하지만, 컴파일 언어인 자바는 컴파일이 되고 나면, 런타임에서 임의로 "코드의 추가"는 불가능하다. 따라서 컴파일 시점에서 타입 안정성을 확보했다는 것은, 이후 런타임에서 타입을 신경쓰지 않고 사용이 가능하다는 소리다. 따라서 타입 소거를 하더라도 문제 없이 프로덕션을 실행할 수 있다.

여기서 하나의 중요한 의문이 들어야 한다.

`Object로 바꿨으면 꺼낼때도 Object인데 타입이 안 맞지 않나?`

이 의문이 들지 않았으면 안된다! 분명히 타입 소거를 하면서 `제네릭이 들어간 모든 타입을 Object로 치환하여 소거한다` 라고 했다. 따라서, 컬렉션에 들어가 있는 자료의 타입은 모두 Object가 된다. 앞서 제네릭이 없었을 적의 정상적으로 작동하는 코드를 가져와보자.

```java
public class WithoutGeneric {
    public static void main(String[] args) {
        List rawList = new ArrayList();
        rawList.add(1);
        int data = (int) rawList.get(0);
    }
}
```

rawList에는 Object로 들어가 있기 때문에 get을 해준 뒤 int로 비검사 형변환을 해주는 것을 볼 수 있다. 제네릭 사용 시에도 런타임에서는 rawList와 같은 형태로 바뀌기 때문에, 타입 소거 시에도 rawList처럼 형변환을 해주어야 한다.

### 그래서 돌려드렸습니다

자, 컴파일 시 지정된 타입을 Object로 바꿨으니, 돌려줄 때 다시 타입을 바꿔서 돌려줘야 한다. rawList에서는 이 일을 사용자가 직접 비검사 형변환을 통해 해줬다. 하지만 제네릭을 사용할 때는 그럴 필요가 없다. 컴파일러는 타입 소거 과정에서 필요한 형태, 즉 원래 제네릭에 넣어서 지정했던 타입의 형태로 자동 형변환을 해준다. 이게 무슨 소리냐면,

```java
public class WithGeneric {
    public static void main(String[] args) {
        List<Integer> genericList = new ArrayList<>();
        genericList.add(1);
        int data = genericList.get(0);
    }
}
```

이렇게 컴파일된 코드가,

```java
public class WithGeneric {
    public static void main(String[] args) {
        List genericList = new ArrayList();
        genericList.add(1); // Object가 int보다 상위 타입이니 들어가도 상관 없다.
        int data = genericList.get(0); // 아직 Object로 반환한다.
    }
}
```

타입 소거를 통해 이렇게 바뀌고,

```java
public class WithGeneric {
    public static void main(String[] args) {
        List genericList = new ArrayList();
        genericList.add(1);
        int data = (int) genericList.get(0); // Object -> int로 형변환
    }
}
```

이렇게 int로 형변환되어 사용된다. 이 모든 과정은 컴파일러가 자동으로 처리해주며, 사용자는 이런 과정에 대해 파고들어갈 필요가 없다.

마지막 코드에서 Object -> int의 형변환 역시 비검사 형변환이니 안전하지 않을 수 있는 것 아니야? 라고 할 수 있다. 하지만 다시 한번 생각해보면, 컴파일을 통과하고 런타임에 진입한 이상 우리는 모든 코드에서 타입에 대한 안정성을 확보했으므로, genericList는 무조건 int를 받아서 int를 내보낸다는걸 보장할 수 있다. 따라서 int data에 Object인 genericList.get(0)을 형변환해서 할당해주더라도 우리는 이 데이터가 int인지를 검사할 필요가 없다. 왜냐? 당연히 int니까. 물론 리플렉션을 통한 검사 등 예외 상황이 있지만 이는 일반적으로는 고려 할 필요가 없는 상황이며, 상황 별 우회 방법 또한 존재한다.

### 그런데 왜 귀찮게 타입 소거를 해요?

앞서 말했듯이 제네릭은 JDK 1.5부터 도입되었다. 그 말인 즉, JDK 1.4까지 작성했던 코드는 제네릭이 존재하지 않는다는 얘기다. 제네릭에 타입 소거가 없다면, 제네릭이 없는 코드와 있는 코드의 호환이 불가능하다. 따라서 자바는 하위 호환성을 위해 타입 소거라는 방식을 택했다. 애초에 타입 소거를 채택하지 않았다면 위에 말했던 리플레션을 통한 검사 등의 예외에 안전했겠지만, 처음 언어를 설계할 때 제네릭이라는 개념을 집어넣지 않은 자바로서는 어쩔 수 없는 선택이다. 제네릭이 1.5에 도입되었다고 1.4까지의 코드를 안드로메다로 보내버릴 수는 없는 법이니까.

---

지금까지 제네릭이 무엇인지, 어떤 원리로 작동하는 지에 대해 간단히 살펴보았다. 하지만 아직 제네릭에 대한 내용은 끝나지 않았다. 제네릭의 바인딩, 배열을 이용해 제네릭 컬렉션을 만드는 방법 등 심화된 내용이 남아있다. "그냥 무슨 타입이 올 지 모르니 미정으로 둔다" 라는 개념으로 쓸 때는 몰랐지만, 재네릭이란 녀석 정말 쉬운 개념이 아니다. 제네릭에 대한 더 자세한 내용은 다음 게시물에서 알아보도록 하자.

~~언제가 될 지는 모르지만~~