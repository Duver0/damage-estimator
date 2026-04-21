package com.cotizador.screenplay.targets;

import net.serenitybdd.screenplay.targets.Target;
import org.openqa.selenium.By;

public class FormularioTargets {

    public static Target inputPorNombre(String name) {
        return Target.the("campo " + name)
                .located(By.cssSelector("input[name='" + name + "']"));
    }

    public static Target selectPorNombre(String name) {
        return Target.the("select " + name)
                .located(By.cssSelector("select[name='" + name + "']"));
    }

    public static final Target BOTON_SIGUIENTE = Target.the("botón Siguiente")
            .located(By.cssSelector("[class*='nextBtn']"));

    public static final Target BOTON_ATRAS = Target.the("botón Atrás")
            .located(By.cssSelector("[class*='backBtn']"));

    public static final Target ENCABEZADO_FOLIO = Target.the("número de folio en encabezado")
            .located(By.cssSelector("[class*='folio']"));

    public static final Target TITULO_PAGINA = Target.the("título de página")
            .located(By.tagName("h1"));
}
