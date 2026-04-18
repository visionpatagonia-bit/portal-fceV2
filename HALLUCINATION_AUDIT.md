# KB Hallucination Audit
> **Generado por** `scripts/audit_hallucinations.py`
> **Total entries auditadas:** 138
> **Entries flaggeadas:** 44 (31.9%)
> **Desglose:** alta=22 · media=2 · baja=20

## Desglose por heurística

| Heurística | Conteo |
|---|---:|
| `H1_cross_domain` | 22 |
| `H2_generic_id` | 21 |
| `H3_template_patterns` | 10 |

## Desglose por materia

| Materia | Alta | Media | Baja |
|---|---:|---:|---:|
| Administración | 4 | 1 | 1 |
| Contabilidad | 0 | 0 | 7 |
| Sociales | 18 | 1 | 12 |

## Severidad ALTA (22 entries)

### `calidad_concepto` · Administración

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H1_cross_domain
  - `H1_cross_domain`: ['contabilid']
- **preview:** La **calidad** es la ventaja competitiva que traduce la capacidad que una empresa tiene para hacer las cosas correctas, según las necesidades del cliente, evitando pérdidas y retrabajo. En contabilida

### `confiabilidad_concepto` · Administración

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H1_cross_domain
  - `H1_cross_domain`: ['contabilid']
- **preview:** La **confiabilidad** es la ventaja competitiva de ser capaz de cumplir las promesas y garantizar que los productos o servicios se entreguen a tiempo y en condiciones correctas. En contabilidad se rela

### `etica_concepto` · Administración

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H1_cross_domain, H3_template_patterns
  - `H1_cross_domain`: ['contabilid']
  - `H3_template_patterns`: 3
- **preview:** La **ética** se refiere a la normativa moral que regula las acciones y decisiones de una persona. Es el conjunto de valores, principios y normas que guían nuestras acciones y comportamientos.  En cont

### `velocidad_concepto` · Administración

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H1_cross_domain
  - `H1_cross_domain`: ['contabilid']
- **preview:** La **velocidad** es la ventaja competitiva de producir más rápidamente determinado producto o servicio, así como de responder más rápidamente a las necesidades del cliente. En contabilidad se relacion

### `agentes_concepto_2` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H1_cross_domain, H2_generic_id
  - `H1_cross_domain`: ['contabilidad']
  - `H2_generic_id`: agentes_concepto_2
- **preview:** Los **agentes** son las personas o entidades que actúan dentro del universo social. En contabilidad, se utilizan para definir los diferentes tipos de agentes que pueden existir en una economía. Por ej

### `bourdieu_concepto_5` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H1_cross_domain, H2_generic_id
  - `H1_cross_domain`: ['contabilidad']
  - `H2_generic_id`: bourdieu_concepto_5
- **preview:** Pierre Bourdieu (1930-2002) fue un sociólogo, antropólogo y filósofo francés, conocido por sus estudios sobre la cultura, la educación y la sociología. Su obra se centró en el análisis de las relacion

### `bourdieu_concepto_7` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H1_cross_domain, H2_generic_id
  - `H1_cross_domain`: ['contabilidad']
  - `H2_generic_id`: bourdieu_concepto_7
- **preview:** Pierre **Bourdieu** (1930-2006) fue un sociólogo y antropólogo francés, conocido por sus estudios sobre la cultura, el poder social y los procesos de cambio social. Su obra más famosa es *El campo*, e

### `bourdieu_estado_concepto` · Sociales

- **generated_by:** `manual_patch:v19.30.5`
- **heurísticas:** H1_cross_domain
  - `H1_cross_domain`: ['cuenta']
- **preview:** Según **Pierre Bourdieu** (*Sobre el Estado*, clase del 18 de enero de 1990), el Estado se define por **la posesión del monopolio de la violencia física y simbólica legítima**.  Bourdieu rectifica la 

### `crédito_concepto` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H1_cross_domain
  - `H1_cross_domain`: ['patrimonio neto', 'contabilidad', 'crédito']
