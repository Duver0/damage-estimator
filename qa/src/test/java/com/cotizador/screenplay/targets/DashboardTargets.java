package com.cotizador.screenplay.targets;

import net.serenitybdd.screenplay.targets.Target;
import org.openqa.selenium.By;

public class DashboardTargets {

    public static final Target TITULO = Target.the("título del dashboard")
            .located(By.tagName("h1"));

    public static final Target TABLA_COTIZACIONES = Target.the("tabla de cotizaciones")
            .located(By.cssSelector("[class*='table']"));

    public static final Target BOTON_NUEVA_COTIZACION = Target.the("botón Nueva Cotización")
            .located(By.cssSelector("[class*='newBtn']"));

    public static final Target FILAS_TABLA = Target.the("filas de cotizaciones")
            .located(By.cssSelector("[class*='tableRow']"));

    public static final Target PRIMER_BOTON_VER = Target.the("primer botón ver")
            .located(By.cssSelector("[class*='viewBtn']"));

    public static final Target PRIMER_BOTON_EDITAR = Target.the("primer botón editar")
            .located(By.cssSelector("[class*='editBtn']"));

    public static final Target PRIMER_BOTON_ELIMINAR = Target.the("primer botón eliminar")
            .located(By.cssSelector("[class*='deleteBtn']"));
}
