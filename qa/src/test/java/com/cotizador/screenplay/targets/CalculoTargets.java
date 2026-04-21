package com.cotizador.screenplay.targets;

import net.serenitybdd.screenplay.targets.Target;
import org.openqa.selenium.By;

public class CalculoTargets {

    public static final Target BOTON_CALCULAR = Target.the("botón Calcular Prima")
            .located(By.cssSelector("[class*='calcBtn']"));

    public static final Target PRIMA_NETA = Target.the("prima neta")
            .locatedBy("//*[contains(@class,'row') and .//*[contains(text(),'Prima Neta')]]//*[self::strong]");

    public static final Target PRIMA_COMERCIAL = Target.the("prima comercial")
            .locatedBy("//*[contains(@class,'highlight')]//strong");

    public static final Target CONTENEDOR_RESULTADO = Target.the("contenedor de resultados de cálculo")
            .located(By.cssSelector("[class*='totals'], [class*='result'], [class*='financialBox']"));

    public static final Target VALORES_PRIMA = Target.the("valores de prima en resultados")
            .located(By.cssSelector("[class*='resultRow'], [class*='financialRow'], [class*='highlight']"));
}
