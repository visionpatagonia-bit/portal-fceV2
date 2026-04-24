"""
intent_patterns.py — Patrones determinísticos para los 3 intents MVP.

Contenido:
    * VERB_NORMALIZATION — forma flexionada → lema canónico.
    * VERB_FAMILIES — sets de lemas por familia semántica (cash/transaction).
    * NEGATION_TOKENS, *_ASYMMETRY_TEMPORAL, INSTALLMENT_MARKERS.
    * EXPLICIT_CASH_MISMATCH_PHRASES (frases idiomáticas explícitas).
    * VALUE_CHANGE_MARKERS, SALE_NEGATION_PHRASES.
    * CAPITALIZATION_DISJUNCTION_PHRASES.

Reglas:
    * Todos los strings están NORMALIZADOS: lower + sin acentos + ws colapsado.
    * Los patterns son features lingüísticas (lema verbal + negación + marcador
      temporal), NO paráfrasis literales del batch. Si me encuentro agregando
      "no me lo pagan todavía" acá, me corto solo — ese es el regreso al
      overfit B2 disfrazado.
    * Cada adición nueva requiere que sea composable (vale para muchas frases,
      no solo para la que vi fallar).
"""

from __future__ import annotations


# =====================================================================
# VERB_NORMALIZATION — forma flexionada → lema canónico.
# Convención: keys normalizadas (sin acentos). Values son los lemas que
# usan los detectores como referencia conceptual. No se usa para reemplazar
# en la query — se usa para inspección/debug y para derivar VERB_FAMILIES.
# =====================================================================

VERB_NORMALIZATION: dict[str, str] = {
    # PAGAR
    "pago": "pagar", "paga": "pagar", "pagas": "pagar",
    "pagamos": "pagar", "pagan": "pagar",
    "pague": "pagar", "pagaste": "pagar", "pagaron": "pagar",
    "pagaba": "pagar", "pagaban": "pagar",
    "pagaria": "pagar", "pagarian": "pagar",
    "pagando": "pagar", "pagado": "pagar", "pagada": "pagar",
    "pagados": "pagar", "pagadas": "pagar",
    "pagarlo": "pagar", "pagarla": "pagar",
    "pagarlos": "pagar", "pagarlas": "pagar",
    "pagarme": "pagar", "pagarnos": "pagar",
    "pagarles": "pagar", "pagarte": "pagar",
    "paguen": "pagar", "paguemos": "pagar",

    # COBRAR
    "cobro": "cobrar", "cobra": "cobrar", "cobras": "cobrar",
    "cobramos": "cobrar", "cobran": "cobrar",
    "cobre": "cobrar", "cobraste": "cobrar", "cobraron": "cobrar",
    "cobraba": "cobrar", "cobraban": "cobrar",
    "cobraria": "cobrar", "cobrarian": "cobrar",
    "cobrando": "cobrar", "cobrado": "cobrar", "cobrada": "cobrar",
    "cobrados": "cobrar", "cobradas": "cobrar",
    "cobrarlo": "cobrar", "cobrarla": "cobrar",
    "cobrarlos": "cobrar", "cobrarlas": "cobrar",
    "cobrarme": "cobrar", "cobrarnos": "cobrar",
    "cobrarles": "cobrar", "cobrarte": "cobrar",
    "cobren": "cobrar", "cobremos": "cobrar",

    # VENDER
    "vendo": "vender", "vende": "vender", "vendes": "vender",
    "vendemos": "vender", "venden": "vender",
    "vendi": "vender", "vendiste": "vender", "vendio": "vender",
    "vendimos": "vender", "vendieron": "vender",
    "vendia": "vender", "vendian": "vender",
    "vendiendo": "vender", "vendido": "vender", "vendida": "vender",
    "vendidos": "vender", "vendidas": "vender",
    "venderlo": "vender", "venderla": "vender",
    "venderlos": "vender", "venderlas": "vender",
    "venderme": "vender", "vendernos": "vender",
    "venderles": "vender", "venderte": "vender",
    "vendan": "vender", "vendamos": "vender",

    # COMPRAR
    "compro": "comprar", "compra": "comprar", "compras": "comprar",
    "compramos": "comprar", "compran": "comprar",
    "compre": "comprar", "compraste": "comprar", "compraron": "comprar",
    "compraba": "comprar", "compraban": "comprar",
    "compraria": "comprar", "comprarian": "comprar",
    "comprando": "comprar", "comprado": "comprar", "comprada": "comprar",
    "comprados": "comprar", "compradas": "comprar",
    "comprarlo": "comprar", "comprarla": "comprar",
    "comprarlos": "comprar", "comprarlas": "comprar",
    "comprarme": "comprar", "comprarnos": "comprar",
    "comprarles": "comprar", "comprarte": "comprar",
    "compren": "comprar", "compremos": "comprar",

    # FACTURAR
    "facturo": "facturar", "factura": "facturar", "facturas": "facturar",
    "facturamos": "facturar", "facturan": "facturar",
    "facture": "facturar", "facturaste": "facturar", "facturaron": "facturar",
    "facturando": "facturar", "facturado": "facturar", "facturada": "facturar",
    "facturen": "facturar", "facturemos": "facturar",
    "facturarlo": "facturar", "facturarla": "facturar",
}


