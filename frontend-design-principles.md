---
name: frontend-design-principles
description: Reglas y principios de diseño UI/Frontend para crear interfaces limpias, profesionales y evitar el aspecto "generado por IA".
---

# Frontend Design Guidelines (Anti-AI Aesthetics)

Cuando diseñes o generes componentes, layouts o estilos de interfaz web (HTML, Tailwind CSS, CSS Modules, React, Vue, etc.), debes aplicar rigurosamente los siguientes 7 principios fundamentales de diseño frontend para garantizar un acabado profesional, legible y de alta calidad.

---

## 1. Balance (Peso Visual)
- **Regla**: Distribuye el peso visual equitativamente para que ningún lado de la pantalla quede sobrecargado o descompensado[cite: 2].
- **Tipos de Balance**:
  - **Simétrico**: Transmite estabilidad y formalidad[cite: 2]. Los elementos se reflejan igual en ambos lados[cite: 2].
  - **Asimétrico**: Transmite dinamismo y modernidad[cite: 2]. Se compensan elementos de distintas formas y tamaños por su peso visual[cite: 2].
  - **Radial**: Organiza la interfaz alrededor de un punto focal central[cite: 2].
- ❌ **Anti-patrón (Red Flag de IA)**: Apilar todos los elementos en un solo lateral dejando el otro lado completamente vacío[cite: 2].

---

## 2. Contraste (Legibilidad e Interés)
- **Regla**: Utiliza el contraste para crear interés visual, guiar la lectura y resaltar las acciones o datos principales[cite: 3].
- **Aplicación**:
  - **Color**: Aplica un color de acento destacado únicamente en elementos de acción primaria (CTA)[cite: 3].
  - **Tamaño**: Establece diferencias marcadas entre títulos, subtítulos y texto plano[cite: 3].
  - **Textura/Fondo**: Utiliza contrastes entre fondos (p. ej., rugoso/liso, oscuro/claro) para dar profundidad[cite: 3].
- ❌ **Anti-patrón (Red Flag de IA)**: Usar un esquema donde todo es gris suave sobre fondos blancos o claros, perdiendo contraste y legibilidad[cite: 3].

---

## 3. Alineación (Orden e Intencionalidad)
- **Regla**: Conecta los elementos visualmente y mantén un eje de alineación uniforme y limpio[cite: 4].
- **Tipos de Alineación**:
  - **Izquierda**: Estándar para lectura cómoda y limpia en bloques de texto o formularios[cite: 4].
  - **Centro**: Ideal para bloques cortos, títulos o cards equilibradas[cite: 4].
  - **Derecha**: Para un estilo moderno o datos secundarios específicos[cite: 4].
  - **Justificado**: Para bordes rectos a ambos lados en bloques largos de texto[cite: 4].
- ❌ **Anti-patrón (Red Flag de IA)**: Mezclar sin criterio coherente textos centrados con otros alineados a la izquierda dentro de un mismo bloque de contenido[cite: 4].

---

## 4. Repetición (Sistema de Diseño y Coherencia)
- **Regla**: Reutiliza patrones visuales continuos para construir coherencia e identidad visual[cite: 5].
- **Aplicación**:
  - **Color**: Mantén la misma paleta para las acciones principales[cite: 5].
  - **Forma**: Unifica el `border-radius`, tamaño de botones e iconografía[cite: 5].
  - **Tipografía**: Define y repite un sistema jerárquico de fuentes estricto[cite: 5].
- ❌ **Anti-patrón (Red Flag de IA)**: Asignar a cada botón, tarjeta o icono un radio de borde, padding o color distinto dentro de la misma pantalla[cite: 5].

---

## 5. Proximidad (Agrupamiento de Información)
- **Regla**: Agrupa espacialmente los elementos que estén relacionados entre sí para permitir un escaneo rápido del usuario[cite: 6].
- **Aplicación**:
  - **Navegación**: Mantén los enlaces de menú agrupados[cite: 6].
  - **Contenido**: Mantén la imagen, el título, el precio y el botón de compra pegados en el mismo contenedor[cite: 6].
  - **Información**: Separa los bloques temáticos con márgenes claros[cite: 6].
- ❌ **Anti-patrón (Red Flag de IA)**: Aplicar una distancia o espaciado uniforme (`gap` / `margin`) idéntico entre absolutamente todos los elementos, haciendo imperceptible la relación entre ellos[cite: 6].

---

## 6. Jerarquía (Guiar la Mirada)
- **Regla**: Muestra de inmediato qué es lo más importante priorizando elementos clave[cite: 7].
- **Herramientas**:
  - **Tamaño**: Títulos considerablemente más grandes que el texto secundario[cite: 7].
  - **Color**: Resalta precios, ofertas o botones clave con color primario[cite: 7].
  - **Espaciado**: Dale mayor margen a las secciones más relevantes[cite: 7].
- ❌ **Anti-patrón (Red Flag de IA)**: Renderizar el título, la descripción y el botón de acción con el mismo grosor, tamaño o peso visual[cite: 7].

---

## 7. Espacio en Blanco (Aire y Sensación Premium)
- **Regla**: Utiliza el espacio negativo para dar aire a la interfaz, facilitar la lectura y transmitir elegancia[cite: 8].
- **Aplicación**:
  - Evita abarrotar tarjetas o pantallas con datos innecesarios[cite: 8].
  - Prioriza la claridad sobre la cantidad de información por píxel[cite: 8].
- ❌ **Anti-patrón (Red Flag de IA)**: Llenar cada tarjeta o bloque con múltiples badges, íconos, bordes y textos sin dejar espacio de respiración[cite: 8].