- **preview:** El **crédito** es una forma de financiamiento que se otorga a un individuo o empresa para realizar algún tipo de transacción. En general, el crédito se basa en la garantía de un valor que puede ser re

### `crédito_personalizado_concepto` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H1_cross_domain
  - `H1_cross_domain`: ['crédito']
- **preview:** El **crédito personalizado** es un concepto en economía que se refiere a la cantidad de dinero que se puede obtener de manera fácil y rápida, sin tener que hacer ningún esfuerzo. Se calcula en base a 

### `direcciones_concepto` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H1_cross_domain
  - `H1_cross_domain`: ['contabilidad']
- **preview:** Las **direcciones departamentales** son las oficinas que se encargan de la gestión del equipamiento en cada departamento. En contabilidad, se utilizan para definir los diferentes tipos de direcciones 

### `distancia_concepto` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H1_cross_domain
  - `H1_cross_domain`: ['contabilidad']
- **preview:** La **distancia** es una magnitud física que representa la cantidad de tiempo o espacio entre dos puntos en el universo. En geometría, la distancia entre dos puntos es la longitud del segmento que cone

### `dominio_concepto_2` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H1_cross_domain, H2_generic_id
  - `H1_cross_domain`: ['activo', 'pasivo', 'contabilidad']
  - `H2_generic_id`: dominio_concepto_2
- **preview:** El **dominio** es la parte del espacio social en que actúan las personas y los grupos de personas. Se estructura en tres componentes: **activo** (personas + grupos), **pasivo** (objetos conteridos), y

### `estado_concepto` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H1_cross_domain
  - `H1_cross_domain`: ['activo', 'pasivo']