def _forms_with_lemma(lemma: str) -> set[str]:
    """Helper: devuelve todas las formas cuyo valor es `lemma` (incluye al propio lemma)."""
    return {f for f, lem in VERB_NORMALIZATION.items() if lem == lemma} | {lemma}


# =====================================================================
# VERB_FAMILIES — derivadas de VERB_NORMALIZATION (single source of truth).
# =====================================================================

PAGAR_FORMS: set[str] = _forms_with_lemma("pagar")
COBRAR_FORMS: set[str] = _forms_with_lemma("cobrar")
VENDER_FORMS: set[str] = _forms_with_lemma("vender")
COMPRAR_FORMS: set[str] = _forms_with_lemma("comprar")
FACTURAR_FORMS: set[str] = _forms_with_lemma("facturar")

# Uniones semánticas
CASH_FLOW_VERBS: set[str] = PAGAR_FORMS | COBRAR_FORMS
TRANSACTION_VERBS: set[str] = VENDER_FORMS | COMPRAR_FORMS | FACTURAR_FORMS

# Sustantivos de transacción económica (nombres, no verbos).
TRANSACTION_NOUNS: set[str] = {
    "venta", "ventas",
    "ingreso", "ingresos",
    "gasto", "gastos",
    "factura", "facturas",
    "compra", "compras",
}


# =====================================================================
# Marcadores estructurales
# =====================================================================

NEGATION_TOKENS: set[str] = {
    "no", "sin", "ni",
    # "aunque" se excluye deliberadamente: introduce negación concesiva en
    # algunos contextos ("aunque no vendí") pero no en otros; los casos
    # "aunque no X" ya caen porque "no" está presente.
}

# Asimetría temporal STRONG — marcadores unívocos de "todavía no".
STRONG_ASYMMETRY_TEMPORAL: set[str] = {
    "todavia",   # "todavía" normalizado
    "aun",       # "aún"
    "diferido",
    "diferida",
}

# Asimetría temporal WEAK — ordering (antes/después). Sólo disparan cuando
# coexisten con un contexto transaccional (ver condiciones D/E del detector).
WEAK_ASYMMETRY_TEMPORAL: set[str] = {
    "antes",
    "despues",   # "después"
    "posterior",
    "previo",
    "recien",    # "recién"
}

ANY_ASYMMETRY_TEMPORAL: set[str] = STRONG_ASYMMETRY_TEMPORAL | WEAK_ASYMMETRY_TEMPORAL

INSTALLMENT_MARKERS: set[str] = {
    "cuota", "cuotas",
}

# Frases multi-word explícitas de asimetría cash/fact (ya normalizadas).
# Capturan construcciones idiomáticas costosas de inferir por tokens sueltos.
# Cada frase es una ESTRUCTURA reutilizable, no una copia literal de un batch.
EXPLICIT_CASH_MISMATCH_PHRASES: set[str] = {
    "antes de pagar", "antes de cobrar",
    "antes de pagarlo", "antes de pagarla",
    "antes de pagarlos", "antes de pagarlas",
    "antes de cobrarlo", "antes de cobrarla",
    "antes de cobrarlos", "antes de cobrarlas",
    "antes de pagarles", "antes de cobrarles",
    "antes de facturar", "antes de facturarlo",
    "sin cobrar", "sin pagar",
    "sin haber cobrado", "sin haber pagado",
    "en cuotas",
    "pueden ser antes",   # elipsis de "pueden ser antes [de pagarlos]"
    "puede ser antes",
    "sean antes", "sea antes",
}


# =====================================================================
# Intent 2 — value_change_without_sale
# =====================================================================

VALUE_CHANGE_MARKERS: set[str] = {
    # Tokens sueltos (chequeados como palabra)
    "aumenta", "aumento", "aumentan", "aumentaron",
    "sube", "subio", "subieron", "suben", "subir", "subiendo",
    "revalua", "revaluo", "revaluar", "revaluado", "revaluada",
    "aprecia", "aprecio", "apreciar", "apreciado", "apreciada",
    # Multi-word (chequeados como substring)
    "aumenta de precio", "aumentan de precio",
    "aumento de precio", "aumentaron de precio",
    "vale mas", "valen mas",
    "mas valor",
    "gana valor", "gano valor", "ganar valor", "ganando valor",
    "subio de precio", "subio de valor",
}

# Frases que niegan o posponen la venta.
SALE_NEGATION_PHRASES: set[str] = {
    "no vendo", "no vende", "no venden",
    "no vendi", "no vendio", "no vendieron",
    "no lo vendo", "no lo vendi", "no lo vendio",
    "no la vendo", "no la vendi",
    "sin vender", "sin venderlo", "sin venderla",
    "aunque no vendi", "aunque no vende", "aunque no venden",
    "aunque no lo vendi", "aunque no lo vendo",
    "hasta venderlo", "hasta venderla",
    "antes de venderlo", "antes de venderla",
    "si no lo vendo", "si no lo vende",
    "si aun no vendi", "si aun no vendio",
    "no vendi todavia", "no lo vendi todavia",
}


# =====================================================================
# Intent 3 — capitalization_doubt
# =====================================================================

CAPITALIZATION_DISJUNCTION_PHRASES: set[str] = {
    "gasto o activo",
    "activo o gasto",
    "es gasto o activo",
    "es activo o gasto",
    "es un gasto o un activo",
    "es un activo o un gasto",
}
