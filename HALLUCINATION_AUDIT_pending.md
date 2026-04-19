# KB Hallucination Audit
> **Generado por** `scripts/audit_hallucinations.py`
> **Total entries auditadas:** 113
> **Entries flaggeadas:** 21 (18.6%)
> **Desglose:** alta=0 · media=0 · baja=21

## Desglose por heurística

| Heurística | Conteo |
|---|---:|
| `H2_generic_id` | 13 |
| `H3_template_patterns` | 8 |

## Desglose por materia

| Materia | Alta | Media | Baja |
|---|---:|---:|---:|
| Administración | 0 | 0 | 2 |
| Contabilidad | 0 | 0 | 7 |
| Sociales | 0 | 0 | 12 |

## Severidad BAJA (21 entries)

### `etica_concepto` · Administración

- **generated_by:** `manual_patch:v19.30.5-neutralize-admin-leaks`
- **heurísticas:** H3_template_patterns
  - `H3_template_patterns`: 3
- **preview:** La **ética** se refiere a la normativa moral que regula las acciones y decisiones de una persona. Es el conjunto de valores, principios y normas que guían nuestras acciones y comportamientos.  En el m

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

