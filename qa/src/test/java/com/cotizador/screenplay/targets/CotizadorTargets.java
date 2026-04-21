package com.cotizador.screenplay.targets;

import net.serenitybdd.screenplay.targets.Target;
import org.openqa.selenium.By;

public class CotizadorTargets {

    public static final Target INPUT_NOMBRE = Target.the("campo nombre del asegurado")
            .located(By.cssSelector("input[name='nombre']"));

    public static final Target INPUT_EMAIL = Target.the("campo email")
            .located(By.cssSelector("input[name='email']"));

    public static final Target INPUT_CODIGO_AGENTE = Target.the("campo código de agente")
            .located(By.cssSelector("input[name='codigoAgente']"));

    public static final Target BOTON_CREAR_FOLIO = Target.the("botón Crear Folio")
            .located(By.cssSelector("[class*='primaryBtn']"));

    public static final Target INPUT_FOLIO_EXISTENTE = Target.the("campo folio existente")
            .located(By.cssSelector("input[name='folioExistente']"));

    public static final Target BOTON_ABRIR = Target.the("botón Abrir folio existente")
            .located(By.cssSelector("[class*='secondaryBtn']"));

    public static final Target PANEL_COTIZACIONES_RECIENTES = Target.the("panel cotizaciones recientes")
            .located(By.cssSelector("[class*='rightPanel']"));
}