- **preview:** El **estado** es un conjunto de relaciones sociales que organizan una comunidad humana. Se estructura en tres componentes: **activo** (relaciones con terceros), **pasivo** (relaciones con otros miembr

### `estado_concepto_6` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H1_cross_domain, H2_generic_id
  - `H1_cross_domain`: ['contabilidad']
  - `H2_generic_id`: estado_concepto_6
- **preview:** El **estado** es una institución que ejerce autoridad sobre un territorio y sus habitantes. Su función principal es garantizar la seguridad y mantener el orden público. El estado no solo se limita a l

### `estado_tipos_concepto` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H1_cross_domain
  - `H1_cross_domain`: ['contabilidad']
- **preview:** Los **tipos de estados** son categorías que se utilizan para clasificar a los diferentes sistemas políticos existentes. En contabilidad, se distinguen entre los tipos de estados según su nivel de desa

### `historia_concepto` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H1_cross_domain
  - `H1_cross_domain`: ['contabilidad', 'cuenta']
- **preview:** La **historia** es el conjunto de relatos y documentos que narran los eventos ocurridos en un lugar o tiempo determinado. Se estructura en dos componentes: **documento** (relatos) y **principios** (me

### `mercado_concepto` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H1_cross_domain
  - `H1_cross_domain`: ['patrimonio neto', 'contabilidad']
- **preview:** El **mercado** es una institución económica donde se intercambian bienes y servicios. Es un lugar de negociación entre compradores y vendedores, donde se establecen precios y se transaccionan monedas.

### `principios_explicacion` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H1_cross_domain
  - `H1_cross_domain`: ['activo', 'pasivo', 'patrimonio neto']
- **preview:** Los **principios de explicación sociológica** son las bases de la sociología. Se estructuran en tres componentes: **activo**, **pasivo** y **patrimonio neto**. El activo representa los bienes y derech

### `superficie_concepto` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H1_cross_domain
  - `H1_cross_domain`: ['contabilidad']
- **preview:** La **superficie** es una magnitud física que representa la cantidad de área en dos dimensiones. En matemáticas, la superficie de un cuerpo geométrico se calcula mediante el método de integración. En c

### `temporalidad_concepto_2` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H1_cross_domain, H2_generic_id
  - `H1_cross_domain`: ['contabilidad']
  - `H2_generic_id`: temporalidad_concepto_2
- **preview:** La **temporalidad** se refiere a la relación entre los eventos que suceden en el tiempo. Es una dimensión fundamental de la realidad y se expresa en dos dimensiones: la **secuencia** (orden temporal) 

### `vinculo_concepto` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H1_cross_domain
  - `H1_cross_domain`: ['activo', 'pasivo', 'patrimonio neto', 'contabilidad']
- **preview:** El **vinculo** es una relación social que une a personas o grupos con comunes intereses o objetivos. En este contexto se refiere al vínculo entre el pueblo y el orden social, que supone la propiedad c

## Severidad MEDIA (2 entries)

### `responsabilidad_concepto_2` · Administración

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H2_generic_id, H3_template_patterns
  - `H2_generic_id`: responsabilidad_concepto_2
  - `H3_template_patterns`: 3
- **preview:** La **responsabilidad** es la obligación de un individuo o una organización para actuar con ética y cumplir sus deberes hacia sí mismos, los demás y el medio ambiente. En el contexto de las empresas, s

### `calendario_concepto_2` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H2_generic_id, H3_template_patterns
  - `H2_generic_id`: calendario_concepto_2
  - `H3_template_patterns`: 2
- **preview:** Un **calendario** es una lista de fechas que se utilizan para organizar el tiempo en un sistema social. Los calendarios no son simplemente una representación de las fechas, sino que también incluyen l

## Severidad BAJA (20 entries)

### `responsabilidad_social_concepto_2` · Administración

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H2_generic_id
  - `H2_generic_id`: responsabilidad_social_concepto_2
- **preview:** La **responsabilidad social** es la obligación de una persona o organización para contribuir al bienestar de la sociedad. En el contexto del trabajo, se refiere a las acciones que se deben realizar pa

### `activo_concepto_2` · Contabilidad

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H2_generic_id
  - `H2_generic_id`: activo_concepto_2
- **preview:** El **activo** es la parte del patrimonio que representa los bienes y los derechos que pertenecen a una persona física o jurídica en un momento determinado. En contabilidad se clasifica en dos tipos: a

### `compra_concepto` · Contabilidad

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H3_template_patterns
  - `H3_template_patterns`: 4
- **preview:** La **compra** es una transacción económica en la que un sujeto adquiere bienes o servicios de otro sujeto en cambio de dinero. En contabilidad, se representa con el concepto de activo y pasivo. La com

### `concepto_patrimonio` · Contabilidad

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H3_template_patterns
  - `H3_template_patterns`: 4
- **preview:** El **patrimonio** es el conjunto de bienes, derechos y obligaciones que pertenecen a una persona física o jurídica en un momento determinado. Se estructura en tres componentes: **activo** (bienes + de

### `costos_concepto_2` · Contabilidad

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H2_generic_id
  - `H2_generic_id`: costos_concepto_2
- **preview:** Los **costos** son las cantidades de dinero que una persona o empresa paga por los bienes y servicios que consume. En contabilidad, los costos se dividen en dos componentes: **costos circulantes** (bi

### `ganancias_concepto_2` · Contabilidad

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H2_generic_id
  - `H2_generic_id`: ganancias_concepto_2
- **preview:** Las **ganancias** son los aumentos del patrimonio neto que se originan en operaciones secundarias o accesorias, o en otras transacciones, hechos o circunstancias que afectan al ente, salvo las que res

### `patrimonio_neto` · Contabilidad

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H3_template_patterns
  - `H3_template_patterns`: 4
- **preview:** El **patrimonio neto** es la diferencia entre el Activo y el Pasivo del ente y representa los derechos que los propietarios tienen sobre el activo, luego de cancelado el pasivo.   Es basicamente integ

### `tiempo_concepto_2` · Contabilidad

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H2_generic_id
  - `H2_generic_id`: tiempo_concepto_2
- **preview:** El **tiempo** es el conjunto de instantes que separan dos eventos sucesivos. En contabilidad este concepto es importante porque cada operación económica se realiza en un determinado momento, y por lo 

### `bourdieu_concepto` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H2_generic_id
  - `H2_generic_id`: bourdieu_concepto
- **preview:** Bourdieu fue un sociólogo francés que desarrolló una teoría sobre la sociedad y su organización. Su trabajo se centró en el estudio de las relaciones sociales y cómo influyen en los individuos y grupo

### `bourdieu_concepto_3` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H2_generic_id
  - `H2_generic_id`: bourdieu_concepto_3
- **preview:** Pierre Bourdieu (1925-2006) fue un sociólogo y antropólogo francés. Su obra se centró en la estructura social y cómo influye en las decisiones individuales y colectivas. Su concepto de capital social 

### `calendario_agrario_concepto` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H3_template_patterns
  - `H3_template_patterns`: 4
- **preview:** Un **calendario agrario** es una lista de fechas que representan los eventos, actividades o ciclos de la agricultura en un año o más. Los calendarios agrarios se utilizan para planificar y organizar l

### `calendario_concepto_3` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H2_generic_id
  - `H2_generic_id`: calendario_concepto_3
- **preview:** Un **calendario** es una lista de fechas que representan los eventos, actividades o ciclos de una comunidad o cultura. Se utilizan para planificar y organizar las actividades en un año o más. Los cale

### `conquista_social_concepto` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H3_template_patterns
  - `H3_template_patterns`: 3
- **preview:** La **conquista social** se refiere al proceso por el cual un grupo o movimiento logra imponer sus valores y normas sobre una sociedad. Esto puede ser a través de la fuerza militar, el poder económico 

### `dificultad_concepto` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H3_template_patterns
  - `H3_template_patterns`: 3
- **preview:** La **dificultad** de los discursos científicos sobre el mundo social es una característica particular que, en mi opinión, es representativa de los discursos científicos sobre este tema. Los discursos 

### `estado_concepto_3` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H2_generic_id
  - `H2_generic_id`: estado_concepto_3
- **preview:** El **estado** es una institución destinada a servir al bien común, según las teorías clásicas. En cierta medida, el Estado sería un lugar neutro o, más exácramente, un punto de vista organizado sobre 

### `estructura_concepto_2` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H2_generic_id
  - `H2_generic_id`: estructura_concepto_2
- **preview:** La **estructura del espacio** es la forma en que se organizan los campos de una historia. En este caso, el informe de Bourdieu presenta un diagrama que representa cómo se distribuyen los campos y sus 

### `juicio_concepto_2` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H2_generic_id
  - `H2_generic_id`: juicio_concepto_2
- **preview:** El **juicio** es el proceso de evaluar la verdad, justicia o validez de una afirmación. En la teoría social, este concepto aparece relacionado con la creación y mantenimiento de categorías sociales qu

### `juicio_concepto_3` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H2_generic_id
  - `H2_generic_id`: juicio_concepto_3
- **preview:** El **juicio** es una expresión de sentido y valor que se realiza en base a un conjunto de reglas, normas o valores. En la teoría social, el juicio se relaciona con el poder y la dominación social. El 

### `oposition_concepto_2` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H2_generic_id
  - `H2_generic_id`: oposition_concepto_2
- **preview:** La **oposición** es un concepto que se refiere al conflicto entre dos o más fuerzas políticas, sociales o económicas. En este caso, Bourdieu habla de la oposición entre los cuerpos técnicos y los insp

### `temporalidad_concepto` · Sociales

- **generated_by:** `mistral:7b-instruct-q4_K_M`
- **heurísticas:** H3_template_patterns
  - `H3_template_patterns`: 4
- **preview:** La **temporalidad** es la estructura en la que se organizan los eventos y fenómenos a lo largo del tiempo. En sociología, se relaciona con el concepto de historia, pero se diferencia en que temporalid

